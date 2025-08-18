#!/usr/bin/env node

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
    
    const authtoken = process.env.NGROK_AUTHTOKEN;
    
    if (!authtoken) {
      console.log(`${colors.red}❌ NGROK_AUTHTOKEN not found in .env file${colors.reset}`);
      reject(new Error('Missing NGROK_AUTHTOKEN in .env'));
      return;
    }
    
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
    
    // Use stable ngrok configuration
    const ngrokProcess = exec(`ngrok http ${port} --log=stdout`, (error) => {
      if (error) {
        reject(error);
      }
    });

    // Give ngrok time to start
    setTimeout(() => {
      resolve(ngrokProcess);
    }, 5000); // Increased timeout for more stable startup
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

// Update Vite configuration to allow ngrok host
function updateViteConfig(ngrokUrl) {
  const viteConfigPath = path.join(__dirname, '..', 'frontend', 'vite.config.ts');
  
  try {
    let viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
    
    // Extract hostname from ngrok URL
    const ngrokHost = new URL(ngrokUrl).hostname;
    
    // Check if allowedHosts is already configured
    if (viteConfig.includes('allowedHosts')) {
      // Replace existing allowedHosts configuration
      viteConfig = viteConfig.replace(
        /allowedHosts:\s*\[[^\]]*\]/,
        `allowedHosts: ['localhost', '${ngrokHost}']`
      );
    } else {
      // Add allowedHosts configuration to server object
      if (viteConfig.includes('server: {')) {
        viteConfig = viteConfig.replace(
          /(server:\s*{[^}]*)(,?\s*})/,
          `$1,\n    allowedHosts: ['localhost', '${ngrokHost}']$2`
        );
      } else {
        // Add complete server configuration
        viteConfig = viteConfig.replace(
          /(plugins:\s*\[[^\]]*\],?)/, 
          `$1\n  server: {\n    allowedHosts: ['localhost', '${ngrokHost}']\n  },`
        );
      }
    }
    
    fs.writeFileSync(viteConfigPath, viteConfig);
    console.log(`${colors.green}✅ Updated Vite configuration for ngrok host: ${ngrokHost}${colors.reset}`);
    
  } catch (error) {
    console.log(`${colors.yellow}⚠️  Could not update Vite config: ${error.message}${colors.reset}`);
    console.log(`${colors.yellow}💡 You may need to manually add '${new URL(ngrokUrl).hostname}' to allowedHosts in vite.config.ts${colors.reset}`);
  }
}

// Clean up Vite configuration - remove ngrok hosts
function cleanupViteConfig() {
  const viteConfigPath = path.join(__dirname, '..', 'frontend', 'vite.config.ts');
  
  try {
    let viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
    
    // Remove ngrok hosts from allowedHosts, keep only localhost
    if (viteConfig.includes('allowedHosts')) {
      viteConfig = viteConfig.replace(
        /allowedHosts:\s*\[[^\]]*\]/,
        `allowedHosts: ['localhost']`
      );
      
      fs.writeFileSync(viteConfigPath, viteConfig);
      console.log(`${colors.green}✅ Cleaned up Vite configuration - removed ngrok hosts${colors.reset}`);
    }
    
  } catch (error) {
    console.log(`${colors.yellow}⚠️  Could not cleanup Vite config: ${error.message}${colors.reset}`);
  }
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

// Restart Docker containers to apply new environment variables
function restartDockerContainers() {
  return new Promise((resolve, reject) => {
    console.log(`${colors.yellow}🔄 Restarting Docker containers to apply new environment...${colors.reset}`);
    
    exec('docker-compose restart backend frontend', (error, stdout, stderr) => {
      if (error) {
        console.log(`${colors.red}❌ Failed to restart containers: ${error.message}${colors.reset}`);
        reject(error);
      } else {
        console.log(`${colors.green}✅ Docker containers restarted with new environment${colors.reset}`);
        resolve();
      }
    });
  });
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
  console.log(`   3. Save settings and test login`);
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

    // Update Vite configuration to allow ngrok host
    updateViteConfig(ngrokUrl);

    // Update .env file
    updateEnvFile(ngrokUrl);

    // Restart Docker containers to apply new environment variables
    await restartDockerContainers();

    // Wait a bit for containers to fully restart
    console.log(`${colors.yellow}⏳ Waiting for services to be ready...${colors.reset}`);
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Display access information
    displayAccessInfo(ngrokUrl);

    // Keep process alive
    process.on('SIGINT', () => {
      console.log(`\n${colors.yellow}🛑 Stopping ngrok tunnel...${colors.reset}`);
      console.log(`${colors.yellow}🧹 Cleaning up configuration...${colors.reset}`);
      
      // Clean up vite.config.ts
      cleanupViteConfig();
      
      // Kill ngrok process
      ngrokProcess.kill();
      
      console.log(`${colors.green}✅ Cleanup complete!${colors.reset}`);
      process.exit(0);
    });

  } catch (error) {
    console.error(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
    console.log(`${colors.yellow}💡 Make sure:${colors.reset}`);
    console.log(`   • NGROK_AUTHTOKEN is set in .env file`);
    console.log(`   • ngrok is installed and authenticated`);
    console.log(`   • Port 8080 is available`);
    console.log(`   • No other ngrok processes are running`);
    process.exit(1);
  }
}

// Run main function
main();
