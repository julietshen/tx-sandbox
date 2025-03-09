#!/usr/bin/env python3
"""
Seed script to populate Redis queues with test data using existing test images.
This script allows testing of the HMA Review Tool with realistic data.
"""

import os
import sys
import time
import random
import glob
from pathlib import Path

# Add the current directory to the path so we can import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from queue_manager import queue_manager
from queue_config import CONTENT_CATEGORIES, QueueNames, ConfidenceLevels

# Path to test images - adjust these paths to match your environment
DEMO_PATH = Path("../demo")
TEST_IMAGES_PATH = DEMO_PATH / "test_images"
VARIATIONS_PATH = DEMO_PATH / "variations"

# Check if paths exist
if not TEST_IMAGES_PATH.exists():
    TEST_IMAGES_PATH = Path("../../demo/test_images")
    
if not VARIATIONS_PATH.exists():
    VARIATIONS_PATH = Path("../../demo/variations")

if not TEST_IMAGES_PATH.exists() or not VARIATIONS_PATH.exists():
    print("Error: Could not find test images or variations directories.")
    print(f"Looked in: {TEST_IMAGES_PATH} and {VARIATIONS_PATH}")
    print("Please run this script from the backend directory.")
    sys.exit(1)

def get_test_images():
    """Get the list of test images and their variations."""
    # Get all test images
    test_images = sorted(glob.glob(str(TEST_IMAGES_PATH / "*.jpg")))
    
    # Get all variations
    variations = sorted(glob.glob(str(VARIATIONS_PATH / "*.jpg")))
    
    return test_images, variations

def create_image_entry(image_path, image_id):
    """Create a simple image entry for testing."""
    filename = os.path.basename(image_path)
    
    # Assign random hash algorithm to each image
    hash_algorithm = random.choice(QueueNames.get_hash_types())
    
    return {
        "id": image_id,
        "filename": filename,
        "hash_algorithm": hash_algorithm,
        "path": image_path
    }

def seed_queues():
    """Seed the Redis queues with test data."""
    print("Starting to seed Redis queues with test data...")
    
    # Get test images and variations
    test_images, variations = get_test_images()
    
    if not test_images:
        print("No test images found.")
        return
    
    print(f"Found {len(test_images)} test images and {len(variations)} variations.")
    
    # Create image entries for all test images
    image_entries = []
    for i, image_path in enumerate(test_images):
        image_id = i + 1
        image_entries.append(create_image_entry(image_path, image_id))
    
    # Create tasks for each image with different categories and confidence levels
    tasks_created = 0
    
    for image in image_entries:
        # Create 3 tasks for each image with different categories
        for _ in range(3):
            # Randomly select category, confidence level, and whether it's escalated
            category = random.choice(CONTENT_CATEGORIES)
            confidence = random.choice(ConfidenceLevels.get_all())
            is_escalated = random.random() < 0.2  # 20% chance of being escalated
            
            # Priority is higher for escalated tasks and higher confidence
            priority = 10 if is_escalated else (
                5 if confidence == ConfidenceLevels.HIGH else 
                3 if confidence == ConfidenceLevels.MEDIUM else 1
            )
            
            # Add metadata for testing
            metadata = {
                "source": "seed_script",
                "test_image": True,
                "timestamp": time.time()
            }
            
            # Add task to queue
            try:
                job_id = queue_manager.add_review_task(
                    image_id=image["id"],
                    content_category=category,
                    hash_algorithm=image["hash_algorithm"],
                    confidence_level=confidence,
                    is_escalated=is_escalated,
                    priority=priority,
                    metadata=metadata
                )
                tasks_created += 1
                print(f"Created task {job_id} for image {image['filename']} (category: {category}, confidence: {confidence}, escalated: {is_escalated})")
            except Exception as e:
                print(f"Error creating task for image {image['filename']}: {e}")
    
    print(f"\nSuccessfully created {tasks_created} test tasks.")
    print("\nQueue statistics:")
    
    # Print statistics for each queue
    stats = queue_manager.get_queue_stats()
    for queue_stat in stats:
        if queue_stat["pending"] > 0:
            print(f"- {queue_stat['queueName']}: {queue_stat['pending']} pending tasks")

def clear_queues():
    """Clear all Redis queues."""
    print("Clearing all Redis queues...")
    
    try:
        redis = queue_manager.redis
        
        # Find all Bull queue keys
        queue_keys = redis.keys("bull:review:*")
        
        # Delete all queue keys
        if queue_keys:
            redis.delete(*queue_keys)
            print(f"Deleted {len(queue_keys)} queue keys.")
        else:
            print("No queue keys found.")
    except Exception as e:
        print(f"Error clearing queues: {e}")

if __name__ == "__main__":
    # Check if we should clear queues first
    if len(sys.argv) > 1 and sys.argv[1] == "--clear":
        clear_queues()
    
    # Seed the queues with test data
    seed_queues()
    
    print("\nDone! You can now test the HMA Review Tool with this data.")
    print("To clear the queues, run: python seed_test_data.py --clear") 