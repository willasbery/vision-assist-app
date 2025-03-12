import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Font size scale factors
export const FONT_SIZES = {
  SMALL: 0.85,
  MEDIUM: 1,
  LARGE: 1.2,
  EXTRA_LARGE: 1.5,
};

// Context for accessibility settings
const AccessibilityContext = createContext({
  fontSize: FONT_SIZES.MEDIUM,
  fontSizeKey: 'MEDIUM',
  highContrast: false,
  setFontSize: () => {},
  setHighContrast: () => {},
});

// Provider component
export const AccessibilityProvider = ({ children }) => {
  const [fontSize, setFontSizeState] = useState(FONT_SIZES.MEDIUM);
  const [fontSizeKey, setFontSizeKey] = useState('MEDIUM');
  const [highContrast, setHighContrastState] = useState(false);

  // Load settings from AsyncStorage on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [storedFontSize, storedHighContrast] = await Promise.all([
          AsyncStorage.getItem('fontSizeKey'),
          AsyncStorage.getItem('highContrast'),
        ]);

        if (storedFontSize) {
          setFontSizeKey(storedFontSize);
          setFontSizeState(FONT_SIZES[storedFontSize]);
        }

        if (storedHighContrast !== null) {
          setHighContrastState(storedHighContrast === 'true');
        }
      } catch (error) {
        console.error('Error loading accessibility settings:', error);
      }
    };

    loadSettings();
  }, []);

  // Save font size to AsyncStorage and update state
  const setFontSize = async (sizeKey) => {
    try {
      await AsyncStorage.setItem('fontSizeKey', sizeKey);
      setFontSizeKey(sizeKey);
      setFontSizeState(FONT_SIZES[sizeKey]);
    } catch (error) {
      console.error('Error saving font size setting:', error);
    }
  };

  // Save high contrast to AsyncStorage and update state
  const setHighContrast = async (value) => {
    try {
      await AsyncStorage.setItem('highContrast', value.toString());
      setHighContrastState(value);
    } catch (error) {
      console.error('Error saving high contrast setting:', error);
    }
  };

  return (
    <AccessibilityContext.Provider
      value={{
        fontSize,
        fontSizeKey,
        highContrast,
        setFontSize,
        setHighContrast,
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

// Custom hook to use the accessibility context
export const useAccessibility = () => useContext(AccessibilityContext);
