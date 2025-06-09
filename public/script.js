/**
 * Walkie-Talkie Web App Client-Side JavaScript
 * Handles audio recording, WebSocket communication, and UI interactions
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
          // UI elements
        this.elements = {
            talkButton: document.getElementById('talkButton'),
            recordingStatus: document.getElementById('recordingStatus'),
            statusIndicator: document.getElementById('statusIndicator'),
            statusText: document.getElementById('statusText'),
            clientCount: document.getElementById('clientCount'),
            volumeLevel: document.getElementById('volumeLevel'),
            playbackAudio: document.getElementById('playbackAudio'),
            createRoomForm: document.getElementById('createRoomForm'),
            joinRoomForm: document.getElementById('joinRoomForm'),
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
     */    async init() {
        try {
            console.log('Initializing walkie-talkie...');
            
            // Show network notice if needed
            this.checkAndShowNetworkNotice();
            
            // Initialize Socket.IO connection
            this.initSocket();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Request microphone access
            await this.requestMicrophoneAccess();
            
            console.log('✅ Walkie-talkie ready!');
        } catch (error) {
            console.error('❌ Initialization failed:', error);
        }
    }

    /**
     * Check if we should show the network access notice
     */
    checkAndShowNetworkNotice() {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        
        // Show notice if accessing via IP address over HTTP
        if (protocol === 'http:' && 
            hostname !== 'localhost' && 
            hostname !== '127.0.0.1' && 
            /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
            
            const notice = document.getElementById('networkNotice');
            if (notice) {
                notice.style.display = 'block';
            }
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
            this.updateConnectionStatus(true);
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
        
        // Connection errors
        this.socket.on('connect_error', (error) => {
            console.error('❌ Connection error:', error);
            this.updateConnectionStatus(false);
        });
    }    /**
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
        
        // Room form event listeners
        if (this.elements.createRoomForm) {
            this.elements.createRoomForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const roomName = this.elements.createRoomForm.createRoomName.value.trim();
                const pin = this.elements.createRoomForm.createRoomPin.value.trim();
                if (!roomName || !/^\d{4,6}$/.test(pin)) {
                    alert('Please enter a valid room name and a 4–6 digit PIN.');
                    return;
                }
                // TODO: Implement create room logic
                alert(`Room '${roomName}' created with PIN ${pin}`);
            });
        }
        if (this.elements.joinRoomForm) {
            this.elements.joinRoomForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const roomName = this.elements.joinRoomForm.joinRoomName.value.trim();
                const pin = this.elements.joinRoomForm.joinRoomPin.value.trim();
                if (!roomName || !/^\d{4,6}$/.test(pin)) {
                    alert('Please enter a valid room name and a 4–6 digit PIN.');
                    return;
                }
                // TODO: Implement join room logic
                alert(`Joining room '${roomName}' with PIN ${pin}`);
            });
        }
    }    /**
     * Request microphone access with better error handling
     */
    async requestMicrophoneAccess() {
        try {
            // Check if we're in a secure context
            if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
                throw new Error('Microphone access requires HTTPS when not on localhost. Please access via HTTPS or use localhost.');
            }
            
            this.audioStream = await navigator.mediaDevices.getUserMedia(this.config.audioConstraints);
            
            // Set up audio context for volume monitoring
            this.setupAudioContext();
              // Enable the talk button
            this.elements.talkButton.disabled = false;
            this.elements.talkButton.querySelector('.button-text').textContent = 'Hold to Talk';
            
            console.log('🎤 Microphone access granted');
            
        } catch (error) {
            console.error('❌ Microphone access error:', error);
            
            let errorMessage = 'Microphone access failed';
            let detailedMessage = '';
            
            // Provide specific error messages based on the error type
            if (error.name === 'NotAllowedError') {
                errorMessage = 'Microphone Denied';
                detailedMessage = 'Please allow microphone access and refresh the page to use the walkie-talkie.';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'No Microphone';
                detailedMessage = 'No microphone device found. Please connect a microphone and refresh the page.';
            } else if (error.name === 'NotSupportedError') {
                errorMessage = 'Not Supported';
                detailedMessage = 'Your browser does not support microphone access. Please use a modern browser like Chrome, Firefox, or Safari.';
            } else if (error.message.includes('HTTPS')) {
                errorMessage = 'HTTPS Required';
                detailedMessage = 'Microphone access requires HTTPS when accessing from network. Please use HTTPS or access via localhost.';
            } else {
                errorMessage = 'Access Failed';
                detailedMessage = `Microphone access failed: ${error.message}`;
            }
              this.elements.talkButton.querySelector('.button-text').textContent = errorMessage;
            console.log(`❌ ${errorMessage}`);
            
            // Show detailed error message
            alert(`❌ ${errorMessage}\n\n${detailedMessage}\n\n🔧 Solutions:\n• Refresh the page and allow microphone access\n• Use HTTPS for network access\n• Try accessing via localhost instead\n• Check browser microphone permissions`);
        }
    }

    /**
     * Set up audio context for volume monitoring
     */
    setupAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.audioAnalyser = this.audioContext.createAnalyser();
            const source = this.audioContext.createMediaStreamSource(this.audioStream);
            
            source.connect(this.audioAnalyser);
            this.audioAnalyser.fftSize = 256;
            
            const bufferLength = this.audioAnalyser.frequencyBinCount;
            this.volumeDataArray = new Uint8Array(bufferLength);
            
            // Start volume monitoring
            this.monitorVolume();
            
        } catch (error) {
            console.error('❌ Audio context setup failed:', error);
        }
    }

    /**
     * Monitor microphone volume level
     */
    monitorVolume() {
        if (!this.audioAnalyser) return;
        
        this.audioAnalyser.getByteFrequencyData(this.volumeDataArray);
        
        // Calculate average volume
        const average = this.volumeDataArray.reduce((sum, value) => sum + value, 0) / this.volumeDataArray.length;
        const volumePercent = (average / 255) * 100;
        
        // Update volume indicator
        this.elements.volumeLevel.style.width = `${volumePercent}%`;
        
        // Continue monitoring
        requestAnimationFrame(() => this.monitorVolume());
    }

    /**
     * Start audio recording
     */
    async startRecording(event) {
        if (this.isRecording || !this.audioStream) return;
        
        try {
            // Resume audio context if suspended
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            // Create media recorder
            this.mediaRecorder = new MediaRecorder(this.audioStream, this.config.recordingOptions);
            this.audioChunks = [];
            
            // Set up recording event handlers
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.audioChunks.push(event.data);
                }
            };
            
            this.mediaRecorder.onstop = () => {
                this.sendAudioData();
            };
            
            // Start recording
            this.mediaRecorder.start(100); // Collect data every 100ms
            this.isRecording = true;
            
            // Update UI
            this.updateRecordingUI(true);
            
            // Notify server about talking status
            this.socket.emit('talking-status', { isTalking: true });
            
            console.log('🎤 Recording started');
              } catch (error) {
            console.error('❌ Recording failed:', error);
        }
    }

    /**
     * Stop audio recording
     */
    stopRecording(event) {
        if (!this.isRecording || !this.mediaRecorder) return;
        
        try {
            // Stop recording
            this.mediaRecorder.stop();
            this.isRecording = false;
            
            // Update UI
            this.updateRecordingUI(false);
            
            // Notify server about talking status
            this.socket.emit('talking-status', { isTalking: false });
            
            console.log('🎤 Recording stopped');
            
        } catch (error) {
            console.error('❌ Stop recording failed:', error);
        }
    }

    /**
     * Send recorded audio data to server
     */
    async sendAudioData() {
        if (this.audioChunks.length === 0) return;
        
        try {
            // Create audio blob from chunks
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            
            // Convert to array buffer for transmission
            const arrayBuffer = await audioBlob.arrayBuffer();
              // Send audio data via socket
            this.socket.emit('audio-data', arrayBuffer);
            
            console.log('📤 Audio data sent:', audioBlob.size, 'bytes');
              } catch (error) {
            console.error('❌ Send audio failed:', error);
        }
    }

    /**
     * Play received audio data
     */
    async playReceivedAudio(arrayBuffer) {
        try {
            // Create audio blob from received data
            const audioBlob = new Blob([arrayBuffer], { type: 'audio/webm' });
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Play audio
            this.elements.playbackAudio.src = audioUrl;
              // Set output device if supported
            if (this.elements.playbackAudio.setSinkId) {
                try {
                    await this.elements.playbackAudio.setSinkId('default');
                } catch (error) {
                    console.warn('Could not set audio output device:', error);
                }
            }
            
            await this.elements.playbackAudio.play();
            
            // Clean up
            this.elements.playbackAudio.onended = () => {
                URL.revokeObjectURL(audioUrl);
            };
            
            console.log('🔊 Playing received audio');
              } catch (error) {
            console.error('❌ Audio playback failed:', error);
        }
    }    /**
     * Update connection status UI
     */
    updateConnectionStatus(connected) {
        if (connected) {
            this.elements.statusIndicator.classList.add('connected');
            this.elements.statusText.textContent = 'Connected';
        } else {
            this.elements.statusIndicator.classList.remove('connected');
            this.elements.statusText.textContent = 'Disconnected';
        }
    }

    /**
     * Update recording UI state
     */
    updateRecordingUI(recording) {
        if (recording) {
            this.elements.recordingStatus.classList.remove('hidden');
            this.elements.talkButton.style.transform = 'scale(0.95)';
            this.elements.talkButton.querySelector('.button-text').textContent = 'Recording...';
        } else {
            this.elements.recordingStatus.classList.add('hidden');
            this.elements.talkButton.style.transform = 'scale(1)';
            this.elements.talkButton.querySelector('.button-text').textContent = 'Hold to Talk';
        }
    }}

