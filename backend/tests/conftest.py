import pytest
from pathlib import Path

def pytest_addoption(parser):
    parser.addoption(
        "--image-dir", action="store", default="bin_obstacles", help="Directory name within the images folder"
    )

@pytest.fixture
def test_images_dir(request):
    """ Fixture to provide test images directory """
    image_dir = request.config.getoption("--image-dir")
    return Path(__file__).parent / "images" / image_dir
