import { useState, useEffect, useRef, useCallback } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import {
  Camera,
  runAsync,
  runAtTargetFps,
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
import DirectionalArrow from '@/src/components/DirectionalArrow';
import { convertFrameToBase64 } from '@/src/utils/convertFrameToBase64';
import { playAudio, unloadSounds } from '@/src/utils/audioPlayer';
import { useWebSocket } from '@/src/hooks/useWebSocket';
import { useServerIP } from '@/src/hooks/useServerIP';
import { useAccessibility } from '@/src/hooks/useAccessibility';
import { getColors } from '@/src/theme/colors';
import AccessibleButton from '@/src/components/AccessibleButton';

const StreamScreen = ({ navigation }) => {
  const [instruction, setInstruction] = useState(null);
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
        setInstruction(response.data);

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

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';

    runAtTargetFps(10, () => {
      'worklet';

      const imageAsBase64 = convertFrameToBase64(frame);

      if (imageAsBase64) {
        onConversion(imageAsBase64);
      }
    });
  });

  useFocusEffect(
    useCallback(() => {
      setEnabled(true);
      return () => setEnabled(false);
    }, [setEnabled])
  );

  // Add accessibility context
  const { highContrast, fontSize } = useAccessibility();
  const colors = getColors(highContrast);

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
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={StyleSheet.absoluteFill}>
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
        <View style={styles.overlayContainer}>
          <DirectionalArrow direction={instruction} />
          <View
            style={[
              styles.instructionsContainer,
              {
                backgroundColor: highContrast
                  ? 'rgba(0, 0, 0, 0.9)'
                  : 'rgba(255, 255, 255, 0.9)',
              },
            ]}
          >
            <Text
              style={[
                styles.instruction,
                {
                  color: highContrast ? colors.text.light : colors.text.dark900,
                },
              ]}
            >
              Current Instruction: {instruction || 'Waiting...'}
            </Text>
          </View>
        </View>
      </View>

      <ErrorPopup
        isVisible={isErrorVisible}
        error={error}
        onRetry={retry}
        onSettings={() => navigation.navigate('Settings')}
        onClose={() => setIsErrorVisible(false)}
      />

      {/* <AccessibleButton
        size="lg"
        variant="solid"
        action="primary"
        onPress={requestPermission}
        isDisabled={!hasPermission}
        style={{ backgroundColor: colors.primary }}
      >
        <ButtonText style={{ color: colors.text.light }}>
          Grant Permission
        </ButtonText>
      </AccessibleButton> */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
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
    padding: 15,
    borderRadius: 10,
    elevation: 3,
    zIndex: 2,
  },
  instruction: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: 'Geist-Regular',
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
