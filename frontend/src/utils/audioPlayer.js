import { Audio } from 'expo-av';

// Sound objects cache
let sound_paths = {
  "continue_forward": require("../../assets/audio/continue_forward.mp3"),
  "immediately_turn_left": require("../../assets/audio/immediately_turn_left.mp3"),
  "immediately_turn_right": require("../../assets/audio/immediately_turn_right.mp3"),
  "possible_left_turn": require("../../assets/audio/possible_left_turn.mp3"),
  "possible_right_turn": require("../../assets/audio/possible_right_turn.mp3"),
  "turn_left": require("../../assets/audio/turn_left.mp3"),
  "turn_right": require("../../assets/audio/turn_right.mp3"),
};

let sounds = {};

// Initialize sounds
export const initialiseSounds = async () => {
  try {
    const { sound: continueForward } = await Audio.Sound.createAsync(sound_paths["continue_forward"], { shouldPlay: false });
    const { sound: immediatelyTurnLeft } = await Audio.Sound.createAsync(sound_paths["immediately_turn_left"], { shouldPlay: false });
    const { sound: immediatelyTurnRight } = await Audio.Sound.createAsync(sound_paths["immediately_turn_right"], { shouldPlay: false });
    const { sound: possibleLeftTurn } = await Audio.Sound.createAsync(sound_paths["possible_left_turn"], { shouldPlay: false });
    const { sound: possiblyRightTurn } = await Audio.Sound.createAsync(sound_paths["possible_right_turn"], { shouldPlay: false });
    const { sound: turnLeft } = await Audio.Sound.createAsync(sound_paths["turn_left"], { shouldPlay: false });
    const { sound: turnRight } = await Audio.Sound.createAsync(sound_paths["turn_right"], { shouldPlay: false });
    
    sounds = {
      "continue_forward": continueForward,
      "immediately_turn_left": immediatelyTurnLeft,
      "immediately_turn_right": immediatelyTurnRight,
      "possible_left_turn": possibleLeftTurn,
      "possible_right_turn": possiblyRightTurn,
      "turn_left": turnLeft,
      "turn_right": turnRight,
    };
  } catch (error) {
    console.error('Error loading sounds:', error);
    throw error;
  }
};

export const playAudio = async (fileName) => {
  try {
    await sounds[fileName].playAsync();
  } catch (error) {
    console.error('Error playing sound:', error);
  }
};

// Cleanup function to unload sounds when they're no longer needed
export const unloadSounds = async () => {
  try {
    for (const sound of Object.values(sounds)) {
      await sound.sound.unloadAsync();
    }
    sounds = {};
  } catch (error) {
    console.error('Error unloading sounds:', error);
  }
}; 