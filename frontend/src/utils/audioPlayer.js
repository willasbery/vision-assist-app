import { Audio } from 'expo-av';

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

export const playAudio = async (fileName) => {
  try {
    if (sounds[fileName]) {
      await sounds[fileName].playAsync();
    }
  } catch (error) {
    console.error('Error playing sound:', error);
  }
};

// Cleanup function to unload sounds when they're no longer needed
export const unloadSounds = async () => {
  // try {
  //   for (const sound of Object.values(sounds)) {
  //     await sound.unloadAsync();
  //   }
  //   sounds = {};
  // } catch (error) {
  //   console.error('Error unloading sounds:', error);
  // }
  return
}; 