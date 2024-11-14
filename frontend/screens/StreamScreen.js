import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Camera, runAtTargetFps, useCameraDevice, useCameraFormat, useCameraPermission, useFrameProcessor } from 'react-native-vision-camera';

import { convertFrameToBase64 } from './convertFrameToBase64';
import { Worklets } from 'react-native-worklets-core';

const StreamScreen = ({ navigation }) => {
  const [status, setStatus] = useState('Connecting...');
  const [serverIP, setServerIP] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastImage, setLastImage] = useState(null);
  const ws = useRef(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const streamInterval = useRef(null);
  const cameraRef = useRef(null);

  const device = useCameraDevice('back');
  const { hasPermission, requestPermission }= useCameraPermission();

  const format = useCameraFormat(device, [
    { videoResolution: { width: 1280, height: 720 } },
    { photoResolution: { width: 1280, height: 720 } },
    { fps: 30 },
  ])

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

  useEffect(() => {
    return () => {
      if (streamInterval.current) {
        clearInterval(streamInterval.current);
      }
    };
  }, []);

  // const startStream = async () => {
  //   if (!device || !cameraRef.current) return;
    
  //   setIsStreaming(true);
    
  //   streamInterval.current = setInterval(async () => {
  //     try {
  //       if (cameraRef.current && ws.current?.readyState === WebSocket.OPEN) {
  //         const photo = await cameraRef.current.takePhoto({
  //           qualityPrioritization: 'quality',
  //           flash: 'off',
  //           enableShutterSound: false,
  //         });

  //         // const photo = await cameraRef.current.takeSnapshot({
  //         //   quality: 100,
  //         // });
          
  //         // Read the photo file and convert to base64
  //         const response = await fetch(`file://${photo.path}`);
  //         const blob = await response.blob();
  //         const reader = new FileReader();
          
  //         reader.onload = () => {
  //           const base64data = reader.result.split(',')[1];
  //           ws.current.send(JSON.stringify({
  //             type: 'frame',
  //             data: `data:image/jpeg;base64,${base64data}`,
  //             timestamp: Date.now(),
  //           }));
  //         };
          
  //         reader.readAsDataURL(blob);
  //       }
  //     } catch (error) {
  //       console.error('Error capturing frame:', error);
  //     }
  //   }, 1000);
  // };

  // const stopStream = () => {
  //   if (streamInterval.current) {
  //     clearInterval(streamInterval.current);
  //     streamInterval.current = null;
  //   }
  //   setIsStreaming(false);
  // };

  const onConversion = Worklets.createRunOnJS((imageAsBase64) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      console.log('Sending frame to server');
      ws.current.send(JSON.stringify({
        type: 'frame',
        data: `data:image/jpeg;base64,${imageAsBase64}`,
        timestamp: Date.now(),
      }));
    }
  })

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';

    runAtTargetFps(2, () => {
      const imageAsBase64 = convertFrameToBase64(frame);

      if (imageAsBase64 === null) {
        return;
      }
      onConversion(imageAsBase64);
    });
  }, [onConversion]);


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
        if (response.type === 'processed_frame') {
          setLastImage(response.data); // Use base64 data directly
        } else if (response.type === 'error') {
          Alert.alert('Error', response.message);
        }
      } catch (e) {
        console.error('Message parsing error:', e);
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

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Camera permissions required</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={requestPermission}
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.status}>{status}</Text>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        format={format}
        isActive={true}
        // photo={true}
        // photoQualityBalance={'quality'}
        // enableZoomGesture
        frameProcessor={frameProcessor}
        fps={30}
        // fps={[5, 10]}
      />
      {/* <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, isStreaming && styles.streamingButton]}
          // onPress={isStreaming ? stopStream : startStream}
        >
          <Text style={styles.buttonText}>
            {isStreaming ? 'Stop Streaming' : 'Start Streaming'}
          </Text>
        </TouchableOpacity>
      </View> */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#2196F3',
    borderRadius: 10,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  status: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

export default StreamScreen;