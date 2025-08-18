#!/usr/bin/env node

// Simple local test
const http = require('http');

function testLocal(port, path = '/health') {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: port,
      path: path,
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          success: true,
          status: res.statusCode,
          data: data,
          headers: res.headers
        });
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

async function runLocalTests() {
  console.log('🧪 Testing local connections...\n');
  
  // Test nginx (port 8080)
  console.log('Testing nginx (port 8080)...');
  const nginxTest = await testLocal(8080);
  console.log(`  Result: ${nginxTest.success ? '✅' : '❌'} Status: ${nginxTest.status || nginxTest.error}`);
  
  // Test backend directly (port 3000) - this should fail from outside docker
  console.log('Testing direct backend (port 3000)...');
  const backendTest = await testLocal(3000);
  console.log(`  Result: ${backendTest.success ? '✅' : '❌'} Status: ${backendTest.status || backendTest.error}`);
  
  // Test nginx OAuth endpoint
  console.log('Testing nginx OAuth endpoint...');
  const oauthTest = await testLocal(8080, '/api/auth/google');
  console.log(`  Result: ${oauthTest.success ? '✅' : '❌'} Status: ${oauthTest.status || oauthTest.error}`);
  
  console.log('\n📋 Diagnosis:');
  if (nginxTest.success && nginxTest.status === 200) {
    console.log('✅ Local nginx working');
    if (oauthTest.success && oauthTest.status >= 300 && oauthTest.status < 400) {
      console.log('✅ OAuth endpoint working locally');
      console.log('🔧 Issue: ngrok tunnel connectivity problem');
    } else {
      console.log('❌ OAuth endpoint not working locally');
    }
  } else {
    console.log('❌ Local nginx not working');
    console.log('🔧 Issue: Docker container networking problem');
  }
}

runLocalTests();
