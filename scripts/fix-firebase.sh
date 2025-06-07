#!/bin/bash

echo "🔧 Fixing Firebase version inconsistencies..."

# Remove existing node_modules and lock files
echo "📦 Cleaning existing installations..."
rm -rf node_modules
rm -f package-lock.json
rm -f yarn.lock

# Clear npm cache
echo "🧹 Clearing npm cache..."
npm cache clean --force

# Install with exact versions
echo "⬇️ Installing dependencies with exact versions..."
npm install

# Verify Firebase installation
echo "✅ Verifying Firebase installation..."
npm list firebase
npm list | grep @firebase

echo "🎉 Firebase fix complete!"
echo ""
echo "Next steps:"
echo "1. Restart your development server"
echo "2. Navigate to /setup to test the wizard"
echo "3. Check the browser console for Firebase initialization logs"
