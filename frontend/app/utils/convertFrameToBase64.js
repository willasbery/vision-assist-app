import { VisionCameraProxy } from 'react-native-vision-camera';

const plugin = VisionCameraProxy.initFrameProcessorPlugin('convertFrameToBase64')

export function convertFrameToBase64(frame) {
  'worklet';

  if (plugin === null) throw new Error('Plugin not initialized');
  return plugin.call(frame)
}