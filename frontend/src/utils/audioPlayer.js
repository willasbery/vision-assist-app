import { Audio } from 'expo-av';
import { Vibration } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";

// Sound objects cache
let sound_paths = {
  "continue_forward": require("../../assets/audio/continue_forward.mp3"),
  "move_left": require("../../assets/audio/move_left.mp3"),
  "move_right": require("../../assets/audio/move_right.mp3"),
};

let sounds = {};

// Initialize sounds
export const initialiseSounds = async () => {
  try {
    const { sound: continueForward } = await Audio.Sound.createAsync(sound_paths["continue_forward"], { shouldPlay: false });
    const { sound: moveLeft } = await Audio.Sound.createAsync(sound_paths["move_left"], { shouldPlay: false });
    const { sound: moveRight } = await Audio.Sound.createAsync(sound_paths["move_right"], { shouldPlay: false });
    
    sounds = {
      "continue_forward": continueForward,
      "move_left": moveLeft,
      "move_right": moveRight,
    };
  } catch (error) {
    console.error('Error loading sounds:', error);
    throw error;
  }
};

// Vibration patterns for different instructions
const vibrationPatterns = {
  "continue_forward": [300, 300],
  "move_left": [300, 200],
  "move_right": [200, 300],
};

export const playAudio = async (fileName) => {
  try {
    // Check settings
    const [audioEnabled, vibrationEnabled] = await Promise.all([
      AsyncStorage.getItem("audioEnabled"),
      AsyncStorage.getItem("vibrationEnabled")
    ]);

    // Play audio if enabled
    if (audioEnabled !== "false" && sounds[fileName]) {
      await sounds[fileName].playAsync();
    }

    // Vibrate if enabled
    if (vibrationEnabled !== "false" && vibrationPatterns[fileName]) {
      Vibration.vibrate(vibrationPatterns[fileName]);
    }
  } catch (error) {
    console.error('Error playing feedback:', error);
  }
};

// Cleanup function to unload sounds when they're no longer needed
export const unloadSounds = async () => {
  try {
    for (const sound of Object.values(sounds)) {
      await sound.unloadAsync();
    }
    sounds = {};
    Vibration.cancel(); // Cancel any ongoing vibrations
  } catch (error) {
    console.error('Error unloading sounds:', error);
  }
}; 