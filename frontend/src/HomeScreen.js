import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Camera } from "expo-camera";

import WebSocketManager from "@/src/common/websockets";


const HomeScreen = ({ navigation }) => {
  const [status, setStatus] = useState("Disconnected");
  const [lastImage, setLastImage] = useState(null);
  const [serverIP, setServerIP] = useState(null);
  const [loading, setLoading] = useState(false);
  const wsManager = useRef(null);

  useEffect(() => {
    loadServerIP();
    const unsubscribe = navigation.addListener("focus", () => {
      loadServerIP();
    });

    return () => {
      unsubscribe();
      wsManager.current?.disconnect();
    };
  }, [navigation]);

  useEffect(() => {
    if (serverIP) {
      wsManager.current = new WebSocketManager(serverIP, {
        onStatusChange: setStatus,
        onMessage: (response) => {
          if (response.type === "confirmation") {
            setLastImage(`http://${serverIP}:8000${response.url}`);
          } else if (response.type === "error") {
            Alert.alert("Error", response.message);
          }
          setLoading(false);
        },
        onError: (error) => {
          Alert.alert("Connection Error", "Failed to connect to server");
          setLoading(false);
        }
      });
      wsManager.current.connect();
    }
    return () => {
      wsManager.current?.disconnect();
    };
  }, [serverIP]);

  const loadServerIP = async () => {
    try {
      const ip = await AsyncStorage.getItem("serverIP");
      if (ip) {
        setServerIP(ip);
      }
    } catch (error) {
      console.error("Error loading server IP:", error);
    }
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert("Permission Required", "Please allow access to your photo library");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setLoading(true);
        setStatus("Sending image...");
        const base64Image = result.assets[0].base64;
        sendImage(base64Image);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
      console.error(error);
      setLoading(false);
    }
  };

  const takePicture = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please allow access to your camera");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setLoading(true);
        setStatus("Sending image...");
        const base64Image = result.assets[0].base64;
        sendImage(base64Image);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to take picture");
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
      Alert.alert("Error", "WebSocket is not connected");
      setStatus("Disconnected - Retrying...");
      setLoading(false);
      wsManager.current?.connect();
    }
  };

  if (!serverIP) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <Center flex={1}>
          <Text size="lg">Please configure server IP in settings</Text>
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
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <Box p="$5">
          <HStack justifyContent="space-between" alignItems="center" mb="$5">
            <Text
              size="lg"
              fontWeight="$bold"
              color={
                status === "Connected"
                  ? "$success700"
                  : status === "Error"
                  ? "$error700"
                  : "$warning700"
              }
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
              onPress={pickImage}
              disabled={loading}
            >
              <ButtonIcon as={Ionicons} name="images-outline" mr="$2" />
              <ButtonText>Pick from Gallery</ButtonText>
            </Button>

            <Button
              size="lg"
              variant="solid"
              action="primary"
              onPress={takePicture}
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
              <Text size="md" mt="$2">
                Sending image...
              </Text>
            </Center>
          )}

          {lastImage && (
            <Box mt="$5" alignItems="center">
              <Text size="lg" mb="$2">
                Last Sent Image:
              </Text>
              <Image
                source={{ uri: lastImage }}
                alt="Last sent image"
                w="$full"
                h={300}
                borderRadius="$lg"
                bg="$backgroundLight200"
                resizeMode="contain"
              />
            </Box>
          )}
        </Box>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;
