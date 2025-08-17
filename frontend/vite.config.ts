import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import os from 'os'

// Get local IP address for HMR
function getLocalIpAddress(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// HTTPS configuration
const useHttps = process.env.USE_HTTPS === 'true';
let httpsConfig = {};

if (useHttps) {
  const certsPath = path.join(__dirname, 'certs');
  const keyPath = path.join(certsPath, 'key.pem');
  const certPath = path.join(certsPath, 'cert.pem');
  
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    httpsConfig = {
      https: {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath)
      }
    };
  }
}

const localIp = getLocalIpAddress();

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    ...httpsConfig,
    hmr: {
      host: localIp,
      port: 24678, // Different port for HMR over HTTPS
    },
  },
})
