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
  const [drawnCardLabels, setDrawnCardLabels] = useState<string[]>([]);
  const [drawCount, setDrawCount] = useState<1 | 3 | 6 | 9 | 10 | 12>(1);
  const [interpretation, setInterpretation] = useState<string>("");
  const [isReadingComplete, setIsReadingComplete] = useState(false);
  const [isInterpreterActive, setIsInterpreterActive] = useState(false);

  // Audio & Caption State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechWords, setSpeechWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);

  // Refs for streaming and queuing
  const audioQueue = React.useRef<{ audio: HTMLAudioElement; text: string }[]>([]);
  const isPlayingAudio = React.useRef(false);
  const currentAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = React.useRef<number | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const isReadingCompleteRef = React.useRef(false);
  const ttsRequestQueue = React.useRef<string[]>([]);
  const activeTTSRequests = React.useRef(0);
  const MAX_CONCURRENT_TTS = 2; // Throttle requests to avoid choking backend

  const [visibleCardCount, setVisibleCardCount] = useState<number>(0);

  // --- Audio Queue Management ---

  const playNextInQueue = async () => {
    // Check ref instead of state to avoid stale closures
    if (isPlayingAudio.current || audioQueue.current.length === 0) {
      if (audioQueue.current.length === 0 && isReadingCompleteRef.current && activeTTSRequests.current === 0 && ttsRequestQueue.current.length === 0) {
        // Queue empty, reading done, no pending request -> all done
        setIsSpeaking(false);
      }
      return;
    }

    isPlayingAudio.current = true;
    setIsSpeaking(true);
    const nextItem = audioQueue.current.shift();

    if (!nextItem) {
      isPlayingAudio.current = false;
      return;
    }

    const { audio, text } = nextItem;
    currentAudioRef.current = audio;

    // Prepare captions
    const words = text.split(/\s+/);
    setSpeechWords(words);
    setCurrentWordIndex(0);

    // Caption Animation Logic
    const getWordWeight = (word: string) => {
      let weight = word.length;
      if (word.endsWith(',')) weight += 4;
      else if (['.', '?', '!'].some(c => word.endsWith(c))) weight += 8;
      return weight;
    };
    const wordWeights = words.map(getWordWeight);
    const totalWeight = wordWeights.reduce((a, b) => a + b, 0);

    const updateCaptions = () => {
      if (!currentAudioRef.current || currentAudioRef.current.paused || currentAudioRef.current.ended) return;

      const duration = currentAudioRef.current.duration;
      const currentTime = currentAudioRef.current.currentTime;

      if (duration > 0 && totalWeight > 0) {
        const progressRatio = currentTime / duration;
        const targetWeight = progressRatio * totalWeight;

        let currentWeightSum = 0;
        let foundIndex = 0;

        for (let i = 0; i < words.length; i++) {
          currentWeightSum += wordWeights[i];
          if (currentWeightSum >= targetWeight) {
            foundIndex = i;
            break;
          }
        }

        setCurrentWordIndex(prev => (prev !== foundIndex ? foundIndex : prev));
      }
      animationFrameRef.current = requestAnimationFrame(updateCaptions);
    };

    audio.onplay = () => {
      updateCaptions();
    };

    audio.onended = () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      URL.revokeObjectURL(audio.src); // Clean up blob URL
      isPlayingAudio.current = false;
      playNextInQueue(); // Trigger next immediately
    };

    audio.onerror = (e) => {
      console.error('Audio playback error', e);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      URL.revokeObjectURL(audio.src);
      isPlayingAudio.current = false;
      playNextInQueue();
    };

    try {
      await audio.play();
    } catch (err) {
      console.error("Autoplay failed", err);
      isPlayingAudio.current = false;
      playNextInQueue();
    }
  };

  const processTTSQueue = async () => {
    if (activeTTSRequests.current >= MAX_CONCURRENT_TTS || ttsRequestQueue.current.length === 0) {
      return;
    }

    const text = ttsRequestQueue.current.shift();
    if (!text) return;

    activeTTSRequests.current++;

    try {
      const response = await axios.post(
        'http://localhost:5000/api/tts',
        { text },
        { responseType: 'blob' }
      );
      const audioUrl = URL.createObjectURL(response.data);
      const audio = new Audio(audioUrl);
      audio.preload = 'auto'; // Hint to load immediately
      audio.load(); // Force load

      audioQueue.current.push({ audio, text });

      // Attempt to play if waiting
      playNextInQueue();
    } catch (error) {
      console.error("Failed to generate TTS for chunk:", text, error);
    } finally {
      activeTTSRequests.current--;
      processTTSQueue(); // Process next in line
    }
  };

  const addToAudioQueue = (text: string) => {
    // Don't generate empty audio
    if (!text.trim()) return;

    ttsRequestQueue.current.push(text);
    processTTSQueue();
  };

  const stopEverything = () => {
    // Stop Fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // Stop Audio
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.src = '';
      currentAudioRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    // Clear Queue
    audioQueue.current = [];
    ttsRequestQueue.current = []; // Clear pending TTS
    // Note: active requests will still finish but won't queue more logic if we handle it:
    // Actually we can't easily cancel the axios promise without an AbortController for it, 
    // but clearing the queue prevents future ones.

    isPlayingAudio.current = false;
    setIsSpeaking(false);
  };

  // --- Card Dealing Effect ---
  useEffect(() => {
    if (drawnCards.length > 0 && visibleCardCount < drawnCards.length) {
      const timer = setTimeout(() => {
        setVisibleCardCount(prev => prev + 1);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [visibleCardCount, drawnCards]);


  // --- Main Logic ---

  const requestReading = async () => {
    stopEverything(); // Clear previous state

    // Reset State
    if (drawnCards.length > 0) {
      setRandomNumber(null);
      setCyclingNumber(null);
      setDrawnCards([]);
      setDrawnCardLabels([]);
      setVisibleCardCount(0);
      setInterpretation("");
      setIsReadingComplete(false);
      isReadingCompleteRef.current = false;
      ttsRequestQueue.current = [];
      activeTTSRequests.current = 0;
      setIsInterpreterActive(false);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsCycling(true);
    setIsReadingComplete(false);
    isReadingCompleteRef.current = false;
    ttsRequestQueue.current = [];
    activeTTSRequests.current = 0;

    // Cycling Animation
    let intervalId = setInterval(() => {
      setCyclingNumber(Math.floor(Math.random() * tarotCards.length));
    }, 50);

    setTimeout(async () => {
      clearInterval(intervalId);

      // 1. Draw Cards
      const newDrawnCards: { card: string; reversed: boolean }[] = [];
      const newDrawnCardLabels: string[] = [];
      const remainingCards = [...tarotCards];
      const cardsToDraw = Math.min(drawCount, remainingCards.length);

      for (let i = 0; i < cardsToDraw; i++) {
        const randomIndex = Math.floor(Math.random() * remainingCards.length);
        const selectedCard = remainingCards.splice(randomIndex, 1)[0];
        const isReversed = Math.random() < 0.11;
        newDrawnCards.push({ card: selectedCard, reversed: isReversed });
        const label = i < spreadLabels[drawCount].length ? spreadLabels[drawCount][i] : "Extra Card";
        newDrawnCardLabels.push(label);
      }

      setDrawnCards(newDrawnCards);
      setDrawnCardLabels(newDrawnCardLabels);
      setVisibleCardCount(0);

      const lastDrawnCardIndex = tarotCards.indexOf(newDrawnCards[newDrawnCards.length - 1].card);
      setRandomNumber(lastDrawnCardIndex);
      setCyclingNumber(lastDrawnCardIndex);
      setIsCycling(false);
      setIsInterpreterActive(true);

      // 2. Start Streaming Interpretation
      try {
        abortControllerRef.current = new AbortController();
        const actualSpreadType = newDrawnCards.length as 1 | 3 | 6 | 9 | 10 | 12;

        const response = await fetch('http://localhost:5000/api/interpret_stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cards: newDrawnCards,
            spreadType: actualSpreadType
          }),
          signal: abortControllerRef.current.signal
        });

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let sentenceBuffer = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            setInterpretation(prev => prev + chunk); // Update UI text immediately

            // Chunking for Audio
            sentenceBuffer += chunk;

            // Regex to find sentence splitters (. ? ! or newline)
            // We keep the delimiter with the sentence
            let match;
            const sentenceRegex = /([.?!]+|\n+)/g;

            let lastIndex = 0;
            while ((match = sentenceRegex.exec(sentenceBuffer)) !== null) {
              const delimiter = match[0];
              const endIndex = match.index + delimiter.length;

              const fullSentence = sentenceBuffer.substring(lastIndex, endIndex).trim();
              if (fullSentence) {
                addToAudioQueue(fullSentence);
              }
              lastIndex = endIndex;
            }

            // Keep the remainder for the next chunk
            sentenceBuffer = sentenceBuffer.substring(lastIndex);
          }
        }

        // flush remaining text
        if (sentenceBuffer.trim()) {
          addToAudioQueue(sentenceBuffer.trim());
        }

        setIsReadingComplete(true);
        isReadingCompleteRef.current = true;

      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log("Stream aborted");
        } else {
          console.error("Stream Error", err);
          setInterpretation(prev => prev + "\n[Error receiving interpretation]");
        }
      } finally {
        setIsInterpreterActive(false);
        abortControllerRef.current = null;
      }

    }, 2000);
  };

  // Logic to show/hide main elements
  const isCardsDealt = drawnCards.length > 0 && visibleCardCount === drawnCards.length;
  // Show loader while interpreting AND audio is still potentially queueing/playing, 
  // OR if cards are still being dealt.
  // Actually, we want to show the 'Teller' GIF while the AI is "thinking" (getting the stream) 
  // or while the cards are appearing to create that "seance" vibe.
  // Once text is streaming in, we might want to keep the GIF until at least some audio starts?

  // Simplified: Show loader until we have the full text? No, that defeats the purpose of streaming.
  // Show loader only while 'waiting' for the FIRST chunk? 
  // Let's repurpose: 
  // - Show loader while `isInterpreterActive` is true (receiving steam) 
  //   OR `isSpeaking` is true (the teller is talking).
  const showTeller = isInterpreterActive || isSpeaking || (drawnCards.length > 0 && visibleCardCount < drawnCards.length);

  return (
    <View style={styles.container}>
      <Picker
        selectedValue={drawCount}
        style={styles.picker}
        onValueChange={(itemValue) => setDrawCount(itemValue as 3 | 6 | 9 | 10 | 12)}
      >
        <Picker.Item label="1 Card" value={1} />
        <Picker.Item label="3 Cards" value={3} />
        <Picker.Item label="6 Cards" value={6} />
        <Picker.Item label="9 Cards" value={9} />
        <Picker.Item label="10 Cards" value={10} />
        <Picker.Item label="12 Cards" value={12} />
      </Picker>

      <ScrollView
        contentContainerStyle={styles.cardDisplayContainer}
        horizontal={false}
        showsVerticalScrollIndicator={true}
      >
        {drawnCards.slice(0, visibleCardCount).map((cardObj, index) => (
          <View key={index} style={styles.card}>
            <Text style={styles.cardNumber}>{drawnCardLabels[index]}</Text>
            <Text style={styles.cardText}>
              {cardObj.card}
              {cardObj.reversed ? " (Reversed)" : ""}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Captions */}
      {isSpeaking && speechWords.length > 0 && (
        <View style={styles.captionContainer}>
          <Text style={styles.captionText}>
            {speechWords[currentWordIndex]} {speechWords[currentWordIndex + 1] || ''}
          </Text>
        </View>
      )}

      {/* Interpretation Section - Only show when fully loaded AND NOT speaking AND NOT loading audio */}
      {interpretation && isReadingComplete && !isSpeaking ? (
        <View style={styles.interpretationContainer}>
          <Text style={styles.interpretationTitle}>Interpretation:</Text>
          <ScrollView style={styles.interpretationScroll} ref={ref => ref?.scrollToEnd({ animated: true })}>
            <Text style={styles.interpretationText}>{interpretation}</Text>
          </ScrollView>
        </View>
      ) : null}

      {showTeller && (
        <View style={styles.loaderContainer}>
          {/* Only show mantra if we are waiting for the VERY first bits */}
          {!interpretation && (
            <Text style={styles.loadingMantra}>
              Be patient while I read your computer's energy...
            </Text>
          )}
          <Image
            source={require('./assets/teller.gif')}
            style={styles.loaderGif}
          />
        </View>
      )}

      {!showTeller && !isCycling && (
        <View style={styles.buttonContainer}>
          <Button
            title="Request New Reading"
            onPress={requestReading}
            color="#6200ea"
          />
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start", // Changed from center to pack items at top
    alignItems: "center",
    backgroundColor: "#121212", // Dark background
    paddingTop: 60, // Add padding for status bar area since we removed centering
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
    marginVertical: 5,
    marginBottom: 0,
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
  captionContainer: {
    position: 'absolute',
    bottom: 100, // Position above the button/picker
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#FFD700",
    alignItems: 'center',
    zIndex: 100,
  },
  captionText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: "#FFD700",
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10
  },

  loaderGif: {
    width: "100%",
    height: 450,
    resizeMode: "contain",
    marginTop: 0,
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    marginTop: -40, // Aggressively pull up closer to cards
    marginBottom: 0,
    paddingTop: 0,
  },
  loadingMantra: {
    color: '#FFD700',
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 0, // Tighten gap between text and GIF
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10
  },
});

