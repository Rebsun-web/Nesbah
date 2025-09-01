#!/bin/bash

echo "🧹 Starting Cache Cleanup..."

# Clean Next.js build cache
echo "📦 Cleaning Next.js build cache..."
rm -rf .next
rm -rf .next/cache
echo "✅ Next.js cache cleaned"

# Clean npm cache
echo "📦 Cleaning npm cache..."
npm cache clean --force
echo "✅ npm cache cleaned"

# Clean node_modules (optional - uncomment if needed)
# echo "🗑️ Removing node_modules..."
# rm -rf node_modules
# rm -f package-lock.json
# echo "✅ node_modules removed"

# Clean any temporary files
echo "🗂️ Cleaning temporary files..."
find . -name "*.tmp" -delete
find . -name "*.log" -delete
find . -name ".DS_Store" -delete
echo "✅ Temporary files cleaned"

# Clean environment cache
echo "🌍 Cleaning environment cache..."
unset NODE_ENV
unset NEXT_TELEMETRY_DISABLED
echo "✅ Environment cache cleaned"

echo ""
echo "🎉 Cache cleanup completed!"
echo ""
echo "💡 Next steps:"
echo "   1. Restart your development server"
echo "   2. Run 'npm install' if you removed node_modules"
echo "   3. Run 'npm run dev' to start fresh"
echo ""
