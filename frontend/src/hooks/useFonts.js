import * as Font from 'expo-font';
import { useEffect, useState } from 'react';

export const useFonts = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          'Geist': require('../assets/fonts/Geist-Regular.otf'),
          'Geist-Medium': require('../assets/fonts/Geist-Medium.otf'),
          'Geist-SemiBold': require('../assets/fonts/Geist-SemiBold.otf'),
          'Geist-Bold': require('../assets/fonts/Geist-Bold.otf'),
        });
        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
        setFontsLoaded(true); // Still set to true to not block app loading
      }
    }

    loadFonts();
  }, []);

  return fontsLoaded;
}; 