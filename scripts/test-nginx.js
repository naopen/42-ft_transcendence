#!/usr/bin/env node

const http = require('http');

console.log('🔍 Testing nginx reverse proxy on port 8080...');

// Test health endpoint through nginx
const testUrl = 'http://localhost:8080/health';

console.log(`📡 Testing: ${testUrl}`);

http.get(testUrl, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`✅ Status: ${res.statusCode}`);
    console.log(`📊 Response: ${data}`);
    
    if (res.statusCode === 200) {
      console.log('🎉 nginx reverse proxy is working correctly!');
      console.log('✅ Backend accessible through nginx');
    } else {
      console.log('❌ Unexpected status code');
    }
  });
}).on('error', (err) => {
  console.error(`❌ Error: ${err.message}`);
  console.log('💡 Make sure the application is running with nginx');
});
