#!/bin/bash

echo "🚀 Deploying Lumière Jewelry Ecommerce Platform..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Not in a git repository. Please initialize git first."
    exit 1
fi

# Check if there are uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  You have uncommitted changes. Please commit them first."
    git status --short
    exit 1
fi

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

echo "✅ Build successful!"

# Check if Vercel CLI is installed
if command -v vercel &> /dev/null; then
    echo "🚀 Deploying to Vercel..."
    vercel --prod
else
    echo "📝 Vercel CLI not found. Install it with: npm i -g vercel"
    echo "   Or deploy manually by connecting your repository to Vercel"
fi

echo ""
echo "🎉 Deployment process complete!"
echo "📚 See README.md for other deployment options"
