from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import hashlib
import io
from PIL import Image
from typing import Dict, List, Optional
from .database import db
import os
import random
from datetime import datetime

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def calculate_file_hash(file_contents: bytes) -> str:
    """Calculate a unique hash for the file contents."""
    return hashlib.sha256(file_contents).hexdigest()

@app.post("/compare")
async def compare_images(image1: UploadFile, image2: UploadFile):
    try:
        # Read both images
        img1_content = await image1.read()
        img2_content = await image2.read()
        
        # Calculate file hashes
        img1_hash = calculate_file_hash(img1_content)
        img2_hash = calculate_file_hash(img2_content)

        # Your existing comparison logic here
        # This is a placeholder - implement actual comparison
        results = {
            "pdq": {"distance": 0.5, "quality1": 0.8, "quality2": 0.9},
            "md5": {"distance": 1.0 if img1_hash != img2_hash else 0.0},
            "sha1": {"distance": 1.0},
            "photodna": {"distance": 0.7},
            "netclean": {"distance": 0.6}
        }

        # Store images and comparison results in database
        img1_id = db.add_image(
            filename=image1.filename,
            file_hash=img1_hash,
            hashes={algo: str(result.get("hash", "")) for algo, result in results.items()}
        )
        
        img2_id = db.add_image(
            filename=image2.filename,
            file_hash=img2_hash,
            hashes={algo: str(result.get("hash", "")) for algo, result in results.items()}
        )

        # Store comparison results
        db.add_comparison(
            img1_id,
            img2_id,
            {algo: result["distance"] for algo, result in results.items()}
        )

        return {
            "success": True,
            "results": results
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/similarity-search")
async def find_similar(
    image: Optional[UploadFile] = None,
    hash_type: str = "pdq",
    hash_value: Optional[str] = None,
    threshold: float = 0.8
):
    try:
        if image:
            # Process uploaded image
            img_content = await image.read()
            img = Image.open(io.BytesIO(img_content))
            # Calculate hash for the uploaded image using our test implementation
            from .generate_test_data import calculate_hash
            hash_value = calculate_hash(img)
        
        if not hash_value:
            raise HTTPException(status_code=400, detail="Either image or hash_value must be provided")

        # Find similar images
        similar_images = db.find_similar_images(hash_type, hash_value, threshold)
        
        # Calculate distances for each result
        for image in similar_images:
            if hash_type == "pdq":
                # Calculate Hamming distance for PDQ hashes
                target_hash = image['hashes']['pdq']
                if target_hash and hash_value:
                    distance = sum(1 for a, b in zip(hash_value, target_hash) if a != b) / len(hash_value)
                    image['distance'] = distance
            elif hash_type in ["md5", "sha1"]:
                # Binary comparison for cryptographic hashes
                target_hash = image['hashes'][hash_type]
                image['distance'] = 0.0 if target_hash == hash_value else 1.0
            else:
                # For PhotoDNA and NetClean, we'll use placeholder distances
                # In a real implementation, these would use their respective algorithms
                image['distance'] = random.uniform(0.0, 1.0)

        # Filter results by threshold
        similar_images = [
            img for img in similar_images 
            if img['distance'] <= threshold
        ]

        # Sort by distance
        similar_images.sort(key=lambda x: x['distance'])
        
        return {
            "success": True,
            "results": similar_images[:50]  # Limit to top 50 results
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.get("/random-image")
async def get_random_image():
    try:
        image = db.get_random_image()
        if not image:
            raise HTTPException(status_code=404, detail="No images found in database")
        
        return {
            "success": True,
            "image": image
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

# Add more endpoints as needed 