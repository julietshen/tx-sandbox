'use client';

import React, { useState } from 'react';
import ImageComparison from './components/ImageComparison';
import ImageEditor from './components/ImageEditor';

export default function Home() {
  const [selectedImage1, setSelectedImage1] = useState<File | null>(null);
  const [selectedImage2, setSelectedImage2] = useState<File | null>(null);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [imageDistances, setImageDistances] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImagesSelected = async (image1: File, image2: File) => {
    setSelectedImage1(image1);
    setSelectedImage2(image2);
    await calculateImageDistances(image1, image2);
  };

  const calculateImageDistances = async (image1: File, image2: File) => {
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

      if (!response.ok) {
        throw new Error('Failed to compare images');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setImageDistances({
        'PDQ Distance': data.pdq_distance,
        // Add more distances as they become available
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setImageDistances({});
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageEdited = async (editedImageData: string) => {
    // Convert base64 to File object
    const response = await fetch(editedImageData);
    const blob = await response.blob();
    const file = new File([blob], 'edited-image.png', { type: 'image/png' });

    if (editingImage === 'image1') {
      setSelectedImage1(file);
      if (selectedImage2) {
        await calculateImageDistances(file, selectedImage2);
      }
    } else {
      setSelectedImage2(file);
      if (selectedImage1) {
        await calculateImageDistances(selectedImage1, file);
      }
    }
    setEditingImage(null);
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Image Comparison Demo
      </h1>

      <ImageComparison onImagesSelected={handleImagesSelected} />

      {isLoading && (
        <div className="mt-8 text-center text-gray-600">
          Calculating image distances...
        </div>
      )}

      {error && (
        <div className="mt-8 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {Object.entries(imageDistances).length > 0 && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Image Distances</h2>
          <div className="grid gap-4">
            {(Object.entries(imageDistances) as [string, number][]).map(([algorithm, distance]) => (
              <div key={algorithm} className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{algorithm}:</span>
                  <span>{distance.toFixed(4)}</span>
                </div>
                {algorithm === 'PDQ Distance' && (
                  <div className="text-sm text-gray-600 bg-white p-4 rounded-lg">
                    <p className="mb-2">
                      <strong>What does this mean?</strong>
                    </p>
                    <p>
                      PDQ (Perceptual Difference Quantization) distance measures how different two images are:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Range: 0 to 256</li>
                      <li>0: Images are identical or extremely similar</li>
                      <li>256: Images are completely different</li>
                      <li>{distance < 85 ? 
                          "These images are quite similar!" : 
                          distance < 170 ? 
                          "These images have some similarities but notable differences." : 
                          "These images are quite different."}</li>
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex gap-4 justify-center">
        <button
          onClick={() => setEditingImage('image1')}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!selectedImage1 || isLoading}
        >
          Edit Image 1
        </button>
        <button
          onClick={() => setEditingImage('image2')}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!selectedImage2 || isLoading}
        >
          Edit Image 2
        </button>
      </div>

      {editingImage && (selectedImage1 || selectedImage2) && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">
            Editing {editingImage === 'image1' ? 'Image 1' : 'Image 2'}
          </h2>
          <ImageEditor
            imageUrl={URL.createObjectURL(
              editingImage === 'image1' ? selectedImage1! : selectedImage2!
            )}
            onImageEdited={handleImageEdited}
          />
        </div>
      )}
    </main>
  );
} 