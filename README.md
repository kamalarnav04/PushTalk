# 🎙️ PushTalk - Walkie-Talkie Web App

A real-time audio communication web application that allows users to send voice messages to each other over a local network. Built with Node.js, Express, Socket.IO, and modern Web APIs.

## ✨ Features

- **🎤 Push-to-Talk**: Hold button to record and send audio messages
- **🔊 Real-time Audio**: Near-instant audio transmission using WebSockets
- **📱 Multi-device Support**: Works on phones, tablets, and computers
- **🌐 Local Network**: Connect multiple devices on the same Wi-Fi network
- **📊 Volume Monitoring**: Real-time audio level visualization
- **🎨 Modern UI**: Clean, responsive design with smooth animations
- **🔒 HTTPS Support**: Secure connections for network access
- **🛡️ Enhanced Security**: Built-in SSL certificate generation

## 📋 Complete Setup Guide (For Non-Technical Users)

### What You'll Need
- A Windows computer
- Internet connection (for initial setup)
- Multiple devices (phones, tablets, computers) on the same Wi-Fi network

### Step 1: Install Node.js
1. **Go to**: https://nodejs.org/
2. **Download**: Click the green "LTS" button (recommended version)
3. **Install**: Run the downloaded file and follow the installation wizard
   - Accept all default settings
   - Click "Next" through all steps
   - Click "Install" when prompted
4. **Verify**: Open PowerShell and type `node --version` (you should see a version number)

### Step 2: Download the Project
1. **Download**: Get the PushTalk project files to your computer
2. **Extract**: If it's a zip file, extract it to a folder like `C:\PushTalk`
3. **Remember the location**: You'll need to navigate to this folder

### Step 3: Open PowerShell
1. **Press**: `Windows Key + R`
2. **Type**: `powershell`
3. **Press**: `Enter`
4. **Navigate to project**: 
   ```powershell
   cd "C:\PushTalk"
   ```
   (Replace `C:\PushTalk` with your actual folder path)

### Step 4: Install Project Dependencies
```powershell
npm install
```
*This downloads all the required components. Wait for it to complete.*

### Step 5: Generate Security Certificates (Important!)
```powershell
npm run generate-cert
```
*This creates secure certificates needed for microphone access on network devices.*

### Step 6: Start the Application
```powershell
npm start
```

You'll see output like:
```
🎙️  Walkie-Talkie Server Started
📡 Server running on port 3000
🌐 Local access: https://localhost:3000
📱 Network access URLs:
   https://192.168.1.100:3000
   https://10.0.0.50:3000
```

### Step 7: Access the App
1. **On the same computer**: Open your browser and go to `https://localhost:3000`
2. **On other devices**: Use one of the network URLs (like `https://192.168.1.100:3000`)
3. **Accept security warning**: Your browser will show a warning about the certificate - this is normal! Click "Advanced" then "Proceed to localhost" (or similar)
4. **Allow microphone access**: Click "Allow" when prompted

### Step 8: Start Talking!
1. **Hold the "Hold to Talk" button** and speak
2. **Release** to stop recording
3. **Listen** for responses from other users
4. **Use spacebar** as a keyboard shortcut instead of clicking the button

## 🚀 Quick Reference

### Starting the App (Every Time)
1. Open PowerShell
2. Navigate to project folder: `cd "C:\PushTalk"`
3. Start server: `npm start`
4. Open browser to the displayed URLs

### Stopping the App
- Press `Ctrl + C` in the PowerShell window

## 📁 Project Structure

```
PushTalk/
│
├── server/
│   ├── server.js          ← Node.js + Express + Socket.IO backend
│   ├── cert.pem           ← SSL certificate (auto-generated)
│   └── key.pem            ← SSL private key (auto-generated)
│
├── public/
│   ├── index.html         ← Main user interface
│   ├── styles.css         ← Styling and animations
│   └── script.js          ← Client-side audio handling + WebSocket communication
│
├── generate-cert.js       ← SSL certificate generation script
├── generate-cert.ps1      ← PowerShell certificate generation script
├── package.json           ← Dependencies and scripts
├── README.md             ← This comprehensive documentation
└── Instruction.txt       ← Original build instructions
```

## 🛠️ Technical Details & Implementation

