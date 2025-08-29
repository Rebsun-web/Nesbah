#!/bin/bash

# Fast npm install script with optimizations
echo "🚀 Starting fast npm install..."

# Clear npm cache if it's older than 1 day
if [ -d ".npm-cache" ]; then
    echo "📦 Using existing npm cache..."
else
    echo "📦 Setting up npm cache..."
    mkdir -p .npm-cache
fi

# Install with pnpm (fastest)
echo "⚡ Installing dependencies with pnpm (fastest)..."
pnpm install

echo "✅ Installation complete!"
