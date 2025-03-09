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
import warnings

# Import and configure warnings
warnings.filterwarnings("ignore", message="Hash vector order changed between version")

from fastapi import FastAPI, UploadFile, File, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from PIL import Image
import io

from database import Database

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class HashingAlgorithm(str, Enum):
    PDQ = "pdq"  # Perceptual hash for similar image detection
    MD5 = "md5"  # Cryptographic hash for exact matching
    SHA1 = "sha1"  # Cryptographic hash for exact matching
    PHOTODNA = "photodna"  # Microsoft PhotoDNA (requires license)
    NETCLEAN = "netclean"  # NetClean (requires license)

# License configuration
PHOTODNA_LICENSE_KEY = os.getenv("PHOTODNA_LICENSE_KEY")
NETCLEAN_LICENSE_KEY = os.getenv("NETCLEAN_LICENSE_KEY")

def check_algorithm_availability(algorithm: HashingAlgorithm) -> tuple[bool, str]:
    """Check if an algorithm is available based on license status."""
    if algorithm == HashingAlgorithm.PHOTODNA:
        if not PHOTODNA_LICENSE_KEY:
            return False, "PhotoDNA requires a license. Please contact Microsoft at https://www.microsoft.com/en-us/photodna"
        return True, ""
    elif algorithm == HashingAlgorithm.NETCLEAN:
        if not NETCLEAN_LICENSE_KEY:
            return False, "NetClean requires a license. Please contact NetClean at https://www.netclean.com/"
        return True, ""
    return True, ""

