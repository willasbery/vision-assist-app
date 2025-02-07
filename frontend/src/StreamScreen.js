import React, { useState, useEffect, useRef } from "react";
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { 
  Camera, 
  runAtTargetFps, 
  useCameraDevice, 
  useCameraFormat, 
  useCameraPermission, 
  useFrameProcessor 
} from "react-native-vision-camera";
import { SafeAreaView } from "react-native-safe-area-context";
import { Worklets } from "react-native-worklets-core";


import { convertFrameToBase64 } from "@/src/utils/convertFrameToBase64";
import { loadServerIP } from "@/src/common/serverManager";
import WebSocketManager from "@/src/common/websockets";
import { playAudio, unloadSounds } from "@/src/utils/audioPlayer";


const StreamScreen = ({ navigation }) => {
  const [status, setStatus] = useState("Connecting...");
  const [serverIP, setServerIP] = useState(null);

  const [instructions, setInstructions] = useState(null);
  const [response, setResponse] = useState(null);

  // Sound effects
  // const continueForward = new Player('continue_forward.wav')
  // const immediatelyTurnLeft = new Player('immediately_turn_left.wav')
  // const immediatelyTurnRight = new Player('immediately_turn_right.wav')
  // const possiblyTurnLeft = new Player('possibly_turn_left.wav')
  // const possiblyTurnRight = new Player('possibly_turn_right.wav')
  // const turnLeft = new Player('turn_left.wav')
  // const turnRight = new Player('turn_right.wav')

  const cameraRef = useRef(null);
  const device = useCameraDevice("back");
  const format = useCameraFormat(device, [
    { videoResolution: { width: 1280, height: 720 } },
    { photoResolution: { width: 1280, height: 720 } },
    { fps: 30 },
  ])
  const { hasPermission, requestPermission } = useCameraPermission();
  // const { resize } = useResizePlugin();

  const wsManager = useRef(null);

  const loadInitialIP = async () => {
    const ip = await loadServerIP();
    if (ip) {
      setServerIP(ip);
    }
  };

  useEffect(() => {
    return () => {
      unloadSounds();
    };
  }, []);


  useEffect(() => {
    loadInitialIP();
    const unsubscribe = navigation.addListener("focus", () => {
      loadInitialIP();
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
          console.log('Server response:', response);
          if (response.type === "success") {
            const parsedInstructions = JSON.parse(response.data);
            setInstructions(parsedInstructions);

            // NOW WE JUST NEED TO PLAY THE AUDIO FOR THE FIRST INSTRUCTION
            playAudio(parsedInstructions[0].instruction_type);
          } else if (response.type === "error") {
            console.error("Server error:", response.data);
            setResponse(response.data);
          }
        },
        onError: (error) => {
          Alert.alert("Connection Error", "Failed to connect to server");
        }
      });
      wsManager.current.connect();
    }
    return () => {
      wsManager.current?.disconnect();
    };
  }, [serverIP]);

  const onConversion = Worklets.createRunOnJS((imageAsBase64) => {
    wsManager.current?.send({
      type: "frame",
      data: `data:image/jpeg;base64,${imageAsBase64}`,
      timestamp: Date.now(),
    });
  });

  const frameProcessor = useFrameProcessor((frame) => {
    "worklet";

    // runAtTargetFps(2, () => {
    //   // const imageAsBase64 = convertFrameToBase64(frame, { 
    //   //   width: 640, 
    //   //   height: 640 
    //   // });

    const imageAsBase64 = convertFrameToBase64(frame);

    if (imageAsBase64 === null) {
      return;
    }

    onConversion(imageAsBase64);
    // });
  }, [onConversion]);

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
        frameProcessor={frameProcessor}
        fps={10}
      />
      {instructions && (
        <Text style={styles.instructions}>
          {instructions.map((instruction, index) => (
            `${index + 1}. ${instruction.instruction_type}: ${instruction.direction} (${instruction.danger} danger)\n`
          ))}
        </Text>
      )}
      {response && <Text style={styles.error}>{response}</Text>}
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
  button: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#2196F3",
    borderRadius: 10,
    minWidth: 200,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  status: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  instructions: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 10,
    borderRadius: 5,
  },
  error: {
    color: 'red',
    position: 'absolute',
    bottom: 20,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 5,
  }
});

export default StreamScreen;