import base64
import cv2
import json
import numpy as np
import os

from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO

from vision_assist.FrameProcessor import FrameProcessor

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class VideoProcessor:
    def __init__(self, weights='.\\vision_assist\\model\\runs\\train11\\weights\\best.pt'):
        self.model = YOLO(weights)
        self.frame_processor = FrameProcessor(model=self.model, verbose=False)
        print("VideoProcessor initialized")
        
    def process_frame(self, frame):
        try:
            processed_frame = self.frame_processor(frame)
            if isinstance(processed_frame, bool) and not processed_frame:
                return None
            return processed_frame
        except Exception as e:
            print(f"Error processing frame: {str(e)}")
            return None

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        self.frame_counters = {}
        self.last_frame_time = {}
        self.video_processor = VideoProcessor()
        
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.frame_counters[websocket] = 0
        self.last_frame_time[websocket] = datetime.now()
        print(f"Client connected. Total connections: {len(self.active_connections)}")
        
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        if websocket in self.frame_counters:
            del self.frame_counters[websocket]
        if websocket in self.last_frame_time:
            del self.last_frame_time[websocket]
        print(f"Client disconnected. Total connections: {len(self.active_connections)}")
        
    @staticmethod
    def base64_to_frame(base64_string):
        # Convert base64 string to numpy array
        img_data = base64.b64decode(base64_string)
        nparr = np.frombuffer(img_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return frame
    
    @staticmethod
    def frame_to_base64(frame):
        # Convert frame to base64 string
        _, buffer = cv2.imencode('.jpg', frame)
        base64_string = base64.b64encode(buffer).decode('utf-8')
        return base64_string

manager = ConnectionManager()

# Create frames directory
FRAMES_DIR = "stream_frames"
if not os.path.exists(FRAMES_DIR):
    os.makedirs(FRAMES_DIR)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                json_data = json.loads(data)
                
                if json_data.get("type") in ["frame", "image"]:
                    current_time = datetime.now()
                    last_time = manager.last_frame_time[websocket]
                    
                    # Process frame if enough time has passed (rate limiting)
                    time_diff = (current_time - last_time).total_seconds()
                    if time_diff >= 0.05:  # Allow up to 20 frames per second
                        # Convert base64 to frame
                        image_data = json_data.get("data").split(",")[1]
                        frame = manager.base64_to_frame(image_data)
                        
                        # Process frame with YOLO
                        print("Processing frame...")
                        start_time = datetime.now() 
                        processed_frame = manager.video_processor.process_frame(frame)
                        end_time = datetime.now()
                        print(f"Frame processed in {(end_time - start_time).total_seconds()} seconds")
                        
                        if processed_frame is not None:
                            # Convert processed frame back to base64
                            processed_base64 = manager.frame_to_base64(processed_frame)
                            
                            # Generate filename for saving
                            frame_number = manager.frame_counters[websocket]
                            timestamp = current_time.strftime("%Y%m%d_%H%M%S_%f")
                            filename = f"frame_{timestamp}_{frame_number:06d}.jpg"
                            filepath = os.path.join(FRAMES_DIR, filename)
                            
                            # Save processed frame
                            cv2.imwrite(filepath, processed_frame)
                            
                            # Update counters
                            manager.frame_counters[websocket] += 1
                            manager.last_frame_time[websocket] = current_time
                            
                            # Send processed frame back to client
                            await websocket.send_json({
                                "type": "processed_frame",
                                "data": f"data:image/jpeg;base64,{processed_base64}",
                                "url": f"/frames/{filename}"
                            })
                        else:
                            # If frame processing failed, send original frame back
                            await websocket.send_json({
                                "type": "error",
                                "message": "Frame processing failed"
                            })
                
            except json.JSONDecodeError:
                print("Invalid JSON received")
            except Exception as e:
                print(f"Error processing frame: {str(e)}")
                await websocket.send_json({
                    "type": "error",
                    "message": str(e)
                })
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, workers=1)