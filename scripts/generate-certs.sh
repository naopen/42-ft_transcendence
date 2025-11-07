#!/bin/bash

# SSL Certificate Generation Script for ft_transcendence
# This script generates self-signed SSL certificates for local HTTPS development

set -e

CERTS_DIR="./certs"
DAYS_VALID=365

echo "🔐 Generating SSL certificates for local development..."

# Create certs directory if it doesn't exist
mkdir -p "$CERTS_DIR"

# Generate private key and self-signed certificate
openssl req -x509 -nodes -days $DAYS_VALID -newkey rsa:2048 \
  -keyout "$CERTS_DIR/nginx.key" \
  -out "$CERTS_DIR/nginx.crt" \
  -subj "/C=JP/ST=Tokyo/L=Tokyo/O=42Tokyo/OU=ft_transcendence/CN=localhost" \
  -addext "subjectAltName=DNS:localhost,DNS:*.localhost,IP:127.0.0.1"

# Set appropriate permissions
chmod 644 "$CERTS_DIR/nginx.crt"
chmod 600 "$CERTS_DIR/nginx.key"

echo "✅ SSL certificates generated successfully!"
echo "📁 Location: $CERTS_DIR/"
echo "🔑 Private key: nginx.key"
echo "📜 Certificate: nginx.crt"
echo ""
echo "⚠️  Note: These are self-signed certificates for development only."
echo "    Your browser will show a security warning - this is expected."
echo "    Click 'Advanced' → 'Proceed to localhost' to continue."
