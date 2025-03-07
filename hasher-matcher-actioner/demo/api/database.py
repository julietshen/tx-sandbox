from typing import List, Tuple, Dict, Optional
import random
import sqlite3
from pathlib import Path
import json
import datetime

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

class ImageDatabase:
    def __init__(self, db_path: str = "image_hashes.db"):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS images (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    filename TEXT,
                    upload_date TIMESTAMP,
                    file_hash TEXT UNIQUE,
                    pdq_hash TEXT,
                    md5_hash TEXT,
                    sha1_hash TEXT,
                    photodna_hash TEXT,
                    netclean_hash TEXT
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS comparisons (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    image1_id INTEGER,
                    image2_id INTEGER,
                    comparison_date TIMESTAMP,
                    pdq_distance REAL,
                    md5_distance REAL,
                    sha1_distance REAL,
                    photodna_distance REAL,
                    netclean_distance REAL,
                    FOREIGN KEY (image1_id) REFERENCES images(id),
                    FOREIGN KEY (image2_id) REFERENCES images(id)
                )
            """)

    def add_image(self, filename: str, file_hash: str, hashes: Dict[str, str]) -> int:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR IGNORE INTO images (
                    filename, upload_date, file_hash, 
                    pdq_hash, md5_hash, sha1_hash, photodna_hash, netclean_hash
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                filename,
                datetime.datetime.now(),
                file_hash,
                hashes.get('pdq'),
                hashes.get('md5'),
                hashes.get('sha1'),
                hashes.get('photodna'),
                hashes.get('netclean')
            ))
            return cursor.lastrowid

    def add_comparison(self, image1_id: int, image2_id: int, distances: Dict[str, float]):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT INTO comparisons (
                    image1_id, image2_id, comparison_date,
                    pdq_distance, md5_distance, sha1_distance, 
                    photodna_distance, netclean_distance
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                image1_id,
                image2_id,
                datetime.datetime.now(),
                distances.get('pdq'),
                distances.get('md5'),
                distances.get('sha1'),
                distances.get('photodna'),
                distances.get('netclean')
            ))

    def get_random_image(self) -> Optional[Dict]:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM images ORDER BY RANDOM() LIMIT 1")
            row = cursor.fetchone()
            if row:
                return {
                    'id': row[0],
                    'filename': row[1],
                    'upload_date': row[2],
                    'file_hash': row[3],
                    'hashes': {
                        'pdq': row[4],
                        'md5': row[5],
                        'sha1': row[6],
                        'photodna': row[7],
                        'netclean': row[8]
                    }
                }
            return None

    def find_similar_images(self, 
                          hash_type: str, 
                          hash_value: str, 
                          threshold: float) -> List[Dict]:
        """Find similar images based on hash type and threshold."""
        hash_column = f"{hash_type}_hash"
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            
            if hash_type in ["md5", "sha1"]:
                # For cryptographic hashes, we only look for exact matches
                cursor.execute(f"""
                    SELECT * FROM images 
                    WHERE {hash_column} = ?
                    LIMIT 50
                """, (hash_value,))
            
            elif hash_type == "pdq":
                # For PDQ, we need to fetch all hashes and calculate Hamming distances
                cursor.execute(f"""
                    SELECT * FROM images 
                    WHERE {hash_column} IS NOT NULL
                """)
            
            else:
                # For PhotoDNA and NetClean, we'll use the comparisons table
                cursor.execute(f"""
                    SELECT i.*, c.{hash_type}_distance as distance
                    FROM images i
                    JOIN comparisons c ON (i.id = c.image1_id OR i.id = c.image2_id)
                    WHERE {hash_column} IS NOT NULL
                    GROUP BY i.id
                    HAVING MIN(c.{hash_type}_distance) <= ?
                    ORDER BY MIN(c.{hash_type}_distance)
                    LIMIT 50
                """, (threshold,))
            
            results = []
            for row in cursor.fetchall():
                results.append({
                    'id': row[0],
                    'filename': row[1],
                    'upload_date': row[2],
                    'file_hash': row[3],
                    'hashes': {
                        'pdq': row[4],
                        'md5': row[5],
                        'sha1': row[6],
                        'photodna': row[7],
                        'netclean': row[8]
                    }
                })
            
            return results

# Create a global instance
db = ImageDatabase() 