'use client';

import React, { useState, useRef } from 'react';
import ReactCrop, { Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageEditorProps {
  imageUrl: string;
  onImageEdited: (editedImage: string) => void;
}

export default function ImageEditor({ imageUrl, onImageEdited }: ImageEditorProps) {
  const [crop, setCrop] = useState<Crop>();
  const [rotation, setRotation] = useState(0);
  const [filter, setFilter] = useState('none');
  const imageRef = useRef<HTMLImageElement>(null);

  const filters = {
    none: 'none',
    grayscale: 'grayscale(100%)',
    sepia: 'sepia(100%)',
    invert: 'invert(100%)',
    blur: 'blur(5px)',
  };

  const handleRotate = (degrees: number) => {
    setRotation((prev) => (prev + degrees) % 360);
  };

  const handleFilterChange = (filterName: keyof typeof filters) => {
    setFilter(filterName);
  };

  const applyChanges = async () => {
    if (!imageRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = imageRef.current.width;
    canvas.height = imageRef.current.height;

    // Apply rotation
    if (rotation !== 0) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }

    // Draw image with filter
    ctx.filter = filters[filter as keyof typeof filters];
    ctx.drawImage(imageRef.current, 0, 0);

    // Apply crop if set
    if (crop) {
      const croppedCanvas = document.createElement('canvas');
      const croppedCtx = croppedCanvas.getContext('2d');
      if (!croppedCtx) return;

      croppedCanvas.width = crop.width;
      croppedCanvas.height = crop.height;
      
      croppedCtx.drawImage(
        canvas,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        crop.width,
        crop.height
      );

      onImageEdited(croppedCanvas.toDataURL());
    } else {
      onImageEdited(canvas.toDataURL());
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="relative">
        <ReactCrop
          crop={crop}
          onChange={(c) => setCrop(c)}
          aspect={undefined}
        >
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Edit"
            style={{
              transform: `rotate(${rotation}deg)`,
              filter: filters[filter as keyof typeof filters],
            }}
          />
        </ReactCrop>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => handleRotate(90)}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Rotate 90°
        </button>
        <button
          onClick={() => handleRotate(-90)}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Rotate -90°
        </button>
      </div>

      <div className="flex gap-4">
        {Object.keys(filters).map((filterName) => (
          <button
            key={filterName}
            onClick={() => handleFilterChange(filterName as keyof typeof filters)}
            className={`px-4 py-2 rounded ${
              filter === filterName ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
          >
            {filterName}
          </button>
        ))}
      </div>

      <button
        onClick={applyChanges}
        className="px-4 py-2 bg-green-500 text-white rounded"
      >
        Apply Changes
      </button>
    </div>
  );
} 