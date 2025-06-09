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
- A Windows computer with Git and Node.js installed
- Internet connection (for initial setup)
- Multiple devices (phones, tablets, computers) on the same Wi-Fi network

### Step 1: Clone the Repository
1. **Open PowerShell**: Press `Windows Key + R`, type `powershell`, and press `Enter`
2. **Navigate to desired location**: 
   ```powershell
   cd "C:\"
   ```
3. **Clone the repository**:
   ```powershell
   git clone https://github.com/yourusername/PushTalk.git
   ```
4. **Navigate to project folder**:
   ```powershell
   cd "PushTalk"
   ```

### Step 2: Install Project Dependencies
```powershell
npm install
```
*This downloads all the required components. Wait for it to complete.*

### Step 3: Generate Security Certificates (Important!)
```powershell
npm run generate-cert
```
*This creates secure certificates needed for microphone access on network devices.*

### Step 4: Start the Application
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

### Step 5: Access the App
1. **On the same computer**: Open your browser and go to `https://localhost:3000`
2. **On other devices**: Use one of the network URLs (like `https://192.168.1.100:3000`)
3. **Accept security warning**: Your browser will show a warning about the certificate - this is normal! Click "Advanced" then "Proceed to localhost" (or similar)
4. **Allow microphone access**: Click "Allow" when prompted

### Step 6: Start Talking!
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

## 🛠️ Technical Details

### Backend
- **Express + Socket.IO** for real-time WebSocket communication
- **HTTPS support** with automatic SSL certificate generation
- **Audio broadcasting** from one client to all connected users

### Frontend
- **MediaRecorder API** for microphone audio capture
- **AudioContext API** for volume monitoring
- **Responsive design** works on desktop and mobile

### Audio Processing
- **WebM/Opus codec** for efficient compression
- **128 kbps quality** with noise suppression
- **Near real-time** transmission with minimal latency

## 📱 How to Use

1. **Connect** all devices to same Wi-Fi network
2. **Allow** microphone permission when prompted
3. **Hold** "Hold to Talk" button and speak
4. **Release** button to listen for responses

## 🎯 Use Cases

- Family communication between rooms
- Work site coordination
- Gaming voice chat
- Classroom interaction
- Event coordination

## 🛠️ Development

### Adding Features
- **Server**: Modify `server/server.js`
- **UI**: Update `public/index.html` and `public/styles.css`
- **Client**: Extend `public/script.js`

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
