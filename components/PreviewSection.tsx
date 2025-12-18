'use client';

import { useEffect, useRef } from 'react';
import { ImageObject } from '@/lib/types';

interface PreviewSectionProps {
  images: ImageObject[];
}

export default function PreviewSection({ images }: PreviewSectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      // Clear existing canvases
      containerRef.current.innerHTML = '';
      
      // Add new canvases
      images.forEach((image, index) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200';
        
        const label = document.createElement('div');
        label.className = 'text-sm font-medium text-gray-700';
        label.textContent = image.glyph || `Image ${index + 1}`;
        
        const canvasWrapper = document.createElement('div');
        canvasWrapper.className = 'bg-white p-2 rounded border border-gray-300';
        canvasWrapper.appendChild(image.canvas);
        
        wrapper.appendChild(label);
        wrapper.appendChild(canvasWrapper);
        containerRef.current?.appendChild(wrapper);
      });
    }
  }, [images]);

  return (
    <div className="card">
      <h2 className="section-title">3. Preview</h2>
      
      {images.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="mt-2">No images to preview</p>
          <p className="text-sm">Upload some images to see them here</p>
        </div>
      ) : (
        <div 
          ref={containerRef}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        />
      )}
    </div>
  );
}
