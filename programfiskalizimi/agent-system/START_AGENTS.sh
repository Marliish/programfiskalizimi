#!/bin/bash
# Quick start script for FiscalNext Multi-Agent System

echo "🤖 FiscalNext Multi-Agent System"
echo "================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo ""
    echo "Please create .env file with your Anthropic API key:"
    echo ""
    echo "  cp .env.example .env"
    echo "  nano .env"
    echo ""
    echo "Add your key: ANTHROPIC_API_KEY=sk-ant-your-key-here"
    exit 1
fi

# Load API key
source .env

if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "❌ ANTHROPIC_API_KEY not set in .env"
    exit 1
fi

echo "✅ API key found"
echo ""

# Activate venv
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate

# Install dependencies if needed
if ! python -c "import anthropic" 2>/dev/null; then
    echo "Installing dependencies..."
    pip install --quiet anthropic
fi

echo "🚀 Launching all agents..."
echo ""

# Launch coordinator
python coordinator.py "$ANTHROPIC_API_KEY"
