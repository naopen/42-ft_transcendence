#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m'
};

// Reset .env file to localhost defaults
function resetEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  
  try {
    // Read .env to preserve important keys like GOOGLE_CLIENT_ID
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Reset URLs to localhost defaults
    envContent = envContent.replace(/FRONTEND_URL=.*/g, 'FRONTEND_URL=http://localhost:8080');
    envContent = envContent.replace(/BACKEND_URL=.*/g, 'BACKEND_URL=http://localhost:8080');
    envContent = envContent.replace(/VITE_API_URL=.*/g, 'VITE_API_URL=http://localhost:8080/api');
    envContent = envContent.replace(/VITE_WS_URL=.*/g, 'VITE_WS_URL=ws://localhost:8080');
    
    // Reset USE_HTTPS to false
    envContent = envContent.replace(/USE_HTTPS=.*/g, 'USE_HTTPS=false');
    
    fs.writeFileSync(envPath, envContent);
    
    console.log(`${colors.green}✅ Reset .env file to localhost defaults${colors.reset}`);
  } catch (error) {
    console.log(`${colors.yellow}⚠️  Could not reset .env file: ${error.message}${colors.reset}`);
  }
}

// Run reset
resetEnvFile();
