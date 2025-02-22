import AsyncStorage from '@react-native-async-storage/async-storage';

export const loadServerIP = async () => {
  try {
    const ip = await AsyncStorage.getItem('serverIP');
    return ip || null;
  } catch (error) {
    console.error('Error loading server IP:', error);
    return null;
  }
};

export const saveServerIP = async (serverIP) => {
  if (!serverIP) {
    throw new Error('Please enter a server IP address');
  }

  try {
    await AsyncStorage.setItem('serverIP', serverIP);
    return true;
  } catch (error) {
    console.error('Error saving server IP:', error);
    throw new Error('Failed to save server IP');
  }
};
