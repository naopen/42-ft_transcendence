# HTTPS Remote Multiplayer Setup Guide

## 🚀 Quick Start

### 1. Generate SSL Certificates and Start
```bash
make re
```

This command will:
- Generate SSL certificates for your local IP
- Update .env file with current IP address  
- Start the application with HTTPS enabled
- Display access URLs automatically

### 2. Access URLs
After running `make re`, you'll see URLs like:
- **Frontend**: `https://192.168.11.7:5173`
- **Backend**: `https://192.168.11.7:3000`
- **Health Check**: `https://192.168.11.7:3000/health`

Share the frontend URL with other players on the same network.

## 🔧 Google OAuth Configuration

### Problem
You may encounter this error:
```
エラー 400: redirect_uri_mismatch
```

### Solution
1. **Go to Google Cloud Console**
   - Navigate to: https://console.cloud.google.com/
   - Select your project

2. **Navigate to OAuth 2.0 Client IDs**
   - Go to APIs & Services > Credentials
   - Find your OAuth 2.0 Client ID

3. **Add Redirect URI**
   Add the following redirect URI (replace IP with your actual IP):
   ```
   https://192.168.11.7:3000/api/auth/google/callback
   ```

4. **Save and Restart**
   ```bash
   make restart
   ```

### Current OAuth Settings
- Client ID: `577561669001-h66fquk2cnvo4vvksvct73ocgc0r0f8i.apps.googleusercontent.com`
- Required Redirect URI: `https://192.168.11.7:3000/api/auth/google/callback`

## 🌐 Network Requirements

### For Remote Multiplayer
- All devices must be on the same network
- Firewall should allow connections to ports 3000 and 5173
- Devices will need to accept the self-signed SSL certificate

### Testing Connectivity
Run this command to test HTTPS backend:
```bash
node scripts/test-https.js
```

## 📱 Multi-Device Testing

### On Host Machine
1. Run `make re`
2. Note the displayed IP address
3. Access `https://[IP]:5173` in browser
4. Accept SSL certificate warning

### On Other Devices (Same Network)
1. Open browser and navigate to `https://[IP]:5173`
2. Accept SSL certificate warning
3. Login with Google OAuth
4. Start playing multiplayer Pong!

## 🔍 Troubleshooting

### Certificate Warnings
- **Expected**: Browsers will show SSL warnings for self-signed certificates
- **Action**: Click "Advanced" → "Proceed anyway" or similar

### OAuth Errors  
- **Check**: Google Cloud Console redirect URI configuration
- **Update**: Add `https://[YOUR_IP]:3000/api/auth/google/callback`

### Network Issues
- **Firewall**: Ensure ports 3000 and 5173 are accessible
- **IP Changes**: Re-run `make re` if IP address changes

## 🎮 Game Features

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

- ✅ HTTPS enabled for remote multiplayer
- ✅ SSL certificates auto-generated
- ✅ Dynamic IP detection and URL display
- ✅ Google OAuth with correct redirect URI
- ✅ Multi-device connectivity on same network
- ✅ All evaluation requirements met

Run `make eval` for complete evaluation checklist.
