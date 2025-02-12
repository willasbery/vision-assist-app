import { NavigationContainer } from '@react-navigation/native';
import "@/global.css";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import React, { useEffect } from 'react';
import { initialiseSounds, unloadSounds } from '@/src/utils/audioPlayer';

import HomeScreen from '@/src/HomeScreen';
import SettingsScreen from '@/src/SettingsScreen';
import StreamScreen from '@/src/StreamScreen';


const Stack = createNativeStackNavigator();

// Common header options to avoid repetition
const commonHeaderOptions = {
  headerStyle: {
    backgroundColor: '#3b82f6',
  },
  headerTintColor: '#fff',
  headerBackTitleVisible: false, // Hide back button text on iOS
};

// Screen configurations
const screens = [
  {
    name: 'Home',
    component: HomeScreen,
    options: {
      title: 'Vision Assist',
      ...commonHeaderOptions,
    },
  },
  {
    name: 'Settings',
    component: SettingsScreen,
    options: {
      title: 'Settings',
      ...commonHeaderOptions,
    },
  },
  {
    name: 'Stream',
    component: StreamScreen,
    options: {
      title: 'Stream',
      ...commonHeaderOptions,
    },
  },
];

export default function App() {
  useEffect(() => {
    // Initialize sounds when component mounts
    const loadSounds = async () => {
      try {
        await initialiseSounds();
      } catch (error) {
        console.error('Failed to initialize sounds:', error);
      }
    };
    
    loadSounds();

    // Cleanup sounds when component unmounts
    return () => {
      unloadSounds();
    };
  }, []); // Empty dependency array means this runs once on mount

  return (
    <GluestackUIProvider mode="light">
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator>
            {screens.map((screen) => (
              <Stack.Screen
                key={screen.name}
                name={screen.name}
                component={screen.component}
                options={screen.options}
              />
            ))}
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="light" />
      </SafeAreaProvider>
    </GluestackUIProvider>
  );
}