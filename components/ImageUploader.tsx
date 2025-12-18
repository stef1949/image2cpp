'use client';

import { useRef } from 'react';
import { ImageObject } from '@/lib/types';

interface ImageUploaderProps {
  onFileSelect: (files: FileList) => void;
  images: ImageObject[];
  onRemoveImage: (index: number) => void;
}

export default function ImageUploader({ onFileSelect, images, onRemoveImage }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className="card">
      <h2 className="section-title">1. Select Image</h2>
      
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-emerald-500 transition-colors cursor-pointer bg-gray-50"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
      >
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          <path
            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <div className="mt-4">
          <label htmlFor="file-input" className="cursor-pointer">
            <span className="text-emerald-600 font-semibold hover:text-emerald-700">
              Upload files
            </span>
            <span className="text-gray-600"> or drag and drop</span>
          </label>
          <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
        </div>
        <input
          ref={fileInputRef}
          id="file-input"
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {images.length > 0 && (
        <div className="mt-6 space-y-3">
          <h3 className="font-semibold text-gray-900">Uploaded Images ({images.length})</h3>
          <div className="space-y-2">
            {images.map((image, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center overflow-hidden">
                    <img
                      src={image.img.src}
                      alt={image.glyph || 'uploaded'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{image.glyph || 'Image'}</p>
                    <p className="text-sm text-gray-500">
                      {image.canvas.width} × {image.canvas.height}px
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onRemoveImage(index)}
                  className="text-red-600 hover:text-red-700 font-medium text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
