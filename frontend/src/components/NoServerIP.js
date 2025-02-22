import React from 'react';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ButtonText } from '@/src/components/ui/button';
import { Center } from '@/src/components/ui/center';

const NoServerIP = ({
  onNavigateSettings,
  message = 'Please configure server IP in settings',
}) => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <Center flex={1}>
        <Text style={{ fontSize: 16, textAlign: 'center', color: '#666' }}>
          {message}
        </Text>
        <Button
          size="lg"
          variant="solid"
          action="primary"
          mt="$4"
          onPress={onNavigateSettings}
        >
          <ButtonText>Go to Settings</ButtonText>
        </Button>
      </Center>
    </SafeAreaView>
  );
};

export default NoServerIP;
