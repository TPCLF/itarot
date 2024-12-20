import React, { useState } from "react";
import { View, Text, Button, StyleSheet, ScrollView } from "react-native";
import { Picker } from "@react-native-picker/picker";

// Tarot card meanings
const tarotCards = [
  "Ace of Cups", "Two of Cups", "Three of Cups", "Four of Cups", "Five of Cups",
  "Six of Cups", "Seven of Cups", "Eight of Cups", "Nine of Cups", "Ten of Cups",
  "Page of Cups", "Knight of Cups", "Queen of Cups", "King of Cups",
  "Ace of Pentacles", "Two of Pentacles", "Three of Pentacles", "Four of Pentacles", "Five of Pentacles",
  "Six of Pentacles", "Seven of Pentacles", "Eight of Pentacles", "Nine of Pentacles", "Ten of Pentacles",
  "Page of Pentacles", "Knight of Pentacles", "Queen of Pentacles", "King of Pentacles",
  "Ace of Swords", "Two of Swords", "Three of Swords", "Four of Swords", "Five of Swords",
  "Six of Swords", "Seven of Swords", "Eight of Swords", "Nine of Swords", "Ten of Swords",
  "Page of Swords", "Knight of Swords", "Queen of Swords", "King of Swords",
  "Ace of Wands", "Two of Wands", "Three of Wands", "Four of Wands", "Five of Wands",
  "Six of Wands", "Seven of Wands", "Eight of Wands", "Nine of Wands", "Ten of Wands",
  "Page of Wands", "Knight of Wands", "Queen of Wands", "King of Wands",
  "The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor",
  "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit",
  "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance",
  "The Devil", "The Tower", "The Star", "The Moon", "The Sun",
  "Judgement", "The World"
];

// Explicitly type the spreadLabels to ensure the keys are 3, 6, 9, 10, or 12
const spreadLabels: {
  [key in 1 | 3 | 6 | 9 | 10 | 12]: string[];
} = {
  1: [],
  3: ["Past", "Present", "Future"],
  6: ["Past", "Present", "Future", "Hidden Influences", "External Factors", "Outcome"],
  9: [
    "Present Situation",
    "Immediate Influence",
    "Hidden Influences",
    "Past Influence",
    "Recent Past",
    "Future Influence",
    "The Querent’s Role",
    "External Factors",
    "Outcome/ Advice"
  ],
  10: [
    "Present Position",
    "Immediate Influence",
    "Goal or Destiny",
    "Distant Past",
    "Recent Past",
    "Future Influence",
    "The Questioner",
    "External Factors",
    "Inner Emotions",
    "Final Result"
  ],
  12: [
    "Past Influences",
    "Present Situation",
    "Immediate Influences",
    "Distant Past",
    "Recent Past",
    "Near Future",
    "Far Future",
    "External Influences",
    "Emotional State",
    "The Querent’s Role",
    "Outcome/ Advice",
    "Final Outcome"
  ]
};

