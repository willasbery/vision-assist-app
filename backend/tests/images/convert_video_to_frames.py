import cv2
import os
from pathlib import Path

def convert_video_to_frames(video_path, output_dir, frame_interval=1):
    """
    Convert video to frames and save them as images.
    
    Args:
        video_path (str): Path to the video file
        output_dir (str): Directory to save the frames
        frame_interval (int): Save every nth frame
    """
    # Create output directory if it doesn't exist
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    
    # Open the video file
    video = cv2.VideoCapture(video_path)
    
    if not video.isOpened():
        raise ValueError(f"Error opening video file: {video_path}")
    
    frame_count = 0
    saved_count = 0
    
    while True:
        # Read the next frame
        success, frame = video.read()
        
        if not success:
            break
            
        # Save frame if it matches the interval
        if frame_count % frame_interval == 0:
            frame_path = os.path.join(output_dir, f"frame_{saved_count:04d}.jpg")
            cv2.imwrite(frame_path, frame)
            saved_count += 1
            
        frame_count += 1
    
    # Clean up
    video.release()
    print(f"Converted {frame_count} frames to {saved_count} images in {output_dir}")

if __name__ == "__main__":
    # Set paths relative to this script
    script_dir = Path(__file__).parent
    video_path = script_dir / "videos" / "bin_obstacles.MP4"
    output_dir = script_dir / "bin_obstacles"
    
    # Convert video to frames, saving every 5th frame
    # Adjust frame_interval as needed based on your video
    convert_video_to_frames(str(video_path), str(output_dir), frame_interval=5)
