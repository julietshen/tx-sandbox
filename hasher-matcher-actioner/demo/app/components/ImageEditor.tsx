'use client';

import React, { useState, useRef } from 'react';
import ReactCrop, { Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ImageEditorProps {
  imageUrl: string;
  onImageEdited: (editedImage: string) => void;
  mode: 'edit' | 'crop' | 'rotate' | 'filter';
}

const filters = {
  none: 'none',
  grayscale: 'grayscale(100%)',
  sepia: 'sepia(100%)',
  invert: 'invert(100%)',
  blur: 'blur(5px)',
};

export default function ImageEditor({ imageUrl, onImageEdited, mode }: ImageEditorProps) {
  const [crop, setCrop] = useState<Crop>();
  const [rotation, setRotation] = useState(0);
  const [filter, setFilter] = useState('none');
  const imageRef = useRef<HTMLImageElement>(null);

  const applyChanges = async () => {
    if (!imageRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = imageRef.current.width;
    canvas.height = imageRef.current.height;

    if (rotation !== 0) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);
    }

    ctx.filter = filters[filter as keyof typeof filters];
    ctx.drawImage(imageRef.current, 0, 0);

    if (crop) {
      const croppedCanvas = document.createElement('canvas');
      const croppedCtx = croppedCanvas.getContext('2d');
      if (!croppedCtx) return;

      croppedCanvas.width = crop.width;
      croppedCanvas.height = crop.height;
      croppedCtx.drawImage(canvas, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
      onImageEdited(croppedCanvas.toDataURL());
    } else {
      onImageEdited(canvas.toDataURL());
    }
  };

  const imageStyle = {
    transform: `rotate(${rotation}deg)`,
    filter: filters[filter as keyof typeof filters],
    maxWidth: rotation % 180 === 0 ? '100%' : '80%',
    maxHeight: rotation % 180 === 0 ? '100%' : '80%',
    objectFit: 'contain' as const
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="relative flex items-center justify-center bg-gray-50" style={{ width: '100%', aspectRatio: '16/9' }}>
        {mode === 'crop' ? (
          <ReactCrop crop={crop} onChange={setCrop}>
            <img ref={imageRef} src={imageUrl} alt="Edit" style={imageStyle} />
          </ReactCrop>
        ) : (
          <img ref={imageRef} src={imageUrl} alt="Edit" style={imageStyle} />
        )}
      </div>

      {mode === 'rotate' && (
        <div className="flex gap-4">
          {[-90, 90, 180].map((deg) => (
            <button
              key={deg}
              onClick={() => setRotation(prev => (prev + deg) % 360)}
              className="btn btn-outline-secondary"
            >
              {deg === 180 ? 'Flip 180°' : `Rotate ${Math.abs(deg)}° ${deg > 0 ? 'Right' : 'Left'}`}
            </button>
          ))}
        </div>
      )}

      {mode === 'filter' && (
        <div className="flex gap-4 flex-wrap">
          {Object.keys(filters).map((name) => (
            <button
              key={name}
              onClick={() => setFilter(name)}
              className={`btn ${filter === name ? 'btn-primary' : 'btn-outline-secondary'}`}
            >
              {name.charAt(0).toUpperCase() + name.slice(1)}
            </button>
          ))}
        </div>
      )}

      <button onClick={applyChanges} className="btn btn-success mt-4">
        Apply Changes
      </button>
    </div>
  );
} 