import React, { useState, useEffect } from "react";
import {
  Text,
  Image,
  StyleSheet,
  ScrollView
} from "react-native";
import { Center } from "@/src/components/ui/center"
import {
  Button,
  ButtonText,
  ButtonIcon
} from "@/src/components/ui/button";
import { Box } from "@/src/components/ui/box";
import { VStack } from "@/src/components/ui/vstack";
import { HStack } from "@/src/components/ui/hstack";
import { Spinner } from "@/src/components/ui/spinner";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Camera } from "expo-camera";
import { Accelerometer } from 'expo-sensors';

import ErrorPopup from '@/src/components/ErrorPopup';
import { useWebSocket } from '@/src/hooks/useWebSocket';
import { useServerIP } from '@/src/hooks/useServerIP';
import NoServerIP from '@/src/components/NoServerIP';

const HomeScreen = ({ navigation }) => {
  const [lastImage, setLastImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isErrorVisible, setIsErrorVisible] = useState(false);

  const { serverIP, error: ipError } = useServerIP(navigation);
  const { status, error: wsError, retry, send } = useWebSocket(serverIP, {
    onMessage: (response) => {
      if (response.type === "confirmation") {
        setLastImage(`http://${serverIP}:8000${response.url}`);
      }
      setLoading(false);
    }
  });

  const error = ipError || wsError;

  useEffect(() => {
    if (error) {
      setIsErrorVisible(true);
    }
  }, [error]);

  useEffect(() => {
    let lastUpdate = 0;
    let lastX = 0;
    let lastY = 0;
    let lastZ = 0;
    const shakeThreshold = 200; // Adjust this value to change sensitivity

    const subscription = Accelerometer.addListener(accelerometerData => {
      const { x, y, z } = accelerometerData;
      const currentTime = Date.now();

      if ((currentTime - lastUpdate) > 100) { // Limit updates to 100ms intervals
        const diffTime = currentTime - lastUpdate;
        lastUpdate = currentTime;

        const speed = Math.abs(x + y + z - lastX - lastY - lastZ) / diffTime * 10000;

        if (speed > shakeThreshold) {
          navigation.navigate("Stream");
        }

        lastX = x;
        lastY = y;
        lastZ = z;
      }
    });

    // Start the accelerometer
    Accelerometer.setUpdateInterval(100);

    // Cleanup subscription on unmount
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
        setError(`Please allow access to your ${useCamera ? 'camera' : 'photo library'}`);
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

      if (!result.canceled && result.assets[0]) {
        setLoading(true);
        setError(null);
        setStatus("Sending image...");
        sendImage(result.assets[0].base64);
      }
    } catch (error) {
      setError(`Failed to ${useCamera ? 'take picture' : 'pick image'}`);
      console.error(error);
      setLoading(false);
    }
  };

  const sendImage = (base64Image) => {
    const success = send({
      type: "image",
      data: `data:image/jpeg;base64,${base64Image}`,
    });

    if (!success) {
      setError("Failed to send image. Please check your connection.");
      setStatus("Disconnected");
      setLoading(false);
    }
  };

  const handleRetry = () => {
    retry();
  };

  if (!serverIP) {
    return <NoServerIP onNavigateSettings={() => navigation.navigate("Settings")} />;
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
              className="text-4xl font-bold"
            >
              Vision Assist
            </Text>
            <Text
              style={[
                styles.status,
                status === "Connected" && styles.statusConnected,
                status.includes("Error") && styles.statusError
              ]}
            >
              Status: {status}
            </Text>
            {/* <Button
              size="lg"
              variant="solid"
              action="primary"
              className="bg-blue-500"
              onPress={() => navigation.navigate("Settings")}
              leftIcon={<Ionicons name="settings-outline" size={24} color="white" />}
            >
              <ButtonText>Settings</ButtonText>
            </Button> */}
          </VStack>

          <VStack space="xl" mb="$5" p="$5" flexDirection="column" justifyContent="space-between">
            <Button
              className="bg-blue-500 items-center"
              size="xl"
              variant="solid"
              action="primary"
              onPress={() => handleImageSelection(false)}
              disabled={loading}
            >
              <ButtonIcon as={Ionicons} name="images-outline" size={16} style={{ marginRight: 10 }} />
              <ButtonText>Pick from Gallery</ButtonText>
            </Button>

            <Button
              className="bg-blue-500 items-center"
              size="xl"
              variant="solid"
              action="primary"
              onPress={() => handleImageSelection(true)}
              disabled={loading}
            >
              <ButtonIcon as={Ionicons} name="camera-outline" size={16} style={{ marginRight: 10 }} />
              <ButtonText>Take Picture</ButtonText>
            </Button>

            <Button
              className="bg-blue-500 items-center"
              size="xl"
              variant="solid"
              action="primary"
              onPress={() => navigation.navigate("Stream")}
              disabled={loading}
            >
              <ButtonIcon as={Ionicons} name="videocam-outline" size={16} style={{ marginRight: 10 }} />
              <ButtonText>Stream Video</ButtonText>
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
            error={error}
            onRetry={handleRetry}
            onSettings={() => navigation.navigate("Settings")}
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
        </Box>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
  },
  status: {
    fontSize: 16,
    fontWeight: "bold",
  },
  statusConnected: {
    color: "#4CAF50",
  },
  statusError: {
    color: "#f44336",
  },
  errorText: {
    color: "#f44336",
    fontSize: 16,
    textAlign: "center",
  },
  image: {
    width: "100%",
    height: 300,
    borderRadius: 10,
    backgroundColor: "#f5f5f5",
    resizeMode: "contain",
  },
});

export default HomeScreen;