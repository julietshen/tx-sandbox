from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, Query, Body
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import io
import numpy as np
from PIL import Image as PILImage
import pdqhash
import hashlib
import datetime
from pydantic import BaseModel

from database import get_db
from models import Image, Hash, Match, ReviewDecision, ReviewStatus, HashAlgorithm, Review
from queue_manager import queue_manager
from queue_config import QueueNames, CONTENT_CATEGORIES, ConfidenceLevels

router = APIRouter()

# Model definitions

class ImageResponse(BaseModel):
    id: int
    filename: str
    upload_date: str
    url: str
    hashes: List[Dict[str, Any]]
    
class MatchResponse(BaseModel):
    id: int
    algorithm: str
    distance: float
    match_date: str
    matched_image_id: int
    matched_image_filename: str
    
class ReviewRequest(BaseModel):
    result: str
    notes: Optional[str] = None
    
class QueueTaskRequest(BaseModel):
    image_id: int
    content_category: str
    hash_algorithm: str
    confidence_level: str
    is_escalated: Optional[bool] = False
    priority: Optional[int] = 0
    metadata: Optional[Dict[str, Any]] = None
    
class QueueTaskResponse(BaseModel):
    id: str
    image_id: int
    content_category: str
    hash_algorithm: str
    confidence_level: str
    is_escalated: bool
    status: str
    created_at: str
    
class QueueStatsResponse(BaseModel):
    queue_name: str
    content_category: str
    hash_algorithm: str
    is_escalated: bool
    pending: int
    active: int
    completed: int
    success_rate: float
    oldest_task_age: int
    
class QueueFilterParams(BaseModel):
    content_category: Optional[str] = None
    hash_algorithm: Optional[str] = None
    confidence_level: Optional[str] = None
    is_escalated: Optional[bool] = None

# --- Image Management Endpoints ---

