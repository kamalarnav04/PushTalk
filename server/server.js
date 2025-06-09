/**
 * Walkie-Talkie Web App Server
 * Node.js + Express + Socket.IO backend for real-time audio communication
 */

console.log('🚀 Starting Walkie-Talkie Server...');

const express = require('express');
const http = require('http');
const https = require('https');
const fs = require('fs');
const socketIo = require('socket.io');
const path = require('path');

// Initialize Express app
const app = express();

// Try to create HTTPS server with self-signed certificate, fallback to HTTP
let server;
let isHttps = false;

try {
    // Try to use HTTPS with self-signed certificate
    const certPath = path.join(__dirname, 'cert.pem');
    const keyPath = path.join(__dirname, 'key.pem');
    
    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
        const options = {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath)
        };
        server = https.createServer(options, app);
        isHttps = true;
        console.log('🔒 HTTPS server will be used');
    } else {
        throw new Error('SSL certificates not found');
    }
} catch (error) {
    // Fallback to HTTP server
    server = http.createServer(app);
    console.log('⚠️  HTTP server will be used (HTTPS certificates not found)');
    console.log('📝 For network access, consider generating SSL certificates:');
    console.log('   openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes');
}

// Initialize Socket.IO with CORS configuration
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 3000;

// Room management
const rooms = new Map(); // roomName -> { pin, clients: Set() }

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Debug endpoint to list active rooms
app.get('/api/rooms', (req, res) => {
    const roomList = [];
    rooms.forEach((room, roomName) => {
        roomList.push({
            name: roomName,
            clientCount: room.clients.size,
            createdAt: room.createdAt,
            hasGracePeriod: room.creatorGracePeriod || false,
            isTemporary: room.isTemporary || false
        });
    });
    res.json({
        totalRooms: rooms.size,
        rooms: roomList,
        timestamp: new Date().toISOString()
    });
});

// Store connected clients information
const connectedClients = new Map();

/**
 * Socket.IO connection handling
 */
