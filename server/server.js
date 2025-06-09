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

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

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
        connectedAt: new Date()
    });

    // Send current client count to all clients
    io.emit('client-count', connectedClients.size);

    /**
     * Handle incoming audio data from clients
     * Broadcasts the audio to all other connected clients
     */
    socket.on('audio-data', (audioBlob) => {
        console.log(`🎤 Audio received from ${socket.id}, broadcasting to others...`);
        
        // Broadcast audio to all clients except the sender
        socket.broadcast.emit('audio-data', {
            audio: audioBlob,
            senderId: socket.id,
            timestamp: Date.now()
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
    });

    /**
     * Handle client disconnection
     */
    socket.on('disconnect', () => {
        console.log(`📴 Client disconnected: ${socket.id}`);
        
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
