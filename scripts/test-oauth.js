#!/usr/bin/env node

// OAuth Test Script
// Tests if OAuth configuration is working correctly

const http = require('http');
const https = require('https');

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

// Test app accessibility
function testAppAccess(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: '/health',
      method: 'GET',
      timeout: 10000
    };

    const req = client.request(options, (res) => {
      resolve({
        success: true,
        status: res.statusCode,
        headers: res.headers
      });
    });

    req.on('error', (error) => {
      resolve({ 
        success: false, 
        error: error.message 
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ 
        success: false, 
        error: 'timeout' 
      });
    });

    req.end();
  });
}

// Test OAuth endpoint accessibility
function testOAuthEndpoint(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url + '/api/auth/google');
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: '/api/auth/google',
      method: 'GET',
      timeout: 10000,
      // Don't follow redirects for this test
      headers: {
        'User-Agent': 'OAuth-Test-Script'
      }
    };

    const req = client.request(options, (res) => {
      resolve({
        success: true,
        status: res.statusCode,
        location: res.headers.location || null,
        isRedirect: res.statusCode >= 300 && res.statusCode < 400
      });
    });

    req.on('error', (error) => {
      resolve({ 
        success: false, 
        error: error.message 
      });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ 
        success: false, 
        error: 'timeout' 
      });
    });

    req.end();
  });
}

// Main test function
async function runTests() {
  console.log(`${colors.green}${colors.bright}🧪 OAuth Configuration Test${colors.reset}`);
  console.log('');
  
  try {
    // Get current ngrok URL
    console.log(`${colors.yellow}📡 Getting current ngrok URL...${colors.reset}`);
    const ngrokUrl = await getCurrentNgrokUrl();
    console.log(`${colors.green}✅ ngrok URL: ${ngrokUrl}${colors.reset}`);
    
    console.log('');
    
    // Test app accessibility
    console.log(`${colors.yellow}🌐 Testing app accessibility...${colors.reset}`);
    const appTest = await testAppAccess(ngrokUrl);
    
    if (appTest.success) {
      console.log(`${colors.green}✅ App accessible (HTTP ${appTest.status})${colors.reset}`);
    } else {
      console.log(`${colors.red}❌ App not accessible: ${appTest.error}${colors.reset}`);
      return;
    }
    
    console.log('');
    
    // Test OAuth endpoint
    console.log(`${colors.yellow}🔐 Testing OAuth endpoint...${colors.reset}`);
    const oauthTest = await testOAuthEndpoint(ngrokUrl);
    
    if (oauthTest.success) {
      if (oauthTest.isRedirect) {
        console.log(`${colors.green}✅ OAuth endpoint working (redirects to Google)${colors.reset}`);
        if (oauthTest.location) {
          console.log(`${colors.cyan}   Redirect URL: ${oauthTest.location}${colors.reset}`);
          
          // Check if the redirect URL contains the correct callback
          const expectedCallback = encodeURIComponent(`${ngrokUrl}/api/auth/google/callback`);
          if (oauthTest.location.includes(expectedCallback)) {
            console.log(`${colors.green}✅ Callback URI is correctly configured${colors.reset}`);
          } else {
            console.log(`${colors.yellow}⚠️  Callback URI might need verification${colors.reset}`);
            console.log(`${colors.cyan}   Expected: ${ngrokUrl}/api/auth/google/callback${colors.reset}`);
          }
        }
      } else {
        console.log(`${colors.yellow}⚠️  OAuth endpoint responds but doesn't redirect (HTTP ${oauthTest.status})${colors.reset}`);
      }
    } else {
      console.log(`${colors.red}❌ OAuth endpoint error: ${oauthTest.error}${colors.reset}`);
    }
    
    console.log('');
    console.log(`${colors.green}${colors.bright}🎯 Test Results Summary:${colors.reset}`);
    console.log(`${colors.cyan}Current URL:${colors.reset} ${ngrokUrl}`);
    console.log(`${colors.cyan}App Status:${colors.reset} ${appTest.success ? '✅ Working' : '❌ Failed'}`);
    console.log(`${colors.cyan}OAuth Status:${colors.reset} ${oauthTest.success && oauthTest.isRedirect ? '✅ Working' : '❌ Needs fixing'}`);
    
    console.log('');
    console.log(`${colors.yellow}${colors.bright}📝 Next Steps:${colors.reset}`);
    
    if (appTest.success && oauthTest.success && oauthTest.isRedirect) {
      console.log(`1. ${colors.green}✅ Technical setup is working${colors.reset}`);
      console.log(`2. ${colors.yellow}🔧 Verify Google Cloud Console settings${colors.reset}`);
      console.log(`3. ${colors.blue}🧪 Test full OAuth flow: ${ngrokUrl}${colors.reset}`);
    } else {
      console.log(`1. ${colors.red}❌ Fix technical issues first${colors.reset}`);
      console.log(`2. ${colors.yellow}🔄 Restart services: make restart${colors.reset}`);
      console.log(`3. ${colors.blue}🔄 Run test again: node scripts/test-oauth.js${colors.reset}`);
    }
    
  } catch (error) {
    console.error(`${colors.red}❌ Test failed: ${error.message}${colors.reset}`);
  }
}

// Run tests
runTests();
