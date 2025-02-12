import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Center } from "@/components/ui/center"
import {
  Button,
  ButtonText,
  ButtonIcon
} from "@/components/ui/button";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Spinner } from "@/components/ui/spinner";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Camera } from "expo-camera";

import WebSocketManager from "@/src/common/websockets";
import { loadServerIP } from "@/src/common/serverManager";

const HomeScreen = ({ navigation }) => {
  const [status, setStatus] = useState("Disconnected");
  const [lastImage, setLastImage] = useState(null);
  const [serverIP, setServerIP] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const wsManager = useRef(null);

  useEffect(() => {
    loadInitialIP();
    return () => {
      wsManager.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadInitialIP);
    return unsubscribe;
  }, [navigation]);

  const loadInitialIP = async () => {
    try {
      const ip = await loadServerIP();
      if (ip) {
        setServerIP(ip);
        setError(null);
      }
    } catch (error) {
      console.error("Error loading server IP:", error);
    }
  };

  useEffect(() => {
    if (!serverIP) {
      setStatus("No server IP configured");
      return;
    }

    wsManager.current = new WebSocketManager(serverIP, {
      onStatusChange: (newStatus) => {
        setStatus(newStatus);
        if (newStatus === "Connected") {
          setError(null);
        }
      },
      onMessage: (response) => {
        if (response.type === "confirmation") {
          setLastImage(`http://${serverIP}:8000${response.url}`);
          setError(null);
        } else if (response.type === "error") {
          setError(response.message);
        }
        setLoading(false);
      },
      onError: (error) => {
        setError("Connection failed. Please check your settings or retry.");
        setLoading(false);
      },
      maxReconnectAttempts: 3,
    });
    
    wsManager.current.connect();
    return () => wsManager.current?.disconnect();
  }, [serverIP]);

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
    const success = wsManager.current?.send({
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
    setError(null);
    wsManager.current?.retry();
  };

  if (!serverIP) {
    return (
      <SafeAreaView style={styles.container}>
        <Center flex={1}>
          <Text style={styles.message}>Please configure server IP in settings</Text>
          <Button
            size="lg"
            variant="solid"
            action="primary"
            mt="$4"
            onPress={() => navigation.navigate("Settings")}
          >
            <ButtonText>Go to Settings</ButtonText>
          </Button>
        </Center>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Box p="$5">
          <HStack justifyContent="space-between" alignItems="center" mb="$5">
            <Text
              style={[
                styles.status,
                status === "Connected" && styles.statusConnected,
                status.includes("Error") && styles.statusError
              ]}
            >
              Status: {status}
            </Text>
            <Button
              variant="link"
              onPress={() => navigation.navigate("Settings")}
            >
              <ButtonIcon as={Ionicons} name="settings-outline" size="xl" />
            </Button>
          </HStack>

          <VStack space="md" mb="$5">
            <Button
              size="lg"
              variant="solid"
              action="primary"
              onPress={() => handleImageSelection(false)}
              disabled={loading}
            >
              <ButtonIcon as={Ionicons} name="images-outline" mr="$2" />
              <ButtonText>Pick from Gallery</ButtonText>
            </Button>

            <Button
              size="lg"
              variant="solid"
              action="primary"
              onPress={() => handleImageSelection(true)}
              disabled={loading}
            >
              <ButtonIcon as={Ionicons} name="camera-outline" mr="$2" />
              <ButtonText>Take Picture</ButtonText>
            </Button>

            <Button
              size="lg"
              variant="solid"
              action="primary"
              onPress={() => navigation.navigate("Stream")}
              disabled={loading}
            >
              <ButtonIcon as={Ionicons} name="videocam-outline" mr="$2" />
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

          {error && (
            <Box my="$5" p="$4" bg="$errorLight100" borderRadius="$lg">
              <Text style={styles.errorText}>{error}</Text>
              <VStack space="sm" mt="$4">
                <Button
                  size="md"
                  variant="solid"
                  action="primary"
                  onPress={handleRetry}
                >
                  <ButtonText>Retry Connection</ButtonText>
                </Button>
                <Button
                  size="md"
                  variant="outline"
                  action="secondary"
                  onPress={() => navigation.navigate("Settings")}
                >
                  <ButtonText>Go to Settings</ButtonText>
                </Button>
              </VStack>
            </Box>
          )}

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
