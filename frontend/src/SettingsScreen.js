import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button, ButtonText } from '@/src/components/ui/button';
import { Box } from '@/src/components/ui/box';
import { VStack } from '@/src/components/ui/vstack';
import { HStack } from '@/src/components/ui/hstack';
import { Input, InputField } from '@/src/components/ui/input';
import { Text } from '@/src/components/ui/text';
import { Switch } from '@/src/components/ui/switch';
import {
  FormControl,
  FormControlHelper,
  FormControlLabel,
} from '@/src/components/ui/form-control';
import ErrorPopup from '@/src/components/ErrorPopup';

import { loadServerIP, saveServerIP } from '@/src/common/serverManager';
import { CustomText } from './components/CustomText';

const SettingsScreen = ({ navigation }) => {
  const [serverIP, setServerIP] = useState('');

  const [audioEnabled, setAudioEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isErrorVisible, setIsErrorVisible] = useState(false);

  useEffect(() => {
    loadInitialSettings();
  }, []);

  useEffect(() => {
    if (error) {
      setIsErrorVisible(true);
    }
  }, [error]);

  const loadInitialSettings = async () => {
    try {
      const [ip, audio, vibration] = await Promise.all([
        loadServerIP(),
        AsyncStorage.getItem('audioEnabled'),
        AsyncStorage.getItem('vibrationEnabled'),
      ]);

      if (ip) setServerIP(ip);
      if (audio !== null) setAudioEnabled(audio === 'true');
      if (vibration !== null) setVibrationEnabled(vibration === 'true');
    } catch (error) {
      console.error('Error loading settings:', error);
      setError('Failed to load settings');
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      setError(null);

      await Promise.all([
        saveServerIP(serverIP),
        AsyncStorage.setItem('audioEnabled', audioEnabled.toString()),
        AsyncStorage.setItem('vibrationEnabled', vibrationEnabled.toString()),
      ]);

      navigation.goBack();
    } catch (error) {
      console.error('Error saving settings:', error);
      setError(error.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    wsManager.current?.retry();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Box
          className="h-full justify-between p-6 gap-y-10"
          justifyContent="space-between"
        >
          <VStack space="3xl">
            <CustomText heading size="4xl" color="$textDark900">
              Settings
            </CustomText>
            <FormControl isRequired>
              <FormControlLabel>
                <CustomText heading size="lg" color="$textDark900">
                  Server IP Address
                </CustomText>
              </FormControlLabel>
              <Input size="lg" variant="outline" mb="$2">
                <InputField
                  value={serverIP}
                  onChangeText={setServerIP}
                  placeholder="Enter server IP (e.g., 192.168.1.100)"
                  keyboardType="numeric"
                  autoCapitalize="none"
                  style={{ fontFamily: 'Geist-Regular' }}
                />
              </Input>
              <FormControlHelper>
                <CustomText regular size="sm" color="$textDark500">
                  Enter the IP address of your server
                </CustomText>
              </FormControlHelper>
            </FormControl>

            <VStack space="4xl" mt="$5">
              <HStack
                space="md"
                alignItems="center"
                justifyContent="space-between"
              >
                <VStack>
                  <CustomText heading size="lg" color="$textDark900">
                    Audio Feedback
                  </CustomText>
                  <CustomText medium size="sm" color="$textDark500">
                    Enable voice instructions
                  </CustomText>
                </VStack>
                <Switch
                  size="lg"
                  value={audioEnabled}
                  onValueChange={setAudioEnabled}
                  trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
                  thumbColor={audioEnabled ? '#fff' : '#fff'}
                />
              </HStack>

              <HStack
                space="md"
                alignItems="center"
                justifyContent="space-between"
              >
                <VStack>
                  <CustomText heading size="lg" color="$textDark900">
                    Vibration Feedback
                  </CustomText>
                  <CustomText medium size="sm" color="$textDark500">
                    Enable haptic feedback
                  </CustomText>
                </VStack>
                <Switch
                  size="lg"
                  value={vibrationEnabled}
                  onValueChange={setVibrationEnabled}
                  trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
                  thumbColor={vibrationEnabled ? '#fff' : '#fff'}
                />
              </HStack>
            </VStack>

            {error && (
              <Text
                size="sm"
                color="$error700"
                textAlign="center"
                mt="$4"
                style={{ fontFamily: 'GeistRegular' }}
              >
                {error}
              </Text>
            )}
          </VStack>
          <Button
            className="mt-6 bg-blue-500"
            size="xl"
            variant="solid"
            action="primary"
            mt="$6"
            onPress={handleSaveSettings}
            isDisabled={isSaving}
          >
            <ButtonText style={{ fontFamily: 'Geist-SemiBold' }}>
              {isSaving ? 'Saving...' : 'Save Settings'}
            </ButtonText>
          </Button>
        </Box>
      </ScrollView>
      <ErrorPopup
        isVisible={isErrorVisible}
        error={error}
        onRetry={handleRetry}
        onClose={() => setIsErrorVisible(false)}
      />
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
});

export default SettingsScreen;
