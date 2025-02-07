import base64
import coloredlogs
import cv2
import logging
import numpy as np

from datetime import datetime
from fastapi import WebSocket
from ultralytics import YOLO

from vision_assist.models import Instruction
from vision_assist.FrameProcessor import FrameProcessor


logger = logging.getLogger(__name__)
coloredlogs.install(level="DEBUG", logger=logger)


class VideoProcessor:
    def __init__(self, weights='.\\vision_assist\\model\\runs\\segment\\train11\\weights\\best.pt'):
        # self.model = YOLO(weights).to("cuda")
        self.model = YOLO(weights)
        self.frame_processor = FrameProcessor(model=self.model, verbose=False, debug=True, imshow=False)
        logger.info(f"VideoProcessor initialized with weights: {weights}")
       
    def process_frame(self, frame) -> tuple[np.ndarray, list[Instruction]]:
        try:
            logger.debug("Processing new frame")
            processed_frame, instructions = self.frame_processor(frame)
            return processed_frame, instructions
        except Exception as e:
            logger.error(f"Error processing frame: {str(e)}")
            return None, None

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        self.frame_counters = {}
        self.last_frame_time = {}
        self.video_processor = VideoProcessor()
        logger.info("ConnectionManager initialized")
       
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.frame_counters[websocket] = 0
        self.last_frame_time[websocket] = datetime.now()
        logger.info(f"New client connected. Total connections: {len(self.active_connections)}")
       
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        if websocket in self.frame_counters:
            del self.frame_counters[websocket]
        if websocket in self.last_frame_time:
            del self.last_frame_time[websocket]
        logger.info(f"Client disconnected. Total connections: {len(self.active_connections)}")
       
    @staticmethod
    def base64_to_frame(base64_string):
        logger.debug("Converting base64 to frame")
        img_data = base64.b64decode(base64_string)
        nparr = np.frombuffer(img_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return frame
   
    @staticmethod
    def frame_to_base64(frame):
        logger.debug("Converting frame to base64")
        _, buffer = cv2.imencode('.jpg', frame)
        base64_string = base64.b64encode(buffer).decode('utf-8')
        return base64_string