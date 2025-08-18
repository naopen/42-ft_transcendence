#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

// Reset .env file to localhost defaults
function resetEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  
  try {
    // Read .env to preserve important keys like GOOGLE_CLIENT_ID
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Parse env content into key-value pairs
    const lines = envContent.split('\n');
    const envVars = {};
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    
    // Reset URL-related variables to localhost defaults
    envVars['FRONTEND_URL'] = 'http://localhost:8080';
    envVars['BACKEND_URL'] = 'http://localhost:8080';
    envVars['VITE_API_URL'] = 'http://localhost:8080/api';
    envVars['VITE_WS_URL'] = 'ws://localhost:8080';
    envVars['USE_HTTPS'] = 'false';
    
    // Rebuild the .env content
    const newEnvContent = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    fs.writeFileSync(envPath, newEnvContent + '\n');
    
    console.log(`${colors.green}✅ Reset .env file to localhost defaults${colors.reset}`);
    console.log(`${colors.yellow}   FRONTEND_URL=http://localhost:8080${colors.reset}`);
    console.log(`${colors.yellow}   BACKEND_URL=http://localhost:8080${colors.reset}`);
    console.log(`${colors.yellow}   VITE_API_URL=http://localhost:8080/api${colors.reset}`);
    console.log(`${colors.yellow}   VITE_WS_URL=ws://localhost:8080${colors.reset}`);
  } catch (error) {
    console.log(`${colors.red}❌ Could not reset .env file: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run reset
resetEnvFile();
