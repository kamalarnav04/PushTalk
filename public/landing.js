/**
 * Landing Page JavaScript - Room Management Only
 * Handles room creation, joining, and navigation to talk page
 */

class RoomManager {
    constructor() {
        // Socket.IO connection
        this.socket = null;
        
        // Current room information
        this.currentRoom = null;
        
        // UI elements
        this.elements = {
            createRoomForm: document.getElementById('createRoomForm'),
            joinRoomForm: document.getElementById('joinRoomForm'),
            createMessage: document.getElementById('createMessage'),
            joinMessage: document.getElementById('joinMessage'),
        };
        
        // Initialize the room manager
        this.init();
    }

    /**
     * Initialize the room manager
     */
    async init() {
        try {
            console.log('Initializing room manager...');
            
            // Initialize Socket.IO connection
            this.initSocket();
            
            // Set up event listeners
            this.setupEventListeners();
            
            console.log('✅ Room manager ready!');
        } catch (error) {
            console.error('❌ Room manager initialization failed:', error);
        }
    }

    /**
     * Initialize Socket.IO connection
     */
    initSocket() {
        this.socket = io();
        
        // Connection established
        this.socket.on('connect', () => {
            console.log('📡 Connected to server');
        });
        
        // Connection lost
        this.socket.on('disconnect', () => {
            console.log('📴 Disconnected from server');
        });
          // Room creation response
        this.socket.on('room-created', (data) => {
            console.log('🏠 Room created:', data);
            this.showMessage('createMessage', `Room "${data.roomName}" created successfully!`, 'success');
            
            // Store room information and navigate immediately
            // The room creator is already added to the room on the server side
            this.navigateToTalkPage(data.roomName, data.pin);
        });
        
        // Room join response
        this.socket.on('room-joined', (data) => {
            console.log('🚪 Room joined:', data);
            this.showMessage('joinMessage', `Successfully joined room "${data.roomName}"!`, 'success');
            this.navigateToTalkPage(data.roomName, data.pin);
        });
        
        // Room error responses
        this.socket.on('room-error', (data) => {
            console.log('❌ Room error:', data);
            if (data.action === 'create') {
                this.showMessage('createMessage', data.message, 'error');
                this.setFormLoading('createRoomForm', false);
            } else if (data.action === 'join') {
                this.showMessage('joinMessage', data.message, 'error');
                this.setFormLoading('joinRoomForm', false);
            }
        });
        
        // Connection errors
        this.socket.on('connect_error', (error) => {
            console.error('❌ Connection error:', error);
            this.showMessage('createMessage', 'Connection failed. Please refresh and try again.', 'error');
            this.showMessage('joinMessage', 'Connection failed. Please refresh and try again.', 'error');
        });
    }    /**
     * Set up event listeners for forms
     */
    setupEventListeners() {
        // Create room form
        if (this.elements.createRoomForm) {
            console.log('✅ Create room form found, adding event listener');
            this.elements.createRoomForm.addEventListener('submit', (e) => {
                console.log('🔍 Create room form submitted');
                e.preventDefault();
                this.handleCreateRoom();
            });
        } else {
            console.error('❌ Create room form not found!');
        }
        
        // Join room form
        if (this.elements.joinRoomForm) {
            console.log('✅ Join room form found, adding event listener');
            this.elements.joinRoomForm.addEventListener('submit', (e) => {
                console.log('🔍 Join room form submitted');
                e.preventDefault();
                this.handleJoinRoom();
            });
        } else {
            console.error('❌ Join room form not found!');
        }
    }/**
     * Handle room creation
     */
    handleCreateRoom() {
        console.log('🔍 handleCreateRoom called');
        
        const formData = new FormData(this.elements.createRoomForm);
        const roomName = formData.get('createRoomName').trim();
        const pin = formData.get('createRoomPin').trim();
        
        console.log('🔍 Form data:', { roomName, pin, pinLength: pin.length });
        
        // Validate input
        if (!roomName || roomName.length < 2) {
            console.log('❌ Room name validation failed');
            this.showMessage('createMessage', 'Please enter a room name (at least 2 characters).', 'error');
            return;
        }
        
        if (!/^\d{4,6}$/.test(pin)) {
            console.log('❌ PIN validation failed. PIN:', pin, 'Test result:', /^\d{4,6}$/.test(pin));
            this.showMessage('createMessage', 'Please enter a valid 4-6 digit PIN.', 'error');
            return;
        }
        
        console.log('✅ Validation passed, sending to server');
        
        // Set loading state
        this.setFormLoading('createRoomForm', true);
        this.hideMessage('createMessage');
        
        // Send create room request
        this.socket.emit('create-room', {
            roomName: roomName,
            pin: pin
        });
        
        console.log(`🏠 Creating room "${roomName}" with PIN ${pin}`);
    }