@router.post("/images/upload")
async def upload_image(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload an image and calculate hashes for it."""
    try:
        # Read image file
        contents = await file.read()
        
        # Convert to PIL Image for processing
        pil_image = PILImage.open(io.BytesIO(contents))
        
        # Create Image record
        db_image = Image(
            filename=file.filename,
            content_type=file.content_type,
            data=contents
        )
        db.add(db_image)
        db.flush()  # Generate ID for the image
        
        # Calculate and store hashes
        # PDQ Hash
        img_array = np.array(pil_image)
        if len(img_array.shape) == 3 and img_array.shape[2] >= 3:
            # Convert to RGB if it's not already
            rgb_image = img_array[:,:,:3]
            # Ensure the array is contiguous
            if not rgb_image.flags['C_CONTIGUOUS']:
                rgb_image = np.ascontiguousarray(rgb_image)
            pdq_hash, quality = pdqhash.compute(rgb_image)
            hash_hex = ''.join([f'{x:02x}' for x in pdq_hash.tobytes()])
            
            db_hash = Hash(
                image_id=db_image.id,
                algorithm=HashAlgorithm.PDQ.value,
                hash_value=hash_hex,
                quality=float(quality)
            )
            db.add(db_hash)
        
        # MD5 Hash
        md5_hash = hashlib.md5(contents).hexdigest()
        db_hash = Hash(
            image_id=db_image.id,
            algorithm=HashAlgorithm.MD5.value,
            hash_value=md5_hash,
            quality=1.0
        )
        db.add(db_hash)
        
        # SHA1 Hash
        sha1_hash = hashlib.sha1(contents).hexdigest()
        db_hash = Hash(
            image_id=db_image.id,
            algorithm=HashAlgorithm.SHA1.value,
            hash_value=sha1_hash,
            quality=1.0
        )
        db.add(db_hash)
        
        # Create initial pending review decision
        review_decision = ReviewDecision(
            image_id=db_image.id,
            status=ReviewStatus.PENDING.value,
            reviewer="system",
            notes="Automatically created on upload"
        )
        db.add(review_decision)
        
        # Find similar images
        find_matches(db_image.id, db)
        
        db.commit()
        
        return {"success": True, "image_id": db_image.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error uploading image: {str(e)}")

@router.get("/images/{image_id}", response_model=ImageResponse)
async def get_image(image_id: int, db: Session = Depends(get_db)):
    """Get image metadata by ID."""
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    hashes = db.query(Hash).filter(Hash.image_id == image_id).all()
    hash_data = {}
    for hash_obj in hashes:
        hash_data[hash_obj.algorithm] = {
            "value": hash_obj.hash_value,
            "quality": hash_obj.quality
        }
    
    review = db.query(ReviewDecision).filter(
        ReviewDecision.image_id == image_id
    ).order_by(ReviewDecision.decision_date.desc()).first()
    
    matches = db.query(Match).filter(
        Match.query_image_id == image_id
    ).all()
    
    match_data = []
    for match in matches:
        matched_image = db.query(Image).filter(Image.id == match.matched_image_id).first()
        match_data.append({
            "match_id": match.id,
            "image_id": matched_image.id,
            "filename": matched_image.filename,
            "algorithm": match.algorithm,
            "distance": match.distance,
            "match_date": match.match_date
        })
    
    return {
        "id": image.id,
        "filename": image.filename,
        "content_type": image.content_type,
        "upload_date": image.upload_date,
        "hashes": hash_data,
        "review_status": review.status if review else None,
        "matches": match_data
    }

@router.get("/images/{image_id}/data")
async def get_image_data(image_id: int, db: Session = Depends(get_db)):
    """Get the actual image data by ID."""
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    return StreamingResponse(io.BytesIO(image.data), media_type=image.content_type)

@router.get("/images", response_model=List[ImageResponse])
async def get_images(
    status: Optional[str] = None,
    sort_by: str = "upload_date",
    sort_order: str = "desc",
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Get a list of images with optional filtering."""
    query = db.query(Image)
    
    # Apply filtering if status is provided
    if status:
        # Find images with the specified review status
        subquery = db.query(ReviewDecision.image_id).filter(
            ReviewDecision.status == status
        ).subquery()
        query = query.filter(Image.id.in_(subquery))
    
    # Apply sorting
    if sort_order.lower() == "asc":
        query = query.order_by(getattr(Image, sort_by))
    else:
        query = query.order_by(getattr(Image, sort_by).desc())
    
    # Apply pagination
    total = query.count()
    query = query.offset((page - 1) * limit).limit(limit)
    images = query.all()
    
    # Prepare result data
    results = []
    for image in images:
        # Get latest review decision
        review = db.query(ReviewDecision).filter(
            ReviewDecision.image_id == image.id
        ).order_by(ReviewDecision.decision_date.desc()).first()
        
        # Get match count
        match_count = db.query(Match).filter(Match.query_image_id == image.id).count()
        
        results.append({
            "id": image.id,
            "filename": image.filename,
            "upload_date": image.upload_date,
            "review_status": review.status if review else None,
            "match_count": match_count
        })
    
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "results": results
    }

@router.get("/images/{image_id}/matches", response_model=List[MatchResponse])
async def get_image_matches(image_id: int, db: Session = Depends(get_db)):
    matches = db.query(Match).filter(Match.query_image_id == image_id).all()
    return matches

# --- Review Endpoints ---

