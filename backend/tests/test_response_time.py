import base64
import io
import pytest
import time
from pathlib import Path
from PIL import Image
import asyncio
import websockets
import json

# Constants
API_ENDPOINT = "ws://localhost:8000/ws"  # WebSocket endpoint
TEST_IMAGES_DIR = Path(__file__).parent / "images/bin_obstacles"

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

@pytest.mark.asyncio
async def test_response_time():
    """Test the response time of the prediction endpoint."""
    # Ensure test images directory exists
    assert TEST_IMAGES_DIR.exists(), f"Test images directory not found at {TEST_IMAGES_DIR}"
    
    # Get all image files from the test directory
    image_files = [f for f in TEST_IMAGES_DIR.glob("*") if f.suffix.lower() in ('.png', '.jpg', '.jpeg')]
    assert len(image_files) > 0, "No test images found in directory"

    response_times = []
    
    print(f"Testing {len(image_files)} images")
    
    async with websockets.connect(API_ENDPOINT) as websocket:
        for image_path in image_files:
            # Convert image to base64
            image_base64 = load_image_as_base64(image_path)
            
            print(f"Sending image: {image_path.name}")
            
            # Measure response time
            start_time = time.time()
            response = await send_image_ws(websocket, image_base64)
            end_time = time.time()
            
            # Assert successful response
            assert response is not None, "No response received from websocket"
            
            response_time = end_time - start_time
            response_times.append(response_time)
            
            print(f"Response time for {image_path.name}: {response_time:.2f} seconds")
    
    # Calculate and print statistics
    avg_response_time = sum(response_times) / len(response_times)
    max_response_time = max(response_times)
    min_response_time = min(response_times)
    
    print(f"\nTest Results:")
    print(f"Average response time: {avg_response_time:.2f} seconds")
    print(f"Maximum response time: {max_response_time:.2f} seconds")
    print(f"Minimum response time: {min_response_time:.2f} seconds")
    
    # Optional: Add assertions for maximum acceptable response time
    assert avg_response_time < 0.5, f"Average response time ({avg_response_time:.2f}s) exceeds maximum threshold (5.0s)"

if __name__ == "__main__":
    pytest.main([__file__])
