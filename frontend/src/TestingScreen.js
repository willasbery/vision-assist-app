import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Button, ButtonText, ButtonIcon } from '@/src/components/ui/button';
import { Box } from '@/src/components/ui/box';
import { VStack } from '@/src/components/ui/vstack';
import { Spinner } from '@/src/components/ui/spinner';
import * as ImagePicker from 'expo-image-picker';
import { createVideoPlayer, VideoView } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import ErrorPopup from '@/src/components/ErrorPopup';
import { useWebSocket } from '@/src/hooks/useWebSocket';
import { useServerIP } from '@/src/hooks/useServerIP';
import { useFocusEffect } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import { Image } from 'expo-image';
import { FFmpegKit, ReturnCode } from 'ffmpeg-kit-react-native';

const TestingScreen = () => {
  const [video, setVideo] = useState(null);
  const [videoSource, setVideoSource] = useState(null);
  const [fps, setFps] = useState(10); // Default to 10 FPS for better performance
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [isErrorVisible, setIsErrorVisible] = useState(false);

  const [progress, setProgress] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);

  const [currentFrame, setCurrentFrame] = useState(0);
  const [currentInstruction, setCurrentInstruction] = useState(null);

  const processingRef = useRef(false);
  const videoRef = useRef(null);
  const frameIntervalRef = useRef(null);
  const frameAckResolveRef = useRef(null);

  const { serverIP } = useServerIP();
  const {
    send,
    error: wsError,
    retry,
    setEnabled,
  } = useWebSocket(serverIP, {
    enabled: false,
    onMessage: (response) => {
      console.log('Server response:', response);
      if (frameAckResolveRef.current) {
        frameAckResolveRef.current(response);
        frameAckResolveRef.current = null;
      }

      setCurrentInstruction(response.data);
    },
  });

  // Enable WebSocket when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      setEnabled(true);
      return () => setEnabled(false);
    }, [setEnabled])
  );

  useEffect(() => {
    if (error || wsError) {
      setIsErrorVisible(true);
    }
  }, [error, wsError]);

  const handleVideoSelection = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        setError('Please allow access to your video library');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const videoSource = result.assets[0]?.uri;
        setVideoSource(videoSource);
        setCurrentFrame(0);
        setTotalFrames(0);
      }
    } catch (error) {
      setError('Failed to select video');
      console.error(error);
    }
  };

  useEffect(() => {
    if (videoSource) {
      const videoPlayer = createVideoPlayer(videoSource);
      setVideo(videoPlayer);
    }
  }, [videoSource]);

  const processVideoFrames = async () => {
    if (!video || !serverIP || !videoSource) {
      setError('Please select a video first');
      return;
    }

    const duration = video.duration;
    const frameInterval = 1 / fps;
    const estimatedTotalFrames = Math.floor(duration / frameInterval);
    setTotalFrames(estimatedTotalFrames);

    console.log('Video is', duration, 'seconds long');
    console.log('Frame interval is', frameInterval, 'seconds');
    console.log('Estimated total frames are', estimatedTotalFrames);

    const outputFileUri = `${FileSystem.documentDirectory}/thumbnail`;
    console.log('Output file URI:', outputFileUri);

    // Generate thumbnails for every frame using FFmpegKit
    // FFmpegKit is deprecated, but as expo-video/expo-video-thumbnails
    // are not working, I am using this instead
    FFmpegKit.execute(
      `-i ${videoSource} -vf fps=${fps} '${outputFileUri}%d.png'`
    )
      .then(async (session) => {
        const returnCode = await session.getReturnCode();

        if (ReturnCode.isSuccess(returnCode)) {
          console.log('Thumbnails generated successfully');
        } else {
          console.log('Error generating thumbnails:', returnCode);
        }
      })
      .catch((error) => {
        console.error('Error generating thumbnails:', error);
      });

    // Process each frame sequentially, awaiting the server response for each
    for (let i = 0; i < estimatedTotalFrames; i++) {
      const frameTime = i * frameInterval;
      const framePath = `${outputFileUri}${i + 1}.png`;

      // Read the thumbnail image in base64 format
      const thumbnail_base64 = await FileSystem.readAsStringAsync(framePath, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Create a promise that will be resolved when the server responds
      const ackPromise = new Promise((resolve, reject) => {
        frameAckResolveRef.current = resolve;
      });

      // Send the frame to the server
      const success = send({
        type: 'frame',
        data: `data:image/jpeg;base64,${thumbnail_base64}`,
        timestamp: Date.now(),
      });

      if (!success) {
        console.error('Failed to send frame');
        // You could choose to reject the promise here if needed:
        frameAckResolveRef.current = null;
        continue;
      }

      // Await the server response for this frame before proceeding
      const response = await ackPromise;
      console.log('Frame', i + 1, 'acknowledged with response:', response);

      setCurrentFrame(thumbnail_base64);
      setProgress(Math.min(100, (frameTime / duration) * 100));
    }
  };

  const stopProcessing = () => {
    processingRef.current = false;
    setIsProcessing(false);

    if (frameIntervalRef.current) {
      clearTimeout(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Box className="p-6">
          <VStack space="xl" mt="$4">
            <Button
              size="xl"
              variant="solid"
              action="primary"
              className="bg-blue-500"
              onPress={handleVideoSelection}
              disabled={isProcessing}
            >
              <ButtonIcon as={Ionicons} name="videocam-outline" size={24} />
              <ButtonText style={{ fontFamily: 'Geist-Regular' }}>
                Select Video
              </ButtonText>
            </Button>

            {video &&
              (currentFrame ? (
                <>
                  <Image
                    style={styles.videoPreview}
                    placeholder={'Testing'}
                    source={{
                      uri: `data:image/jpeg;base64,${currentFrame}`,
                    }}
                    contentFit="contain"
                    transition={100}
                  />
                  <Text>{currentInstruction}</Text>
                </>
              ) : (
                <>
                  <VideoView
                    style={styles.videoPreview}
                    player={video}
                    contentFit="contain"
                    nativeControls={false}
                    ref={videoRef}
                  />
                  <Text style={{ color: 'white' }}>Hello</Text>
                </>
              ))}

            <Box mt="$4">
              <Text style={styles.label}>Frames Per Second: {fps}</Text>
              <Slider
                minimumValue={1}
                maximumValue={30}
                step={1}
                value={fps}
                onValueChange={setFps}
                minimumTrackTintColor="#3b82f6"
                maximumTrackTintColor="#d1d5db"
                thumbTintColor="#3b82f6"
                disabled={isProcessing}
              />
              <Text style={styles.helperText}>
                Lower FPS = faster processing, higher FPS = smoother video
              </Text>
            </Box>

            {isProcessing ? (
              <>
                <Button
                  className="bg-blue-500"
                  size="xl"
                  variant="solid"
                  action="secondary"
                  onPress={stopProcessing}
                >
                  <ButtonText style={{ fontFamily: 'Geist-Regular' }}>
                    Stop Processing
                  </ButtonText>
                </Button>

                <Box alignItems="center" mt="$4">
                  <Spinner size="large" color="#3b82f6" />
                  <Text style={styles.processingText}>
                    Processing frame {currentFrame} of ~{totalFrames}
                  </Text>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[styles.progressBar, { width: `${progress}%` }]}
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {Math.round(progress)}% complete
                  </Text>
                </Box>
              </>
            ) : (
              <Button
                className="bg-blue-500"
                size="xl"
                variant="solid"
                action="primary"
                onPress={processVideoFrames}
                disabled={!video || isProcessing}
              >
                <ButtonText style={{ fontFamily: 'Geist-Regular' }}>
                  Start Processing
                </ButtonText>
              </Button>
            )}
          </VStack>
        </Box>

        <ErrorPopup
          isVisible={isErrorVisible}
          error={error || wsError}
          onRetry={retry}
          onClose={() => setIsErrorVisible(false)}
        />
      </ScrollView>
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
    paddingBottom: 20,
  },
  videoPreview: {
    width: '100%',
    height: 300,
    borderRadius: 8,
    backgroundColor: '#f1f1f1',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
    fontFamily: 'Geist-Medium',
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    color: '#666',
    fontFamily: 'Geist-Regular',
  },
  processingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    fontFamily: 'Geist-Regular',
  },
  progressText: {
    marginTop: 4,
    fontSize: 14,
    color: '#3b82f6',
    fontFamily: 'Geist-Medium',
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3b82f6',
  },
});

export default TestingScreen;
