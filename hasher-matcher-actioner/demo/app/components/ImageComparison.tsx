'use client';

import { useState } from 'react';

interface ImageComparisonProps {
  onImagesSelected?: (image1: File, image2: File) => void;
  matchId?: string;
  photoDNAKey?: string;
  netCleanKey?: string;
}

enum HashingAlgorithm {
  PHOTODNA = "photodna",
  PDQ = "pdq",
  MD5 = "md5",
  SHA1 = "sha1",
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

export default function ImageComparison({ 
  onImagesSelected, 
  matchId,
  photoDNAKey,
  netCleanKey 
}: ImageComparisonProps) {
  const [selectedImage1, setSelectedImage1] = useState<File | null>(null);
  const [selectedImage2, setSelectedImage2] = useState<File | null>(null);
  const [comparisonResults, setComparisonResults] = useState<ComparisonResults | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>, imageNumber: number) => {
    if (e.target.files && e.target.files[0]) {
      if (imageNumber === 1) {
        setSelectedImage1(e.target.files[0]);
      } else {
        setSelectedImage2(e.target.files[0]);
      }

      // If both images are selected, calculate distances
      if (
        (imageNumber === 1 && selectedImage2) ||
        (imageNumber === 2 && selectedImage1)
      ) {
        const img1 = imageNumber === 1 ? e.target.files[0] : selectedImage1;
        const img2 = imageNumber === 2 ? e.target.files[0] : selectedImage2;
        if (img1 && img2) {
          await calculateDistances(img1, img2);
        }
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

      if (data.error) {
        setError(data.error);
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
      case HashingAlgorithm.PHOTODNA:
        return {
          name: "PhotoDNA",
          description: "Microsoft's robust perceptual hash, required for NCMEC submissions (requires licensing).",
          distanceRange: "0 (match) or Different"
        };
      case HashingAlgorithm.PDQ:
        return {
          name: "PDQ (Perceptual Difference Quantization)",
          description: "Facebook's open-source perceptual hash, recommended for NCMEC submissions.",
          distanceRange: "0-256 (lower is more similar)"
        };
      case HashingAlgorithm.MD5:
        return {
          name: "MD5",
          description: "Cryptographic hash for exact matching, optional for NCMEC submissions.",
          distanceRange: "0 (match) or Different"
        };
      case HashingAlgorithm.SHA1:
        return {
          name: "SHA1",
          description: "Cryptographic hash for exact matching, optional for NCMEC submissions.",
          distanceRange: "0 (match) or Different"
        };
      case HashingAlgorithm.NETCLEAN:
        return {
          name: "NetClean",
          description: "Proprietary hash format, optional for NCMEC submissions (requires licensing).",
          distanceRange: "0 (match) or Different"
        };
    }
  };

  const renderAlgorithmCard = (algo: string, result: AlgorithmResult) => {
    const algorithm = algo as HashingAlgorithm;
    const description = getAlgorithmDescription(algorithm);
    const isLicensedAlgorithm = algorithm === HashingAlgorithm.PHOTODNA || algorithm === HashingAlgorithm.NETCLEAN;
    const hasLicense = (algorithm === HashingAlgorithm.PHOTODNA && photoDNAKey) || 
                      (algorithm === HashingAlgorithm.NETCLEAN && netCleanKey);
    
    const formatDistance = (distance: number) => {
      if (distance === -1) return "Different";
      return distance.toFixed(2);
    };
    
    return (
      <div key={algo} className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold mb-2">{description.name}</h3>
          {isLicensedAlgorithm && (
            <span className={`px-2 py-1 text-xs rounded ${hasLicense ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {hasLicense ? 'Licensed' : 'License Required'}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 mb-4">{description.description}</p>
        
        {isLicensedAlgorithm && !hasLicense ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-sm text-yellow-800">
              {algorithm === HashingAlgorithm.PHOTODNA ? 
                'PhotoDNA requires Microsoft licensing and approval. Contact Microsoft to request access.' :
                'NetClean hash format requires licensing. Contact NetClean to request access.'}
            </p>
            <a 
              href={algorithm === HashingAlgorithm.PHOTODNA ? 
                "https://www.microsoft.com/en-us/photodna" : 
                "https://www.netclean.com/"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block"
            >
              Learn More
            </a>
          </div>
        ) : result.error ? (
          <div className="text-red-600">{result.error}</div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Distance:</span>
              <span className="font-medium">{formatDistance(result.distance)}</span>
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

      {isLoading && (
        <div className="text-center text-gray-600">
          Calculating image distances...
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {comparisonResults && comparisonResults.success && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-6">Comparison Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(comparisonResults.results).map(([algo, result]) => 
              renderAlgorithmCard(algo, result)
            )}
          </div>
        </div>
      )}
    </div>
  );
} 