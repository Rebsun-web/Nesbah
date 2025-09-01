#!/bin/bash

echo "🧹 Database Connection Cleanup Script"
echo "====================================="

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "🔧 Running database connection cleanup..."

# Run the cleanup script
node scripts/clean-db-connections.js

if [ $? -eq 0 ]; then
    echo "✅ Basic cleanup completed successfully"
else
    echo "⚠️ Basic cleanup had issues, running force reset..."
    node scripts/force-db-reset.js
fi

echo ""
echo "🎯 Cleanup completed!"
echo "💡 If you still have connection issues, consider:"
echo "   1. Restarting your Next.js application"
echo "   2. Checking your database server status"
echo "   3. Reviewing connection pool settings in your .env file"
