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
        card_meanings: Dict[str, Dict[str, str]]
    ) -> str:
        """
        Generate a tarot reading interpretation.
        
        Args:
            cards: List of card objects with 'card' and 'reversed' keys
            spread_type: Number of cards in the spread (1, 3, 6, 9, 10, or 12)
            card_meanings: Dictionary mapping card names to their meanings
            
        Returns:
            String containing the interpretation
        """
        prompt = self._build_prompt(cards, spread_type, card_meanings)
        
        try:
            response = ollama.chat(
                model=self.model_name,
                messages=[
                    {
                        'role': 'system',
                        'content': 'You are an experienced tarot reader who provides insightful, compassionate, and meaningful interpretations. Focus on practical guidance and spiritual insight. Keep interpretations concise but meaningful (2-4 paragraphs).'
                    },
                    {
                        'role': 'user',
                        'content': prompt
                    }
                ]
            )
            
            return response['message']['content']
        except Exception as e:
            return f"Error generating interpretation: {str(e)}\n\nPlease ensure Ollama is running and the model '{self.model_name}' is installed."
    
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
        prompt += "\nKeep the interpretation concise but meaningful (2-4 paragraphs)."
        
        return prompt
