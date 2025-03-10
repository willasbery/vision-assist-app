import { NavigationContainer } from '@react-navigation/native';
import '@/global.css';
import { GluestackUIProvider } from '@/src/components/ui/gluestack-ui-provider';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import React, { useEffect } from 'react';
import { initialiseSounds, unloadSounds } from '@/src/utils/audioPlayer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';

import { useFonts } from '@/src/hooks/useFonts';
import { typography } from '@/src/theme/typography';
import { getColors } from '@/src/theme/colors';
import {
  AccessibilityProvider,
  useAccessibility,
} from '@/src/hooks/useAccessibility';

import HomeScreen from '@/src/HomeScreen';
import SettingsScreen from '@/src/SettingsScreen';
import StreamScreen from '@/src/StreamScreen';
import TestingScreen from '@/src/TestingScreen';
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Common header options with accessibility support
const CommonHeaderOptions = () => {
  const { highContrast } = useAccessibility();
  const colors = getColors(highContrast);

  return {
    headerStyle: {
      backgroundColor: colors.primary,
      // height: 60 * 1.5 * fontSize,
    },
    headerTintColor: colors.text.light,
    headerBackTitleVisible: false,
    headerTitleStyle: {
      fontFamily: 'Geist-SemiBold',
    },
  };
};

// Tab navigator component with accessibility support
function TabNavigator() {
  const { highContrast, fontSize } = useAccessibility();
  const colors = getColors(highContrast);

  console.log(fontSize);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = focused
            ? route.name === 'Home'
              ? 'home'
              : 'settings'
            : route.name === 'Home'
            ? 'home-outline'
            : 'settings-outline';
          // Adjust icon size to be slightly smaller relative to the container
          const scaledSize = Math.min(24 * fontSize * 0.8, size * fontSize);
          return <Ionicons name={iconName} size={scaledSize} color={color} />;
        },
        tabBarStyle: {
          height: fontSize <= 1 ? 60 * fontSize : 60 * fontSize * 0.8, // Increased height further to accommodate everything
          backgroundColor: colors.background,
        },
        tabBarLabelStyle: {
          fontFamily: 'Geist-SemiBold',
          fontSize: 12 * fontSize,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
        }}
      />
    </Tab.Navigator>
  );
}

// Main app component with accessibility provider
function MainApp() {
  const fontsLoaded = useFonts();
  const { highContrast } = useAccessibility();
  const colors = getColors(highContrast);

  // 1. First useEffect - Splash Screen
  useEffect(() => {
    async function prepare() {
      await SplashScreen.preventAutoHideAsync();
    }
    prepare();
  }, []);

  // 2. Second useEffect - Sound Loading
  useEffect(() => {
    const loadSounds = async () => {
      try {
        await initialiseSounds();
      } catch (error) {
        console.error('Failed to initialize sounds:', error);
      }
    };

    loadSounds();
    return () => {
      unloadSounds();
    };
  }, []);

  // 3. Third useEffect - Hide Splash Screen after fonts load
  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GluestackUIProvider
      mode="light"
      config={{
        tokens: {
          fonts: typography.fonts,
          fontConfig: typography.fontConfig,
          colors: {
            primary: colors.primary,
            secondary: colors.secondary,
            background: colors.background,
            textDark900: colors.text.dark900,
            textDark500: colors.text.dark500,
            textLight: colors.text.light,
            error700: colors.error,
          },
        },
      }}
    >
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen
              name="TabNavigator"
              component={TabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Stream"
              component={StreamScreen}
              options={({ navigation }) => ({
                title: 'Stream',
                ...CommonHeaderOptions(),
              })}
            />
            <Stack.Screen
              name="Testing"
              component={TestingScreen}
              options={({ navigation }) => ({
                title: 'Testing',
                ...CommonHeaderOptions(),
              })}
            />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="light" />
      </SafeAreaProvider>
    </GluestackUIProvider>
  );
}

// Export the app with accessibility provider
export default function App() {
  return (
    <AccessibilityProvider>
      <MainApp />
    </AccessibilityProvider>
  );
}