@router.post("/reviews")
async def create_review(
    image_id: int = Form(...),
    status: str = Form(...),
    reviewer: str = Form(...),
    notes: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Create a review decision for an image."""
    # Check if image exists
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Validate status
    if status not in [s.value for s in ReviewStatus]:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join([s.value for s in ReviewStatus])}")
    
    # Create review decision
    review = ReviewDecision(
        image_id=image_id,
        status=status,
        reviewer=reviewer,
        notes=notes
    )
    db.add(review)
    db.commit()
    
    return {"success": True, "review_id": review.id}

@router.get("/reviews/{image_id}")
async def get_reviews(image_id: int, db: Session = Depends(get_db)):
    """Get all review decisions for an image."""
    # Check if image exists
    image = db.query(Image).filter(Image.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Get reviews
    reviews = db.query(ReviewDecision).filter(
        ReviewDecision.image_id == image_id
    ).order_by(ReviewDecision.decision_date.desc()).all()
    
    results = []
    for review in reviews:
        results.append({
            "id": review.id,
            "status": review.status,
            "reviewer": review.reviewer,
            "decision_date": review.decision_date,
            "notes": review.notes
        })
    
    return results

# --- Match Endpoints ---

@router.get("/matches")
async def get_matches(
    image_id: Optional[int] = None,
    algorithm: Optional[str] = None,
    min_distance: Optional[float] = None,
    max_distance: Optional[float] = None,
    page: int = 1,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Get matches with optional filtering."""
    query = db.query(Match)
    
    # Apply filters
    if image_id:
        query = query.filter(Match.query_image_id == image_id)
    
    if algorithm:
        query = query.filter(Match.algorithm == algorithm)
    
    if min_distance is not None:
        query = query.filter(Match.distance >= min_distance)
    
    if max_distance is not None:
        query = query.filter(Match.distance <= max_distance)
    
    # Apply pagination
    total = query.count()
    query = query.offset((page - 1) * limit).limit(limit)
    matches = query.all()
    
    # Prepare result data
    results = []
    for match in matches:
        query_image = db.query(Image).filter(Image.id == match.query_image_id).first()
        matched_image = db.query(Image).filter(Image.id == match.matched_image_id).first()
        
        results.append({
            "id": match.id,
            "query_image": {
                "id": query_image.id,
                "filename": query_image.filename
            },
            "matched_image": {
                "id": matched_image.id,
                "filename": matched_image.filename
            },
            "algorithm": match.algorithm,
            "distance": match.distance,
            "match_date": match.match_date
        })
    
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "results": results
    }

# --- Helper Functions ---

def find_matches(image_id: int, db: Session):
    """Find and store matches for an image."""
    # Get the image and its hashes
    image_hashes = db.query(Hash).filter(Hash.image_id == image_id).all()
    
    # Group hashes by algorithm
    hashes_by_algo = {}
    for hash_obj in image_hashes:
        hashes_by_algo[hash_obj.algorithm] = hash_obj
    
    # For each algorithm, find potential matches
    for algo, hash_obj in hashes_by_algo.items():
        if algo == HashAlgorithm.PDQ.value:
            # For PDQ, find images with similar PDQ hashes
            pdq_matches = find_pdq_matches(hash_obj.hash_value, db, image_id)
            for match in pdq_matches:
                db_match = Match(
                    query_image_id=image_id,
                    matched_image_id=match["image_id"],
                    algorithm=algo,
                    distance=match["distance"]
                )
                db.add(db_match)
        
        elif algo in [HashAlgorithm.MD5.value, HashAlgorithm.SHA1.value]:
            # For cryptographic hashes, find exact matches
            crypto_matches = find_crypto_matches(hash_obj.hash_value, algo, db, image_id)
            for match in crypto_matches:
                db_match = Match(
                    query_image_id=image_id,
                    matched_image_id=match["image_id"],
                    algorithm=algo,
                    distance=0.0  # Exact match
                )
                db.add(db_match)
    
    db.commit()

def find_pdq_matches(hash_value: str, db: Session, exclude_image_id: int = None, threshold: float = 0.2):
    """Find images with similar PDQ hashes."""
    # Get all PDQ hashes
    pdq_hashes = db.query(Hash).join(Image).filter(
        Hash.algorithm == HashAlgorithm.PDQ.value,
        Hash.image_id != exclude_image_id
    ).all()
    
    matches = []
    for hash_obj in pdq_hashes:
        # Calculate Hamming distance
        distance = calculate_pdq_distance(hash_value, hash_obj.hash_value)
        
        # Add to matches if below threshold
        if distance <= threshold:
            matches.append({
                "image_id": hash_obj.image_id,
                "hash_value": hash_obj.hash_value,
                "distance": distance
            })
    
    # Sort by distance (most similar first)
    matches.sort(key=lambda x: x["distance"])
    return matches

