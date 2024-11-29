import React, { useState } from "react";
import { View, Text, Button, StyleSheet, ScrollView } from "react-native";

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

export default function App() {
  const [randomNumber, setRandomNumber] = useState<number | null>(null);
  const [cyclingNumber, setCyclingNumber] = useState<number | null>(null);
  const [isCycling, setIsCycling] = useState(false);
  const [drawnCards, setDrawnCards] = useState<{ name: string; number: number }[]>([]);

  const generateRandomNumber = () => {
    setIsCycling(true);
    let intervalId: NodeJS.Timeout;

    // Start cycling numbers
    intervalId = setInterval(() => {
      setCyclingNumber(Math.floor(Math.random() * tarotCards.length) + 1);
    }, 50);

    // Stop cycling after 2 seconds and select a final number
    setTimeout(() => {
      clearInterval(intervalId);
      let finalNumber: number;
      do {
        finalNumber = Math.floor(Math.random() * tarotCards.length);
      } while (drawnCards.some((card) => card.name === tarotCards[finalNumber])); // Avoid duplicates

      setRandomNumber(finalNumber);
      setCyclingNumber(finalNumber);
      setDrawnCards((prevCards) => [
        ...prevCards,
        { name: tarotCards[finalNumber], number: prevCards.length + 1 }
      ]);
      setIsCycling(false);
    }, 2000);
  };

  const resetDeck = () => {
    setRandomNumber(null);
    setCyclingNumber(null);
    setDrawnCards([]);
  };

  return (
    <View style={styles.container}>
      {/* Visualizer */}
      <View style={styles.visualizer}>
        <Text style={styles.visualizerText}>
          {cyclingNumber !== null ? cyclingNumber : "--"}
        </Text>
      </View>

      {/* Display drawn cards */}
      <ScrollView
        contentContainerStyle={styles.cardDisplayContainer}
        horizontal={false}
        showsVerticalScrollIndicator={true}
      >
        {drawnCards.map((card, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.cardNumber}>#{card.number}</Text> {/* Display card number */}
            <Text style={styles.cardText}>{card.name}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Main Content */}
      <Text style={styles.numberText}>
        {randomNumber !== null
          ? `You drew: ${tarotCards[randomNumber]}`
          : 'Press "Draw a Card" to begin!'}
      </Text>
      <Button
        title="Draw a Card"
        onPress={generateRandomNumber}
        disabled={isCycling || drawnCards.length === tarotCards.length}
      />
      <Button
        title="Reset Deck"
        onPress={resetDeck}
        disabled={drawnCards.length === 0}
      />
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
    fontSize: 24,
    marginVertical: 20,
    color: "#ffffff", // Light text color
    textAlign: "center",
  },
  visualizer: {
    position: "absolute",
    top: 20,
    right: 20,
    backgroundColor: "#1f1f1f", // Darker background for the visualizer
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#6200ea", // Purple border
  },
  visualizerText: {
    fontSize: 18,
    color: "#bb86fc", // Soft purple for text
    fontWeight: "bold",
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
    fontSize: 16,
    color: "#bb86fc", // Soft purple for number
    fontWeight: "bold",
    marginBottom: 5, // Space between number and card text
  },
  cardText: {
    fontSize: 14,
    color: "#ffffff",
    textAlign: "center",
  },
});
