from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, LargeBinary, Enum
from sqlalchemy.orm import relationship
import datetime
import enum
from database import Base

# Define ReviewStatus as an enum
class ReviewStatus(enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    REPROCESSED = "reprocessed"

# Define HashAlgorithm as an enum
class HashAlgorithm(enum.Enum):
    PDQ = "pdq"
    MD5 = "md5"
    SHA1 = "sha1"
    PHOTODNA = "photodna"

class Image(Base):
    __tablename__ = "images"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    content_type = Column(String)
    upload_date = Column(DateTime, default=datetime.datetime.utcnow)
    data = Column(LargeBinary)  # Actual image binary data
    
    # Relationships
    hashes = relationship("Hash", back_populates="image", cascade="all, delete-orphan")
    matches = relationship("Match", foreign_keys="Match.query_image_id", back_populates="query_image")
    matched_in = relationship("Match", foreign_keys="Match.matched_image_id", back_populates="matched_image")
    review_decisions = relationship("ReviewDecision", back_populates="image", cascade="all, delete-orphan")

class Hash(Base):
    __tablename__ = "hashes"

    id = Column(Integer, primary_key=True, index=True)
    image_id = Column(Integer, ForeignKey("images.id"))
    algorithm = Column(String, index=True)  # PDQ, MD5, SHA1, etc.
    hash_value = Column(String, index=True)
    quality = Column(Float)  # Quality score for some hash types like PDQ
    
    # Relationships
    image = relationship("Image", back_populates="hashes")

class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    query_image_id = Column(Integer, ForeignKey("images.id"))
    matched_image_id = Column(Integer, ForeignKey("images.id"))
    algorithm = Column(String, index=True)
    distance = Column(Float)  # Similarity distance (lower is more similar)
    match_date = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    query_image = relationship("Image", foreign_keys=[query_image_id], back_populates="matches")
    matched_image = relationship("Image", foreign_keys=[matched_image_id], back_populates="matched_in")

class ReviewDecision(Base):
    __tablename__ = "review_decisions"

    id = Column(Integer, primary_key=True, index=True)
    image_id = Column(Integer, ForeignKey("images.id"))
    status = Column(String, index=True)  # pending, approved, rejected, reprocessed
    reviewer = Column(String)  # Name/ID of the reviewer
    decision_date = Column(DateTime, default=datetime.datetime.utcnow)
    notes = Column(String, nullable=True)
    
    # Relationships
    image = relationship("Image", back_populates="review_decisions")