export default function App() {
  const [randomNumber, setRandomNumber] = useState<number | null>(null);
  const [cyclingNumber, setCyclingNumber] = useState<number | null>(null);
  const [isCycling, setIsCycling] = useState(false);
  const [drawnCards, setDrawnCards] = useState<{ card: string; reversed: boolean }[]>([]);
  const [drawnCardLabels, setDrawnCardLabels] = useState<string[]>([]);  // Track card labels
  const [selectedValue, setSelectedValue] = useState<number>(1);
  const [drawCount, setDrawCount] = useState<1 | 3 | 6 | 9 | 10 | 12>(1); // Type as one of 3 | 6 | 9 | 10 | 12

  const generateRandomNumber = () => {
    setIsCycling(true);
    let intervalId: NodeJS.Timeout;
  
    // Start cycling numbers for visual effect
    intervalId = setInterval(() => {
      setCyclingNumber(Math.floor(Math.random() * tarotCards.length));
    }, 50);
  
    // Stop cycling and perform card draw after 2 seconds
    setTimeout(() => {
      clearInterval(intervalId);
  
      // Create a copy of the drawn cards and labels
      const newDrawnCards: { card: string; reversed: boolean }[] = [...drawnCards];
      const newDrawnCardLabels: string[] = [...drawnCardLabels];
  
      // Identify remaining cards
      const remainingCards = tarotCards.filter(card => 
        !newDrawnCards.some(drawnCard => drawnCard.card === card)
      );
  
      // If no cards are left, handle gracefully
      if (remainingCards.length === 0) {
        alert("No more cards left in the deck!");
        setIsCycling(false);
        return;
      }
  
      // Determine how many cards to draw
      const cardsToDraw = Math.min(drawCount, remainingCards.length);
  
      // Draw cards from the remaining pool
      const drawnThisTurn = [];
      for (let i = 0; i < cardsToDraw; i++) {
        const randomIndex = Math.floor(Math.random() * remainingCards.length);
        const selectedCard = remainingCards.splice(randomIndex, 1)[0]; // Remove from remaining pool
  
        // Randomly determine if the card is reversed
        const isReversed = Math.random() < 0.11; // 11% chance
        drawnThisTurn.push({ card: selectedCard, reversed: isReversed });
  
        // Add labels if applicable
        const label = i < spreadLabels[drawCount].length ? spreadLabels[drawCount][i] : "Extra Card";
        newDrawnCardLabels.push(label);
      }
  
      // Add newly drawn cards to the list of all drawn cards
      newDrawnCards.push(...drawnThisTurn);
  
      // Update state
      setDrawnCards(newDrawnCards);
      setDrawnCardLabels(newDrawnCardLabels);
  
      // Set the final cycling and drawn card for UI
      const lastDrawnCardIndex = tarotCards.indexOf(drawnThisTurn[drawnThisTurn.length - 1].card);
      setRandomNumber(lastDrawnCardIndex);
      setCyclingNumber(lastDrawnCardIndex);
  
      // Stop cycling
      setIsCycling(false);
    }, 2000);
  };
  
  

  const resetDeck = () => {
    setRandomNumber(null);
    setCyclingNumber(null);
    setDrawnCards([]); // Clear drawn cards
    setDrawnCardLabels([]); // Clear labels
  };

  return (
    <View style={styles.container}>
      {/* Draw Count Selection */}
      <Picker
        selectedValue={drawCount}
        style={styles.picker}
        onValueChange={(itemValue) => setDrawCount(itemValue as 3 | 6 | 9 | 10 | 12)} // Type assertion here
      >
        <Picker.Item label="1 Card" value={1} />
        <Picker.Item label="3 Cards" value={3} />
        <Picker.Item label="6 Cards" value={6} />
        <Picker.Item label="9 Cards" value={9} />
        <Picker.Item label="10 Cards" value={10} />
        <Picker.Item label="12 Cards" value={12} />
      </Picker>
      {/* Top Bar Random Number Visualizer, Commented out for future consideration... */}
      {/*<View style={styles.visualizer}>
        <Text style={styles.visualizerText}>
          {cyclingNumber !== null ? cyclingNumber : "--"}
        </Text>
      </View>*/}

      {/* Display drawn cards */}
      <ScrollView
        contentContainerStyle={styles.cardDisplayContainer}
        horizontal={false}
        showsVerticalScrollIndicator={true}
      >
        {drawnCards.map((cardObj, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.cardNumber}>{drawnCardLabels[index]}</Text>
            <Text style={styles.cardText}>
         {cardObj.card}
         {cardObj.reversed ? " (Reversed)" : ""}
        </Text>
      </View>
    ))}

      </ScrollView>

      {/* Main Content */}
      
      <Button
        title="Draw a Card"
        onPress={generateRandomNumber}
        disabled={isCycling || drawnCards.length === tarotCards.length}
      />
        <View style={styles.resetButton}>
      <Button
        title="Reset Deck"
        onPress={resetDeck}
        disabled={drawnCards.length === 0}
      />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212", // Dark background
  },
  numberText: {
    fontSize: 20,
    margin: 20,
    color: "white", // Light text color
  },
  picker: {
    width: 200,
    height: 50,
    position: "absolute", // Absolute positioning
    left: 10, // Position it towards the left
    bottom: 10, // Position it above the bottom edge
    color: "#ffffff",
    backgroundColor: "#6200ea", // Optional: Give the picker a background color
    borderRadius: 10, // Optional: Add rounded corners
    padding: 5, // Optional: Padding for better spacing
  },
  visualizer: {
    marginBottom: 20,
  },
  visualizerText: {
    fontSize: 50,
    color: "white", // Light text color
  },
  cardDisplayContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
  },
  card: {
    backgroundColor: "#1f1f1f",
    borderWidth: 2,
    borderColor: "#6200ea", // Purple border
    borderRadius: 8,
    padding: 15,
    margin: 5,
    width: 100, // Fixed width
    height: 140, // Taller than width to give card shape
    alignItems: "center",
    justifyContent: "center",
  },
  cardNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFD700", // Gold color for the labels
  },
  cardText: {
    fontSize: 16,
    color: "white", // Light text color for the card name
  },
  resetButton: {
    position: 'absolute',
    bottom: 20, // 20px from the bottom
    right: 20, // 20px from the right
  },
});