app = FastAPI(
    title="Image Comparison API",
    description="API for comparing images using various hashing algorithms",
    version="1.0.0"
)
db = Database()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def compute_hash(image: np.ndarray, algorithm: HashingAlgorithm) -> tuple[str, float]:
    """Compute hash using specified algorithm."""
    try:
        # Check algorithm availability
        available, message = check_algorithm_availability(algorithm)
        if not available:
            logger.warning(f"Algorithm {algorithm} not available: {message}")
            return "algorithm_not_licensed", 0.0

        if algorithm == HashingAlgorithm.PDQ:
            # Ensure image is RGB and contiguous
            if image.shape[-1] == 4:
                image = image[..., :3]
            if not image.flags['C_CONTIGUOUS']:
                image = np.ascontiguousarray(image)
            hash_val, quality = pdqhash.compute(image)
            hash_hex = ''.join([f'{x:02x}' for x in hash_val.tobytes()])
            return hash_hex, float(quality)
        elif algorithm == HashingAlgorithm.PHOTODNA:
            # PhotoDNA implementation would go here if licensed
            return "photodna_not_implemented", 0.0
        elif algorithm == HashingAlgorithm.NETCLEAN:
            # NetClean implementation would go here if licensed
            return "netclean_not_implemented", 0.0
        
        # For cryptographic hashes, use PIL image bytes
        pil_image = Image.fromarray(image)
        img_bytes = pil_image.tobytes()
        
        if algorithm == HashingAlgorithm.MD5:
            return hashlib.md5(img_bytes).hexdigest(), 100.0
        elif algorithm == HashingAlgorithm.SHA1:
            return hashlib.sha1(img_bytes).hexdigest(), 100.0
        
        raise ValueError(f"Unsupported algorithm: {algorithm}")
    except Exception as e:
        logger.error(f"Error computing {algorithm} hash: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

def calculate_hash_distance(hash1: str, hash2: str, algorithm: HashingAlgorithm) -> float:
    """Calculate distance between two hashes."""
    try:
        # Check for unlicensed algorithms
        if hash1 in ["algorithm_not_licensed", "photodna_not_implemented", "netclean_not_implemented"] or \
           hash2 in ["algorithm_not_licensed", "photodna_not_implemented", "netclean_not_implemented"]:
            return 100.0  # Return max distance for unlicensed/unimplemented algorithms

        if algorithm == HashingAlgorithm.PDQ:
            # PDQ uses Hamming distance - handle large integers by processing hex strings directly
            def hex_to_bin(hex_str):
                return ''.join(format(int(c, 16), '04b') for c in hex_str)
            
            bin1 = hex_to_bin(hash1)
            bin2 = hex_to_bin(hash2)
            # Count differing bits and normalize to [0,1]
            total_bits = len(bin1)
            hamming_distance = sum(b1 != b2 for b1, b2 in zip(bin1, bin2))
            return float(hamming_distance) / total_bits
        elif algorithm in [HashingAlgorithm.PHOTODNA, HashingAlgorithm.NETCLEAN]:
            # Licensed algorithm distance calculations would go here
            return 100.0
        else:
            # For cryptographic hashes, only exact matches matter
            return 0.0 if hash1 == hash2 else 100.0
    except Exception as e:
        logger.error(f"Error calculating distance for {algorithm}: {str(e)}")
        return 100.0  # Return max distance on error

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

@app.get("/")
async def root():
    """Welcome endpoint with API information."""
    return {
        "message": "Welcome to the Image Comparison API",
        "endpoints": {
            "/": "This welcome message",
            "/docs": "Interactive API documentation",
            "/redoc": "Alternative API documentation",
            "/compare": "Compare two images using various hashing algorithms",
            "/find_nearest": "Find nearest matches for an image in the database"
        },
        "supported_algorithms": [algo.value for algo in HashingAlgorithm]
    }

@app.post("/compare")
async def compare_images(image1: UploadFile = File(...), image2: UploadFile = File(...)):
    """Compare two images using supported hash algorithms."""
    try:
        # Convert images to numpy arrays
        img1 = np.array(Image.open(io.BytesIO(await image1.read())))
        img2 = np.array(Image.open(io.BytesIO(await image2.read())))
        
        logger.info(f"Comparing images: {image1.filename} and {image2.filename}")
        logger.info(f"Image shapes: {img1.shape}, {img2.shape}")
        
        results = {}
        for algorithm in HashingAlgorithm:
            try:
                # Calculate hashes
                hash1, quality1 = compute_hash(img1, algorithm)
                hash2, quality2 = compute_hash(img2, algorithm)
                
                # Calculate distance and interpretation
                distance = calculate_hash_distance(hash1, hash2, algorithm)
                interpretation = get_similarity_interpretation(distance, algorithm)
                
                results[algorithm] = {
                    "distance": float(distance),  # Ensure distance is a float
                    "quality1": float(quality1),  # Ensure quality is a float
                    "quality2": float(quality2),  # Ensure quality is a float
                    "interpretation": interpretation,
                    "hash1": hash1,
                    "hash2": hash2
                }
                
                logger.info(f"Computed {algorithm} hash with distance: {distance}")
                
            except Exception as e:
                logger.error(f"Error processing {algorithm}: {str(e)}")
                results[algorithm] = {
                    "error": str(e),
                    "distance": 100.0,  # Default to maximum distance on error
                    "quality1": 0.0,
                    "quality2": 0.0,
                    "interpretation": "Error calculating similarity"
                }
        
        return {"results": results, "success": True}
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return {"error": str(e), "success": False}
    finally:
        await image1.close()
        await image2.close()

def get_similarity_interpretation(distance: float, algorithm: HashingAlgorithm) -> str:
    """Get human-readable interpretation of the distance."""
    if algorithm == HashingAlgorithm.PDQ:
        certainty = max(0, min(100, (1 - distance/256) * 100))
        if distance <= 30:
            return f"These images are nearly identical ({certainty:.1f}% match)"
        elif distance <= 80:
            return f"These images are visually similar ({certainty:.1f}% match)"
        else:
            return f"These images are different ({certainty:.1f}% match)"
    elif algorithm in [HashingAlgorithm.MD5, HashingAlgorithm.SHA1]:
        return "Images are exactly identical" if distance == 0 else "Images are different"
    elif algorithm == HashingAlgorithm.PHOTODNA:
        available, message = check_algorithm_availability(algorithm)
        if not available:
            return "PhotoDNA requires a license - Contact Microsoft for access"
        return "PhotoDNA comparison not available (requires license)"
    elif algorithm == HashingAlgorithm.NETCLEAN:
        available, message = check_algorithm_availability(algorithm)
        if not available:
            return "NetClean requires a license - Contact NetClean for access"
        return "NetClean comparison not available (requires license)"
    else:
        return "Unknown algorithm"

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