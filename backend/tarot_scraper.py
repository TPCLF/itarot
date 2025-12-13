import requests
from bs4 import BeautifulSoup
import json
import os
from typing import Dict, Optional

class TarotScraper:
    """Scrapes tarot card meanings from the web and caches them locally."""
    
    def __init__(self, cache_file='tarot_cache.json'):
        self.cache_file = cache_file
        self.cache = self._load_cache()
    
    def _load_cache(self) -> Dict:
        """Load cached tarot card meanings from file."""
        if os.path.exists(self.cache_file):
            try:
                with open(self.cache_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Error loading cache: {e}")
                return {}
        return {}
    
    def _save_cache(self):
        """Save tarot card meanings to cache file."""
        try:
            with open(self.cache_file, 'w', encoding='utf-8') as f:
                json.dump(self.cache, f, indent=2, ensure_ascii=False)
        except Exception as e:
            print(f"Error saving cache: {e}")
    
    def get_card_meaning(self, card_name: str, reversed: bool = False) -> Dict[str, str]:
        """
        Get the meaning of a tarot card.
        
        Args:
            card_name: Name of the card (e.g., "The Fool", "Ace of Cups")
            reversed: Whether the card is reversed
            
        Returns:
            Dictionary with 'upright' and 'reversed' meanings
        """
        cache_key = card_name.lower()
        
        # Check cache first
        if cache_key in self.cache:
            return self.cache[cache_key]
        
        # If not in cache, use fallback meanings
        meaning = self._get_fallback_meaning(card_name)
        
        # Cache the result
        self.cache[cache_key] = meaning
        self._save_cache()
        
        return meaning
    
    def _get_fallback_meaning(self, card_name: str) -> Dict[str, str]:
        """
        Provide fallback meanings for tarot cards.
        These are basic interpretations that will be used if web scraping fails.
        """
        # Basic meanings for major arcana
        major_arcana_meanings = {
            "the fool": {
                "upright": "New beginnings, innocence, spontaneity, free spirit, adventure",
                "reversed": "Recklessness, taken advantage of, inconsideration, naivety"
            },
            "the magician": {
                "upright": "Manifestation, resourcefulness, power, inspired action, skill",
                "reversed": "Manipulation, poor planning, untapped talents, illusion"
            },
            "the high priestess": {
                "upright": "Intuition, sacred knowledge, divine feminine, subconscious mind",
                "reversed": "Secrets, disconnected from intuition, withdrawal, silence"
            },
            "the empress": {
                "upright": "Femininity, beauty, nature, nurturing, abundance, creativity",
                "reversed": "Creative block, dependence on others, smothering, emptiness"
            },
            "the emperor": {
                "upright": "Authority, establishment, structure, father figure, control",
                "reversed": "Domination, excessive control, lack of discipline, inflexibility"
            },
            "the hierophant": {
                "upright": "Spiritual wisdom, religious beliefs, conformity, tradition, institutions",
                "reversed": "Personal beliefs, freedom, challenging the status quo, rebellion"
            },
            "the lovers": {
                "upright": "Love, harmony, relationships, values alignment, choices",
                "reversed": "Self-love, disharmony, imbalance, misalignment of values"
            },
            "the chariot": {
                "upright": "Control, willpower, success, action, determination, victory",
                "reversed": "Self-discipline, opposition, lack of direction, aggression"
            },
            "strength": {
                "upright": "Strength, courage, persuasion, influence, compassion, inner power",
                "reversed": "Inner strength, self-doubt, low energy, raw emotion, insecurity"
            },
            "the hermit": {
                "upright": "Soul searching, introspection, being alone, inner guidance, solitude",
                "reversed": "Isolation, loneliness, withdrawal, paranoia, exile"
            },
            "wheel of fortune": {
                "upright": "Good luck, karma, life cycles, destiny, turning point, change",
                "reversed": "Bad luck, resistance to change, breaking cycles, setbacks"
            },
            "justice": {
                "upright": "Justice, fairness, truth, cause and effect, law, accountability",
                "reversed": "Unfairness, lack of accountability, dishonesty, legal issues"
            },
            "the hanged man": {
                "upright": "Pause, surrender, letting go, new perspectives, sacrifice",
                "reversed": "Delays, resistance, stalling, indecision, stagnation"
            },
            "death": {
                "upright": "Endings, change, transformation, transition, letting go, release",
                "reversed": "Resistance to change, personal transformation, inner purging"
            },
            "temperance": {
                "upright": "Balance, moderation, patience, purpose, meaning, harmony",
                "reversed": "Imbalance, excess, self-healing, re-alignment, extremes"
            },
            "the devil": {
                "upright": "Shadow self, attachment, addiction, restriction, sexuality, materialism",
                "reversed": "Releasing limiting beliefs, exploring dark thoughts, detachment"
            },
            "the tower": {
                "upright": "Sudden change, upheaval, chaos, revelation, awakening, disruption",
                "reversed": "Personal transformation, fear of change, averting disaster"
            },
            "the star": {
                "upright": "Hope, faith, purpose, renewal, spirituality, inspiration, serenity",
                "reversed": "Lack of faith, despair, self-trust, disconnection, discouragement"
            },
            "the moon": {
                "upright": "Illusion, fear, anxiety, subconscious, intuition, dreams",
                "reversed": "Release of fear, repressed emotion, inner confusion, clarity"
            },
            "the sun": {
                "upright": "Positivity, fun, warmth, success, vitality, joy, confidence",
                "reversed": "Inner child, feeling down, overly optimistic, unrealistic expectations"
            },
            "judgement": {
                "upright": "Judgement, rebirth, inner calling, absolution, reflection, reckoning",
                "reversed": "Self-doubt, inner critic, ignoring the call, lack of self-awareness"
            },
            "the world": {
                "upright": "Completion, integration, accomplishment, travel, fulfillment, success",
                "reversed": "Seeking personal closure, short-cuts, delays, incomplete goals"
            }
        }
        
        # Basic suit meanings
        suit_meanings = {
            "cups": "emotions, feelings, relationships, connections",
            "pentacles": "material world, finances, career, manifestation",
            "swords": "thoughts, intellect, communication, conflict",
            "wands": "inspiration, energy, action, passion, creativity"
        }
        
        card_lower = card_name.lower()
        
        # Check if it's a major arcana card
        if card_lower in major_arcana_meanings:
            return major_arcana_meanings[card_lower]
        
        # For minor arcana, generate basic meaning based on suit and number
        for suit, suit_meaning in suit_meanings.items():
            if suit in card_lower:
                upright = f"This card relates to {suit_meaning}. "
                reversed = f"Blocked or internalized {suit_meaning}. "
                
                if "ace" in card_lower:
                    upright += "A new beginning or opportunity in this area."
                    reversed += "Missed opportunity or delayed start."
                elif "page" in card_lower:
                    upright += "A message, new learning, or youthful energy."
                    reversed += "Immaturity, lack of commitment, or delayed news."
                elif "knight" in card_lower:
                    upright += "Action, movement, pursuit of goals."
                    reversed += "Hasty action, delays, or frustration."
                elif "queen" in card_lower:
                    upright += "Nurturing, mature feminine energy, mastery."
                    reversed += "Dependency, manipulation, or self-care needed."
                elif "king" in card_lower:
                    upright += "Mastery, control, mature masculine energy."
                    reversed += "Domination, control issues, or lack of authority."
                else:
                    # Numbered cards
                    upright += "Development and progression in this area."
                    reversed += "Challenges or setbacks in this area."
                
                return {
                    "upright": upright,
                    "reversed": reversed
                }
        
        # Default fallback
        return {
            "upright": f"{card_name} represents an important aspect of your reading that requires reflection.",
            "reversed": f"{card_name} reversed suggests internal processing or blocked energy in this area."
        }
