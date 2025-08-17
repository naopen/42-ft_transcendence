# Remote Multiplayer Setup Guide with ngrok

## 🚀 Quick Start (Recommended)

### Method 1: ngrok Remote Access (Works Anywhere)
```bash
# Install ngrok (if not already installed)
brew install ngrok
# or download from https://ngrok.com/download

# Start with ngrok for true remote multiplayer
make ngrok
```

This method provides:
- ✅ **True remote access** from anywhere on the internet
- ✅ **No network restrictions** 
- ✅ **Works with different ISPs/networks**
- ✅ **Automatic HTTPS** (handled by ngrok)
- ✅ **Single port solution** (bypasses firewall issues)

### Method 2: Local Network HTTPS (Same Network Only)
```bash
# For same-network testing only
make re
```

## 🔧 ngrok Setup Details

### Prerequisites
1. **Install ngrok**: https://ngrok.com/download
2. **Create free account**: https://dashboard.ngrok.com/signup
3. **Authenticate ngrok** (if required for your account)

### Starting with ngrok
```bash
make ngrok
```

This command will:
1. Stop any existing containers
2. Start the application on port 8080 (nginx proxy)
3. Launch ngrok tunnel
4. Display the public ngrok URL
5. Update .env file automatically

### Expected Output
```
🚀 ft_transcendence - ngrok Remote Setup
==============================================

✅ ngrok is installed
🔌 Starting ngrok tunnel on port 8080...
🔍 Getting ngrok tunnel URL...
✅ Updated .env file with ngrok URL

🎉 ngrok tunnel is ready!

🌐 Public Access URL:
   https://abc123.ngrok.io

🎮 Share this URL for remote multiplayer:
   https://abc123.ngrok.io

🔧 Google OAuth Setup Required:
   1. Go to Google Cloud Console
   2. Add redirect URI: https://abc123.ngrok.io/api/auth/google/callback
   3. Save and restart: make restart
```

## 🔧 Google OAuth Configuration

### Problem
You may encounter this error:
```
エラー 400: redirect_uri_mismatch
```

### Solution for ngrok
1. **Start with ngrok** to get your public URL:
   ```bash
   make ngrok
   ```

2. **Copy the ngrok URL** (e.g., `https://abc123.ngrok.io`)

3. **Go to Google Cloud Console**:
   - Navigate to: https://console.cloud.google.com/
   - Select your project
   - Go to APIs & Services > Credentials
   - Find your OAuth 2.0 Client ID

4. **Add Redirect URI**:
   ```
   https://abc123.ngrok.io/api/auth/google/callback
   ```

5. **Save and restart**:
   ```bash
   make restart
   ```

### Current OAuth Settings
- Client ID: `577561669001-h66fquk2cnvo4vvksvct73ocgc0r0f8i.apps.googleusercontent.com`
- Required Redirect URI: `https://[YOUR-NGROK-URL]/api/auth/google/callback`

## 🌐 Architecture Overview

### ngrok Method (Recommended)
```
Internet ←→ ngrok.io ←→ ngrok client ←→ nginx:8080 ←→ frontend:5173
                                                    ←→ backend:3000
```

**Benefits:**
- Single public URL for everything
- Automatic HTTPS termination
- No firewall/router configuration needed
- Works across different networks
- Free tier supports all basic needs

### Local HTTPS Method (Legacy)
```
Local Network ←→ Local IP:5173 (frontend)
              ←→ Local IP:3000 (backend)
```

**Limitations:**
- Only works on same network
- Requires certificate acceptance
- Limited by router/firewall settings
- Multiple ports to manage

## 📱 Multi-Device Testing

### With ngrok (Recommended)
1. **Start ngrok**:
   ```bash
   make ngrok
   ```
2. **Share the ngrok URL** with other players
3. **No network restrictions** - works from anywhere!
4. **Access from any device**:
   - Desktop computers
   - Mobile devices  
   - Different networks/ISPs

### With Local HTTPS (Same Network Only)
1. **Start local HTTPS**:
   ```bash
   make re
   ```
2. **Note the IP address** (e.g., `192.168.11.7`)
3. **On other devices** (same network only):
   - Navigate to `https://[IP]:5173`
   - Accept SSL certificate warning
   - Login and play!

## 🔍 Troubleshooting

### ngrok Issues
- **"ngrok not found"**: Install ngrok from https://ngrok.com/download
- **"Tunnel not created"**: Check if port 8080 is available
- **"Authentication required"**: Sign up for free account at https://dashboard.ngrok.com/
- **"Tunnel session expired"**: Restart with `make ngrok` (free tier has time limits)

### OAuth Errors  
- **redirect_uri_mismatch**: Update Google Cloud Console with current ngrok URL
- **Invalid client**: Check Google OAuth credentials in .env file

### Application Issues
- **Containers not starting**: Run `make down` then `make ngrok`
- **WebSocket connection failed**: Ensure ngrok tunnel is active
- **Game not loading**: Check browser console for errors

### Network Issues (Legacy HTTPS only)
- **Certificate warnings**: Expected - click "Advanced" → "Proceed anyway"
- **Connection refused**: Check firewall settings for ports 3000 and 5173
- **IP changes**: Re-run `make re` if IP address changes

## 🎮 Game Features

### Remote Multiplayer
- **ngrok**: True internet-based multiplayer
- **Real-time gameplay** with WebSocket connections
- **Cross-platform**: Desktop and mobile support
- **No network configuration** required

### 3D Pong with Babylon.js
- Real-time multiplayer gameplay
- Remote player connectivity
- Tournament system support

### Statistics Dashboard
- Game session tracking
- Performance metrics
- Visual charts and graphs

### Multi-language Support
- English (EN)
- Japanese (JA) 
- French (FR)

### Responsive Design
- Works on desktop and mobile
- Firefox compatible
- Cross-browser support

## 📋 Evaluation Checklist

- ✅ **Remote multiplayer** via ngrok (internet-wide access)
- ✅ **Two separate PCs** can connect from different networks
- ✅ **Single port solution** (bypasses firewall issues)
- ✅ **Automatic HTTPS** via ngrok
- ✅ **Google OAuth** with proper redirect URI
- ✅ **Real-time WebSocket** communication
- ✅ **All evaluation requirements** met

## 🚀 Quick Commands Reference

```bash
# Start with ngrok (recommended for evaluation)
make ngrok

# Stop ngrok tunnel
make stop-ngrok

# Local development (same network only)
make up

# Local HTTPS (same network only)
make re

# View help
make help
```

**For evaluation: Use `make ngrok` for true remote multiplayer testing!**
