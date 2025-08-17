#!/usr/bin/env node

const https = require('https');

// Accept self-signed certificates
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const testUrl = 'https://192.168.11.7:3000/health';

console.log(`🔍 Testing HTTPS endpoint: ${testUrl}`);

https.get(testUrl, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`✅ Status: ${res.statusCode}`);
    console.log(`📊 Response: ${data}`);
    
    if (res.statusCode === 200) {
      console.log('🎉 HTTPS backend is working correctly!');
    } else {
      console.log('❌ Unexpected status code');
    }
  });
}).on('error', (err) => {
  console.error(`❌ Error: ${err.message}`);
  console.log('💡 Make sure the backend is running with HTTPS enabled');
});