io.on('connection', (socket) => {
    console.log(`📱 New client connected: ${socket.id}`);
      // Store client information
    connectedClients.set(socket.id, {
        id: socket.id,
        connectedAt: new Date(),
        currentRoom: null
    });

    // Send current client count to all clients
    io.emit('client-count', connectedClients.size);    /**
     * Handle room creation
     */
    socket.on('create-room', (data) => {
        const { roomName, pin } = data;
        console.log(`🏠 Creating room "${roomName}" with PIN ${pin} by ${socket.id}`);
        
        // Check if room already exists
        if (rooms.has(roomName)) {
            console.log(`❌ Room "${roomName}" already exists`);
            socket.emit('room-error', {
                action: 'create',
                message: `Room "${roomName}" already exists. Please choose a different name.`
            });
            return;
        }
        
        // Create new room with extended lifetime for creator to join
        rooms.set(roomName, {
            pin: pin,
            clients: new Set(),
            createdAt: new Date(),
            createdBy: socket.id,
            isTemporary: true, // Mark as temporary until someone joins
            creatorGracePeriod: true // Give creator extra time to join
        });
        
        // Set a grace period for the creator to join (2 minutes)
        setTimeout(() => {
            const room = rooms.get(roomName);
            if (room && room.clients.size === 0 && room.creatorGracePeriod) {
                console.log(`⏰ Grace period expired for room "${roomName}", deleting empty room`);
                rooms.delete(roomName);
            }
        }, 120000); // 2 minutes grace period
        
        console.log(`✅ Room "${roomName}" created successfully with 2-minute grace period`);
        socket.emit('room-created', {
            roomName: roomName,
            pin: pin
        });
    });    /**
     * Handle room joining
     */
    socket.on('join-room', (data) => {
        const { roomName, pin } = data;
        console.log(`🚪 Client ${socket.id} attempting to join room "${roomName}"`);
        
        // Check if room exists
        if (!rooms.has(roomName)) {
            console.log(`❌ Room "${roomName}" does not exist`);
            socket.emit('room-error', {
                action: 'join',
                message: `Room "${roomName}" not found. Please check the room name.`
            });
            return;
        }
        
        const room = rooms.get(roomName);
        
        // Check PIN
        if (room.pin !== pin) {
            console.log(`❌ Wrong PIN for room "${roomName}"`);
            socket.emit('room-error', {
                action: 'join',
                message: 'Incorrect PIN. Please check your credentials.'
            });
            return;
        }
        
        // Add client to room
        room.clients.add(socket.id);
        
        // Clear grace period flags when someone joins
        if (room.creatorGracePeriod) {
            room.creatorGracePeriod = false;
            room.isTemporary = false;
            console.log(`🏠 Room "${roomName}" is now active (grace period cleared)`);
        }
        
        // Update client info
        const clientInfo = connectedClients.get(socket.id);
        if (clientInfo) {
            clientInfo.currentRoom = roomName;
        }
        
        console.log(`✅ Client ${socket.id} joined room "${roomName}" (${room.clients.size} total)`);
        socket.emit('room-joined', {
            roomName: roomName,
            pin: pin,
            clientCount: room.clients.size
        });
        
        // Notify other clients in the room
        room.clients.forEach(clientId => {
            if (clientId !== socket.id) {
                const clientSocket = io.sockets.sockets.get(clientId);
                if (clientSocket) {
                    clientSocket.emit('room-update', {
                        type: 'user-joined',
                        roomName: roomName,
                        clientCount: room.clients.size
                    });
                }
            }
        });
    });

    /**
     * Handle leaving room
     */
    socket.on('leave-room', () => {
        const clientInfo = connectedClients.get(socket.id);
        if (clientInfo && clientInfo.currentRoom) {
            const roomName = clientInfo.currentRoom;
            console.log(`🚪 Client ${socket.id} leaving room "${roomName}"`);
            
            const room = rooms.get(roomName);
            if (room) {
                room.clients.delete(socket.id);
                
                // If room is empty, delete it
                if (room.clients.size === 0) {
                    rooms.delete(roomName);
                    console.log(`🗑️ Room "${roomName}" deleted (empty)`);
                } else {
                    // Notify remaining clients
                    room.clients.forEach(clientId => {
                        const clientSocket = io.sockets.sockets.get(clientId);
                        if (clientSocket) {
                            clientSocket.emit('room-update', {
                                type: 'user-left',
                                roomName: roomName,
                                clientCount: room.clients.size
                            });
                        }
                    });
                }
            }
            
            clientInfo.currentRoom = null;
        }
    });    /**
     * Handle incoming audio data from clients
     * Broadcasts the audio to all other connected clients in the same room
     */
    socket.on('audio-data', (data) => {
        const clientInfo = connectedClients.get(socket.id);
        if (!clientInfo || !clientInfo.currentRoom) {
            console.log(`⚠️ Audio received from ${socket.id} but client not in any room`);
            return;
        }
        
        const roomName = clientInfo.currentRoom;
        const room = rooms.get(roomName);
        if (!room) {
            console.log(`⚠️ Audio received from ${socket.id} but room "${roomName}" not found`);
            return;
        }
        
        console.log(`🎤 Audio received from ${socket.id} in room "${roomName}", broadcasting to ${room.clients.size - 1} others...`);
        
        // Broadcast audio to all clients in the same room except the sender
        room.clients.forEach(clientId => {
            if (clientId !== socket.id) {
                const clientSocket = io.sockets.sockets.get(clientId);
                if (clientSocket) {
                    clientSocket.emit('audio-data', {
                        audio: data.audio,
                        senderId: socket.id,
                        timestamp: Date.now()
                    });
                }
            }
        });
    });

    /**
     * Handle client status updates (talking/not talking)
     */
    socket.on('talking-status', (status) => {
        console.log(`📢 Client ${socket.id} is ${status.isTalking ? 'talking' : 'not talking'}`);
        
        // Broadcast talking status to all other clients
        socket.broadcast.emit('talking-status', {
            senderId: socket.id,
            isTalking: status.isTalking
        });
    });    /**
     * Handle client disconnection
     */
    socket.on('disconnect', () => {
        console.log(`📴 Client disconnected: ${socket.id}`);
        
        const clientInfo = connectedClients.get(socket.id);
        
        // Remove client from their room if they were in one
        if (clientInfo && clientInfo.currentRoom) {
            const roomName = clientInfo.currentRoom;
            const room = rooms.get(roomName);
            if (room) {
                room.clients.delete(socket.id);
                  // If room is empty, mark it for deletion after a delay
                if (room.clients.size === 0) {
                    // If room still has grace period, don't set timeout (already has one)
                    if (!room.creatorGracePeriod) {
                        console.log(`⏰ Room "${roomName}" is empty, will be deleted in 30 seconds if no one joins`);
                        
                        // Delete room after 30 seconds if still empty
                        setTimeout(() => {
                            const currentRoom = rooms.get(roomName);
                            if (currentRoom && currentRoom.clients.size === 0) {
                                rooms.delete(roomName);
                                console.log(`🗑️ Room "${roomName}" deleted (empty timeout)`);
                            }
                        }, 30000); // 30 seconds
                    } else {
                        console.log(`⏰ Room "${roomName}" is empty but still within grace period`);
                    }
                } else {
                    console.log(`🚪 Client ${socket.id} removed from room "${roomName}" (${room.clients.size} remaining)`);
                    
                    // Notify remaining clients in the room
                    room.clients.forEach(clientId => {
                        const clientSocket = io.sockets.sockets.get(clientId);
                        if (clientSocket) {
                            clientSocket.emit('room-update', {
                                type: 'user-disconnected',
                                roomName: roomName,
                                clientCount: room.clients.size
                            });
                        }
                    });
                }
            }
        }
        
        // Remove client from connected clients map
        connectedClients.delete(socket.id);
        
        // Update client count for remaining clients
        io.emit('client-count', connectedClients.size);
    });

    /**
     * Handle connection errors
     */
    socket.on('error', (error) => {
        console.error(`❌ Socket error for ${socket.id}:`, error);
    });
});

