import json
import time
from datetime import datetime
from typing import Dict, List, Optional, Union, Any
from redis import Redis

from queue_config import (
    get_redis, 
    get_queue_name, 
    QueueNames, 
    CONTENT_CATEGORIES, 
    ConfidenceLevels
)

class QueueManager:
    """Manager for BullMQ queues using Redis."""
    
    def __init__(self):
        self.redis = get_redis()
        
    def add_review_task(
        self, 
        image_id: int,
        content_category: str,
        hash_algorithm: str,
        confidence_level: str,
        is_escalated: bool = False,
        priority: int = 0,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Add a new review task to the appropriate queue.
        
        Args:
            image_id: ID of the image to review
            content_category: Category of content (adult, violence, etc.)
            hash_algorithm: Hash algorithm used (pdq, md5, sha1)
            confidence_level: Match confidence level (high, medium, low)
            is_escalated: Whether this task is escalated
            priority: Task priority (higher number = higher priority)
            metadata: Additional metadata for the task
            
        Returns:
            ID of the created job
        """
        if content_category not in CONTENT_CATEGORIES:
            raise ValueError(f"Invalid content category: {content_category}")
            
        if hash_algorithm not in QueueNames.get_hash_types() and hash_algorithm != QueueNames.MANUAL:
            raise ValueError(f"Invalid hash algorithm: {hash_algorithm}")
            
        if confidence_level not in ConfidenceLevels.get_all():
            raise ValueError(f"Invalid confidence level: {confidence_level}")
        
        # Create job data
        job_id = f"task:{int(time.time() * 1000)}:{image_id}"
        queue_type = QueueNames.ESCALATED if is_escalated else hash_algorithm
        queue_name = get_queue_name(queue_type, content_category, is_escalated)
        
        job_data = {
            "id": job_id,
            "imageId": image_id,
            "contentCategory": content_category,
            "hashAlgorithm": hash_algorithm,
            "confidenceLevel": confidence_level,
            "isEscalated": is_escalated,
            "createdAt": datetime.utcnow().isoformat(),
            "status": "pending",
            "metadata": metadata or {}
        }
        
        # Add job to queue
        job_key = f"bull:{queue_name}:{job_id}"
        self.redis.hset(job_key, "data", json.dumps(job_data))
        self.redis.hset(job_key, "opts", json.dumps({"priority": priority}))
        self.redis.zadd(f"bull:{queue_name}:wait", {job_id: priority})
        
        # Update queue metrics
        self.redis.hincrby(f"bull:{queue_name}:metrics", "total", 1)
        self.redis.hincrby(f"bull:{queue_name}:metrics", "pending", 1)
        
        return job_id
        
    def get_next_task(
        self, 
        content_categories: Optional[List[str]] = None,
        hash_algorithms: Optional[List[str]] = None,
        confidence_levels: Optional[List[str]] = None,
        is_escalated: Optional[bool] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Get the next task to review based on filters.
        
        Args:
            content_categories: List of content categories to include
            hash_algorithms: List of hash algorithms to include
            confidence_levels: List of confidence levels to include
            is_escalated: Whether to get escalated tasks
            
        Returns:
            Next task data or None if no tasks match criteria
        """
        categories = content_categories or CONTENT_CATEGORIES
        hash_types = hash_algorithms or QueueNames.get_hash_types()
        if is_escalated:
            hash_types = [QueueNames.ESCALATED]
            
        # Get highest priority job from matching queues
        for category in categories:
            for queue_type in hash_types:
                queue_name = get_queue_name(queue_type, category, bool(is_escalated))
                # Get first job in wait queue
                job_id = self.redis.zrange(f"bull:{queue_name}:wait", 0, 0)
                if job_id:
                    job_id = job_id[0]
                    job_key = f"bull:{queue_name}:{job_id}"
                    job_data_str = self.redis.hget(job_key, "data")
                    if job_data_str:
                        job_data = json.loads(job_data_str)
                        if confidence_levels and job_data.get("confidenceLevel") not in confidence_levels:
                            continue
                        
                        # Move job to active queue
                        self.redis.zrem(f"bull:{queue_name}:wait", job_id)
                        self.redis.zadd(f"bull:{queue_name}:active", {job_id: time.time()})
                        
                        # Update job status
                        job_data["status"] = "active"
                        job_data["startedAt"] = datetime.utcnow().isoformat()
                        self.redis.hset(job_key, "data", json.dumps(job_data))
                        
                        # Update queue metrics
                        self.redis.hincrby(f"bull:{queue_name}:metrics", "pending", -1)
                        self.redis.hincrby(f"bull:{queue_name}:metrics", "active", 1)
                        
                        return job_data
                        
        return None
        
    def complete_task(self, job_id: str, result: str, notes: Optional[str] = None) -> bool:
        """
        Complete a review task with a result.
        
        Args:
            job_id: ID of the job
            result: Result of the review (approved, rejected, escalated)
            notes: Optional reviewer notes
            
        Returns:
            Whether the operation was successful
        """
        # Find job in active queues
        job_key = None
        queue_name = None
        
        for category in CONTENT_CATEGORIES:
            for queue_type in QueueNames.get_all():
                for is_escalated in [False, True]:
                    q_name = get_queue_name(queue_type, category, is_escalated)
                    active_key = f"bull:{q_name}:active"
                    if self.redis.zscore(active_key, job_id) is not None:
                        job_key = f"bull:{q_name}:{job_id}"
                        queue_name = q_name
                        break
                if job_key:
                    break
            if job_key:
                break
                
        if not job_key or not queue_name:
            return False
            
        # Get job data
        job_data_str = self.redis.hget(job_key, "data")
        if not job_data_str:
            return False
            
        job_data = json.loads(job_data_str)
        
        # Update job data
        job_data["status"] = "completed"
        job_data["result"] = result
        job_data["completedAt"] = datetime.utcnow().isoformat()
        if notes:
            job_data["notes"] = notes
            
        # Move job to completed queue
        self.redis.zrem(f"bull:{queue_name}:active", job_id)
        self.redis.zadd(f"bull:{queue_name}:completed", {job_id: time.time()})
        self.redis.hset(job_key, "data", json.dumps(job_data))
        
        # Update queue metrics
        self.redis.hincrby(f"bull:{queue_name}:metrics", "active", -1)
        self.redis.hincrby(f"bull:{queue_name}:metrics", "completed", 1)
        self.redis.hincrby(f"bull:{queue_name}:metrics", f"result:{result}", 1)
        
        # If result is "escalated", add to escalation queue
        if result == "escalated":
            self.add_review_task(
                image_id=job_data["imageId"],
                content_category=job_data["contentCategory"],
                hash_algorithm=job_data["hashAlgorithm"],
                confidence_level=job_data["confidenceLevel"],
                is_escalated=True,
                priority=10,  # Higher priority for escalated tasks
                metadata={
                    "originalJobId": job_id,
                    "escalatedAt": datetime.utcnow().isoformat(),
                    "notes": notes
                }
            )
            
        return True
        
    def get_queue_stats(
        self, 
        content_category: Optional[str] = None,
        hash_algorithm: Optional[str] = None,
        is_escalated: Optional[bool] = None
    ) -> List[Dict[str, Any]]:
        """
        Get statistics for queues matching the filters.
        
        Args:
            content_category: Filter by content category
            hash_algorithm: Filter by hash algorithm
            is_escalated: Filter by escalation status
            
        Returns:
            List of queue statistics
        """
        stats_list = []
        categories = [content_category] if content_category else CONTENT_CATEGORIES
        hash_types = [hash_algorithm] if hash_algorithm else QueueNames.get_all()
        
        for category in categories:
            for queue_type in hash_types:
                # Skip non-escalated queues if we only want escalated
                if is_escalated and queue_type != QueueNames.ESCALATED:
                    continue
                # Skip escalated queues if we only want non-escalated
                if is_escalated is False and queue_type == QueueNames.ESCALATED:
                    continue
                
                queue_name = get_queue_name(queue_type, category, bool(is_escalated))
                metrics_key = f"bull:{queue_name}:metrics"
                
                # Get basic metrics
                metrics = self.redis.hgetall(metrics_key) or {}
                
                # Calculate success rate
                total_completed = int(metrics.get("completed", 0))
                takedowns = int(metrics.get("result:rejected", 0))
                success_rate = (takedowns / total_completed * 100) if total_completed > 0 else 0
                
                # Get oldest job
                oldest_age = 0
                oldest_job = self.redis.zrange(f"bull:{queue_name}:wait", 0, 0, withscores=True)
                if oldest_job:
                    oldest_age = int(time.time() - oldest_job[0][1])
                
                # Build stats object
                stats = {
                    "queueName": queue_name,
                    "contentCategory": category,
                    "hashAlgorithm": queue_type,
                    "isEscalated": bool(is_escalated),
                    "pending": int(metrics.get("pending", 0)),
                    "active": int(metrics.get("active", 0)),
                    "completed": total_completed,
                    "successRate": success_rate,
                    "oldestTaskAge": oldest_age
                }
                
                stats_list.append(stats)
                
        return stats_list

# Create singleton instance
queue_manager = QueueManager() 