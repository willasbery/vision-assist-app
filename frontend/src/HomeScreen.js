import React, { useState, useEffect } from 'react';
import { Text, Image, StyleSheet, ScrollView, Vibration } from 'react-native';
import { Center } from '@/src/components/ui/center';
import { Button, ButtonText, ButtonIcon } from '@/src/components/ui/button';
import { Box } from '@/src/components/ui/box';
import { VStack } from '@/src/components/ui/vstack';
import { Spinner } from '@/src/components/ui/spinner';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Camera } from 'expo-camera';
import { Accelerometer } from 'expo-sensors';
import { useFocusEffect } from '@react-navigation/native';

import ErrorPopup from '@/src/components/ErrorPopup';
import { useWebSocket } from '@/src/hooks/useWebSocket';
import { useServerIP } from '@/src/hooks/useServerIP';
import NoServerIP from '@/src/components/NoServerIP';

const HomeScreen = ({ navigation }) => {
  const [lastImage, setLastImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isErrorVisible, setIsErrorVisible] = useState(false);
  const [customError, setCustomError] = useState(null);

  const [developmentMode, setDevelopmentMode] = useState(false);

  const { serverIP, error: ipError } = useServerIP(navigation);
  const {
    status,
    error: wsError,
    retry,
    send,
    setEnabled,
  } = useWebSocket(serverIP, {
    onMessage: (response) => {
      if (response.type === 'confirmation') {
        setLastImage(`http://${serverIP}:8000${response.url}`);
      }
      setLoading(false);
    },
    enabled: false,
  });

  useFocusEffect(
    React.useCallback(() => {
      const loadDevelopmentMode = async () => {
        const devMode = await AsyncStorage.getItem('developmentMode');
        console.log('devMode', devMode);
        if (devMode !== null) setDevelopmentMode(devMode === 'true');
      };

      setEnabled(true);
      loadDevelopmentMode();

      return () => setEnabled(false);
    }, [setEnabled])
  );

  const displayedError = customError || ipError || wsError;

  useEffect(() => {
    if (displayedError) {
      setIsErrorVisible(true);
    }
  }, [displayedError]);

  useEffect(() => {
    let lastUpdate = 0;
    let lastX = 0;
    let lastY = 0;
    let lastZ = 0;
    const shakeThreshold = 200;

    const subscription = Accelerometer.addListener((accelerometerData) => {
      const { x, y, z } = accelerometerData;
      const currentTime = Date.now();

      if (currentTime - lastUpdate > 100) {
        const diffTime = currentTime - lastUpdate;
        lastUpdate = currentTime;

        const speed =
          (Math.abs(x + y + z - lastX - lastY - lastZ) / diffTime) * 10000;

        if (speed > shakeThreshold) {
          Vibration.vibrate([400, 400]);
          navigation.navigate('Stream');
        }

        lastX = x;
        lastY = y;
        lastZ = z;
      }
    });

    Accelerometer.setUpdateInterval(100);

    return () => {
      subscription.remove();
    };
  }, [navigation]);

  const handleImageSelection = async (useCamera = false) => {
    try {
      const permissionResult = useCamera
        ? await Camera.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        setCustomError(
          `Please allow access to your ${
            useCamera ? 'camera' : 'photo library'
          }`
        );
        return;
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            quality: 0.8,
            base64: true,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8,
            base64: true,
          });

      if (!result.canceled && result.assets && result.assets[0]) {
        setLoading(true);
        setCustomError(null);
        sendImage(result.assets[0].base64);
      }
    } catch (error) {
      setCustomError(`Failed to ${useCamera ? 'take picture' : 'pick image'}`);
      console.error(error);
      setLoading(false);
    }
  };

  const sendImage = (base64Image) => {
    const success = send({
      type: 'image',
      data: `data:image/jpeg;base64,${base64Image}`,
    });

    if (!success) {
      setCustomError('Failed to send image. Please check your connection.');
      setLoading(false);
    }
  };

  const handleRetry = () => {
    retry();
    setCustomError(null);
    // setIsErrorVisible(false);
  };

  if (!serverIP) {
    return (
      <NoServerIP onNavigateSettings={() => navigation.navigate('Settings')} />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Box className="px-4 py-10 gap-y-10">
          <VStack
            mb="$10"
            mt="$10"
            className="gap-y-2"
            justifyContent="space-between"
            alignItems="center"
          >
            <Text
              className="text-5xl font-semibold text-blue-500"
              style={{ fontFamily: 'Geist-SemiBold' }}
            >
              Vision Assist
            </Text>
            <Text
              style={[
                styles.status,
                status.includes('Connected') && styles.statusConnected,
                status.includes('Reconnecting') && styles.statusReconnecting,
                status.includes('Disconnected') && styles.statusDisconnected,
                { fontFamily: 'Geist-Regular' },
              ]}
            >
              Status: {status}
            </Text>
          </VStack>

          {developmentMode ? (
            <>
              <VStack
                space="xl"
                mb="$5"
                p="$5"
                flexDirection="column"
                justifyContent="space-between"
              >
                <Button
                  className="bg-blue-500 items-center"
                  size="xl"
                  variant="solid"
                  action="primary"
                  onPress={() => handleImageSelection(false)}
                  disabled={loading}
                >
                  <ButtonIcon
                    as={Ionicons}
                    name="images-outline"
                    size={16}
                    style={{ marginRight: 10 }}
                  />
                  <ButtonText style={{ fontFamily: 'Geist-Regular' }}>
                    Pick from Gallery
                  </ButtonText>
                </Button>

                <Button
                  className="bg-blue-500 items-center"
                  size="xl"
                  variant="solid"
                  action="primary"
                  onPress={() => handleImageSelection(true)}
                  disabled={loading}
                >
                  <ButtonIcon
                    as={Ionicons}
                    name="camera-outline"
                    size={16}
                    style={{ marginRight: 10 }}
                  />
                  <ButtonText style={{ fontFamily: 'Geist-Regular' }}>
                    Take Picture
                  </ButtonText>
                </Button>

                <Button
                  className="bg-blue-500 items-center"
                  size="xl"
                  variant="solid"
                  action="primary"
                  onPress={() => navigation.navigate('Stream')}
                  disabled={loading}
                >
                  <ButtonIcon
                    as={Ionicons}
                    name="videocam-outline"
                    size={16}
                    style={{ marginRight: 10 }}
                  />
                  <ButtonText style={{ fontFamily: 'Geist-Regular' }}>
                    Stream Video
                  </ButtonText>
                </Button>
                <Button
                  className="bg-blue-500 items-center"
                  size="xl"
                  variant="solid"
                  action="primary"
                  onPress={() => navigation.navigate('Testing')}
                >
                  <ButtonText style={{ fontFamily: 'Geist-Regular' }}>
                    Testing
                  </ButtonText>
                </Button>
              </VStack>

              {loading && (
                <Center my="$5">
                  <Spinner size="large" />
                  <Text style={styles.message} mt="$2">
                    Sending image...
                  </Text>
                </Center>
              )}

              <ErrorPopup
                isVisible={isErrorVisible}
                error={displayedError}
                onRetry={handleRetry}
                onSettings={() => navigation.navigate('Settings')}
                onClose={() => setIsErrorVisible(false)}
              />

              {lastImage && (
                <Box mt="$5" alignItems="center">
                  <Text style={styles.message} mb="$2">
                    Last Sent Image:
                  </Text>
                  <Image
                    source={{ uri: lastImage }}
                    alt="Last sent image"
                    style={styles.image}
                  />
                </Box>
              )}
            </>
          ) : (
            <VStack>
              <Button
                className="bg-blue-500 items-center h-32"
                size="xl"
                variant="solid"
                action="primary"
                onPress={() => navigation.navigate('Stream')}
                disabled={loading}
              >
                <ButtonIcon
                  as={Ionicons}
                  name="videocam-outline"
                  size={32}
                  style={{
                    marginRight: 10,
                    color: 'white',
                  }}
                />
                <ButtonText
                  style={{ fontFamily: 'Geist-Regular', fontSize: 24 }}
                >
                  Start Processing
                </ButtonText>
              </Button>
            </VStack>
          )}
        </Box>
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
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    fontFamily: 'Geist-Regular',
  },
  status: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Geist-Regular',
  },
  statusConnected: {
    color: '#4CAF50',
  },
  statusDisconnected: {
    color: '#f44336',
  },
  statusError: {
    color: '#f44336',
  },
  errorText: {
    color: '#f44336',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: 'Geist-Regular',
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    resizeMode: 'contain',
  },
});

export default HomeScreen;
