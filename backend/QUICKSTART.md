# Quick Start Guide

## Installation

Run the automated setup script:

```bash
cd backend
./setup.sh
```

This script will:
1. Install Python virtual environment support
2. Install Ollama
3. Start the Ollama service
4. Download the Llama 3.2 3B model (~2GB)
5. Create a Python virtual environment
6. Install all Python dependencies
7. Test the setup

**Note**: The script will ask for your sudo password to install system packages.

## Running the Backend

After setup is complete:

```bash
cd backend
source venv/bin/activate
python app.py
```

The backend will be available at http://localhost:5000

## Using the App

1. Make sure the backend is running (see above)
2. Open the frontend (should already be running with `npm run web`)
3. Draw some tarot cards
4. Click "Get Interpretation"
5. Wait a few seconds for the AI-generated interpretation

## Troubleshooting

See the full [README.md](README.md) for detailed troubleshooting steps.
