import React from 'react';
import { Modal, ModalContent, ModalBody } from '@/src/components/ui/modal';
import { Button, ButtonText } from '@/src/components/ui/button';
import { Text } from '@/src/components/ui/text';
import { VStack } from '@/src/components/ui/vstack';
import { Box } from '@/src/components/ui/box';

const ErrorPopup = ({ isVisible, error, onRetry, onSettings, onClose }) => {
  return (
    <Modal
      isOpen={isVisible}
      onClose={onClose}
      size="lg"
    >
      <ModalContent>
        <ModalBody>
          <Box p="$4" bg="$errorLight100" borderRadius="$lg">
            <Text
              className="mb-6"
              color="$error700"
              textAlign="center"
              fontSize="$lg"
              mb="$4"
            >
              {error}
            </Text>
            <VStack space="xl">
              {onSettings && (
                <Button
                  size="md"
                  variant="outline"
                  action="secondary"
                  onPress={() => {
                    onSettings();
                    onClose();
                  }}
                >
                  <ButtonText className="text-blue-500">Go to Settings</ButtonText>
                </Button>
              )}
              {onRetry && (
                <Button
                  className="bg-blue-500"
                  size="md"
                  variant="solid"
                  action="primary"
                  onPress={() => {
                    onRetry();
                    onClose();
                  }}
                >
                  <ButtonText>Retry Connection</ButtonText>
                </Button>
              )}
            </VStack>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ErrorPopup; 