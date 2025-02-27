import React, { useState, useEffect, useRef } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraFormat,
  useCameraPermission,
  useFrameProcessor,
} from 'react-native-vision-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Worklets } from 'react-native-worklets-core';
import { Button, ButtonText } from '@/src/components/ui/button';
import { VStack } from '@/src/components/ui/vstack';
import { Accelerometer } from 'expo-sensors';
import { useFocusEffect } from '@react-navigation/native';

import ErrorPopup from '@/src/components/ErrorPopup';
import NoServerIP from '@/src/components/NoServerIP';
import { convertFrameToBase64 } from '@/src/utils/convertFrameToBase64';
import { playAudio, unloadSounds } from '@/src/utils/audioPlayer';
import { useWebSocket } from '@/src/hooks/useWebSocket';
import { useServerIP } from '@/src/hooks/useServerIP';

const StreamScreen = ({ navigation }) => {
  const [instructions, setInstructions] = useState(null);
  const [isErrorVisible, setIsErrorVisible] = useState(false);
  const processingRef = useRef(false);
  const cameraRef = useRef(null);
  const mountedAtRef = useRef(0);

  const lastInstructionTimeRef = useRef(0);
  const lastContinueForwardAudioTimeRef = useRef(0);
  const lastContinueLeftAudioTimeRef = useRef(0);
  const lastContinueRightAudioTimeRef = useRef(0);

  const { serverIP, error: ipError } = useServerIP(navigation);
  const {
    status,
    error: wsError,
    retry,
    send,
    setEnabled,
  } = useWebSocket(serverIP, {
    onMessage: (response) => {
      if (response.type === 'success' && response.data.length > 0) {
        const now = Date.now();
        if (response.data === 'continue_forward') {
          if (now - lastContinueForwardAudioTimeRef.current < 2000) {
            console.log(
              'Skipping audio playback for "continue_forward" (played less than 2 seconds ago)'
            );
            processingRef.current = false;
            return;
          }

          lastContinueForwardAudioTimeRef.current = now;
        } else if (response.data === 'continue_left') {
          if (now - lastContinueLeftAudioTimeRef.current < 1000) {
            console.log(
              'Skipping audio playback for "continue_left" (played less than 1 second ago)'
            );
            processingRef.current = false;
            return;
          }

          lastContinueLeftAudioTimeRef.current = now;
        } else if (response.data === 'continue_right') {
          if (now - lastContinueRightAudioTimeRef.current < 1000) {
            console.log(
              'Skipping audio playback for "continue_right" (played less than 1 second ago)'
            );
            processingRef.current = false;
            return;
          }

          lastContinueRightAudioTimeRef.current = now;
        }

        if (now - lastInstructionTimeRef.current < 500) {
          console.log(
            'Skipping audio playback for "continue_forward" (played less than 500ms ago)'
          );
          processingRef.current = false;
          return;
        }

        console.log('Instruction  received:', response.data);
        playAudio(response.data);

        lastInstructionTimeRef.current = now;
      }
      processingRef.current = false;
    },
    enabled: false,
  });

  const error = ipError || wsError;

  useEffect(() => {
    if (error) {
      setIsErrorVisible(true);
    }
  }, [error]);

  useEffect(() => {
    return () => {
      unloadSounds();
    };
  }, []);

  useEffect(() => {
    mountedAtRef.current = Date.now();
  }, []);

  useEffect(() => {
    let lastUpdate = 0;
    let lastX = 0;
    let lastY = 0;
    let lastZ = 0;
    const shakeThreshold = 200;

    const subscription = Accelerometer.addListener((accelerometerData) => {
      if (Date.now() - mountedAtRef.current < 3000) return;

      const { x, y, z } = accelerometerData;
      const currentTime = Date.now();

      if (currentTime - lastUpdate > 100) {
        const diffTime = currentTime - lastUpdate;
        lastUpdate = currentTime;

        const speed =
          (Math.abs(x + y + z - lastX - lastY - lastZ) / diffTime) * 10000;

        if (speed > shakeThreshold) {
          navigation.navigate('TabNavigator', { screen: 'Home' });
        }

        lastX = x;
        lastY = y;
        lastZ = z;
      }
    });

    Accelerometer.setUpdateInterval(100);
    return () => subscription.remove();
  }, [navigation]);

  const device = useCameraDevice('back', {
    physicalDevices: ['ultra-wide-angle-camera', 'wide-angle-camera'],
  });

  const format = useCameraFormat(device, [
    { videoResolution: { width: 1280, height: 720 } },
    { photoResolution: { width: 1280, height: 720 } },
    { fps: 30 },
  ]);

  const { hasPermission, requestPermission } = useCameraPermission();

  const onConversion = Worklets.createRunOnJS((imageAsBase64) => {
    if (!processingRef.current) {
      processingRef.current = true;
      const success = send({
        type: 'frame',
        data: `data:image/jpeg;base64,${imageAsBase64}`,
        timestamp: Date.now(),
      });

      if (!success) {
        processingRef.current = false;
      }
    }
  });

  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';
      const imageAsBase64 = convertFrameToBase64(frame);
      if (imageAsBase64) {
        onConversion(imageAsBase64);
      }
    },
    [onConversion]
  );

  useFocusEffect(
    React.useCallback(() => {
      setEnabled(true);
      return () => setEnabled(false);
    }, [setEnabled])
  );

  if (!serverIP) {
    return (
      <NoServerIP onNavigateSettings={() => navigation.navigate('Settings')} />
    );
  }

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <VStack space="md" alignItems="center">
          <Text style={styles.message}>Camera permissions required</Text>
          <Button
            size="lg"
            variant="solid"
            action="primary"
            onPress={requestPermission}
          >
            <ButtonText>Grant Permission</ButtonText>
          </Button>
        </VStack>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        format={format}
        isActive={!error}
        frameProcessor={frameProcessor}
        enableZoomGesture={true}
        onError={(error) => console.error('Camera error:', error)}
        androidPreviewViewType="surface-view"
      />

      {instructions && (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructions}>
            {instructions.map(
              (instruction, index) =>
                `${index + 1}. ${instruction.instruction_type}: ${
                  instruction.direction
                } (${instruction.danger} danger)\n`
            )}
          </Text>
        </View>
      )}

      <ErrorPopup
        isVisible={isErrorVisible}
        error={error}
        onRetry={retry}
        onSettings={() => navigation.navigate('Settings')}
        onClose={() => setIsErrorVisible(false)}
      />
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
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Geist-Regular',
  },
  status: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    zIndex: 1,
  },
  statusConnected: {
    color: '#4CAF50',
  },
  statusError: {
    color: '#f44336',
  },
  instructionsContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 10,
    elevation: 3,
  },
  instructions: {
    fontSize: 14,
    lineHeight: 20,
  },
  errorContainer: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    alignItems: 'center',
  },
  errorText: {
    color: '#f44336',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default StreamScreen;
