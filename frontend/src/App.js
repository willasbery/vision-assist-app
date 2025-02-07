import { NavigationContainer } from '@react-navigation/native';
import "@/global.css";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from '@/HomeScreen';
import SettingsScreen from '@/SettingsScreen';
import StreamScreen from '@/StreamScreen';


const Stack = createNativeStackNavigator();

// Common header options to avoid repetition
const commonHeaderOptions = {
  headerStyle: {
    backgroundColor: '#2196F3',
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
      title: 'Image Uploader',
      ...commonHeaderOptions,
    },
  },
  {
    name: 'Settings',
    component: SettingsScreen,
    options: {
      title: 'Connection Settings',
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
  return (
    <GluestackUIProvider mode="light"><SafeAreaProvider>
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
      </SafeAreaProvider></GluestackUIProvider>
  );
}