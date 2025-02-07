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

import { loadServerIP, saveServerIP } from "@/src/common/serverManager";

const SettingsScreen = ({ navigation }) => {
  const [serverIP, setServerIP] = useState("");

  useEffect(() => {
    loadInitialIP();
  }, []);

  const loadInitialIP = async () => {
    const ip = await loadServerIP();
    if (ip) {
      setServerIP(ip);
    }
  };

  const handleSaveServerIP = async () => {
    try {
      await saveServerIP(serverIP);
      Alert.alert("Success", "Server IP saved successfully", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert("Error", error.message);
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
        onPress={handleSaveServerIP}
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