### Backend (Node.js + Express + Socket.IO)
- **Express server** serves static files and handles HTTP/HTTPS requests
- **Socket.IO** manages WebSocket connections for real-time communication
- **Audio broadcasting** sends audio data from one client to all others
- **Client management** tracks connected users and connection status
- **HTTPS Support** automatic HTTPS detection and SSL certificate validation
- **Network Access Warnings** clear setup instructions in console output

### Frontend (HTML + CSS + JavaScript)
- **MediaRecorder API** captures audio from the microphone
- **AudioContext API** monitors volume levels and handles audio processing
- **Socket.IO client** communicates with the server in real-time
- **Responsive design** works on desktop and mobile devices
- **Enhanced Error Handling** detailed error messages with specific solutions
- **Network Access Notice** alerts for HTTP connections on network devices

### Audio Processing
- **Format**: WebM with Opus codec for efficient compression
- **Quality**: 128 kbps audio bitrate with noise suppression
- **Latency**: Near real-time transmission with minimal delay
- **Compatibility**: Works across all modern browsers

### Security Features
- **SSL Certificate Generation**: Automatic self-signed certificate creation
- **Enhanced Browser Compatibility Detection**: Identifies specific API issues
- **Secure Context Requirements**: Proper HTTPS enforcement for network access
- **Error Type Detection**: Specific error handling for:
  - "HTTPS Required"
  - "Microphone Denied" 
  - "No Microphone"
  - "Not Supported"

## 📱 How to Use

1. **📡 Connect**: Make sure all devices are on the same Wi-Fi network
2. **🔗 Share**: Send the app URL to other users
3. **🎤 Allow**: Grant microphone permission when prompted
4. **💬 Talk**: Hold the "Hold to Talk" button and speak
5. **👂 Listen**: Release the button and hear responses from others

### Keyboard Shortcut
- **Spacebar**: Hold to talk (same as clicking the button)

## 🔧 Configuration

### Audio Settings
The app automatically configures optimal audio settings:
- **Echo Cancellation**: Reduces audio feedback
- **Noise Suppression**: Filters background noise
- **Auto Gain Control**: Normalizes volume levels
- **Sample Rate**: 44.1 kHz for high quality

### Network Configuration
- **Default Port**: 3000 (configurable via environment variable)
- **CORS**: Enabled for all origins (local network access)
- **Firewall**: Ensure port 3000 is accessible on your network

## 🌐 Network Access

When you start the server, it will display URLs like:
```
🎙️  Walkie-Talkie Server Started
📡 Server running on port 3000
🌐 Local access: https://localhost:3000
📱 Network access URLs:
   https://192.168.1.100:3000
   https://10.0.0.50:3000
🔒 HTTPS enabled with self-signed certificates
⚠️  Browsers will show security warnings - this is normal!
```

Use the network access URLs to connect from other devices on your local network. For network access, HTTPS is required for microphone functionality.

## 🐛 Troubleshooting & Network Fix Guide

### 🔧 Network Access Fix - Browser Audio Features Error

**❌ Problem**: Getting error "Your browser does not support the required audio features. Please use a modern browser like Chrome, Firefox, or Safari." when accessing from network devices (not localhost).

**🎯 Root Cause**: Modern web browsers require a **secure context (HTTPS)** for accessing sensitive APIs like:
- `navigator.mediaDevices.getUserMedia()` (microphone access)
- `MediaRecorder` API (audio recording)

When accessing the app via network IP addresses using HTTP (e.g., `http://192.168.1.100:3000`), browsers block these APIs for security reasons.

### ✅ Solution: Enable HTTPS

**Quick Fix (Recommended)**
1. **Generate SSL certificates**:
   ```powershell
   npm run generate-cert
   ```

2. **Restart the server**:
   ```powershell
   npm start
   ```

3. **Access via HTTPS**:
   - Use `https://your-ip:3000` instead of `http://your-ip:3000`
   - Accept the browser security warning (normal for self-signed certificates)

### Alternative Methods

**Method 1: PowerShell Script**
```powershell
.\generate-cert.ps1
npm start
```

**Method 2: Manual OpenSSL** (if you have OpenSSL installed)
```powershell
openssl req -x509 -newkey rsa:4096 -keyout server/key.pem -out server/cert.pem -days 365 -nodes
npm start
```

**Method 3: Use Localhost Only**
- Access the app via `http://localhost:3000` on the server machine
- Share screen or use remote desktop for other users

### 🔍 Testing the Fix

1. **Start the server with HTTPS**:
   ```powershell
   npm run generate-cert
   npm start
   ```

