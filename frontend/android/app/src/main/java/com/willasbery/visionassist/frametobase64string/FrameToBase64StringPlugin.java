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
  private static final double DEFAULT_WIDTH = 640;  // Default width if none provided
  private static final double DEFAULT_HEIGHT = 480; // Default height if none provided
    
  public FrameToBase64StringPlugin(@NonNull VisionCameraProxy proxy, @Nullable Map<String, Object> options) {
    super();
  }

  @Nullable
  @Override
  public Object callback(@NonNull Frame frame, @Nullable Map<String, Object> arguments) throws FrameInvalidError {
    Double newWidth = DEFAULT_WIDTH;
    Double newHeight = DEFAULT_HEIGHT;

    if (arguments != null) {
      if (arguments.containsKey("width")) {
        newWidth = (Double) arguments.get("width");
      }

      if (arguments.containsKey("height")) {
        newHeight = (Double) arguments.get("height");
      }
    }

    Bitmap originalBitmap = BitmapUtils.getBitmap(frame);
  
    Bitmap resizedBitmap = Bitmap.createScaledBitmap(
      originalBitmap,
      newWidth.intValue(),
      newHeight.intValue(),
      true
    );

    String base64String = BitmapUtils.bitmap2Base64(resizedBitmap);
        
    return base64String;
  }
}