/**
 * Check browser compatibility and secure context requirements
 */
function checkBrowserCompatibility() {
    const errors = [];
    
    // Check for basic MediaDevices support
    if (!navigator.mediaDevices) {
        errors.push('MediaDevices API not supported');
    }
    
    // Check for getUserMedia support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        errors.push('getUserMedia API not supported');
    }
    
    // Check for MediaRecorder support
    if (!window.MediaRecorder) {
        errors.push('MediaRecorder API not supported');
    }
    
    // Check for AudioContext support
    if (!window.AudioContext && !window.webkitAudioContext) {
        errors.push('AudioContext API not supported');
    }
    
    // Check for secure context (HTTPS requirement for network access)
    if (!window.isSecureContext && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        errors.push('Secure context (HTTPS) required for network access');
    }
    
    return errors;
}

/**
 * Show detailed error message with solutions
 */
function showCompatibilityError(errors) {
    let message = '❌ Browser Compatibility Issues Detected:\n\n';
    
    errors.forEach((error, index) => {
        message += `${index + 1}. ${error}\n`;
    });
    
    message += '\n🔧 Solutions:\n';
    
    if (errors.some(e => e.includes('Secure context'))) {
        message += '• Access via HTTPS (https://your-ip:3000) instead of HTTP\n';
        message += '• Or use localhost/127.0.0.1 for local testing\n';
    }
    
    if (errors.some(e => e.includes('not supported'))) {
        message += '• Update to a modern browser (Chrome 47+, Firefox 41+, Safari 14+)\n';
        message += '• Enable experimental web features in browser settings\n';
    }
    
    message += '\n📱 Recommended browsers:\n';
    message += '• Chrome (desktop & mobile)\n';
    message += '• Firefox (desktop & mobile)\n';
    message += '• Safari (macOS & iOS)\n';
    message += '• Edge (desktop & mobile)';
    
    alert(message);
}

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    // Check browser compatibility
    const compatibilityErrors = checkBrowserCompatibility();
    
    if (compatibilityErrors.length > 0) {
        console.error('❌ Browser compatibility issues:', compatibilityErrors);
        showCompatibilityError(compatibilityErrors);
        
        // Still try to initialize for partial compatibility
        console.log('⚠️ Attempting to initialize despite compatibility issues...');
    }
    
    // Initialize the walkie-talkie app
    window.walkieTalkieApp = new WalkieTalkieApp();
});
