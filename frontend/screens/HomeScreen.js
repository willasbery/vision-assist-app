import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// Only import Camera if you need it for takePicture
import { Camera } from 'expo-camera';

const HomeScreen = ({ navigation }) => {
  const [status, setStatus] = useState('Disconnected');
  const [lastImage, setLastImage] = useState(null);
  const [serverIP, setServerIP] = useState(null);
  const [loading, setLoading] = useState(false);
  const ws = useRef(null);

  useEffect(() => {
    loadServerIP();
    const unsubscribe = navigation.addListener('focus', () => {
      loadServerIP();
    });

    return () => {
      unsubscribe();
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [navigation]);

  useEffect(() => {
    if (serverIP) {
      connectWebSocket();
    }
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [serverIP]);

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

  const connectWebSocket = () => {
    const wsUrl = `ws://${serverIP}:8000/ws`;
    console.log('Connecting to:', wsUrl);
    
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('WebSocket Connected');
      setStatus('Connected');
    };

    ws.current.onclose = (e) => {
      console.log('WebSocket Disconnected:', e.code, e.reason);
      setStatus('Disconnected');
      setTimeout(connectWebSocket, 3000);
    };

    ws.current.onmessage = (event) => {
      try {
        const response = JSON.parse(event.data);
        if (response.type === 'confirmation') {
          setLastImage(`http://${serverIP}:8000${response.url}`);
        } else if (response.type === 'error') {
          Alert.alert('Error', response.message);
        }
      } catch (e) {
        console.log('Received message:', event.data);
      }
      setLoading(false);
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      setStatus('Error');
      Alert.alert('Connection Error', 'Failed to connect to server');
      setLoading(false);
    };
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photo library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setLoading(true);
        setStatus('Sending image...');
        const base64Image = result.assets[0].base64;
        sendImage(base64Image);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
      console.error(error);
      setLoading(false);
    }
  };

  const takePicture = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your camera');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setLoading(true);
        setStatus('Sending image...');
        const base64Image = result.assets[0].base64;
        sendImage(base64Image);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take picture');
      console.error(error);
      setLoading(false);
    }
  };

  const sendImage = (base64Image) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      const message = {
        type: 'image',
        data: `data:image/jpeg;base64,${base64Image}`,
      };
      ws.current.send(JSON.stringify(message));
    } else {
      Alert.alert('Error', 'WebSocket is not connected');
      setStatus('Disconnected - Retrying...');
      setLoading(false);
      connectWebSocket();
    }
  };

  if (!serverIP) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Please configure server IP in settings</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.buttonText}>Go to Settings</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[
            styles.status,
            { color: status === 'Connected' ? 'green' : status === 'Error' ? 'red' : 'orange' }
          ]}>
            Status: {status}
          </Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Ionicons name="settings-outline" size={24} color="#2196F3" />
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.button}
            onPress={pickImage}
            disabled={loading}
          >
            <Ionicons name="images-outline" size={24} color="white" />
            <Text style={styles.buttonText}>Pick from Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={takePicture}
            disabled={loading}
          >
            <Ionicons name="camera-outline" size={24} color="white" />
            <Text style={styles.buttonText}>Take Picture</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Stream')}
            disabled={loading}
          >
            <Ionicons name="videocam-outline" size={24} color="white" />
            <Text style={styles.buttonText}>Stream Video</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>Sending image...</Text>
          </View>
        )}

        {lastImage && (
          <View style={styles.previewContainer}>
            <Text style={styles.previewText}>Last Sent Image:</Text>
            <Image
              source={{ uri: lastImage }}
              style={styles.preview}
              resizeMode="contain"
            />
          </View>
        )}
      </ScrollView>
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
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
    backgroundColor: 'black',
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    padding: 20,
  },
  streamButton: {
    alignItems: 'center',
    marginBottom: 30,
  },
  streamButtonText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  buttonStreaming: {
    backgroundColor: '#ff4444',
  },
});

export default HomeScreen;