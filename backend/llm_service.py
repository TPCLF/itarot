import ollama
from typing import List, Dict

class LLMService:
    """Service for generating tarot reading interpretations using a local LLM."""
    
    def __init__(self, model_name='llama3.2:3b'):
        self.model_name = model_name
    
    def generate_interpretation(
        self, 
        cards: List[Dict[str, any]], 
        spread_type: int,
        card_meanings: Dict[str, Dict[str, str]],
        stream: bool = False
    ) -> str:
        """
        Generate a tarot reading interpretation.
        
        Args:
            cards: List of card objects with 'card' and 'reversed' keys
            spread_type: Number of cards in the spread (1, 3, 6, 9, 10, or 12)
            card_meanings: Dictionary mapping card names to their meanings
            stream: Whether to stream the response as a generator
            
        Returns:
            String containing the interpretation (or generator if stream=True)
        """
        prompt = self._build_prompt(cards, spread_type, card_meanings)
        
        try:
            response = ollama.chat(
                model=self.model_name,
                stream=stream,
                messages=[ 
                    {
                        'role': 'system',
                        'content': (
                            
                            'Avoid putting a title in the reading or adding any astrix or other punctuation that could cause the reading to sound obviously generated. '
                            'Try really hard to never type any astrix around any text or titles for any part of the reading. '
                            'Output will be used for a voice over. '
                            'You are a mystical fortune teller with acess to ancient wisdom and knowledge. '
                            'Use thoughtful questions throughout the reading to invite reflection on the cards meanings. Asking questions is encouraged and preferred over making firm declarations. '
                            'Speak in terms of possibilities, tendencies, and emerging patterns rather than stating what will happen. Avoid declaring anything as certain or guaranteed. '
                            'Your job is to avoid sounding obviously wrong while relating the information provided by the relationship between the cards and how they fall. '
                            'Discussing what may be versus what definantly is could be a quick path to making a statement that could be misconstrued as wrong. '
                            'stick to what might be and dont say what absoultly is. '
                            'Questions are good, your predictions cannot be labled wrong when you are asking plenty questions.'
                            'For a single card reading, focus on the card and its meaning, do not refrence other spreads. '
                            'Remember to focus on what cards are in what positions what they mean and the way they are interacting with each other. '
                        )
                    },
                    {
                        'role': 'user',
                        'content': prompt
                    }
                ]
            )
            
            if stream:
                return response # Generator
            
            return response['message']['content']
        except Exception as e:
            err_msg = f"Error generating interpretation: {str(e)}\n\nPlease ensure Ollama is running and the model '{self.model_name}' is installed."
            if stream:
                def err_gen(): yield err_msg
                return err_gen()
            return err_msg
    
    def _build_prompt(
        self, 
        cards: List[Dict[str, any]], 
        spread_type: int,
        card_meanings: Dict[str, Dict[str, str]]
    ) -> str:
        """Build the prompt for the LLM based on the card spread."""
        
        # Position labels for different spreads
        spread_labels = {
            1: ["Single Card"],
            3: ["Past", "Present", "Future"],
            6: ["Past", "Present", "Future", "Hidden Influences", "External Factors", "Outcome"],
            9: [
                "Present Situation", "Immediate Influence", "Hidden Influences",
                "Past Influence", "Recent Past", "Future Influence",
                "The Querent's Role", "External Factors", "Outcome/Advice"
            ],
            10: [
                "Present Position", "Immediate Influence", "Goal or Destiny",
                "Distant Past", "Recent Past", "Future Influence",
                "The Questioner", "External Factors", "Inner Emotions", "Final Result"
            ],
            12: [
                "Past Influences", "Present Situation", "Immediate Influences",
                "Distant Past", "Recent Past", "Near Future", "Far Future",
                "External Influences", "Emotional State", "The Querent's Role",
                "Outcome/Advice", "Final Outcome"
            ]
        }
        
        labels = spread_labels.get(spread_type, [f"Position {i+1}" for i in range(len(cards))])
        
        prompt = f"Please interpret this {spread_type}-card tarot reading:\n\n"
        
        # Add each card with its position and meaning
        for i, card_obj in enumerate(cards):
            card_name = card_obj['card']
            is_reversed = card_obj['reversed']
            position = labels[i] if i < len(labels) else f"Position {i+1}"
            
            orientation = "Reversed" if is_reversed else "Upright"
            meaning_key = 'reversed' if is_reversed else 'upright'
            
            card_meaning = card_meanings.get(card_name.lower(), {}).get(
                meaning_key, 
                "No specific meaning available"
            )
            
            prompt += f"**{position}**: {card_name} ({orientation})\n"
            prompt += f"Meaning: {card_meaning}\n\n"
        
        prompt += "\nProvide a cohesive interpretation that:\n"
        prompt += "1. Considers how the cards relate to each other\n"
        prompt += "2. Takes into account the position meanings in the spread\n"
        prompt += "3. Offers practical guidance and spiritual insight\n"
        prompt += "4. Addresses the overall narrative of the reading\n"
        
        return prompt
