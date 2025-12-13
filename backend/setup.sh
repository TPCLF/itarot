#!/bin/bash

# Tarot App Backend Setup Script
# This script installs all necessary dependencies for the LLM-powered tarot interpretation backend

set -e  # Exit on error

echo "=================================="
echo "Tarot App Backend Setup"
echo "=================================="
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    echo "Please do not run this script as root/sudo"
    echo "The script will ask for sudo password when needed"
    exit 1
fi

# Step 1: Install Python venv
echo "Step 1: Installing Python virtual environment support..."
if ! dpkg -l | grep -q python3-venv; then
    echo "Installing python3-venv..."
    sudo apt update
    sudo apt install -y python3-venv python3-pip
    echo "✓ Python venv installed"
else
    echo "✓ Python venv already installed"
fi
echo ""

# Step 2: Install Ollama
echo "Step 2: Installing Ollama..."
if ! command -v ollama &> /dev/null; then
    echo "Downloading and installing Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
    echo "✓ Ollama installed"
else
    echo "✓ Ollama already installed"
fi
echo ""

# Step 3: Start Ollama service
echo "Step 3: Starting Ollama service..."
if ! pgrep -x "ollama" > /dev/null; then
    echo "Starting Ollama in the background..."
    nohup ollama serve > /tmp/ollama.log 2>&1 &
    sleep 3
    echo "✓ Ollama service started"
else
    echo "✓ Ollama service already running"
fi
echo ""

# Step 4: Download LLM model
echo "Step 4: Downloading Llama 3.2 3B model..."
echo "This will download ~2GB and may take a few minutes..."
if ! ollama list | grep -q "llama3.2:3b"; then
    ollama pull llama3.2:3b
    echo "✓ Model downloaded"
else
    echo "✓ Model already downloaded"
fi
echo ""

# Step 5: Create Python virtual environment
echo "Step 5: Setting up Python virtual environment..."
cd "$(dirname "$0")"
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✓ Virtual environment created"
else
    echo "✓ Virtual environment already exists"
fi
echo ""

# Step 6: Install Python dependencies
echo "Step 6: Installing Python dependencies..."
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
echo "✓ Python dependencies installed"
echo ""

# Step 7: Test the setup
echo "Step 7: Testing the setup..."
python3 << 'EOF'
import ollama
try:
    response = ollama.chat(
        model='llama3.2:3b',
        messages=[{'role': 'user', 'content': 'Say "Setup successful!" and nothing else.'}]
    )
    print("✓ LLM test successful!")
    print(f"  Response: {response['message']['content']}")
except Exception as e:
    print(f"✗ LLM test failed: {e}")
    exit(1)
EOF
echo ""

echo "=================================="
echo "Setup Complete!"
echo "=================================="
echo ""
echo "To start the backend service:"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  python app.py"
echo ""
echo "The service will be available at http://localhost:5000"
echo ""
