#!/bin/bash

# FiscalNext Storefront - Quick Install Script
# Run this from the monorepo root

set -e

echo "🚀 FiscalNext Storefront - Quick Install"
echo "========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "pnpm-workspace.yaml" ]; then
    echo "❌ Error: Please run this script from the monorepo root"
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt "20" ]; then
    echo "❌ Error: Node.js 20+ required (you have $(node -v))"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

echo "✅ pnpm installed"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install
echo "✅ Dependencies installed"
echo ""

# Create .env.local if it doesn't exist
if [ ! -f "apps/storefront/.env.local" ]; then
    echo "⚙️  Creating environment file..."
    cp apps/storefront/.env.example apps/storefront/.env.local
    echo "✅ Created .env.local from template"
    echo "⚠️  Please edit apps/storefront/.env.local with your values"
else
    echo "✅ Environment file already exists"
fi

echo ""
echo "🎉 Installation complete!"
echo ""
echo "Next steps:"
echo "1. Edit apps/storefront/.env.local"
echo "2. Make sure the API is running on port 3001"
echo "3. Run: cd apps/storefront && pnpm dev"
echo "4. Open: http://localhost:3002"
echo ""
echo "📚 For more info, see:"
echo "   - apps/storefront/QUICK_START.md"
echo "   - apps/storefront/README.md"
echo ""
