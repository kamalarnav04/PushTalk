/**
 * Talk Page JavaScript - Walkie-Talkie Functionality
 * Handles audio recording, playback, and real-time communication
 */

class WalkieTalkieApp {
    constructor() {
        // Socket.IO connection
        this.socket = null;
        
        // Audio recording
        this.mediaRecorder = null;
        this.audioStream = null;
        this.isRecording = false;
        this.audioChunks = [];
        
        // Audio playback
        this.audioContext = null;
        this.audioAnalyser = null;
        this.volumeDataArray = null;
        
        // Room information
        this.currentRoom = null;
        
        // UI elements
        this.elements = {
            talkButton: document.getElementById('talkButton'),
            recordingStatus: document.getElementById('recordingStatus'),
            statusIndicator: document.getElementById('statusIndicator'),
            statusText: document.getElementById('statusText'),
            clientCount: document.getElementById('clientCount'),
            volumeLevel: document.getElementById('volumeLevel'),
            playbackAudio: document.getElementById('playbackAudio'),
            roomName: document.getElementById('roomName'),
            roomPin: document.getElementById('roomPin'),
            leaveRoomBtn: document.getElementById('leaveRoomBtn'),
            networkNotice: document.getElementById('networkNotice')
        };
        
        // Configuration
        this.config = {
            audioConstraints: {
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 44100
                }
            },
            recordingOptions: {
                mimeType: 'audio/webm;codecs=opus',
                audioBitsPerSecond: 128000
            }
        };
        
