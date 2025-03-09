'use client';

import React, { useState } from 'react';
import ImageComparison from './components/ImageComparison';
import ImageEditor from './components/ImageEditor';

export default function Home() {
  const [selectedImage1, setSelectedImage1] = useState<File | null>(null);
  const [selectedImage2, setSelectedImage2] = useState<File | null>(null);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [mode, setMode] = useState<'edit' | 'rotate'>('edit');

  const handleImagesSelected = async (image1: File, image2: File) => {
    setSelectedImage1(image1);
    setSelectedImage2(image2);
  };

  const handleImageEdited = async (editedImageData: string) => {
    // Convert base64 to File object
    const response = await fetch(editedImageData);
    const blob = await response.blob();
    const file = new File([blob], 'edited-image.png', { type: 'image/png' });

    if (editingImage === 'image1') {
      setSelectedImage1(file);
    } else {
      setSelectedImage2(file);
    }
    setEditingImage(null);
  };

  return (
    <main className="min-h-screen p-8">
      <ImageComparison onImagesSelected={handleImagesSelected} />
      
      {editingImage && (selectedImage1 || selectedImage2) && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingImage && mode === 'rotate' ? 
              `Rotating Image ${editingImage === 'image1' ? '1' : '2'}` :
              `Editing ${editingImage === 'image1' ? 'Image 1' : 'Image 2'}`}
          </h2>
          <ImageEditor
            imageUrl={URL.createObjectURL(
              editingImage === 'image1' ? selectedImage1! : selectedImage2!
            )}
            onImageEdited={handleImageEdited}
            mode={mode}
          />
        </div>
      )}
    </main>
  );
} 