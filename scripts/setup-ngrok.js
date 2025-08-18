#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Color codes
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

console.log(`${colors.green}${colors.bright}==============================================`);
console.log(`🚀 ft_transcendence - ngrok Remote Setup`);
console.log(`==============================================${colors.reset}`);

// Check if ngrok is installed
function checkNgrok() {
  return new Promise((resolve) => {
    exec('ngrok --version', (error) => {
      if (error) {
        console.log(`${colors.yellow}⚠️  ngrok is not installed${colors.reset}`);
        resolve(false);
      } else {
        console.log(`${colors.green}✅ ngrok is installed${colors.reset}`);
        resolve(true);
      }
    });
  });
}

// Install ngrok
function installNgrok() {
  return new Promise((resolve, reject) => {
    console.log(`${colors.yellow}📦 Installing ngrok...${colors.reset}`);
    
    exec('brew install ngrok', (error) => {
      if (error) {
        console.log(`${colors.red}❌ Failed to install ngrok with brew${colors.reset}`);
        console.log(`${colors.yellow}💡 Please install manually:${colors.reset}`);
        console.log(`   ${colors.cyan}https://ngrok.com/download${colors.reset}`);
        reject(error);
      } else {
        console.log(`${colors.green}✅ ngrok installed successfully${colors.reset}`);
        resolve();
      }
    });
  });
}

// Configure ngrok authtoken
function configureNgrokAuth() {
  return new Promise((resolve, reject) => {
    console.log(`${colors.yellow}🔑 Configuring ngrok authentication...${colors.reset}`);
    
    const authtoken = '31HyZL9wTSky5SL2zYH8FoKpTaX_Ab8KUZnKw2n449jUs1Qy';
    
    exec(`ngrok config add-authtoken ${authtoken}`, (error) => {
      if (error) {
        console.log(`${colors.red}❌ Failed to configure ngrok auth${colors.reset}`);
        console.log(`${colors.yellow}💡 Please configure manually:${colors.reset}`);
        console.log(`   ${colors.cyan}ngrok config add-authtoken ${authtoken}${colors.reset}`);
        reject(error);
      } else {
        console.log(`${colors.green}✅ ngrok authentication configured${colors.reset}`);
        resolve();
      }
    });
  });
}

// Kill existing ngrok processes
function killExistingNgrok() {
  return new Promise((resolve) => {
    exec('pkill -f ngrok', (error) => {
      // Don't care about errors - just try to kill existing processes
      setTimeout(resolve, 1000); // Wait 1 second for cleanup
    });
  });
}

// Start ngrok tunnel
function startNgrok(port) {
  return new Promise((resolve, reject) => {
    console.log(`${colors.yellow}🔌 Starting ngrok tunnel on port ${port}...${colors.reset}`);
    
    const ngrokProcess = exec(`ngrok http ${port} --log=stdout`, (error) => {
      if (error) {
        reject(error);
      }
    });

    // Give ngrok time to start
    setTimeout(() => {
      resolve(ngrokProcess);
    }, 3000);
  });
}

// Get ngrok tunnel URL
function getNgrokUrl() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4040,
      path: '/api/tunnels',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const tunnels = JSON.parse(data);
          const httpTunnel = tunnels.tunnels.find(t => t.proto === 'https');
          
          if (httpTunnel) {
            resolve(httpTunnel.public_url);
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

    req.end();
  });
}

// Update .env file with ngrok URL
function updateEnvFile(ngrokUrl) {
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Update URLs to use ngrok
  envContent = envContent.replace(/FRONTEND_URL=.*/g, `FRONTEND_URL=${ngrokUrl}`);
  envContent = envContent.replace(/BACKEND_URL=.*/g, `BACKEND_URL=${ngrokUrl}`);
  envContent = envContent.replace(/VITE_API_URL=.*/g, `VITE_API_URL=${ngrokUrl}/api`);
  envContent = envContent.replace(/VITE_WS_URL=.*/g, `VITE_WS_URL=${ngrokUrl.replace('https:', 'wss:')}`);
  
  // Disable HTTPS since ngrok handles it
  envContent = envContent.replace(/USE_HTTPS=.*/g, 'USE_HTTPS=false');
  
  fs.writeFileSync(envPath, envContent);
  
  console.log(`${colors.green}✅ Updated .env file with ngrok URL${colors.reset}`);
}

// Display access information
function displayAccessInfo(ngrokUrl) {
  console.log('');
  console.log(`${colors.green}${colors.bright}🎉 ngrok tunnel is ready!${colors.reset}`);
  console.log('');
  console.log(`${colors.yellow}🌐 Public Access URL:${colors.reset}`);
  console.log(`   ${colors.blue}${colors.bright}${ngrokUrl}${colors.reset}`);
  console.log('');
  console.log(`${colors.yellow}🎮 Share this URL for remote multiplayer:${colors.reset}`);
  console.log(`   ${colors.green}${colors.bright}${ngrokUrl}${colors.reset}`);
  console.log('');
  console.log(`${colors.yellow}🔧 Google OAuth Setup Required:${colors.reset}`);
  console.log(`   1. Go to Google Cloud Console`);
  console.log(`   2. Add redirect URI: ${colors.cyan}${ngrokUrl}/api/auth/google/callback${colors.reset}`);
  console.log(`   3. Save and restart: ${colors.cyan}make restart${colors.reset}`);
  console.log('');
  console.log(`${colors.yellow}⚡ Real-time updates:${colors.reset}`);
  console.log(`   Any player can access from anywhere!`);
  console.log(`   No network restrictions!`);
  console.log('');
  console.log(`${colors.red}⚠️  Important:${colors.reset}`);
  console.log(`   Keep this terminal open to maintain the tunnel`);
  console.log(`   Press Ctrl+C to stop ngrok tunnel`);
  console.log('');
}

// Main function
async function main() {
  try {
    // Check ngrok installation
    const isNgrokInstalled = await checkNgrok();
    
    if (!isNgrokInstalled) {
      // Auto-install ngrok
      await installNgrok();
      // Configure auth token
      await configureNgrokAuth();
    }

    // Kill existing ngrok processes
    await killExistingNgrok();

    // Start ngrok tunnel on port 8080 (nginx)
    const ngrokProcess = await startNgrok(8080);

    // Get ngrok URL
    console.log(`${colors.yellow}🔍 Getting ngrok tunnel URL...${colors.reset}`);
    const ngrokUrl = await getNgrokUrl();

    // Update .env file
    updateEnvFile(ngrokUrl);

    // Display access information
    displayAccessInfo(ngrokUrl);

    // Keep process alive
    process.on('SIGINT', () => {
      console.log(`\n${colors.yellow}🛑 Stopping ngrok tunnel...${colors.reset}`);
      ngrokProcess.kill();
      process.exit(0);
    });

  } catch (error) {
    console.error(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
    console.log(`${colors.yellow}💡 Make sure:${colors.reset}`);
    console.log(`   • ngrok is installed and authenticated`);
    console.log(`   • Port 8080 is available`);
    console.log(`   • No other ngrok processes are running`);
    process.exit(1);
  }
}

// Run main function
main();
