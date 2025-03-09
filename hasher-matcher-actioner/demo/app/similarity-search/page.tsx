'use client';

import { useState } from 'react';

enum HashingAlgorithm {
  PDQ = "pdq",
  MD5 = "md5",
  SHA1 = "sha1",
  PHOTODNA = "photodna",
  NETCLEAN = "netclean"
}

interface SimilarImage {
  id: number;
  filename: string;
  upload_date: string;
  distance: number;
  hashes: Record<string, string>;
}

const getImageUrl = (filename: string) => {
  // If it's a variation, it will be named like "variation_chicken1.jpg_1.jpg"
  // If it's an original, it will be named like "chicken1.jpg"
  return `http://localhost:8000/images/${filename}`;
};

export default function SimilaritySearch() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [hashValue, setHashValue] = useState<string>('');
  const [hashType, setHashType] = useState<HashingAlgorithm>(HashingAlgorithm.PDQ);
  const [threshold, setThreshold] = useState<number>(0.8);
  const [similarImages, setSimilarImages] = useState<SimilarImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setHashValue(''); // Clear hash value when file is selected
      setSelectedImageUrl(URL.createObjectURL(file));
    }
  };

  const handleRandomImage = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:8000/random-image');
      const data = await response.json();
      
      if (data.success && data.image) {
        setHashValue(data.image.hashes[hashType]);
        setSelectedFile(null);
        setSelectedImageUrl(getImageUrl(data.image.filename));
      } else {
        throw new Error(data.error || 'Failed to get random image');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get random image');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSimilarImages([]);

      const formData = new FormData();
      if (selectedFile) {
        formData.append('image', selectedFile);
      }
      
      const queryParams = new URLSearchParams({
        hash_type: hashType,
        threshold: threshold.toString()
      });
      
      if (hashValue) {
        queryParams.append('hash_value', hashValue);
      }

      const response = await fetch(
        `http://localhost:8000/similarity-search?${queryParams.toString()}`,
        {
          method: 'POST',
          body: selectedFile ? formData : undefined
        }
      );

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to find similar images');
      }

      setSimilarImages(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to find similar images');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container-fluid py-5">
      <div className="row mb-5">
        <div className="col-12 text-center">
          <h1 className="display-4 mb-3">Similarity Search</h1>
          <p className="lead mb-4">
            Find similar images using various hashing algorithms. Upload a new image,
            enter a hash value, or select a random image from the database.
          </p>
        </div>
      </div>

      <div className="row justify-content-center mb-5">
        <div className="col-md-8">
          <div className="card">
            <div className="card-body">
              <div className="mb-4">
                <label className="form-label">Search Method</label>
                <div className="d-flex gap-3">
                  <div className="form-check">
                    <input
                      type="radio"
                      className="form-check-input"
                      id="uploadImage"
                      checked={!hashValue}
                      onChange={() => setHashValue('')}
                    />
                    <label className="form-check-label" htmlFor="uploadImage">
                      Upload Image
                    </label>
                  </div>
                  <div className="form-check">
                    <input
                      type="radio"
                      className="form-check-input"
                      id="hashValue"
                      checked={!!hashValue}
                      onChange={() => setSelectedFile(null)}
                    />
                    <label className="form-check-label" htmlFor="hashValue">
                      Hash Value
                    </label>
                  </div>
                </div>
              </div>

              {!hashValue && (
                <div className="mb-4">
                  <label htmlFor="imageUpload" className="form-label">
                    Upload Image
                  </label>
                  <input
                    type="file"
                    className="form-control"
                    id="imageUpload"
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                </div>
              )}

              {hashValue && (
                <div className="mb-4">
                  <label htmlFor="hashValue" className="form-label">
                    Hash Value
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="hashValue"
                    value={hashValue}
                    onChange={(e) => setHashValue(e.target.value)}
                  />
                </div>
              )}

              <div className="mb-4">
                <label htmlFor="hashType" className="form-label">
                  Hash Algorithm
                </label>
                <select
                  className="form-select"
                  id="hashType"
                  value={hashType}
                  onChange={(e) => setHashType(e.target.value as HashingAlgorithm)}
                >
                  {Object.values(HashingAlgorithm).map((value) => (
                    <option key={value} value={value}>
                      {value.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label htmlFor="threshold" className="form-label">
                  Similarity Threshold
                </label>
                <input
                  type="range"
                  className="form-range"
                  id="threshold"
                  min="0"
                  max="1"
                  step="0.1"
                  value={threshold}
                  onChange={(e) => setThreshold(parseFloat(e.target.value))}
                />
                <div className="text-muted small">
                  Current: {threshold} (0 = exact match, 1 = most different)
                </div>
              </div>

              <div className="d-flex gap-2">
                <button
                  className="btn btn-primary"
                  onClick={handleSearch}
                  disabled={isLoading || (!selectedFile && !hashValue)}
                >
                  {isLoading ? 'Searching...' : 'Search'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleRandomImage}
                  disabled={isLoading}
                >
                  Use Random Image
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedImageUrl && (
        <div className="row justify-content-center mb-5">
          <div className="col-md-8">
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Selected Image</h5>
                <img 
                  src={selectedImageUrl} 
                  alt="Selected image" 
                  className="img-fluid rounded mb-3"
                  style={{ maxHeight: '300px', width: 'auto', display: 'block', margin: '0 auto' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {similarImages.length > 0 && (
        <div className="row">
          <div className="col-12">
            <h2 className="h3 mb-4">Similar Images</h2>
            <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
              {similarImages.map((image) => (
                <div key={image.id} className="col">
                  <div className="card h-100">
                    <img 
                      src={getImageUrl(image.filename)} 
                      alt={image.filename}
                      className="card-img-top"
                      style={{ height: '200px', objectFit: 'contain', backgroundColor: '#f8f9fa' }}
                    />
                    <div className="card-body">
                      <h5 className="card-title">{image.filename}</h5>
                      <p className="card-text">
                        Distance: {image.distance.toFixed(4)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 