# Tarot Interpretation Backend

This backend service provides AI-powered tarot reading interpretations using a local LLM (no API costs!).

## Prerequisites

- Python 3.8 or higher
- Ollama (for running the local LLM)

## Setup Instructions

### 1. Install Ollama

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**macOS:**
```bash
brew install ollama
```

**Windows:**
Download from https://ollama.com/download

### 2. Start Ollama Service

```bash
ollama serve
```

Keep this running in a separate terminal.

### 3. Download the LLM Model

In another terminal:
```bash
ollama pull llama3.2:3b
```

This will download ~2GB. The model will be cached locally for future use.

### 4. Set Up Python Environment

```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Linux/macOS
# OR
venv\Scripts\activate  # On Windows

# Install dependencies
pip install -r requirements.txt
```

### 5. Run the Backend Service

```bash
python app.py
```

The service will start on http://localhost:5000

## Testing the Service

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Test Interpretation
```bash
curl -X POST http://localhost:5000/api/interpret \
  -H "Content-Type: application/json" \
  -d '{
    "cards": [
      {"card": "The Fool", "reversed": false},
      {"card": "The Magician", "reversed": false},
      {"card": "The High Priestess", "reversed": true}
    ],
    "spreadType": 3
  }'
```

## API Endpoints

### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "message": "Tarot interpretation service is running"
}
```

### POST /api/interpret
Generate a tarot reading interpretation.

**Request Body:**
```json
{
  "cards": [
    {"card": "The Fool", "reversed": false},
    {"card": "The Magician", "reversed": true}
  ],
  "spreadType": 3
}
```

**Response:**
```json
{
  "interpretation": "Your reading suggests...",
  "cardCount": 2,
  "spreadType": 3
}
```

## Troubleshooting

### "Error generating interpretation"
- Make sure Ollama is running: `ollama serve`
- Verify the model is installed: `ollama list`
- If not installed: `ollama pull llama3.2:3b`

### Port 5000 already in use
Change the port in `app.py`:
```python
app.run(debug=True, host='0.0.0.0', port=5001)
```

### Slow interpretations
- The 3B model should respond in 1-3 seconds on most systems
- For faster responses, ensure no other heavy processes are running
- Consider using a GPU if available (Ollama will auto-detect)

## Alternative Models

If you want to try different models:

**Smaller/Faster (1-2GB):**
```bash
ollama pull phi3:mini
```
Update `llm_service.py` line 8: `model_name='phi3:mini'`

**Larger/Better Quality (4-7GB):**
```bash
ollama pull llama3.2:7b
```
Update `llm_service.py` line 8: `model_name='llama3.2:7b'`

## File Structure

```
backend/
├── app.py              # Flask API server
├── llm_service.py      # LLM integration
├── tarot_scraper.py    # Card meanings (with fallback data)
├── requirements.txt    # Python dependencies
├── tarot_cache.json    # Cached card meanings (auto-generated)
└── venv/              # Virtual environment (created during setup)
```
