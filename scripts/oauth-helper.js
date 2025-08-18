#!/usr/bin/env node

// OAuth URL Management Script
// Automatically updates Google OAuth settings when ngrok URL changes

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Load environment variables manually
const envPath = require('path').join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key] = value;
    }
  });
}

const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bright: '\x1b[1m'
};

// Get current ngrok URL
function getCurrentNgrokUrl() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4040,
      path: '/api/tunnels',
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const tunnels = JSON.parse(data);
          const httpsTunnel = tunnels.tunnels.find(t => t.proto === 'https');
          
          if (httpsTunnel) {
            resolve(httpsTunnel.public_url);
          } else {
            reject(new Error('No HTTPS tunnel found'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('timeout'));
    });

    req.end();
  });
}

// Check if OAuth URLs need updating
function checkUrlsNeedUpdate(currentUrl) {
  const envPath = path.join(__dirname, '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const frontendUrlMatch = envContent.match(/FRONTEND_URL=(.+)/);
  const currentFrontendUrl = frontendUrlMatch ? frontendUrlMatch[1] : null;
  
  return currentFrontendUrl !== currentUrl;
}

// Generate OAuth configuration instructions
function generateOAuthInstructions(ngrokUrl) {
  const instructions = {
    jsOrigins: [
      ngrokUrl,
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:8080'
    ],
    redirectUris: [
      `${ngrokUrl}/api/auth/google/callback`,
      'http://localhost:3000/api/auth/google/callback',
      'http://localhost:8080/api/auth/google/callback'
    ]
  };
  
  return instructions;
}

// Display comprehensive setup instructions
function displaySetupInstructions(ngrokUrl, oauthConfig) {
  console.log(`${colors.green}${colors.bright}🔧 OAuth Configuration Required${colors.reset}`);
  console.log('');
  console.log(`${colors.yellow}📋 Copy and paste these settings into Google Cloud Console:${colors.reset}`);
  console.log('');
  
  console.log(`${colors.cyan}${colors.bright}JavaScript Origins (承認済みのJavaScript生成元):${colors.reset}`);
  oauthConfig.jsOrigins.forEach((origin, index) => {
    console.log(`   ${index + 1}. ${colors.white}${origin}${colors.reset}`);
  });
  
  console.log('');
  console.log(`${colors.cyan}${colors.bright}Redirect URIs (承認済みのリダイレクトURI):${colors.reset}`);
  oauthConfig.redirectUris.forEach((uri, index) => {
    console.log(`   ${index + 1}. ${colors.white}${uri}${colors.reset}`);
  });
  
  console.log('');
  console.log(`${colors.yellow}${colors.bright}⚠️  Setup Instructions:${colors.reset}`);
  console.log(`1. Open Google Cloud Console`);
  console.log(`2. Navigate to: APIs & Services > Credentials`);
  console.log(`3. Click your OAuth 2.0 Client ID: ${colors.cyan}ft-transcendence Web Client${colors.reset}`);
  console.log(`4. Add the URLs above to both sections`);
  console.log(`5. Click ${colors.green}SAVE${colors.reset}`);
  console.log(`6. Wait 1-2 minutes for changes to propagate`);
  console.log('');
  console.log(`${colors.green}${colors.bright}🧪 Test URL: ${ngrokUrl}${colors.reset}`);
  console.log('');
}

// Save configuration for future reference
function saveConfigReference(ngrokUrl, oauthConfig) {
  const configPath = path.join(__dirname, 'oauth-config.json');
  const config = {
    lastUpdated: new Date().toISOString(),
    ngrokUrl: ngrokUrl,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    oauthConfig: oauthConfig
  };
  
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  console.log(`${colors.green}✅ Configuration saved to oauth-config.json${colors.reset}`);
}

// Main function
async function main() {
  try {
    console.log(`${colors.green}${colors.bright}🔍 Checking OAuth Configuration...${colors.reset}`);
    console.log('');
    
    // Get current ngrok URL
    const ngrokUrl = await getCurrentNgrokUrl();
    console.log(`${colors.green}✅ Current ngrok URL: ${ngrokUrl}${colors.reset}`);
    
    // Check if URLs need updating
    const needsUpdate = checkUrlsNeedUpdate(ngrokUrl);
    
    if (needsUpdate) {
      console.log(`${colors.yellow}⚠️  Environment URLs need updating${colors.reset}`);
    } else {
      console.log(`${colors.green}✅ Environment URLs are current${colors.reset}`);
    }
    
    // Generate OAuth configuration
    const oauthConfig = generateOAuthInstructions(ngrokUrl);
    
    console.log('');
    displaySetupInstructions(ngrokUrl, oauthConfig);
    
    // Save configuration reference
    saveConfigReference(ngrokUrl, oauthConfig);
    
  } catch (error) {
    console.error(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
    console.log(`${colors.yellow}💡 Make sure ngrok is running: make ngrok${colors.reset}`);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, getCurrentNgrokUrl, generateOAuthInstructions };
