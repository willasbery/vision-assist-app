package com.willasbery.visionassist.frametobase64string;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import android.graphics.Bitmap;
import com.mrousavy.camera.core.FrameInvalidError;
import com.mrousavy.camera.frameprocessors.Frame;
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin;
import com.mrousavy.camera.frameprocessors.VisionCameraProxy;
import java.util.Map;

import android.media.Image;


public class FrameToBase64StringPlugin extends FrameProcessorPlugin {
  public FrameToBase64StringPlugin(@NonNull VisionCameraProxy proxy, @Nullable Map<String, Object> options) {
    super();
  }

  @Nullable
  @Override
  public Object callback(@NonNull Frame frame, @Nullable Map<String, Object> arguments) throws FrameInvalidError {
    Bitmap bm = BitmapUtils.getBitmap(frame);
    return BitmapUtils.bitmap2Base64(bm);
  }
}