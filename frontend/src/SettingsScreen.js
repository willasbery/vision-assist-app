import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ButtonText } from '@/src/components/ui/button';
import { Box } from '@/src/components/ui/box';
import { VStack } from '@/src/components/ui/vstack';
import { HStack } from '@/src/components/ui/hstack';
import { Input, InputField } from '@/src/components/ui/input';
import { Text } from '@/src/components/ui/text';
import { Switch } from '@/src/components/ui/switch';
import { Divider } from '@/src/components/ui/divider';
import {
  FormControl,
  FormControlHelper,
  FormControlLabel,
} from '@/src/components/ui/form-control';
import { loadServerIP, saveServerIP } from '@/src/common/serverManager';
import { CustomText } from '@/src/components/CustomText';
import { useServerIP } from '@/src/hooks/useServerIP';
import { useAccessibility } from '@/src/hooks/useAccessibility';
import FontSizeSlider from '@/src/components/FontSizeSlider';
import AccessibleButton from '@/src/components/AccessibleButton';
import { getColors } from '@/src/theme/colors';

const SettingsScreen = ({ navigation }) => {
  const [serverIP, setServerIP] = useState('');

  const [audioEnabled, setAudioEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [developmentMode, setDevelopmentMode] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Get accessibility context
  const { highContrast, setHighContrast, fontSize } = useAccessibility();
  const colors = getColors(highContrast);

  useEffect(() => {
    loadInitialSettings();
  }, []);

  const loadInitialSettings = async () => {
    try {
      const [ip, audio, vibration, devMode] = await Promise.all([
        loadServerIP(),
        AsyncStorage.getItem('audioEnabled'),
        AsyncStorage.getItem('vibrationEnabled'),
        AsyncStorage.getItem('developmentMode'),
      ]);

      if (ip) setServerIP(ip);
      if (audio !== null) setAudioEnabled(audio === 'true');
      if (vibration !== null) setVibrationEnabled(vibration === 'true');
      if (devMode !== null) setDevelopmentMode(devMode === 'true');
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
        AsyncStorage.setItem('developmentMode', developmentMode.toString()),
      ]);

      navigation.goBack();
    } catch (error) {
      console.error('Error saving settings:', error);
      setError(error.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Box flex={1}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Box px="$6">
            <VStack space="md" mt="$2">
              <CustomText heading size="2xl" color={colors.primary}>
                Accessibility
              </CustomText>
              <FontSizeSlider />
              <HStack
                space="md"
                alignItems="center"
                justifyContent="space-between"
                mt="$4"
              >
                <VStack>
                  <CustomText heading size="lg" color="$textDark900">
                    High Contrast Mode
                  </CustomText>
                  <CustomText medium size="sm" color="$textDark500">
                    Increase color contrast for better visibility
                  </CustomText>
                </VStack>
                <Switch
                  size="lg"
                  value={highContrast}
                  onValueChange={setHighContrast}
                  trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
                  thumbColor={highContrast ? '#fff' : '#fff'}
                />
              </HStack>

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
              <Divider />
              <VStack space="md">
                <CustomText heading size="2xl" color={colors.primary}>
                  Developer Settings
                </CustomText>
                <HStack
                  space="md"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <VStack>
                    <CustomText heading size="lg" color="$textDark900">
                      Development Mode
                    </CustomText>
                    <CustomText medium size="sm" color="$textDark500">
                      Enable developer features
                    </CustomText>
                  </VStack>
                  <Switch
                    size="lg"
                    value={developmentMode}
                    onValueChange={setDevelopmentMode}
                    trackColor={{ false: '#e5e7eb', true: '#3b82f6' }}
                    thumbColor={developmentMode ? '#fff' : '#fff'}
                  />
                </HStack>
                <FormControl isRequired>
                  <FormControlLabel>
                    <CustomText heading size="lg" color="$textDark900">
                      Server IP Address
                    </CustomText>
                  </FormControlLabel>
                  <FormControlHelper>
                    <CustomText regular size="sm" color="$textDark500">
                      Enter the IP address of your server
                    </CustomText>
                  </FormControlHelper>
                  <Input size="lg" variant="outline" mb="$2">
                    <InputField
                      value={serverIP}
                      onChangeText={setServerIP}
                      placeholder="Enter server IP (e.g., 192.168.1.100)"
                      keyboardType="numeric"
                      autoCapitalize="none"
                      style={{
                        fontFamily: 'Geist-Regular',
                        fontSize: fontSize * 16,
                        height: 'fit-content',
                      }}
                    />
                  </Input>
                </FormControl>
              </VStack>
            </VStack>
          </Box>
        </ScrollView>

        <Box
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          p="$6"
          backgroundColor={colors.background}
        >
          {error && (
            <Text
              size="sm"
              color="$error700"
              textAlign="center"
              mb="$4"
              style={{ fontFamily: 'GeistRegular' }}
            >
              {error}
            </Text>
          )}
          <AccessibleButton
            size="xl"
            variant="solid"
            action="primary"
            onPress={handleSaveSettings}
            isDisabled={isSaving}
            style={{
              backgroundColor: colors.primary,
              marginLeft: 16,
              marginRight: 16,
              marginBottom: 8,
            }}
          >
            <ButtonText
              style={{ fontFamily: 'Geist-SemiBold', color: colors.text.light }}
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </ButtonText>
          </AccessibleButton>
        </Box>
      </Box>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: -32,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
    paddingLeft: 16,
    paddingRight: 16,
  },
});

export default SettingsScreen;