def find_crypto_matches(hash_value: str, algorithm: str, db: Session, exclude_image_id: int = None):
    """Find images with matching cryptographic hashes."""
    matches = []
    
    # Find exact matches
    hash_objs = db.query(Hash).join(Image).filter(
        Hash.algorithm == algorithm,
        Hash.hash_value == hash_value,
        Hash.image_id != exclude_image_id
    ).all()
    
    for hash_obj in hash_objs:
        matches.append({
            "image_id": hash_obj.image_id,
            "hash_value": hash_obj.hash_value,
            "distance": 0.0
        })
    
    return matches

def calculate_pdq_distance(hash1: str, hash2: str) -> float:
    """Calculate the normalized Hamming distance between two PDQ hashes."""
    # Convert hex strings to binary
    bin1 = ''.join([format(int(c, 16), '04b') for c in hash1])
    bin2 = ''.join([format(int(c, 16), '04b') for c in hash2])
    
    # Calculate Hamming distance
    hamming_distance = sum(b1 != b2 for b1, b2 in zip(bin1, bin2))
    
    # Normalize to 0-1 range
    normalized_distance = hamming_distance / len(bin1)
    
    return normalized_distance

# --- Queue Endpoints ---

@router.post("/queues/tasks", response_model=Dict[str, str])
def add_task(task: QueueTaskRequest):
    """Add a new task to the review queue."""
    try:
        job_id = queue_manager.add_review_task(
            image_id=task.image_id,
            content_category=task.content_category,
            hash_algorithm=task.hash_algorithm,
            confidence_level=task.confidence_level,
            is_escalated=task.is_escalated,
            priority=task.priority,
            metadata=task.metadata
        )
        return {"jobId": job_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
@router.get("/queues/tasks/next", response_model=Optional[Dict[str, Any]])
def get_next_task(
    content_categories: Optional[List[str]] = Query(None),
    hash_algorithms: Optional[List[str]] = Query(None),
    confidence_levels: Optional[List[str]] = Query(None),
    is_escalated: Optional[bool] = Query(None)
):
    """Get the next task from the queue based on filters."""
    task = queue_manager.get_next_task(
        content_categories=content_categories,
        hash_algorithms=hash_algorithms,
        confidence_levels=confidence_levels,
        is_escalated=is_escalated
    )
    return task
    
@router.post("/queues/tasks/{job_id}/complete")
def complete_task(job_id: str, result: str = Form(...), notes: Optional[str] = Form(None)):
    """Complete a review task with a result."""
    if result not in ["approved", "rejected", "escalated"]:
        raise HTTPException(status_code=400, detail="Invalid result")
        
    success = queue_manager.complete_task(job_id, result, notes)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")
        
    return {"status": "success"}
    
@router.get("/queues/stats", response_model=List[Dict[str, Any]])
def get_queue_stats(
    content_category: Optional[str] = Query(None),
    hash_algorithm: Optional[str] = Query(None),
    is_escalated: Optional[bool] = Query(None)
):
    """Get statistics for queues matching the filters."""
    stats = queue_manager.get_queue_stats(
        content_category=content_category,
        hash_algorithm=hash_algorithm,
        is_escalated=is_escalated
    )
    return stats
    
@router.get("/queues/config")
def get_queue_config():
    """Get queue configuration options."""
    return {
        "hashAlgorithms": QueueNames.get_all(),
        "contentCategories": CONTENT_CATEGORIES,
        "confidenceLevels": ConfidenceLevels.get_all()
    }
