import sys
import os
import base64
from typing import List, Optional, Dict, Tuple
import pdqhash
import signal
import subprocess
import time
import logging
from enum import Enum
import hashlib
import imagehash
from skimage.color import rgb2gray

# Increase the limit for integer string conversion
sys.set_int_max_str_digits(1000000)

from fastapi import FastAPI, UploadFile, File, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from PIL import Image
import io

from database import Database

class HashingAlgorithm(str, Enum):
    PHOTODNA = "photodna"  # Required for NCMEC
    PDQ = "pdq"  # Optional but recommended
    MD5 = "md5"  # Optional
    SHA1 = "sha1"  # Optional
    NETCLEAN = "netclean"  # Optional

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

def compute_hash(image: np.ndarray, algorithm: HashingAlgorithm) -> Tuple[str, float]:
    """Compute hash using specified algorithm."""
    # Convert to PIL Image for some algorithms
    pil_image = Image.fromarray(image)
    
    if algorithm == HashingAlgorithm.PHOTODNA:
        # Note: PhotoDNA requires licensing from Microsoft
        raise NotImplementedError("PhotoDNA requires licensing from Microsoft")
    
    elif algorithm == HashingAlgorithm.PDQ:
        # Convert image to RGB if it's RGBA
        if image.shape[-1] == 4:
            image = image[..., :3]
        # Ensure image is contiguous and in correct format
        if not image.flags['C_CONTIGUOUS']:
            image = np.ascontiguousarray(image)
        hash_val, quality = pdqhash.compute(image)
        # Convert numpy array to hex string
        hash_bytes = hash_val.tobytes()
        hash_hex = ''.join([f'{x:02x}' for x in hash_bytes])
        return hash_hex, float(quality)
    
    elif algorithm == HashingAlgorithm.MD5:
        # Convert to bytes and compute MD5
        img_bytes = pil_image.tobytes()
        hash_val = hashlib.md5(img_bytes).hexdigest()
        return hash_val, 100.0
    
    elif algorithm == HashingAlgorithm.SHA1:
        # Convert to bytes and compute SHA1
        img_bytes = pil_image.tobytes()
        hash_val = hashlib.sha1(img_bytes).hexdigest()
        return hash_val, 100.0
    
    elif algorithm == HashingAlgorithm.NETCLEAN:
        # Note: NetClean requires licensing
        raise NotImplementedError("NetClean requires licensing")
    
    else:
        raise ValueError(f"Unsupported hashing algorithm: {algorithm}")

def calculate_hash_distance(hash1: str, hash2: str, algorithm: HashingAlgorithm) -> float:
    """Calculate distance between two hashes based on the algorithm used."""
    if algorithm == HashingAlgorithm.PDQ:
        # PDQ uses Hamming distance on hex strings
        hash1_int = int(hash1, 16)
        hash2_int = int(hash2, 16)
        return float(bin(hash1_int ^ hash2_int).count('1'))
    
    elif algorithm in [HashingAlgorithm.MD5, HashingAlgorithm.SHA1, HashingAlgorithm.NETCLEAN, HashingAlgorithm.PHOTODNA]:
        # For cryptographic hashes and licensed algorithms, we can only check equality
        return 0.0 if hash1 == hash2 else -1.0  # Using -1 to represent "different" instead of infinity
    
    else:
        raise ValueError(f"Unsupported hashing algorithm: {algorithm}")

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

def find_available_port(start_port: int = 8000, max_attempts: int = 10) -> int:
    """Find an available port starting from start_port."""
    for port in range(start_port, start_port + max_attempts):
        try:
            import socket
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('0.0.0.0', port))
                return port
        except OSError:
            continue
    raise RuntimeError(f"Could not find an available port in range {start_port}-{start_port + max_attempts - 1}")

