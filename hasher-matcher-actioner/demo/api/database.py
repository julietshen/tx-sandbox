from typing import List, Tuple, Dict, Optional
import random

class Database:
    def __init__(self):
        # Store hashes in memory as (id, hash_value, metadata) tuples
        self.hashes: List[Tuple[str, str, Dict]] = []
        self.next_id = 1

    def store_hash(self, hash_value: str, metadata: Dict) -> str:
        """Store a hash value with associated metadata."""
        id_ = str(self.next_id)
        self.next_id += 1
        self.hashes.append((id_, hash_value, metadata))
        return id_

    def get_hash(self, id_: str) -> Optional[Tuple[str, str, Dict]]:
        """Get a hash by its ID."""
        for hash_ in self.hashes:
            if hash_[0] == id_:
                return hash_
        return None

    def get_all_hashes(self) -> List[Tuple[str, str, Dict]]:
        """Get all stored hashes."""
        return self.hashes

    def get_random_hash(self) -> Optional[Tuple[str, str, Dict]]:
        """Get a random hash from the database."""
        if not self.hashes:
            return None
        return random.choice(self.hashes) 