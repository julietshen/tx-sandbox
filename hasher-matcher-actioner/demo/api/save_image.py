from PIL import Image
import io
from pathlib import Path

def save_image_from_base64(image_data: bytes, output_path: str):
    """Save image data to a file."""
    try:
        # Create output directory if it doesn't exist
        output_dir = Path(output_path).parent
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Open and save the image
        image = Image.open(io.BytesIO(image_data))
        image.save(output_path)
        print(f"Successfully saved image to {output_path}")
        return True
    except Exception as e:
        print(f"Error saving image: {e}")
        return False 