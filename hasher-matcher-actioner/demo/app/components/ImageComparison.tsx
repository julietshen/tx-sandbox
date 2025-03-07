'use client';

import { useState } from 'react';

interface ImageComparisonProps {
  onImagesSelected?: (image1: File, image2: File) => void;
}

enum HashingAlgorithm {
  PDQ = "pdq",
  MD5 = "md5",
  SHA1 = "sha1"
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

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>, imageNumber: number) => {
    if (e.target.files && e.target.files[0]) {
      const newImage = e.target.files[0];
      
      if (imageNumber === 1) {
        setSelectedImage1(newImage);
        if (selectedImage2) {
          await calculateDistances(newImage, selectedImage2);
        }
      } else {
        setSelectedImage2(newImage);
        if (selectedImage1) {
          await calculateDistances(selectedImage1, newImage);
        }
      }

      if (onImagesSelected && selectedImage1 && selectedImage2) {
        onImagesSelected(selectedImage1, selectedImage2);
      }
    }
  };

  const calculateDistances = async (image1: File, image2: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('image1', image1);
      formData.append('image2', image2);

      const response = await fetch('http://localhost:8000/compare', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to compare images');
      } else {
        setComparisonResults(data);
      }
    } catch (err) {
      setError('Failed to calculate image distances');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const getAlgorithmDescription = (algorithm: HashingAlgorithm) => {
    switch (algorithm) {
      case HashingAlgorithm.PDQ:
        return {
          name: "PDQ (Perceptual Difference Quantization)",
          description: "Facebook's open-source perceptual hash for finding similar images",
          distanceRange: "0-256 (lower is more similar)"
        };
      case HashingAlgorithm.MD5:
        return {
          name: "MD5",
          description: "Cryptographic hash for exact image matching",
          distanceRange: "0 (match) or 100 (different)"
        };
      case HashingAlgorithm.SHA1:
        return {
          name: "SHA1",
          description: "Cryptographic hash for exact image matching",
          distanceRange: "0 (match) or 100 (different)"
        };
    }
  };

  const renderAlgorithmCard = (algo: string, result: AlgorithmResult) => {
    const algorithm = algo as HashingAlgorithm;
    const description = getAlgorithmDescription(algorithm);
    
    return (
      <div key={algo} className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-2">{description.name}</h3>
        <p className="text-sm text-gray-600 mb-4">{description.description}</p>
        
        {result.error ? (
          <div className="text-red-600">{result.error}</div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Distance:</span>
              <span className="font-medium">{result.distance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Quality (Image 1):</span>
              <span className="font-medium">{result.quality1.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Quality (Image 2):</span>
              <span className="font-medium">{result.quality2.toFixed(2)}%</span>
            </div>
            <div className="mt-2 pt-2 border-t">
              <p className="text-sm font-medium">{result.interpretation}</p>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Distance range: {description.distanceRange}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image 1 Selection */}
        <div>
          <h3 className="text-lg font-medium mb-4">Image 1</h3>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageSelect(e, 1)}
            className="block w-full text-sm text-gray-500
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-full file:border-0
                     file:text-sm file:font-semibold
                     file:bg-blue-50 file:text-blue-700
                     hover:file:bg-blue-100"
          />
          {selectedImage1 && (
            <div className="mt-4">
              <img
                src={URL.createObjectURL(selectedImage1)}
                alt="Selected image 1"
                className="max-w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          )}
        </div>

        {/* Image 2 Selection */}
        <div>
          <h3 className="text-lg font-medium mb-4">Image 2</h3>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageSelect(e, 2)}
            className="block w-full text-sm text-gray-500
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-full file:border-0
                     file:text-sm file:font-semibold
                     file:bg-blue-50 file:text-blue-700
                     hover:file:bg-blue-100"
          />
          {selectedImage2 && (
            <div className="mt-4">
              <img
                src={URL.createObjectURL(selectedImage2)}
                alt="Selected image 2"
                className="max-w-full h-auto rounded-lg shadow-lg"
              />
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Comparing images...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
          {error}
        </div>
      ) : comparisonResults && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.entries(comparisonResults.results).map(([algo, result]) => 
            renderAlgorithmCard(algo, result)
          )}
        </div>
      )}
    </div>
  );
} 