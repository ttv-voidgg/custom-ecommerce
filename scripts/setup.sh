#!/bin/bash

echo "🚀 Setting up Lumière Jewelry Ecommerce Platform..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "📝 Creating environment file..."
    cp .env.example .env.local
    echo "⚠️  Please configure your .env.local file with your Firebase credentials"
    echo "   See README.md for detailed setup instructions"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure your .env.local file with Firebase credentials"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Navigate to http://localhost:3000/setup to initialize your store"
echo ""
echo "📚 For detailed instructions, see README.md"
