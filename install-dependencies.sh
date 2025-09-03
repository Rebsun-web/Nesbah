#!/bin/bash

# Nesbah Project Dependencies Installation Script
echo "🚀 Installing Nesbah project dependencies..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Install dependencies
echo "📦 Installing npm packages..."
npm install

# Check if installation was successful
if [ $? -eq 0 ]; then
    echo "✅ All dependencies installed successfully!"
    echo ""
    echo "🚀 To start the development server:"
    echo "   npm run dev"
    echo ""
    echo "📝 Note: Server may run on http://localhost:3001 if port 3000 is in use"
    echo ""
    echo "🔧 Available scripts:"
    echo "   npm run dev     - Start development server"
    echo "   npm run build   - Build for production"
    echo "   npm run start   - Start production server"
    echo "   npm run lint    - Run ESLint"
else
    echo "❌ Installation failed. Please check the error messages above."
    exit 1
fi
