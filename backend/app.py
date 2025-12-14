from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from tarot_scraper import TarotScraper
from llm_service import LLMService
from tts_service import TTSService
import io

app = Flask(__name__)
CORS(app)  # Enable CORS for React Native app

# Initialize services
scraper = TarotScraper()
llm_service = LLMService()
tts_service = TTSService()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'healthy',
        'message': 'Tarot interpretation service is running'
    })

@app.route('/api/interpret_stream', methods=['POST'])
def interpret_reading_stream():
    """
    Generate a streaming interpretation for a tarot reading.
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        cards = data.get('cards', [])
        spread_type = data.get('spreadType', 1)
        
        if not cards:
            return jsonify({'error': 'No cards provided'}), 400
            
        # Get meanings for all cards
        card_meanings = {}
        for card_obj in cards:
            card_name = card_obj['card']
            is_reversed = card_obj.get('reversed', False)
            meaning = scraper.get_card_meaning(card_name, is_reversed)
            card_meanings[card_name.lower()] = meaning
            
        # Generator function for streaming response
        def generate():
            stream = llm_service.generate_interpretation(
                cards, 
                spread_type, 
                card_meanings, 
                stream=True
            )
            
            for chunk in stream:
                if isinstance(chunk, dict) and 'message' in chunk:
                    content = chunk['message']['content']
                    if content:
                        yield content
                elif isinstance(chunk, str):
                    yield chunk

        from flask import Response, stream_with_context
        return Response(stream_with_context(generate()), mimetype='text/plain')

    except Exception as e:
        return jsonify({'error': f'Error processing request: {str(e)}'}), 500

@app.route('/api/interpret', methods=['POST'])
def interpret_reading():
    """
    Generate an interpretation for a tarot reading.
    
    Expected JSON body:
    {
        "cards": [
            {"card": "The Fool", "reversed": false},
            {"card": "The Magician", "reversed": true},
            ...
        ],
        "spreadType": 3
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        cards = data.get('cards', [])
        spread_type = data.get('spreadType', 1)
        
        if not cards:
            return jsonify({'error': 'No cards provided'}), 400
        
        if spread_type not in [1, 3, 6, 9, 10, 12]:
            return jsonify({'error': 'Invalid spread type'}), 400
        
        # Get meanings for all cards
        card_meanings = {}
        for card_obj in cards:
            card_name = card_obj['card']
            is_reversed = card_obj.get('reversed', False)
            meaning = scraper.get_card_meaning(card_name, is_reversed)
            card_meanings[card_name.lower()] = meaning
        
        # Generate interpretation using LLM
        interpretation = llm_service.generate_interpretation(
            cards, 
            spread_type, 
            card_meanings
        )
        
        return jsonify({
            'interpretation': interpretation,
            'cardCount': len(cards),
            'spreadType': spread_type
        })
    
    except Exception as e:
        return jsonify({
            'error': f'Error processing request: {str(e)}'
        }), 500

@app.route('/api/tts', methods=['POST'])
def text_to_speech():
    """
    Convert text to speech audio.
    
    Expected JSON body:
    {
        "text": "Text to convert to speech"
    }
    
    Returns WAV audio file
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        text = data.get('text', '')
        
        if not text or len(text.strip()) == 0:
            return jsonify({'error': 'No text provided'}), 400
        
        # Generate audio
        audio_data = tts_service.synthesize(text)
        
        # Return audio file
        return send_file(
            io.BytesIO(audio_data),
            mimetype='audio/wav',
            as_attachment=False,
            download_name='speech.wav'
        )
    
    except Exception as e:
        return jsonify({
            'error': f'Error generating speech: {str(e)}'
        }), 500

if __name__ == '__main__':
    print("Starting Tarot Interpretation Service...")
    print("Make sure Ollama is running with: ollama serve")
    print("And the model is downloaded with: ollama pull llama3.2:3b")
    print("\nService will be available at http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
