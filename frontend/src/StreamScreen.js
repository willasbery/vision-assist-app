import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  View,
} from "react-native";
import { 
  Camera, 
  runAtTargetFps, 
  useCameraDevice, 
  useCameraFormat, 
  useCameraPermission, 
  useFrameProcessor,
  useCameraDevices
} from "react-native-vision-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import { Worklets } from "react-native-worklets-core";
import { Button, ButtonText } from "@/components/ui/button";
import { VStack } from "@/components/ui/vstack";

import { convertFrameToBase64 } from "@/src/utils/convertFrameToBase64";
import { loadServerIP } from "@/src/common/serverManager";
import WebSocketManager from "@/src/common/websockets";
import { playAudio, unloadSounds } from "@/src/utils/audioPlayer";

const StreamScreen = ({ navigation }) => {
  const [status, setStatus] = useState("Initializing...");
  const [serverIP, setServerIP] = useState(null);
  const [instructions, setInstructions] = useState(null);
  const [error, setError] = useState(null);
  const processingRef = useRef(false);
  const wsManager = useRef(null);

  const cameraRef = useRef(null);
  const device = useCameraDevice("back", {
    physicalDevices: [
      "ultra-wide-angle-camera",
      "wide-angle-camera"
    ]
  });

  const format = useCameraFormat(device, [
    { videoResolution: { width: 1280, height: 720 } },
    { photoResolution: { width: 1280, height: 720 } },
    { fps: 30 },
  ]);
  const { hasPermission, requestPermission } = useCameraPermission();

  const loadInitialIP = async () => {
    const ip = await loadServerIP();
    if (ip) {
      setServerIP(ip);
      setError(null);
    }
  };

  useEffect(() => {
    loadInitialIP();
    return () => {
      unloadSounds();
      wsManager.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", loadInitialIP);
    return unsubscribe;
  }, [navigation]);

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
        if (response.type === "success") {
          if (response.data.length > 0) {
            console.log('Playing audio:', response.data);
            playAudio(response.data);
          }
        } else if (response.type === "error") {
          console.error("Server error:", response.data);
          setError(response.data);
        }
        processingRef.current = false;
      },
      onError: (error) => {
        setError("Connection failed. Please check your settings or retry.");
      },
      maxReconnectAttempts: 3,
    });
    
    wsManager.current.connect();

    return () => wsManager.current?.disconnect();
  }, [serverIP]);

  const onConversion = Worklets.createRunOnJS((imageAsBase64) => {
    if (!processingRef.current && wsManager.current) {
      processingRef.current = true;
      const success = wsManager.current.send({
        type: "frame",
        data: `data:image/jpeg;base64,${imageAsBase64}`,
        timestamp: Date.now(),
      });
      
      if (!success) {
        processingRef.current = false;
      }
    }
  });

  const frameProcessor = useFrameProcessor((frame) => {
    "worklet";
    const imageAsBase64 = convertFrameToBase64(frame);
    if (imageAsBase64) {
      onConversion(imageAsBase64);
    }
  }, [onConversion]);

  const handleRetry = () => {
    setError(null);
    wsManager.current?.retry();
  };

  if (!serverIP) {
    return (
      <SafeAreaView style={styles.container}>
        <VStack space="md" alignItems="center">
          <Text style={styles.message}>Please configure server IP in settings</Text>
          <Button
            size="lg"
            variant="solid"
            action="primary"
            onPress={() => navigation.navigate("Settings")}
          >
            <ButtonText>Go to Settings</ButtonText>
          </Button>
        </VStack>
      </SafeAreaView>
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
      {/* <Text style={[
        styles.status,
        status === "Connected" && styles.statusConnected,
        status.includes("Error") && styles.statusError
      ]}>
        {status}
      </Text> */}
      
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        format={format}
        isActive={!error}
        frameProcessor={frameProcessor}
        enableZoomGesture={true}
        onError={(error) => console.error("Camera error:", error)}
        androidPreviewViewType="surface-view"
      />

      {instructions && (
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructions}>
            {instructions.map((instruction, index) => (
              `${index + 1}. ${instruction.instruction_type}: ${instruction.direction} (${instruction.danger} danger)\n`
            ))}
          </Text>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
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
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  status: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    zIndex: 1,
  },
  statusConnected: {
    color: "#4CAF50",
  },
  statusError: {
    color: "#f44336",
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