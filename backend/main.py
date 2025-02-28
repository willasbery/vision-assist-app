import coloredlogs
import cv2
import json
import logging
import os
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from models import ConnectionManager

logger = logging.getLogger(__name__)
coloredlogs.install(level="DEBUG", logger=logger)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

manager = ConnectionManager()

FRAMES_DIR = "stream_frames"
if not os.path.exists(FRAMES_DIR):
    os.makedirs(FRAMES_DIR)
    logger.info(f"Created frames directory: {FRAMES_DIR}")

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
                    image_data = json_data.get("data").split(",")[1]
                    frame = manager.base64_to_frame(image_data)
                    
                    logger.info("Processing frame...")
                    start_time = datetime.now() 
                    processed_frame, instruction = manager.video_processor.process_frame(frame)
                    end_time = datetime.now()
                    logger.info(f"Frame processed in {(end_time - start_time).total_seconds():.3f} seconds")
                    
                    if instruction is not None:
                        # processed_base64 = manager.frame_to_base64(processed_frame)
                        
                        # frame_number = manager.frame_counters[websocket]
                        # timestamp = current_time.strftime("%Y%m%d_%H%M%S_%f")
                        # filename = f"frame_{timestamp}_{frame_number:06d}.jpg"
                        # filepath = os.path.join(FRAMES_DIR, filename)
                        
                        # cv2.imwrite(filepath, processed_frame)
                        # logger.debug(f"Saved processed frame: {filepath}")
                        
                        logger.info(f"Sending instruction: {instruction}")
                        
                        manager.frame_counters[websocket] += 1
                        manager.last_frame_time[websocket] = current_time
                        
                        await websocket.send_json({
                            "type": "success",
                            "data": instruction,
                            # "url": f"/stream_frames/{filename}"
                        })
                    else:
                        logger.warning("Frame processing failed")
                        await websocket.send_json({
                            "type": "error",
                            "message": "Frame processing failed"
                        })
                
            except json.JSONDecodeError:
                logger.error("Invalid JSON received")
            except Exception as e:
                logger.error(f"Error processing frame: {str(e)}")
                await websocket.send_json({
                    "type": "error",
                    "message": str(e)
                })
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting server...")
    uvicorn.run(app, host="0.0.0.0", port=8000, workers=1)