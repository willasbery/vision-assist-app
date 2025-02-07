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
      <SafeAreaView style={styles.container}>
        <Text>Please configure server IP in settings</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("Settings")}
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
            { color: status === "Connected" ? "green" : status === "Error" ? "red" : "orange" }
          ]}>
            Status: {status}
          </Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate("Settings")}
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
            onPress={() => navigation.navigate("Stream")}
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
    backgroundColor: "#fff",
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  status: {
    fontSize: 18,
    fontWeight: "bold",
  },
  buttonContainer: {
    gap: 15,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  previewContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  preview: {
    width: "100%",
    height: 300,
    borderRadius: 10,
    backgroundColor: "#f0f0f0",
  }
});

export default HomeScreen;