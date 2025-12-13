import React, { useState, useEffect } from "react";
import { View, Text, Button, StyleSheet, ScrollView, ActivityIndicator, Image } from "react-native";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";

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
  const [interpretation, setInterpretation] = useState<string | null>(null);
  const [isLoadingInterpretation, setIsLoadingInterpretation] = useState(false);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);


  // Speak text using backend TTS
  const speakText = async (text: string) => {
    console.log('speakText called with:', text?.substring(0, 50));

    // Stop any current speech
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = '';
    }

    if (!text) {
      console.error('No text provided');
      return;
    }

    try {
      setIsSpeaking(true);
      console.log('Requesting TTS from backend...');

      // Request audio from backend
      const response = await axios.post(
        'http://localhost:5000/api/tts',
        { text },
        { responseType: 'blob' }
      );

      // Create audio from blob
      const audioUrl = URL.createObjectURL(response.data);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        console.log('Speech ended');
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
      };

      setCurrentAudio(audio);
      await audio.play();
      console.log('Audio playing');

    } catch (error: any) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
      alert('Voice playback failed. Make sure the backend is running.');
    }
  };

  // Stop speaking
  const stopSpeaking = () => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.src = '';
      setCurrentAudio(null);
    }
    setIsSpeaking(false);
    console.log('Speech stopped');
  };



  // Auto-read interpretation when it changes
  useEffect(() => {
    if (interpretation && !interpretation.startsWith('Error')) {
      // Small delay to let UI update
      setTimeout(() => speakText(interpretation), 500);
    }
  }, [interpretation]);

  const requestReading = async () => {
    stopSpeaking();
    // If cards have already been drawn, reset the deck first
    if (drawnCards.length > 0) {
      setRandomNumber(null);
      setCyclingNumber(null);
      setDrawnCards([]);
      setDrawnCardLabels([]);
      setInterpretation(null);
      // Wait a brief moment for state to update
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsCycling(true);
    setInterpretation(null);
    let intervalId: NodeJS.Timeout;

    // Start cycling numbers for visual effect
    intervalId = setInterval(() => {
      setCyclingNumber(Math.floor(Math.random() * tarotCards.length));
    }, 50);

    // Stop cycling and perform card draw after 2 seconds
    setTimeout(async () => {
      clearInterval(intervalId);

      // Create a fresh array for new reading (since we reset above)
      const newDrawnCards: { card: string; reversed: boolean }[] = [];
      const newDrawnCardLabels: string[] = [];

      // All cards are available for a fresh reading
      const remainingCards = [...tarotCards];

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

      // Add newly drawn cards to the list
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

      // Automatically get interpretation after drawing cards
      setIsLoadingInterpretation(true);

      try {
        // Use the actual number of drawn cards as the spread type
        const actualSpreadType = newDrawnCards.length as 1 | 3 | 6 | 9 | 10 | 12;

        const response = await axios.post('http://localhost:5000/api/interpret', {
          cards: newDrawnCards,
          spreadType: actualSpreadType
        });

        setInterpretation(response.data.interpretation);
      } catch (error: any) {
        console.error('Error getting interpretation:', error);

        // Show the actual error message from the server if available
        let errorMessage = 'Error: Could not get interpretation.\n\n';

        if (error.response?.data?.error) {
          errorMessage += `Server error: ${error.response.data.error}\n\n`;
        } else if (error.message) {
          errorMessage += `Error: ${error.message}\n\n`;
        }

        errorMessage +=
          `Make sure the backend is running:\n` +
          `1. cd backend\n` +
          `2. source venv/bin/activate\n` +
          `3. python app.py\n\n` +
          `Also ensure Ollama is running with: ollama serve`;

        setInterpretation(errorMessage);
      } finally {
        setIsLoadingInterpretation(false);
      }
    }, 2000);
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

      {/* Interpretation Section */}
      {interpretation && (
        <View style={styles.interpretationContainer}>
          <Text style={styles.interpretationTitle}>Interpretation:</Text>
          <ScrollView style={styles.interpretationScroll}>
            <Text style={styles.interpretationText}>{interpretation}</Text>
          </ScrollView>
        </View>
      )}

      {isLoadingInterpretation && (
        <Image
          source={require('./assets/teller.gif')}
          style={styles.loaderGif}
        />
      )}

      {/* Main Content */}
      <View style={styles.buttonContainer}>
        <Button
          title={isCycling || isLoadingInterpretation ? "Reading..." : "Request New Reading"}
          onPress={requestReading}
          disabled={isCycling || isLoadingInterpretation}
          color="#6200ea"
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
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
  },
  interpretationContainer: {
    backgroundColor: "#1f1f1f",
    borderWidth: 2,
    borderColor: "#9c27b0",
    borderRadius: 10,
    padding: 15,
    margin: 10,
    maxHeight: 200,
    width: "90%",
  },
  interpretationTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 10,
  },
  interpretationScroll: {
    maxHeight: 150,
  },
  interpretationText: {
    fontSize: 14,
    color: "white",
    lineHeight: 20,
  },

  loaderGif: {
    flex: 1,
    width: "100%",
    resizeMode: "contain",
    marginVertical: 10,
  },
});

