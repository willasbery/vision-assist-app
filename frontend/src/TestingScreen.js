import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Button, ButtonText, ButtonIcon } from '@/src/components/ui/button';
import { Box } from '@/src/components/ui/box';
import { VStack } from '@/src/components/ui/vstack';
import { Spinner } from '@/src/components/ui/spinner';
import * as ImagePicker from 'expo-image-picker';
import { VideoView, createVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import ErrorPopup from '@/src/components/ErrorPopup';
import { useWebSocket } from '@/src/hooks/useWebSocket';
import { useServerIP } from '@/src/hooks/useServerIP';
import { useFocusEffect } from '@react-navigation/native';
import * as VideoThumbnails from 'expo-video-thumbnails';
import * as FileSystem from 'expo-file-system';

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

  const processingRef = useRef(false);
  const videoRef = useRef(null);
  const frameIntervalRef = useRef(null);

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
        setProgress(0);
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
      const video = createVideoPlayer(videoSource);
      setVideo(video);
    }
  }, [videoSource]);

  const generateThumbnail = async (videoUri, timeInMs) => {
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time: timeInMs,
        quality: 1,
      });

      // Convert thumbnail to base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return base64;
    } catch (e) {
      console.error('Error generating thumbnail:', e);
      throw e;
    }
  };

  const processVideoFrames = async () => {
    if (!video || !serverIP || !videoSource) {
      setError('Please select a video first');
      return;
    }

    setIsProcessing(true);
    processingRef.current = true;
    setProgress(0);
    setCurrentFrame(0);

    try {
      // Get video duration
      const duration = video.duration;
      const frameInterval = 1 / fps;
      const estimatedTotalFrames = Math.floor(duration / frameInterval);
      setTotalFrames(estimatedTotalFrames);

      console.log(
        `Video duration: ${duration}s, FPS: ${fps}, Total frames: ~${estimatedTotalFrames}`
      );

      let currentTime = 0;
      let frameCount = 0;

      const processNextFrame = async () => {
        if (!processingRef.current || currentTime >= duration) {
          stopProcessing();
          return;
        }

        try {
          // Generate thumbnail for current time
          const base64Frame = await generateThumbnail(videoSource, currentTime);

          // Send frame to server
          const success = send({
            type: 'frame',
            data: `data:image/jpeg;base64,${base64Frame}`,
            timestamp: Date.now(),
          });

          console.log('Frame sent:', success);

          if (!success) {
            throw new Error('Failed to send frame');
          }

          // Update progress
          frameCount++;
          setCurrentFrame(frameCount);
          setProgress(Math.min(100, (currentTime / duration) * 100));

          // Move to next frame
          currentTime += frameInterval;
          setTimeout(processNextFrame, 50);
        } catch (error) {
          console.error('Error processing frame:', error);
          setError(`Error processing frame: ${error.message}`);
          stopProcessing();
        }
      };

      // Start processing
      processNextFrame();
    } catch (error) {
      console.error('Error processing video:', error);
      setError(`Error processing video: ${error.message}`);
      stopProcessing();
    }
  };

  const stopProcessing = () => {
    processingRef.current = false;
    setIsProcessing(false);

    if (frameIntervalRef.current) {
      clearTimeout(frameIntervalRef.current);
      frameIntervalRef.current = null;
    }

    if (video) {
      video.pauseAsync().catch(console.error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Box p="$4">
          <VStack space="xl">
            <Button
              size="xl"
              variant="solid"
              action="primary"
              onPress={handleVideoSelection}
              disabled={isProcessing}
            >
              <ButtonIcon as={Ionicons} name="videocam-outline" size={24} />
              <ButtonText style={{ fontFamily: 'Geist-Regular' }}>
                Select Video
              </ButtonText>
            </Button>

            {video && (
              <VideoView
                style={styles.videoPreview}
                player={video}
                contentFit="contain"
                nativeControls={false}
                ref={videoRef}
              />
            )}

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
                disabled={isProcessing}
              />
              <Text style={styles.helperText}>
                Lower FPS = faster processing, higher FPS = smoother video
              </Text>
            </Box>

            {isProcessing ? (
              <>
                <Button
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
    height: 200,
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