@app.post("/compare")
async def compare_images(
    image1: UploadFile = File(...), 
    image2: UploadFile = File(...),
    x_photodna_key: Optional[str] = Header(None),
    x_netclean_key: Optional[str] = Header(None)
):
    """Compare two images using all supported HMA algorithms."""
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

        results = {}
        
        # Compute hashes and distances for all algorithms
        for algorithm in HashingAlgorithm:
            try:
                # Skip PhotoDNA if no API key provided
                if algorithm == HashingAlgorithm.PHOTODNA and not x_photodna_key:
                    results[algorithm] = {
                        "error": "PhotoDNA requires a valid API key. Contact Microsoft to request access."
                    }
                    continue

                # Skip NetClean if no API key provided
                if algorithm == HashingAlgorithm.NETCLEAN and not x_netclean_key:
                    results[algorithm] = {
                        "error": "NetClean requires a valid API key. Contact NetClean to request access."
                    }
                    continue

                # Calculate hashes
                hash1_val, quality1 = compute_hash(img1_array, algorithm)
                hash2_val, quality2 = compute_hash(img2_array, algorithm)
                
                # Calculate distance
                distance = calculate_hash_distance(hash1_val, hash2_val, algorithm)
                
                # Get interpretation
                interpretation = get_similarity_interpretation(distance, algorithm)
                
                # Store results
                results[algorithm] = {
                    "distance": float(distance),
                    "quality1": float(quality1),
                    "quality2": float(quality2),
                    "interpretation": interpretation
                }
                
                # Store hashes in database
                db.store_hash(hash1_val, {
                    "source": "compare_endpoint",
                    "quality": float(quality1),
                    "algorithm": algorithm
                })
                db.store_hash(hash2_val, {
                    "source": "compare_endpoint",
                    "quality": float(quality2),
                    "algorithm": algorithm
                })
                
                logger.info(f"Computed {algorithm} hash with distance: {distance}")
                
            except NotImplementedError as e:
                logger.error(f"Algorithm not implemented: {str(e)}")
                results[algorithm] = {"error": str(e)}
            except Exception as e:
                logger.error(f"Error computing {algorithm} hash: {str(e)}")
                results[algorithm] = {"error": str(e)}

        return {
            "results": results,
            "success": True
        }
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return {"error": f"Unexpected error: {str(e)}"}
    finally:
        image1.file.close()
        image2.file.close()

def get_similarity_interpretation(distance: float, algorithm: HashingAlgorithm) -> str:
    """Get human-readable interpretation of the distance based on the algorithm."""
    if algorithm == HashingAlgorithm.PDQ:
        if distance <= 30:
            return "Very similar images (likely variations of the same image)"
        elif distance <= 80:
            return "Moderately similar images"
        else:
            return "Different images"
            
    elif algorithm in [HashingAlgorithm.MD5, HashingAlgorithm.SHA1, HashingAlgorithm.NETCLEAN, HashingAlgorithm.PHOTODNA]:
        if distance == 0:
            return "Identical images (exact match)"
        else:
            return "Different images"

@app.post("/find_nearest")
async def find_nearest_matches(
    image: Optional[UploadFile] = File(None),
    base64_image: Optional[str] = None,
    hash_value: Optional[str] = None,
    algorithm: HashingAlgorithm = HashingAlgorithm.PDQ,
    threshold: float = 100  # PDQ threshold for considering matches
):
    """Find nearest matches for an image in the database using the specified algorithm."""
    try:
        # Get query hash
        if image:
            query_array = image_to_array(image)
            query_hash, quality = compute_hash(query_array, algorithm)
        elif base64_image:
            query_array = base64_to_array(base64_image)
            query_hash, quality = compute_hash(query_array, algorithm)
        elif hash_value:
            query_hash = hash_value
            quality = None
        else:
            raise HTTPException(status_code=400, detail="Must provide either image, base64_image, or hash_value")

        # Store the query hash if it came from an image
        if image or base64_image:
            db.store_hash(query_hash, {
                "source": "find_nearest_endpoint",
                "quality": quality,
                "algorithm": algorithm
            })

        # Get all hashes from database
        all_hashes = db.get_all_hashes()
        
        # Calculate distances and find matches
        matches = []
        for id_, stored_hash, metadata in all_hashes:
            # Only compare hashes generated with the same algorithm
            if metadata.get("algorithm", HashingAlgorithm.PDQ) == algorithm:
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
            "total_matches": len(matches),
            "algorithm": algorithm
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
    # Try to clear port 8000 first
    clear_port_8000()
    
    # Find an available port
    try:
        port = find_available_port()
        print(f"Starting server on port {port}")
        import uvicorn
        uvicorn.run(app, host="0.0.0.0", port=port)
    except Exception as e:
        print(f"Failed to start server: {e}") 