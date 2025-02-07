import base64
import io
from PIL import Image
import json
import time
import asyncio
import websockets

def load_image_as_base64(image_path):
    """Convert an image file to base64 string."""
    with Image.open(image_path) as img:
        buffered = io.BytesIO()
        img.save(buffered, format=img.format)
        return base64.b64encode(buffered.getvalue()).decode()

async def send_image_ws(websocket, image_base64):
    """Send image through websocket and await response."""
    try:
        payload = {
            "type": "frame",
            "data": f"data:image/jpeg;base64,{image_base64}",
            "timestamp": int(time.time() * 1000)  # Current time in milliseconds
        }
        await websocket.send(json.dumps(payload))
        # Add timeout to recv
        response = await asyncio.wait_for(websocket.recv(), timeout=10.0)
        return response
    except asyncio.TimeoutError:
        raise TimeoutError("WebSocket response timed out after 10 seconds")
    except websockets.exceptions.ConnectionClosed:
        raise ConnectionError("WebSocket connection closed unexpectedly") 