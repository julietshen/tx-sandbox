from fastapi import FastAPI
from redis import Redis
from typing import Dict, List, Optional, Union

# Redis configuration
REDIS_HOST = "localhost"
REDIS_PORT = 6379
REDIS_DB = 0
REDIS_PASSWORD = None

# Queue configuration
QUEUE_PREFIX = "review"

# Queue names
class QueueNames:
    PDQ = "pdq"
    MD5 = "md5"
    SHA1 = "sha1"
    ESCALATED = "escalated"
    MANUAL = "manual"

    @classmethod
    def get_all(cls) -> List[str]:
        """Get all queue names."""
        return [
            cls.PDQ,
            cls.MD5, 
            cls.SHA1,
            cls.ESCALATED,
            cls.MANUAL
        ]

    @classmethod
    def get_hash_types(cls) -> List[str]:
        """Get all hash algorithm queue names."""
        return [
            cls.PDQ,
            cls.MD5,
            cls.SHA1
        ]

# Content categories
CONTENT_CATEGORIES = [
    "adult",
    "violence",
    "hate_speech",
    "terrorism",
    "self_harm",
    "spam",
    "other"
]

# Confidence levels
class ConfidenceLevels:
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

    @classmethod
    def get_all(cls) -> List[str]:
        """Get all confidence levels."""
        return [
            cls.HIGH,
            cls.MEDIUM,
            cls.LOW
        ]

# Redis client instance
redis_client: Optional[Redis] = None

def get_redis() -> Redis:
    """Get or create Redis client."""
    global redis_client
    if redis_client is None:
        redis_client = Redis(
            host=REDIS_HOST,
            port=REDIS_PORT,
            db=REDIS_DB,
            password=REDIS_PASSWORD,
            decode_responses=True
        )
    return redis_client

def get_queue_name(queue_type: str, category: str, is_escalated: bool = False) -> str:
    """Get the full queue name for a specific queue type and category."""
    prefix = QUEUE_PREFIX
    escalated_suffix = "_escalated" if is_escalated else ""
    return f"{prefix}:{queue_type}:{category}{escalated_suffix}"

def init_app(app: FastAPI) -> None:
    """Initialize Redis connection and queues."""
    @app.on_event("startup")
    async def startup_redis_client():
        global redis_client
        redis_client = get_redis()
        
    @app.on_event("shutdown")
    async def shutdown_redis_client():
        global redis_client
        if redis_client:
            redis_client.close()
            redis_client = None 