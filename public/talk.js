/**
 * Talk Page JavaScript - Walkie-Talkie Functionality
 * Handles audio recording, playback, and real-time communication
 */

class WalkieTalkieApp {    constructor() {
        // Socket.IO connection
        this.socket = null;
        
        // Audio recording
        this.mediaRecorder = null;
        this.audioStream = null;
        this.isRecording = false;
        this.audioChunks = [];
        this.currentUser = null;
        
        // Audio playback
        this.audioContext = null;
        this.audioAnalyser = null;
        this.volumeDataArray = null;
          // Room information
        this.currentRoom = null;
        this.roomParticipants = [];
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
            roomPin: document.getElementById('roomPin'),            leaveRoomBtn: document.getElementById('leaveRoomBtn'),
            networkNotice: document.getElementById('networkNotice'),
            userDisplayName: document.getElementById('userDisplayName'),
            showParticipantsBtn: document.getElementById('showParticipantsBtn'),
            participantsList: document.getElementById('participantsList'),
            participantsCount: document.getElementById('participantsCount'),
            speakersList: document.getElementById('speakersList')
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
    }    /**
     * Initialize the walkie-talkie application
     */
    async init() {
        try {
            console.log('🎙️ Initializing walkie-talkie...');
            
            // Check authentication
            this.checkAuthentication();
            
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
     * Check if user is authenticated
     */
    checkAuthentication() {
        const currentUser = localStorage.getItem('currentUser');
        if (!currentUser) {
            // User not logged in, redirect to auth page
            alert('Please log in to access the talk page.');
            window.location.href = 'auth.html';
            return;
        }
        
        try {
            this.currentUser = JSON.parse(currentUser);
            
            // Display username in the header
            if (this.elements.userDisplayName) {
                this.elements.userDisplayName.textContent = this.currentUser.username;
            }
            
            console.log('🔐 User authenticated:', this.currentUser.username);
        } catch (error) {
            console.error('⚠️ Invalid user data, redirecting to auth');
            localStorage.removeItem('currentUser');
            window.location.href = 'auth.html';
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
            if (this.currentRoom && this.currentUser) {
                this.socket.emit('join-room', {
                    roomName: this.currentRoom.roomName,
                    pin: this.currentRoom.pin,
                    username: this.currentUser.username
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
            
            // Show who is speaking
            if (data.senderUsername) {
                this.showSpeakingIndicator(data.senderUsername);
            }
        });// Room joined successfully
        this.socket.on('room-joined', (roomData) => {
            console.log('🏠 Joined room:', roomData);
            this.updateConnectionStatus(true, `Connected to room "${roomData.roomName}"`);
            
            // Store room participants
            this.roomParticipants = roomData.participants || [];
            this.updateParticipantsList();
        });
        
        // Room updates (user joined/left)
        this.socket.on('room-update', (update) => {
            console.log('🔄 Room update:', update);
            
            if (update.participants) {
                this.roomParticipants = update.participants;
                this.updateParticipantsList();
            }
            
            // Show notification based on update type
            if (update.type === 'user-joined' && update.newUser) {
                this.showNotification(`${update.newUser.username} joined the room`, 'info');
            } else if (update.type === 'user-left' && update.leftUser) {
                this.showNotification(`${update.leftUser.username} left the room`, 'info');
            } else if (update.type === 'user-disconnected' && update.disconnectedUser) {
                this.showNotification(`${update.disconnectedUser.username} disconnected`, 'warning');
            }
        });
        
        // Room participants response
        this.socket.on('room-participants', (data) => {
            this.roomParticipants = data.participants || [];
            this.updateParticipantsList();
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
        
        // Participants toggle button
        if (this.elements.showParticipantsBtn) {
            this.elements.showParticipantsBtn.addEventListener('click', () => this.toggleParticipantsList());
        }
        
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
    }    /**
     * Toggle participants list visibility
     */
    toggleParticipantsList() {
        const participantsList = this.elements.participantsList;
        const toggleText = this.elements.showParticipantsBtn.querySelector('.toggle-text');
        
        if (participantsList.classList.contains('hidden')) {
            // Show participants list
            participantsList.classList.remove('hidden');
            toggleText.textContent = 'Hide';
            
            // Request updated participants from server
            if (this.socket && this.socket.connected) {
                this.socket.emit('get-room-participants');
            }
        } else {
            // Hide participants list
            participantsList.classList.add('hidden');
            toggleText.textContent = 'Show';
        }
    }

    /**
     * Update participants list display
     */
    updateParticipantsList() {
        if (!this.elements.participantsList || !this.elements.participantsCount) return;
        
        const count = this.roomParticipants.length;
        this.elements.participantsCount.textContent = count;
        
        if (count === 0) {
            this.elements.participantsList.innerHTML = '<div class="no-participants">No participants in room</div>';
            return;
        }
        
        // Create participants list HTML
        const participantsHTML = this.roomParticipants.map(participant => {
            const joinedTime = new Date(participant.joinedAt).toLocaleTimeString();
            const isCurrentUser = participant.isCurrentUser || (this.currentUser && participant.username === this.currentUser.username);
            
            return `
                <div class="participant-item ${isCurrentUser ? 'current-user' : ''}">
                    <div class="participant-avatar">👤</div>
                    <div class="participant-info">
                        <div class="participant-name">
                            ${participant.username}
                            ${isCurrentUser ? '<span class="you-label">(You)</span>' : ''}
                        </div>
                        <div class="participant-joined">Joined: ${joinedTime}</div>
                    </div>
                    <div class="participant-status online">●</div>
                </div>
            `;
        }).join('');
        
        this.elements.participantsList.innerHTML = participantsHTML;
    }

    /**
     * Show speaking indicator for a user
     */
    showSpeakingIndicator(username) {
        // Update active speakers list
        if (this.elements.speakersList) {
            const existingSpeaker = this.elements.speakersList.querySelector(`[data-username="${username}"]`);
            
            if (!existingSpeaker) {
                // Remove "no speakers" message
                const noSpeakers = this.elements.speakersList.querySelector('.no-speakers');
                if (noSpeakers) {
                    noSpeakers.style.display = 'none';
                }
                
                // Add speaker indicator
                const speakerElement = document.createElement('div');
                speakerElement.className = 'speaker-item talking';
                speakerElement.setAttribute('data-username', username);
                speakerElement.innerHTML = `
                    <div class="speaker-status"></div>
                    <span class="speaker-name">${username}</span>
                    <span class="speaking-indicator">🎤</span>
                `;
                
                this.elements.speakersList.appendChild(speakerElement);
                
                // Remove after 3 seconds
                setTimeout(() => {
                    if (speakerElement.parentNode) {
                        speakerElement.remove();
                        
                        // Show "no speakers" if list is empty
                        if (this.elements.speakersList.children.length === 1) {
                            const noSpeakers = this.elements.speakersList.querySelector('.no-speakers');
                            if (noSpeakers) {
                                noSpeakers.style.display = 'block';
                            }
                        }
                    }
                }, 3000);
            }
        }
    }

    /**
     * Show notification to user
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${type === 'info' ? 'ℹ️' : type === 'warning' ? '⚠️' : '✅'}</span>
                <span class="notification-text">${message}</span>
            </div>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Show with animation
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Remove after 4 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 4000);
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