/**
 * Start the server
 */
server.listen(PORT, '0.0.0.0', () => {
    const protocol = isHttps ? 'https' : 'http';
    
    console.log('🎙️  Walkie-Talkie Server Started');
    console.log(`📡 Server running on port ${PORT} (${protocol.toUpperCase()})`);
    console.log(`🌐 Local access: ${protocol}://localhost:${PORT}`);
    
    // Get local IP addresses for network access
    const networkInterfaces = require('os').networkInterfaces();
    const addresses = [];
    
    for (const interfaceName in networkInterfaces) {
        const interfaces = networkInterfaces[interfaceName];
        for (const interface of interfaces) {
            if (interface.family === 'IPv4' && !interface.internal) {
                addresses.push(interface.address);
            }
        }
    }
    
    if (addresses.length > 0) {
        console.log('📱 Network access URLs:');
        addresses.forEach(address => {
            console.log(`   ${protocol}://${address}:${PORT}`);
        });
        
        if (!isHttps) {
            console.log('\n⚠️  WARNING: Using HTTP on network may cause issues with microphone access');
            console.log('   Modern browsers require HTTPS for microphone access from network devices');
            console.log('   Consider generating SSL certificates for HTTPS support');
        }
    }
    
    console.log('\n🔊 Open the URL on multiple devices to test the walkie-talkie!');
    
    if (!isHttps) {
        console.log('\n🔧 To enable HTTPS support:');
        console.log('1. Generate SSL certificates:');
        console.log('   openssl req -x509 -newkey rsa:4096 -keyout server/key.pem -out server/cert.pem -days 365 -nodes');
        console.log('2. Restart the server');
        console.log('3. Accept the security warning in your browser (self-signed certificate)');
    }
});

/**
 * Graceful shutdown handling
 */
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});
