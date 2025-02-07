import argparse
import pytest
import time
import websockets
from pathlib import Path

from utils.image_helpers import load_image_as_base64, send_image_ws
from settings import API_ENDPOINT

def get_test_directory():
    """Get the test directory from command line arguments or use default."""
    parser = argparse.ArgumentParser(description='Run response time tests for image processing')
    parser.add_argument('--image-dir', type=str, default="bin_obstacles",
                       help='Directory name within the images folder')
    
    # Only parse known args to work with pytest
    args, _ = parser.parse_known_args()
    
    # Construct the full path relative to the test directory
    return Path(__file__).parent / "images" / args.image_dir

TEST_IMAGES_DIR = get_test_directory()

@pytest.mark.asyncio
async def test_response_time(test_images_dir):  # Use the fixture here
    """Test the response time of the prediction endpoint."""
    
    # Ensure test images directory exists
    assert test_images_dir.exists(), f"Test images directory not found at {test_images_dir}"
    
    # Get all image files from the test directory
    image_files = [f for f in test_images_dir.glob("*") if f.suffix.lower() in ('.png', '.jpg', '.jpeg')]
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
