import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";


const SettingsScreen = ({ navigation }) => {
  const [serverIP, setServerIP] = useState("");

  useEffect(() => {
    loadServerIP();
  }, []);

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

  const saveServerIP = async () => {
    if (!serverIP) {
      Alert.alert("Error", "Please enter a server IP address");
      return;
    }

    try {
      await AsyncStorage.setItem("serverIP", serverIP);
      Alert.alert("Success", "Server IP saved successfully", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error("Error saving server IP:", error);
      Alert.alert("Error", "Failed to save server IP");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Server IP Address:</Text>
        <TextInput
          style={styles.input}
          value={serverIP}
          onChangeText={setServerIP}
          placeholder="Enter server IP (e.g., 192.168.1.100)"
          keyboardType="numeric"
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={saveServerIP}
      >
        <Text style={styles.buttonText}>Save Settings</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  inputContainer: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    color: "#666",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#2196F3",
    padding: 15,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  }
});

export default SettingsScreen;