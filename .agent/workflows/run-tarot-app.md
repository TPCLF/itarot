---
description: Run the tarot app with LLM interpretation backend
---

# Running the Tarot App with LLM Backend

This workflow guides you through running both the frontend and backend services.

## Prerequisites

Make sure you have completed the backend setup (see `backend/README.md`):
- Ollama installed
- Llama 3.2 3B model downloaded
- Python virtual environment created with dependencies

## Steps

### 1. Start Ollama Service

Open a new terminal and run:
```bash
ollama serve
```

Keep this terminal running.

### 2. Start the Backend Service

Open another terminal and run:
```bash
cd /home/user/itarot/backend
source venv/bin/activate
python app.py
```

The backend will start on http://localhost:5000

### 3. Start the Frontend

The frontend should already be running with `npm run web`. If not, run:
```bash
cd /home/user/itarot
npm run web
```

### 4. Use the App

1. Open your browser to the Expo web interface (usually http://localhost:8081)
2. Select a spread size (1, 3, 6, 9, 10, or 12 cards)
3. Click "Draw a Card" to draw cards
4. Once you have cards drawn, click "Get Interpretation"
5. Wait a few seconds for the LLM to generate the interpretation
6. The interpretation will appear below the cards

## Troubleshooting

**"Error: Could not get interpretation"**
- Make sure Ollama is running: `ollama serve`
- Make sure the backend is running: check terminal for errors
- Verify the model is installed: `ollama list` (should show llama3.2:3b)

**Backend errors**
- Check that all dependencies are installed: `pip install -r requirements.txt`
- Make sure you're in the virtual environment: `source venv/bin/activate`

**Slow interpretations**
- First interpretation may take longer as the model loads
- Subsequent interpretations should be faster (1-3 seconds)
