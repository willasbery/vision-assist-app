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

import HomeScreen from '@/src/HomeScreen';
import SettingsScreen from '@/src/SettingsScreen';
import StreamScreen from '@/src/StreamScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Common header options
const commonHeaderOptions = {
  headerStyle: {
    backgroundColor: '#3b82f6',
  },
  headerTintColor: '#fff',
  headerBackTitleVisible: false,
  headerTitleStyle: {
    fontFamily: 'Geist-SemiBold',
  },
};

// Tab navigator component
function TabNavigator() {
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
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        animationEnabled: false,
        tabBarStyle: {
          height: 60,
        },
        tabBarLabelStyle: {
          // color: '#fff',
          fontFamily: 'Geist-SemiBold',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
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

export default function App() {
  const fontsLoaded = useFonts();

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
              options={{
                title: 'Stream',
                ...commonHeaderOptions,
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="light" />
      </SafeAreaProvider>
    </GluestackUIProvider>
  );
}
