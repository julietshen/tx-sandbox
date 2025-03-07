'use client';

import React, { useState } from 'react';

interface ImageComparisonProps {
  onImagesSelected?: (image1: File, image2: File) => void;
  matchId?: string;
}

export default function ImageComparison({ onImagesSelected, matchId }: ImageComparisonProps) {
  const [selectedImage1, setSelectedImage1] = useState<File | null>(null);
  const [selectedImage2, setSelectedImage2] = useState<File | null>(null);
  const [imageDistances, setImageDistances] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>, imageNumber: number) => {
    const file = event.target.files?.[0];
    if (file) {
      if (imageNumber === 1) {
        setSelectedImage1(file);
      } else {
        setSelectedImage2(file);
      }

      if (
        (imageNumber === 1 && selectedImage2) ||
        (imageNumber === 2 && selectedImage1)
      ) {
        const img1 = imageNumber === 1 ? file : selectedImage1!;
        const img2 = imageNumber === 2 ? file : selectedImage2!;
        onImagesSelected?.(img1, img2);
      }
    }
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

      {Object.entries(imageDistances).length > 0 && (
        <div className="p-4 bg-gray-100 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Image Distances</h2>
          <div className="grid gap-4">
            {(Object.entries(imageDistances) as [string, number][]).map(([algorithm, distance]) => (
              <div key={algorithm} className="flex justify-between items-center">
                <span className="font-medium">{algorithm}:</span>
                <span>{distance.toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 