2. **Test locally**:
   - Open `https://localhost:3000`
   - Accept security warning
   - Allow microphone access
   - Verify functionality

3. **Test network access**:
   - Open `https://your-ip:3000` on another device
   - Accept security warning
   - Allow microphone access
   - Test audio communication

### Common Error Messages & Solutions

**❌ "HTTPS Required" or "Microphone access denied"**
- **Cause**: Browser requires HTTPS for microphone access on network devices
- **Solution**: Follow the HTTPS setup steps above

**❌ "No Microphone Found"**
- Check if microphone is connected and working
- Verify browser permissions for microphone access
- Try refreshing the page

**❌ "Microphone Denied"**
- Click the microphone icon in browser address bar
- Select "Allow" for microphone access
- Refresh the page if needed

**❌ "Not Supported"**
- Update your browser to the latest version
- Try a different browser (Chrome, Firefox, Safari, Edge)
- Ensure you're using a supported browser

**❌ "Cannot connect to server"**
- Ensure the server is running (`npm start`)
- Check that devices are on the same network
- Verify firewall settings allow port 3000
- Try accessing via `https://localhost:3000` on the server machine

**❌ "Audio not playing on other devices"**
- Check speaker volume on receiving devices
- Verify network connectivity between devices
- Check browser audio settings
- Ensure all devices are using the same URL (HTTP vs HTTPS)

### 🔒 Browser Security Requirements

- **Localhost Access**: HTTP allowed for `getUserMedia` (microphone access)
- **Network Access**: HTTPS required for `getUserMedia` (microphone access)
- **Self-signed Certificates**: Acceptable after user confirmation
- **Certificate Warning**: Normal behavior - click "Advanced" → "Proceed" to continue

### 🌐 Understanding Network Access

When you start the server, it will display URLs like:
```
🎙️  Walkie-Talkie Server Started
📡 Server running on port 3000
🌐 Local access: https://localhost:3000
📱 Network access URLs:
   https://192.168.1.100:3000
   https://10.0.0.50:3000
🔒 HTTPS enabled with self-signed certificates
⚠️  Browsers will show security warnings - this is normal!
```

**Important**: Use the HTTPS URLs for network access to ensure microphone functionality.

### Browser Compatibility
- ✅ **Chrome** (recommended)
- ✅ **Firefox**
- ✅ **Safari** (macOS/iOS)
- ✅ **Edge**
- ❌ **Internet Explorer** (not supported)

## 🔒 Security & Privacy

- **Local Network Only**: Audio data stays within your local network
- **No Recording**: Audio is transmitted live, not stored anywhere
- **No External Services**: Everything runs locally on your network
- **HTTPS**: Consider using HTTPS for enhanced security (optional)

## 🎯 Use Cases

- **👨‍👩‍👧‍👦 Family Communication**: Talk between rooms in a house
- **🏗️ Work Sites**: Communicate across construction sites or warehouses
- **🎮 Gaming**: Voice communication for local multiplayer games
- **📚 Education**: Interactive classroom communication
- **🏥 Healthcare**: Secure communication within medical facilities
- **🎪 Events**: Coordination during events or performances

## 🛠️ Development

### Adding Features
The modular code structure makes it easy to add new features:
- **Server logic**: Modify `server/server.js`
- **UI components**: Update `public/index.html` and `public/styles.css`
- **Client functionality**: Extend `public/script.js`

### Environment Variables
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (development/production)

### Testing
Test the application with multiple devices:
1. Start the server on one device
2. Open the network URL on 2+ other devices
3. Test audio transmission between devices
4. Verify connection status and activity logging

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🏆 Network Fix Implementation Results

✅ **The app now works properly on network devices with proper HTTPS setup**
✅ **Clear error messages guide users to the correct solution**
✅ **Automatic certificate generation simplifies setup**
✅ **Comprehensive documentation prevents future issues**

### Files Enhanced for Network Access
- **Backend**: `server/server.js` - Added HTTPS support
- **Frontend**: `public/script.js` - Enhanced error handling and compatibility checks
- **Frontend**: `public/index.html` - Added network access notice
- **Scripts**: `generate-cert.js`, `generate-cert.ps1` - Certificate generation
- **Package**: `package.json` - Added generate-cert script

## 🤝 Contributing

Feel free to submit issues, feature requests, or pull requests to improve this walkie-talkie application!

---

**🎙️ Happy talking!** If you encounter any issues or have suggestions, please feel free to reach out.