    /**
     * Handle room joining
     */
    handleJoinRoom() {
        const formData = new FormData(this.elements.joinRoomForm);
        const roomName = formData.get('joinRoomName').trim();
        const pin = formData.get('joinRoomPin').trim();
        
        // Validate input
        if (!roomName || roomName.length < 2) {
            this.showMessage('joinMessage', 'Please enter a room name (at least 2 characters).', 'error');
            return;
        }
        
        if (!/^\d{4,6}$/.test(pin)) {
            this.showMessage('joinMessage', 'Please enter a valid 4-6 digit PIN.', 'error');
            return;
        }
        
        // Set loading state
        this.setFormLoading('joinRoomForm', true);
        this.hideMessage('joinMessage');
        
        // Send join room request
        this.socket.emit('join-room', {
            roomName: roomName,
            pin: pin
        });
        
        console.log(`🚪 Joining room "${roomName}" with PIN ${pin}`);
    }

    /**
     * Navigate to talk page with room information
     */
    navigateToTalkPage(roomName, pin) {
        // Store room information in localStorage for the talk page
        localStorage.setItem('currentRoom', JSON.stringify({
            roomName: roomName,
            pin: pin,
            joinedAt: new Date().toISOString()
        }));
        
        // Navigate to talk page after a short delay to show success message
        setTimeout(() => {
            window.location.href = 'talk.html';
        }, 1500);
    }

    /**
     * Show message to user
     */
    showMessage(elementId, message, type = 'info') {
        const messageElement = this.elements[elementId];
        if (!messageElement) return;
        
        messageElement.textContent = message;
        messageElement.className = `message ${type}`;
        messageElement.classList.remove('hidden');
        
        // Auto-hide success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                this.hideMessage(elementId);
            }, 3000);
        }
    }

    /**
     * Hide message
     */
    hideMessage(elementId) {
        const messageElement = this.elements[elementId];
        if (messageElement) {
            messageElement.classList.add('hidden');
        }
    }

    /**
     * Set form loading state
     */
    setFormLoading(formId, isLoading) {
        const form = document.getElementById(formId);
        if (!form) return;
        
        if (isLoading) {
            form.classList.add('loading');
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
            }
        } else {
            form.classList.remove('loading');
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
            }
        }
    }
}

/**
 * Check if user is already in a room
 */
function checkExistingRoom() {
    const currentRoom = localStorage.getItem('currentRoom');
    if (currentRoom) {
        try {
            const roomData = JSON.parse(currentRoom);
            const joinedAt = new Date(roomData.joinedAt);
            const now = new Date();
            const hoursSinceJoined = (now - joinedAt) / (1000 * 60 * 60);
            
            // If joined less than 24 hours ago, offer to rejoin
            if (hoursSinceJoined < 24) {
                const rejoin = confirm(`You were in room "${roomData.roomName}" recently. Would you like to rejoin?`);
                if (rejoin) {
                    window.location.href = 'talk.html';
                    return;
                }
            }
        } catch (error) {
            console.log('Could not parse existing room data:', error);
        }
        
        // Clear old room data
        localStorage.removeItem('currentRoom');
    }
}

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    // Check for existing room
    checkExistingRoom();
    
    // Initialize the room manager
    window.roomManager = new RoomManager();
});
