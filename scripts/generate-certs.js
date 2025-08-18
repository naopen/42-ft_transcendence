#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

// Get local IP address
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '192.168.1.100'; // Fallback IP
}

const LOCAL_IP = getLocalIpAddress();
console.log(`🔍 Detected local IP: ${LOCAL_IP}`);

// Create frontend certs directory if it doesn't exist
const frontendCertsDir = path.join(__dirname, '..', 'frontend', 'certs');
if (!fs.existsSync(frontendCertsDir)) {
  fs.mkdirSync(frontendCertsDir, { recursive: true });
}

// Create backend certs directory if it doesn't exist
const backendCertsDir = path.join(__dirname, '..', 'backend', 'certs');
if (!fs.existsSync(backendCertsDir)) {
  fs.mkdirSync(backendCertsDir, { recursive: true });
}

// Generate SSL certificate with local IP as SAN
const keyPath = path.join(frontendCertsDir, 'key.pem');
const certPath = path.join(frontendCertsDir, 'cert.pem');

// OpenSSL configuration for SAN
const sslConfig = `
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
req_extensions = v3_req

[dn]
C=JP
ST=Tokyo
L=Tokyo
O=42Tokyo
OU=ft_transcendence
CN=localhost

[v3_req]
basicConstraints = CA:FALSE
keyUsage = nonRepudiation, digitalSignature, keyEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
IP.1 = 127.0.0.1
IP.2 = ${LOCAL_IP}
IP.3 = 0.0.0.0
`;

const configPath = path.join(frontendCertsDir, 'ssl.conf');
fs.writeFileSync(configPath, sslConfig);

try {
  console.log('🔐 Generating SSL certificate...');
  
  // Generate private key
  execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: 'inherit' });
  
  // Generate certificate with SAN
  execSync(`openssl req -new -x509 -key "${keyPath}" -out "${certPath}" -days 365 -config "${configPath}" -extensions v3_req`, { stdio: 'inherit' });
  
  // Copy certificates to backend directory
  fs.copyFileSync(keyPath, path.join(backendCertsDir, 'key.pem'));
  fs.copyFileSync(certPath, path.join(backendCertsDir, 'cert.pem'));
  
  // Clean up config file
  fs.unlinkSync(configPath);
  
  console.log('✅ SSL certificates generated successfully!');
  console.log(`📁 Frontend certificates: ${frontendCertsDir}`);
  console.log(`📁 Backend certificates: ${backendCertsDir}`);
  console.log(`🌐 Local IP: ${LOCAL_IP}`);
  
  // Update .env file with current IP
  const envPath = path.join(__dirname, '..', '.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Update IP-based URLs
  envContent = envContent.replace(/https:\/\/\d+\.\d+\.\d+\.\d+/g, `https://${LOCAL_IP}`);
  envContent = envContent.replace(/wss:\/\/\d+\.\d+\.\d+\.\d+/g, `wss://${LOCAL_IP}`);
  
  fs.writeFileSync(envPath, envContent);
  
  console.log(`📝 Updated .env file with IP: ${LOCAL_IP}`);
  
} catch (error) {
  console.error('❌ Error generating certificates:', error.message);
  process.exit(1);
}
