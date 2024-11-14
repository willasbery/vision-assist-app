import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen = ({ navigation }) => {
  const [serverIP, setServerIP] = useState('');

  useEffect(() => {
    loadServerIP();
  }, []);

  const loadServerIP = async () => {
    try {
      const ip = await AsyncStorage.getItem('serverIP');
      if (ip) {
        setServerIP(ip);
      }
    } catch (error) {
      console.error('Error loading server IP:', error);
    }
  };

  const saveServerIP = async () => {
    if (!serverIP) {
      Alert.alert('Error', 'Please enter a server IP address');
      return;
    }

    try {
      await AsyncStorage.setItem('serverIP', serverIP);
      Alert.alert('Success', 'Server IP saved successfully', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error saving server IP:', error);
      Alert.alert('Error', 'Failed to save server IP');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Server IP Address:</Text>
        <TextInput
          style={styles.input}
          value={serverIP}
          onChangeText={setServerIP}
          placeholder="Enter server IP (e.g., 192.168.1.100)"
          keyboardType="numeric"
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={saveServerIP}
      >
        <Text style={styles.buttonText}>Save Settings</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  status: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  settingsButton: {
    padding: 10,
  },
  buttonContainer: {
    gap: 15,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  previewContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  previewText: {
    fontSize: 16,
    marginBottom: 10,
    color: '#666',
  },
  preview: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
  },
  inputContainer: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
});

export default SettingsScreen;