        // Initialize the application
        this.init();
    }

    /**
     * Initialize the walkie-talkie application
     */
    async init() {
        try {
            console.log('🎙️ Initializing walkie-talkie...');
            
            // Check for room data
            this.loadRoomData();
            
            // Initialize Socket.IO connection
            this.initSocket();
            
            // Request microphone permissions and set up audio
            await this.setupAudio();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Set up volume visualization
            this.setupVolumeVisualization();
            
            console.log('✅ Walkie-talkie ready!');
        } catch (error) {
            console.error('❌ Walkie-talkie initialization failed:', error);
            this.showNetworkNotice();
        }
    }

    /**
     * Load room data from localStorage
     */
    loadRoomData() {
        const roomData = localStorage.getItem('currentRoom');
        if (!roomData) {
            alert('No room data found. Redirecting to landing page...');
            window.location.href = 'landing.html';
            return;
        }

        try {
            this.currentRoom = JSON.parse(roomData);
            console.log('📋 Loaded room data:', this.currentRoom);
            
            // Update UI with room information
            this.elements.roomName.textContent = this.currentRoom.roomName;
            this.elements.roomPin.textContent = this.currentRoom.pin;
        } catch (error) {
            console.error('Error parsing room data:', error);
            localStorage.removeItem('currentRoom');
            window.location.href = 'landing.html';
        }
    }

    /**
     * Initialize Socket.IO connection and event listeners
     */
    initSocket() {
        console.log('🔌 Connecting to server...');
        this.socket = io();
        
        // Connection established
        this.socket.on('connect', () => {
            console.log('📡 Connected to server');
            this.updateConnectionStatus(true);
            
            // Join the room
            if (this.currentRoom) {
                this.socket.emit('join-room', {
                    roomName: this.currentRoom.roomName,
                    pin: this.currentRoom.pin
                });
            }
        });
        
        // Connection lost
        this.socket.on('disconnect', () => {
            console.log('📴 Disconnected from server');
            this.updateConnectionStatus(false);
        });
        
        // Client count updates
        this.socket.on('client-count', (count) => {
            this.elements.clientCount.textContent = count;
        });
        
        // Incoming audio data
        this.socket.on('audio-data', (data) => {
            this.playReceivedAudio(data.audio);
        });
          // Room joined successfully
        this.socket.on('room-joined', (roomData) => {
            console.log('🏠 Joined room:', roomData);
            this.updateConnectionStatus(true, `Connected to room "${roomData.roomName}"`);
        });
        
        // Room join/error handling
        this.socket.on('room-error', (error) => {
            console.error('❌ Room error:', error);
            alert('Room error: ' + error.message);
            // Clear room data and redirect
            localStorage.removeItem('currentRoom');
            window.location.href = 'landing.html';
        });
        
        // Connection errors
        this.socket.on('connect_error', (error) => {
            console.error('❌ Connection error:', error);
            this.updateConnectionStatus(false);
        });
    }

    /**
     * Set up event listeners for UI interactions
     */
    setupEventListeners() {
        // Talk button events (mouse and touch)
        this.elements.talkButton.addEventListener('mousedown', (e) => this.startRecording(e));
        this.elements.talkButton.addEventListener('mouseup', (e) => this.stopRecording(e));
        this.elements.talkButton.addEventListener('mouseleave', (e) => this.stopRecording(e));
        
        this.elements.talkButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.startRecording(e);
        });
        this.elements.talkButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.stopRecording(e);
        });
        this.elements.talkButton.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.stopRecording(e);
        });
        
        // Prevent context menu on talk button
        this.elements.talkButton.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Leave room button
        this.elements.leaveRoomBtn.addEventListener('click', () => this.leaveRoom());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.isRecording) {
                e.preventDefault();
                this.startRecording(e);
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space' && this.isRecording) {
                e.preventDefault();
                this.stopRecording(e);
            }
        });
        
        // Prevent spacebar from scrolling
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
            }
        });
    }

    /**
     * Request microphone access and set up audio stream
     */
    async setupAudio() {
        try {
            console.log('🎤 Requesting microphone access...');
            this.audioStream = await navigator.mediaDevices.getUserMedia(this.config.audioConstraints);
            
            // Set up MediaRecorder
            this.mediaRecorder = new MediaRecorder(this.audioStream, this.config.recordingOptions);
            
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
              this.mediaRecorder.onstop = () => {
                this.sendAudioData();
            };
            
            // Enable the talk button after successful audio setup
            this.elements.talkButton.disabled = false;
            this.elements.talkButton.querySelector('.button-text').textContent = 'Hold to Talk';
            
            console.log('✅ Audio setup complete');
        } catch (error) {
            console.error('❌ Microphone access denied:', error);
            throw new Error('Microphone access is required for walkie-talkie functionality');
        }
    }

    /**
     * Set up volume visualization
     */
    setupVolumeVisualization() {
        if (!this.audioStream) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = this.audioContext.createMediaStreamSource(this.audioStream);
            this.audioAnalyser = this.audioContext.createAnalyser();
            
            this.audioAnalyser.fftSize = 256;
            source.connect(this.audioAnalyser);
            
            this.volumeDataArray = new Uint8Array(this.audioAnalyser.frequencyBinCount);
            
            // Start volume monitoring
            this.updateVolumeLevel();
        } catch (error) {
            console.warn('Volume visualization setup failed:', error);
        }
    }

    /**
     * Update volume level indicator
     */
    updateVolumeLevel() {
        if (!this.audioAnalyser || !this.volumeDataArray) return;
        
        this.audioAnalyser.getByteFrequencyData(this.volumeDataArray);
        
        // Calculate average volume
        let sum = 0;
        for (let i = 0; i < this.volumeDataArray.length; i++) {
            sum += this.volumeDataArray[i];
        }
        const average = sum / this.volumeDataArray.length;
        const percentage = Math.min(100, (average / 255) * 100);
        
        // Update volume indicator
        if (this.elements.volumeLevel) {
            this.elements.volumeLevel.style.width = `${percentage}%`;
        }
        
        // Continue monitoring
        requestAnimationFrame(() => this.updateVolumeLevel());
    }    /**
     * Start audio recording
     */
    startRecording(event) {
        if (this.isRecording || !this.mediaRecorder || !this.socket.connected) return;
        
        try {
            console.log('🔴 Starting recording...');
            
            this.isRecording = true;
            this.audioChunks = [];
            
            // Start recording
            this.mediaRecorder.start();
            
            // Update UI - show recording status
            this.elements.talkButton.classList.add('recording');
            this.elements.recordingStatus.classList.remove('hidden');
            this.elements.talkButton.style.transform = 'scale(0.95)';
            this.elements.talkButton.querySelector('.button-text').textContent = 'Recording...';
            
        } catch (error) {
            console.error('❌ Failed to start recording:', error);
            this.isRecording = false;
        }
    }    /**
     * Stop audio recording
     */
    stopRecording(event) {
        if (!this.isRecording || !this.mediaRecorder) return;
        
        try {
            console.log('⏹️ Stopping recording...');
            
            this.isRecording = false;
            
            // Stop recording
            this.mediaRecorder.stop();
            
            // Update UI - hide recording status
            this.elements.talkButton.classList.remove('recording');
            this.elements.recordingStatus.classList.add('hidden');
            this.elements.talkButton.style.transform = 'scale(1)';
            this.elements.talkButton.querySelector('.button-text').textContent = 'Hold to Talk';
            
        } catch (error) {
            console.error('❌ Failed to stop recording:', error);
        }
    }

    /**
     * Send recorded audio data to server
     */
    async sendAudioData() {
        if (this.audioChunks.length === 0) return;
        
        try {
            console.log('📤 Sending audio data...');
            
            // Create blob from audio chunks
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            
            // Convert to array buffer
            const arrayBuffer = await audioBlob.arrayBuffer();
            
            // Send to server
            this.socket.emit('audio-data', {
                audio: arrayBuffer,
                room: this.currentRoom
            });
            
            // Clear audio chunks
            this.audioChunks = [];
            
        } catch (error) {
            console.error('❌ Failed to send audio:', error);
        }
    }

    /**
     * Play received audio data
     */
    playReceivedAudio(audioArrayBuffer) {
        try {
            console.log('🔊 Playing received audio...');
            
            // Create blob from array buffer
            const audioBlob = new Blob([audioArrayBuffer], { type: 'audio/webm' });
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Play audio
            this.elements.playbackAudio.src = audioUrl;
            this.elements.playbackAudio.play().catch(error => {
                console.error('❌ Audio playback failed:', error);
            });
            
            // Clean up URL after playing
            this.elements.playbackAudio.onended = () => {
                URL.revokeObjectURL(audioUrl);
            };
            
        } catch (error) {
            console.error('❌ Failed to play audio:', error);
        }
    }    /**
     * Update connection status indicator
     */
    updateConnectionStatus(isConnected, statusMessage = null) {
        if (isConnected) {
            this.elements.statusIndicator.className = 'status-indicator connected';
            this.elements.statusText.textContent = statusMessage || 'Connected';
        } else {
            this.elements.statusIndicator.className = 'status-indicator disconnected';
            this.elements.statusText.textContent = statusMessage || 'Disconnected';
        }
    }

    /**
     * Leave the current room
     */
    leaveRoom() {
        const confirmed = confirm('Are you sure you want to leave this room?');
        if (!confirmed) return;
        
        // Notify server
        if (this.socket && this.socket.connected) {
            this.socket.emit('leave-room');
        }
        
        // Stop recording if active
        if (this.isRecording) {
            this.stopRecording();
        }
        
        // Clean up audio stream
        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => track.stop());
        }
        
        // Clear room data
        localStorage.removeItem('currentRoom');
        
        // Redirect to landing page
        window.location.href = 'landing.html';
    }

    /**
     * Show network notice for HTTPS requirement
     */
    showNetworkNotice() {
        if (this.elements.networkNotice) {
            this.elements.networkNotice.style.display = 'block';
        }
    }
}

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the walkie-talkie application
    window.walkieTalkieApp = new WalkieTalkieApp();
});
