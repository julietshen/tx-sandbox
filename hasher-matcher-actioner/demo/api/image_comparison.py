from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from PIL import Image
import io
import sys
import os
import base64
from typing import List, Optional
import pdqhash
import signal
import subprocess
import time
import logging

from database import Database

app = FastAPI()
db = Database()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def image_to_array(image_file: UploadFile) -> np.ndarray:
    """Convert uploaded image to numpy array."""
    contents = image_file.file.read()
    image = Image.open(io.BytesIO(contents))
    return np.array(image)

def base64_to_array(base64_str: str) -> np.ndarray:
    """Convert base64 image to numpy array."""
    try:
        # Remove data URL prefix if present
        if ',' in base64_str:
            base64_str = base64_str.split(',')[1]
        image_data = base64.b64decode(base64_str)
        image = Image.open(io.BytesIO(image_data))
        return np.array(image)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 image: {str(e)}")

def clear_port_8000():
    """Kill any process using port 8000."""
    try:
        # Find and kill processes using port 8000
        subprocess.run("lsof -ti:8000 | xargs kill -9", shell=True)
        time.sleep(1)  # Give the system time to free up the port
    except Exception:
        pass  # Ignore errors if no process is found

@app.post("/compare")
async def compare_images(image1: UploadFile = File(...), image2: UploadFile = File(...)):
    """Compare two images using various HMA algorithms."""
    try:
        # Log incoming request
        logger.info(f"Comparing images: {image1.filename} and {image2.filename}")

        # Convert images to numpy arrays
        try:
            img1_array = image_to_array(image1)
            logger.info(f"Image 1 shape: {img1_array.shape}, dtype: {img1_array.dtype}")
        except Exception as e:
            logger.error(f"Error processing image 1: {str(e)}")
            return {"error": f"Failed to process image 1: {str(e)}"}

        try:
            img2_array = image_to_array(image2)
            logger.info(f"Image 2 shape: {img2_array.shape}, dtype: {img2_array.dtype}")
        except Exception as e:
            logger.error(f"Error processing image 2: {str(e)}")
            return {"error": f"Failed to process image 2: {str(e)}"}

        # Calculate PDQ hashes
        try:
            hash1, quality1 = pdqhash.compute(img1_array)
            # Convert numpy array to bytes, then to hex string
            hash1_val = hash1.tobytes().hex()
            logger.info(f"Hash 1 computed, quality: {quality1}")
        except Exception as e:
            logger.error(f"Error computing hash for image 1: {str(e)}")
            return {"error": f"Failed to compute hash for image 1: {str(e)}"}

        try:
            hash2, quality2 = pdqhash.compute(img2_array)
            # Convert numpy array to bytes, then to hex string
            hash2_val = hash2.tobytes().hex()
            logger.info(f"Hash 2 computed, quality: {quality2}")
        except Exception as e:
            logger.error(f"Error computing hash for image 2: {str(e)}")
            return {"error": f"Failed to compute hash for image 2: {str(e)}"}

        # Store hashes in database
        try:
            db.store_hash(hash1_val, {"source": "compare_endpoint", "quality": float(quality1)})
            db.store_hash(hash2_val, {"source": "compare_endpoint", "quality": float(quality2)})
            logger.info("Hashes stored in database")
        except Exception as e:
            logger.error(f"Error storing hashes in database: {str(e)}")
            return {"error": f"Failed to store hashes: {str(e)}"}

        # Calculate distance by converting hex strings back to integers for XOR
        try:
            hash1_int = int(hash1_val, 16)
            hash2_int = int(hash2_val, 16)
            distance = bin(hash1_int ^ hash2_int).count('1')
            logger.info(f"Computed distance: {distance}")
        except Exception as e:
            logger.error(f"Error calculating distance: {str(e)}")
            return {"error": f"Failed to calculate distance: {str(e)}"}

        return {
            "pdq_distance": float(distance),
            "quality1": float(quality1),
            "quality2": float(quality2),
            "success": True
        }
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return {"error": f"Unexpected error: {str(e)}"}
    finally:
        image1.file.close()
        image2.file.close()

@app.post("/find_nearest")
async def find_nearest_matches(
    image: Optional[UploadFile] = File(None),
    base64_image: Optional[str] = None,
    hash_value: Optional[str] = None,
    threshold: float = 100  # PDQ threshold for considering matches
):
    """Find nearest matches for an image in the database."""
    try:
        # Get query hash
        if image:
            query_array = image_to_array(image)
            query_hash, _ = pdqhash.compute(query_array)  # Unpack tuple
            query_hash = query_hash.tobytes().hex()  # Convert to hex string
        elif base64_image:
            query_array = base64_to_array(base64_image)
            query_hash, _ = pdqhash.compute(query_array)  # Unpack tuple
            query_hash = query_hash.tobytes().hex()  # Convert to hex string
        elif hash_value:
            query_hash = hash_value
        else:
            raise HTTPException(status_code=400, detail="Must provide either image, base64_image, or hash_value")

        # Store the query hash
        if image or base64_image:
            db.store_hash(query_hash, {"source": "find_nearest_endpoint"})

        # Get all hashes from database
        all_hashes = db.get_all_hashes()
        
        # Calculate distances and find matches
        matches = []
        for id_, stored_hash, metadata in all_hashes:
            # Convert hex strings to integers for XOR operation
            stored_hash_int = int(stored_hash, 16)
            query_hash_int = int(query_hash, 16)
            distance = bin(stored_hash_int ^ query_hash_int).count('1')
            if distance <= threshold:
                matches.append({
                    "id": id_,
                    "distance": float(distance),
                    "metadata": metadata
                })
        
        # Sort matches by distance
        matches.sort(key=lambda x: x["distance"])
        
        return {
            "matches": matches,
            "total_matches": len(matches)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if image:
            image.file.close()

@app.get("/random_hash")
async def get_random_hash():
    """Get a random hash from the database."""
    result = db.get_random_hash()
    if result:
        id_, hash_value, metadata = result
        return {
            "id": id_,
            "hash": hash_value,
            "metadata": metadata
        }
    raise HTTPException(status_code=404, detail="No hashes found in database")

if __name__ == "__main__":
    # Clear port 8000 before starting
    clear_port_8000()
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 