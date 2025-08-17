#!/usr/bin/env node

const os = require('os');

// Get local IP address
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '192.168.1.100'; // Fallback IP
}

const LOCAL_IP = getLocalIpAddress();

// Color codes for terminal output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

console.log(`${colors.green}${colors.bright}==============================================`);
console.log(`🚀 ft_transcendence - HTTPS Remote Multiplayer`);
console.log(`==============================================${colors.reset}`);
console.log('');
console.log(`${colors.yellow}📡 Network Information:${colors.reset}`);
console.log(`   Local IP: ${colors.cyan}${LOCAL_IP}${colors.reset}`);
console.log('');
console.log(`${colors.yellow}🌐 Access URLs (HTTPS):${colors.reset}`);
console.log(`   Frontend:    ${colors.blue}https://${LOCAL_IP}:5173${colors.reset}`);
console.log(`   Backend:     ${colors.blue}https://${LOCAL_IP}:3000${colors.reset}`);
console.log(`   Health:      ${colors.blue}https://${LOCAL_IP}:3000/health${colors.reset}`);
console.log('');
console.log(`${colors.yellow}🎮 Remote Multiplayer:${colors.reset}`);
console.log(`   Share this URL with other players:`);
console.log(`   ${colors.green}${colors.bright}https://${LOCAL_IP}:5173${colors.reset}`);
console.log('');
console.log(`${colors.yellow}⚠️  Important Notes:${colors.reset}`);
console.log(`   • Other devices must be on the same network`);
console.log(`   • Accept the SSL certificate warning in browsers`);
console.log(`   • For Google OAuth, update redirect URI to:`);
console.log(`     ${colors.cyan}https://${LOCAL_IP}:3000/api/auth/google/callback${colors.reset}`);
console.log('');
console.log(`${colors.yellow}🔧 Quick Setup for OAuth:${colors.reset}`);
console.log(`   1. Go to Google Cloud Console`);
console.log(`   2. Navigate to OAuth 2.0 Client IDs`);
console.log(`   3. Add redirect URI: ${colors.cyan}https://${LOCAL_IP}:3000/api/auth/google/callback${colors.reset}`);
console.log(`   4. Save and restart the application`);
console.log('');
