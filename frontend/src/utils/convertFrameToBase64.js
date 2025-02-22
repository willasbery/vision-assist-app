import { VisionCameraProxy } from 'react-native-vision-camera';

const plugin = VisionCameraProxy.initFrameProcessorPlugin(
  'convertFrameToBase64'
);

export function convertFrameToBase64(frame, config) {
  'worklet';

  if (plugin === null) throw new Error('Plugin not initialized');

  if (config) {
    let options = {};

    if (config.width != undefined) {
      options.width = config.width;
    }

    if (config.height != undefined) {
      options.height = config.height;
    }

    return plugin.call(frame, options);
  } else {
    return plugin.call(frame);
  }
}
