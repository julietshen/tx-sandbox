'use client';

import { useState } from 'react';
import ImageEditor from './ImageEditor';

interface ImageComparisonProps {
  onImagesSelected?: (image1: File, image2: File) => void;
}

enum HashingAlgorithm {
  PDQ = "pdq",
  MD5 = "md5",
  SHA1 = "sha1",
  PHOTODNA = "photodna",
  NETCLEAN = "netclean"
}

interface AlgorithmResult {
  distance: number;
  quality1: number;
  quality2: number;
  interpretation: string;
  error?: string;
}

interface ComparisonResults {
  results: Record<HashingAlgorithm, AlgorithmResult>;
  success: boolean;
}

export default function ImageComparison({ onImagesSelected }: ImageComparisonProps) {
  const [selectedImage1, setSelectedImage1] = useState<File | null>(null);
  const [selectedImage2, setSelectedImage2] = useState<File | null>(null);
  const [comparisonResults, setComparisonResults] = useState<ComparisonResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<'edit' | 'crop' | 'rotate' | 'filter' | null>(null);
  const [editingImage, setEditingImage] = useState<1 | 2 | null>(null);

  const handleEditImage = (imageNum: 1 | 2) => {
    setEditMode('edit');
    setEditingImage(imageNum);
  };

  const handleCropImage = (imageNum: 1 | 2) => {
    setEditMode('crop');
    setEditingImage(imageNum);
  };

  const handleRotateImage = (imageNum: 1 | 2) => {
    setEditMode('rotate');
    setEditingImage(imageNum);
  };

  const handleFilterImage = (imageNum: 1 | 2) => {
    setEditMode('filter');
    setEditingImage(imageNum);
  };

  const handleImageEdited = async (editedImageData: string) => {
    const response = await fetch(editedImageData);
    const blob = await response.blob();
    const file = new File([blob], 'edited-image.png', { type: 'image/png' });

    if (editingImage === 1) {
      setSelectedImage1(file);
      if (selectedImage2) {
        await calculateDistances(file, selectedImage2);
      }
    } else if (editingImage === 2) {
      setSelectedImage2(file);
      if (selectedImage1) {
        await calculateDistances(selectedImage1, file);
      }
    }
    setEditMode(null);
    setEditingImage(null);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>, imageNumber: number) => {
    if (e.target.files && e.target.files[0]) {
      const newImage = e.target.files[0];
      
      if (imageNumber === 1) {
        setSelectedImage1(newImage);
        if (selectedImage2) {
          await calculateDistances(newImage, selectedImage2);
          if (onImagesSelected) {
            onImagesSelected(newImage, selectedImage2);
          }
        }
      } else {
        setSelectedImage2(newImage);
        if (selectedImage1) {
          await calculateDistances(selectedImage1, newImage);
          if (onImagesSelected) {
            onImagesSelected(selectedImage1, newImage);
          }
        }
      }
    }
  };

  const calculateDistances = async (image1: File, image2: File) => {
    setIsLoading(true);
    setError(null);
    setComparisonResults(null);

    try {
      const formData = new FormData();
      formData.append('image1', image1);
      formData.append('image2', image2);

      const response = await fetch('http://localhost:8000/compare', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      console.log('API Response:', data);

      if (!data.success) {
        throw new Error(data.error || 'Failed to compare images');
      }

      // Validate the response data structure
      if (!data.results || typeof data.results !== 'object') {
        throw new Error('Invalid response format from server');
      }

      // Validate each algorithm result
      Object.entries(data.results).forEach(([algo, result]: [string, any]) => {
        console.log(`Algorithm ${algo} result:`, result);
        if (result) {
          if (typeof result.distance !== 'number') {
            console.warn(`Invalid distance value for ${algo}:`, result.distance);
            result.distance = null;
          }
          if (typeof result.quality1 !== 'number') {
            console.warn(`Invalid quality1 value for ${algo}:`, result.quality1);
            result.quality1 = null;
          }
          if (typeof result.quality2 !== 'number') {
            console.warn(`Invalid quality2 value for ${algo}:`, result.quality2);
            result.quality2 = null;
          }
        }
      });

      setComparisonResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate image distances');
      console.error('Error calculating distances:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getAlgorithmDescription = (algorithm: HashingAlgorithm) => {
    switch (algorithm) {
      case HashingAlgorithm.PDQ:
        return {
          name: "PDQ (Perceptual Difference Quantization)",
          description: "A perceptual hash that measures how visually similar two images are, even if they've been modified, resized, or compressed. Created by Facebook for finding similar images at scale.",
          distanceRange: "Scale: 0-256 | 0 = identical, <30 = nearly identical, <80 = visually similar, >80 = different images"
        };
      case HashingAlgorithm.MD5:
        return {
          name: "MD5 (Message Digest)",
          description: "A cryptographic hash that checks if two images are exactly identical at the binary level. Even a single pixel difference will result in completely different hashes.",
          distanceRange: "Binary: 0 = exact match (identical files), 100 = different files (any difference at all)"
        };
      case HashingAlgorithm.SHA1:
        return {
          name: "SHA1 (Secure Hash Algorithm 1)",
          description: "Similar to MD5, this cryptographic hash verifies exact binary matches. Used when you need to confirm two images are precisely the same.",
          distanceRange: "Binary: 0 = exact match (identical files), 100 = different files (any difference at all)"
        };
      case HashingAlgorithm.PHOTODNA:
        return {
          name: "PhotoDNA (Microsoft)",
          description: "Microsoft's robust image matching technology, specifically designed to find modified versions of known images. Requires a license.",
          distanceRange: "Scale: 0-100 | Lower numbers indicate more similar images"
        };
      case HashingAlgorithm.NETCLEAN:
        return {
          name: "NetClean",
          description: "NetClean's image matching technology, optimized for high-speed matching against large databases. Requires a license.",
          distanceRange: "Scale: 0-100 | Lower numbers indicate more similar images"
        };
      default:
        return {
          name: algorithm,
          description: "Image comparison algorithm",
          distanceRange: "0-100 (lower is more similar)"
        };
    }
  };

  const renderAlgorithmCard = (algo: string, result: AlgorithmResult) => {
    if (!result) {
      console.warn(`No result data for algorithm ${algo}`);
      return null;
    }

    const algorithm = algo as HashingAlgorithm;
    const description = getAlgorithmDescription(algorithm);
    
    // Calculate percentage match for applicable algorithms
    const getPercentageMatch = (distance: number | null, algorithm: HashingAlgorithm) => {
      if (distance === null || distance === undefined) return null;
      
      switch (algorithm) {
        case HashingAlgorithm.PDQ:
          return Math.max(0, Math.round((1 - distance / 256) * 100));
        case HashingAlgorithm.MD5:
        case HashingAlgorithm.SHA1:
          return distance === 0 ? 100 : 0;
        case HashingAlgorithm.PHOTODNA:
        case HashingAlgorithm.NETCLEAN:
          return Math.max(0, Math.round((1 - distance / 100) * 100));
        default:
          return null;
      }
    };
    
    return (
      <div key={algo} className="col">
        <div className="card h-100 bg-gray-50">
          <div className="card-header bg-gray-100">
            <h3 className="h5 mb-0">{description.name}</h3>
          </div>
          <div className="card-body">
            <p className="text-muted small mb-3">{description.description}</p>
            {result.error ? (
              <div className="alert alert-danger" role="alert">
                {result.error}
              </div>
            ) : (
              <>
                {result.interpretation && (
                  <div className={`alert ${
                    result.interpretation.toLowerCase().includes('license') ? 'alert-peach' :
                    result.interpretation.toLowerCase().includes('different') ? 'alert-danger bg-red-50' :
                    'alert-info bg-info-subtle'
                  } mb-4`} role="alert">
                    {result.interpretation}
                  </div>
                )}
                {result.distance !== undefined && result.distance !== null && (
                  <>
                    <p className="mb-2">Distance: {result.distance.toFixed(2)}</p>
                    {getPercentageMatch(result.distance, algorithm) !== null && (
                      <p className="mb-2">Match: {getPercentageMatch(result.distance, algorithm)}%</p>
                    )}
                    <p className="text-muted small mb-3">{description.distanceRange}</p>
                  </>
                )}
                {(result.quality1 !== undefined || result.quality2 !== undefined) && (
                  <>
                    {result.quality1 !== undefined && result.quality1 !== null && (
                      <div>
                        <p className="mb-1">Quality (Image 1): {result.quality1.toFixed(2)}</p>
                        <p className="text-muted small">Quality scale: 0-100 (higher is better)</p>
                      </div>
                    )}
                    {result.quality2 !== undefined && result.quality2 !== null && (
                      <div>
                        <p className="mb-1">Quality (Image 2): {result.quality2.toFixed(2)}</p>
                        <p className="text-muted small">Quality scale: 0-100 (higher is better)</p>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container-fluid py-5">
      <div className="row mb-5">
        <div className="col-12 text-center mb-4">
          <h1 className="display-4 mb-3">Image Comparison Demo</h1>
          <p className="subhead mb-4">
            Compare two images using multiple hashing algorithms to determine their similarity.
            Each algorithm provides different insights into how similar the images are.
          </p>
        </div>
      </div>

      <div className="row mb-5">
        {/* Image 1 Selection */}
        <div className="col-md-6 mb-4 mb-md-0">
          <div className="card h-100">
            <div className="card-header">
              <h2 className="h5 mb-0">First Image</h2>
            </div>
            <div className="card-body">
              <div className="mb-4">
                <label htmlFor="image1" className="form-label">
                  Select first image to compare
                </label>
                <input
                  id="image1"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageSelect(e, 1)}
                  className="form-control"
                  aria-describedby="image1Help"
                />
                <div id="image1Help" className="form-text mt-2">
                  Supported formats: JPG, PNG, GIF
                </div>
              </div>
              {selectedImage1 && (
                <div className="mt-3">
                  <img
                    src={URL.createObjectURL(selectedImage1)}
                    alt="First selected image preview"
                    className="img-fluid w-100"
                    style={{ objectFit: 'cover', maxHeight: '300px' }}
                  />
                  <div className="mt-3 d-flex gap-2">
                    <button className="btn btn-primary" onClick={() => handleEditImage(1)}>
                      Edit Image
                    </button>
                    <button className="btn btn-outline-secondary" onClick={() => handleCropImage(1)}>
                      Crop
                    </button>
                    <button className="btn btn-outline-secondary" onClick={() => handleRotateImage(1)}>
                      Rotate
                    </button>
                    <button className="btn btn-outline-secondary" onClick={() => handleFilterImage(1)}>
                      Filter
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Image 2 Selection */}
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header">
              <h2 className="h5 mb-0">Second Image</h2>
            </div>
            <div className="card-body">
              <div className="mb-4">
                <label htmlFor="image2" className="form-label">
                  Select second image to compare
                </label>
                <input
                  id="image2"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageSelect(e, 2)}
                  className="form-control"
                  aria-describedby="image2Help"
                />
                <div id="image2Help" className="form-text mt-2">
                  Supported formats: JPG, PNG, GIF
                </div>
              </div>
              {selectedImage2 && (
                <div className="mt-3">
                  <img
                    src={URL.createObjectURL(selectedImage2)}
                    alt="Second selected image preview"
                    className="img-fluid w-100"
                    style={{ objectFit: 'cover', maxHeight: '300px' }}
                  />
                  <div className="mt-3 d-flex gap-2">
                    <button className="btn btn-primary" onClick={() => handleEditImage(2)}>
                      Edit Image
                    </button>
                    <button className="btn btn-outline-secondary" onClick={() => handleCropImage(2)}>
                      Crop
                    </button>
                    <button className="btn btn-outline-secondary" onClick={() => handleRotateImage(2)}>
                      Rotate
                    </button>
                    <button className="btn btn-outline-secondary" onClick={() => handleFilterImage(2)}>
                      Filter
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Editor Section */}
      {editMode && editingImage && (selectedImage1 || selectedImage2) && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">
            {editMode === 'rotate' ? 
              `Rotating Image ${editingImage}` :
              editMode === 'crop' ? 
              `Cropping Image ${editingImage}` :
              editMode === 'filter' ?
              `Filtering Image ${editingImage}` :
              `Editing Image ${editingImage}`}
          </h2>
          <ImageEditor
            imageUrl={URL.createObjectURL(
              editingImage === 1 ? selectedImage1! : selectedImage2!
            )}
            onImageEdited={handleImageEdited}
            mode={editMode}
          />
        </div>
      )}

      {/* Results Section */}
      {isLoading ? (
        <div className="text-center py-5" role="status" aria-live="polite">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="subhead mt-3 mb-0">Analyzing images...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger" role="alert">
          <div className="d-flex align-items-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-exclamation-circle me-2" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
              <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
            </svg>
            {error}
          </div>
        </div>
      ) : comparisonResults && (
        <div>
          <h2 className="h3 mb-4">Comparison Results</h2>
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
            {Object.entries(comparisonResults.results).map(([algo, result]) => (
              <div key={algo} className="col">
                {renderAlgorithmCard(algo, result)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 