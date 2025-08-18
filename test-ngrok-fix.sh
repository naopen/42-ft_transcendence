#!/bin/bash

# Test script for ngrok URL handling

echo "🧪 Testing ngrok URL handling fix..."
echo ""

# 1. Clean and rebuild
echo "Step 1: Full clean rebuild"
make fclean

echo ""
echo "Step 2: Starting with ngrok"
make

echo ""
echo "✅ Test complete!"
echo ""
echo "Manual verification steps:"
echo "1. Copy the ngrok URL displayed above"
echo "2. Open the URL in your browser"
echo "3. Click 'Sign in with Google'"
echo "4. After Google auth, verify you're redirected to the ngrok URL (not localhost)"
echo "5. Check that you're successfully logged in and redirected to /game"
echo ""
echo "To test rebuild:"
echo "1. Run 'make re'"
echo "2. Use the new ngrok URL"
echo "3. Verify Google OAuth still works with the new URL"
