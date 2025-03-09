import os
import random
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter
import hashlib
import json
from api.database import db
from datetime import datetime
import io
import requests
from pathlib import Path
import numpy as np
import pdqhash

def download_image(url, filename):
    """Download an image from a URL and save it."""
    response = requests.get(url)
    if response.status_code == 200:
        with open(filename, 'wb') as f:
            f.write(response.content)
        return True
    return False

def create_variations(image_path, num_variations=3):
    """Create variations of an image using different transformations."""
    original = Image.open(image_path)
    variations = []
    
    for i in range(num_variations):
        # Create a copy of the original
        variation = original.copy()
        
        # Apply random transformations
        # 1. Adjust brightness
        enhancer = ImageEnhance.Brightness(variation)
        variation = enhancer.enhance(random.uniform(0.8, 1.2))
        
        # 2. Adjust contrast
        enhancer = ImageEnhance.Contrast(variation)
        variation = enhancer.enhance(random.uniform(0.8, 1.2))
        
        # 3. Slight rotation
        angle = random.uniform(-5, 5)
        variation = variation.rotate(angle, expand=True)
        
        # 4. Slight blur
        if random.random() > 0.5:
            variation = variation.filter(ImageFilter.GaussianBlur(radius=random.uniform(0, 1)))
        
        # 5. Random crop and resize back
        width, height = variation.size
        crop_width = int(width * random.uniform(0.8, 0.95))
        crop_height = int(height * random.uniform(0.8, 0.95))
        left = random.randint(0, width - crop_width)
        top = random.randint(0, height - crop_height)
        variation = variation.crop((left, top, left + crop_width, top + crop_height))
        variation = variation.resize((width, height))
        
        variations.append(variation)
    
    return variations

def calculate_hash(image):
    """Calculate PDQ hash of the image."""
    # Convert PIL image to numpy array
    img_array = np.array(image)
    # Ensure image is RGB and contiguous
    if img_array.shape[-1] == 4:
        img_array = img_array[..., :3]
    if not img_array.flags['C_CONTIGUOUS']:
        img_array = np.ascontiguousarray(img_array)
    # Compute PDQ hash
    hash_val, quality = pdqhash.compute(img_array)
    hash_hex = ''.join([f'{x:02x}' for x in hash_val.tobytes()])
    return hash_hex, float(quality)

def calculate_file_hash(file_path: str) -> str:
    """Calculate SHA-256 hash of a file."""
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        # Read the file in chunks
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def process_and_store_image(image, filename, is_variation=False, parent_image_id=None):
    """Process an image and store it in the database."""
    # Convert to bytes for cryptographic hashes
    img_byte_arr = io.BytesIO()
    image.save(img_byte_arr, format='PNG')
    img_byte_arr = img_byte_arr.getvalue()
    
    # Calculate hashes
    file_hash = hashlib.sha256(img_byte_arr).hexdigest()
    pdq_hash, pdq_quality = calculate_hash(image)
    
    # Store in database
    image_id = db.add_image(
        filename=filename,
        file_hash=file_hash,
        hashes={
            "pdq": pdq_hash,
            "md5": hashlib.md5(img_byte_arr).hexdigest(),
            "sha1": hashlib.sha1(img_byte_arr).hexdigest(),
            "photodna": f"photodna_{file_hash[:8]}",  # Placeholder
            "netclean": f"netclean_{file_hash[:8]}"   # Placeholder
        },
        quality_scores={
            "pdq": pdq_quality
        },
        is_variation=is_variation,
        parent_image_id=parent_image_id
    )
    
    return image_id, pdq_hash

def generate_test_dataset():
    """Generate test dataset using local test images."""
    print("Generating test data with real images...")
    
    # Use all test images
    test_images = [f"photo{i}.jpg" for i in range(1, 14)]
    
    # Create variations directory if it doesn't exist
    variations_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "variations")
    os.makedirs(variations_dir, exist_ok=True)
    
    for image_name in test_images:
        image_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "test_images", image_name)
        
        if not os.path.exists(image_path):
            print(f"⚠️ Warning: Image {image_name} not found, skipping...")
            continue
            
        print(f"\nProcessing {image_name}...")
        
        # Process original image
        try:
            image = Image.open(image_path)
            hash_result = calculate_hash(image)
            hash_value = hash_result[0] if isinstance(hash_result, tuple) else hash_result
            quality = hash_result[1] if isinstance(hash_result, tuple) else 1.0
            print(f"✓ Original image processed")
            
            # Store original in database
            db.add_image(
                filename=image_name,
                file_hash=calculate_file_hash(image_path),
                hashes={'pdq': hash_value},
                is_variation=False,
                quality_scores={'pdq': quality}
            )
            
            # Create and store variations
            variations = create_variations(image_path)
            for i, variation in enumerate(variations, 1):
                variation_filename = f"variation_{image_name}_{i}.jpg"
                variation_full_path = os.path.join(variations_dir, variation_filename)
                variation.save(variation_full_path, "JPEG")
                
                hash_result = calculate_hash(variation)
                hash_value = hash_result[0] if isinstance(hash_result, tuple) else hash_result
                quality = hash_result[1] if isinstance(hash_result, tuple) else 0.9
                print(f"✓ Variation {i} processed")
                
                # Store variation in database
                db.add_image(
                    filename=variation_filename,
                    file_hash=calculate_file_hash(variation_full_path),
                    hashes={'pdq': hash_value},
                    is_variation=True,
                    quality_scores={'pdq': quality}
                )
                
        except Exception as e:
            print(f"❌ Error processing {image_name}: {str(e)}")
            continue
    
    print("\n✨ Test data generation complete!")

if __name__ == "__main__":
    print("Starting test data generation with real images...")
    generate_test_dataset()
    print("\nTest data generation complete!") 