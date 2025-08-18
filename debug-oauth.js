#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('./backend/node_modules/dotenv').config();

console.log('=== OAuth Debug Information ===\n');

// Check .env configuration
console.log('Environment Variables:');
console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
console.log('BACKEND_URL:', process.env.BACKEND_URL);
console.log('VITE_API_URL:', process.env.VITE_API_URL);
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? '[SET]' : '[NOT SET]');
console.log('');

// Calculate expected callback URI
const expectedCallbackUri = `${process.env.BACKEND_URL}/api/auth/google/callback`;
console.log('Expected Callback URI:', expectedCallbackUri);
console.log('');

// Check ngrok status
const checkNgrok = () => {
  return new Promise((resolve) => {
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
          resolve(tunnels);
        } catch (error) {
          resolve(null);
        }
      });
    });

    req.on('error', () => {
      resolve(null);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });

    req.end();
  });
};

// Test local app access
const testLocalAccess = () => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 8080,
      path: '/health',
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      resolve({
        status: res.statusCode,
        headers: res.headers
      });
    });

    req.on('error', (error) => {
      resolve({ error: error.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ error: 'timeout' });
    });

    req.end();
  });
};

// Main check function
async function main() {
  // Check ngrok tunnels
  console.log('Checking ngrok tunnels...');
  const tunnels = await checkNgrok();
  
  if (tunnels && tunnels.tunnels && tunnels.tunnels.length > 0) {
    console.log('✅ ngrok is running');
    tunnels.tunnels.forEach((tunnel, index) => {
      console.log(`  Tunnel ${index + 1}: ${tunnel.proto}://${tunnel.public_url.replace(/https?:\/\//, '')} -> ${tunnel.config.addr}`);
    });
    
    const httpsTunnel = tunnels.tunnels.find(t => t.proto === 'https');
    if (httpsTunnel) {
      const actualCallbackUri = `${httpsTunnel.public_url}/api/auth/google/callback`;
      console.log('');
      console.log('Current ngrok callback URI:', actualCallbackUri);
      
      if (actualCallbackUri === expectedCallbackUri) {
        console.log('✅ Callback URI matches .env configuration');
      } else {
        console.log('❌ Callback URI MISMATCH!');
        console.log('  Expected:', expectedCallbackUri);
        console.log('  Actual:  ', actualCallbackUri);
      }
    }
  } else {
    console.log('❌ ngrok is not running or not accessible');
  }
  
  console.log('');
  
  // Test local access
  console.log('Testing local app access...');
  const localTest = await testLocalAccess();
  
  if (localTest.error) {
    console.log('❌ Local app not accessible:', localTest.error);
  } else {
    console.log('✅ Local app accessible (status:', localTest.status + ')');
  }
  
  console.log('');
  console.log('=== Recommendations ===');
  
  if (!tunnels || !tunnels.tunnels || tunnels.tunnels.length === 0) {
    console.log('1. Start ngrok: make ngrok');
  }
  
  console.log('2. Ensure Google OAuth redirect URIs include:');
  console.log('   -', expectedCallbackUri);
  console.log('   - http://localhost:3000/api/auth/google/callback (for local dev)');
  
  console.log('3. Check that the client ID matches in Google Console');
  console.log('4. Verify JavaScript origins include:');
  console.log('   - https://c598e38bb092.ngrok-free.app (current ngrok URL)');
  console.log('   - http://localhost:5173 (local frontend)');
  console.log('   - http://localhost:3000 (local backend)');
}

main().catch(console.error);
