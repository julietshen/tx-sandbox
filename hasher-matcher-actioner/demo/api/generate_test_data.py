import os
import random
from PIL import Image, ImageDraw
import hashlib
import json
from database import db
from datetime import datetime
import io

def generate_random_image(width=256, height=256):
    """Generate a random image with shapes."""
    image = Image.new('RGB', (width, height), 'white')
    draw = ImageDraw.Draw(image)
    
    # Add random shapes
    for _ in range(random.randint(3, 8)):
        shape_type = random.choice(['rectangle', 'ellipse'])
        color = (
            random.randint(0, 255),
            random.randint(0, 255),
            random.randint(0, 255)
        )
        x1 = random.randint(0, width)
        y1 = random.randint(0, height)
        x2 = random.randint(x1, width)
        y2 = random.randint(y1, height)
        
        if shape_type == 'rectangle':
            draw.rectangle([x1, y1, x2, y2], fill=color)
        else:
            draw.ellipse([x1, y1, x2, y2], fill=color)
    
    return image

def create_similar_image(original_image, similarity_level=0.8):
    """Create a similar image by modifying the original."""
    width, height = original_image.size
    similar = original_image.copy()
    
    # Add noise based on similarity level
    pixels = similar.load()
    noise_factor = 1 - similarity_level
    
    for x in range(width):
        for y in range(height):
            if random.random() < noise_factor:
                pixels[x, y] = (
                    random.randint(0, 255),
                    random.randint(0, 255),
                    random.randint(0, 255)
                )
    
    return similar

def calculate_hash(image):
    """Calculate a simple perceptual hash of the image."""
    # Resize to 8x8
    small_image = image.resize((8, 8), Image.Resampling.LANCZOS)
    # Convert to grayscale
    gray_image = small_image.convert('L')
    # Calculate average pixel value
    pixels = list(gray_image.getdata())
    avg_pixel = sum(pixels) / len(pixels)
    # Create hash
    hash_bits = ['1' if pixel > avg_pixel else '0' for pixel in pixels]
    return ''.join(hash_bits)

def generate_test_dataset(num_original_images=10, num_variations_per_image=3):
    """Generate a test dataset with original images and their variations."""
    print(f"Generating {num_original_images} original images with {num_variations_per_image} variations each...")
    
    for i in range(num_original_images):
        # Generate original image
        original = generate_random_image()
        original_hash = calculate_hash(original)
        
        # Save original image to bytes
        img_byte_arr = io.BytesIO()
        original.save(img_byte_arr, format='PNG')
        img_byte_arr = img_byte_arr.getvalue()
        
        # Add original to database
        original_id = db.add_image(
            filename=f"original_{i}.png",
            file_hash=hashlib.sha256(img_byte_arr).hexdigest(),
            hashes={
                "pdq": original_hash,
                "md5": hashlib.md5(img_byte_arr).hexdigest(),
                "sha1": hashlib.sha1(img_byte_arr).hexdigest(),
                "photodna": f"photodna_hash_{i}",  # Placeholder
                "netclean": f"netclean_hash_{i}"   # Placeholder
            }
        )
        
        print(f"Generated original image {i+1}/{num_original_images}")
        
        # Generate variations
        for j in range(num_variations_per_image):
            similarity = random.uniform(0.7, 0.95)
            variation = create_similar_image(original, similarity)
            variation_hash = calculate_hash(variation)
            
            # Save variation to bytes
            var_byte_arr = io.BytesIO()
            variation.save(var_byte_arr, format='PNG')
            var_byte_arr = var_byte_arr.getvalue()
            
            # Add variation to database
            variation_id = db.add_image(
                filename=f"variation_{i}_{j}.png",
                file_hash=hashlib.sha256(var_byte_arr).hexdigest(),
                hashes={
                    "pdq": variation_hash,
                    "md5": hashlib.md5(var_byte_arr).hexdigest(),
                    "sha1": hashlib.sha1(var_byte_arr).hexdigest(),
                    "photodna": f"photodna_hash_{i}_{j}",  # Placeholder
                    "netclean": f"netclean_hash_{i}_{j}"   # Placeholder
                }
            )
            
            # Add comparison to database
            hamming_distance = sum(1 for a, b in zip(original_hash, variation_hash) if a != b)
            normalized_distance = hamming_distance / len(original_hash)
            
            db.add_comparison(
                original_id,
                variation_id,
                {
                    "pdq": normalized_distance,
                    "md5": 1.0,  # Different files will have different MD5
                    "sha1": 1.0, # Different files will have different SHA1
                    "photodna": random.uniform(0.0, 0.3),  # Placeholder
                    "netclean": random.uniform(0.0, 0.3)   # Placeholder
                }
            )
            
            print(f"Generated variation {j+1}/{num_variations_per_image} for original {i+1}")

if __name__ == "__main__":
    print("Starting test data generation...")
    generate_test_dataset()
    print("Test data generation complete!") 