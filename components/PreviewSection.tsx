'use client';

import { useEffect, useState } from 'react';
import { ImageObject } from '@/lib/types';

interface PreviewSectionProps {
  images: ImageObject[];
}

interface CanvasPreview {
  id: string;
  glyph: string;
  canvas: HTMLCanvasElement;
}

export default function PreviewSection({ images }: PreviewSectionProps) {
  const [previews, setPreviews] = useState<CanvasPreview[]>([]);

  useEffect(() => {
    const newPreviews = images.map((image, index) => ({
      id: `canvas-${index}-${Date.now()}`,
      glyph: image.glyph || `Image ${index + 1}`,
      canvas: image.canvas,
    }));
    setPreviews(newPreviews);
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {previews.map((preview) => (
            <CanvasPreviewItem key={preview.id} preview={preview} />
          ))}
        </div>
      )}
    </div>
  );
}

function CanvasPreviewItem({ preview }: { preview: CanvasPreview }) {
  const containerRef = useEffect(() => {
    // Component will handle mounting the canvas
  }, []);

  return (
    <div className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <div className="text-sm font-medium text-gray-700">{preview.glyph}</div>
      <div 
        className="bg-white p-2 rounded border border-gray-300"
        ref={(node) => {
          if (node && !node.contains(preview.canvas)) {
            node.appendChild(preview.canvas);
          }
        }}
      />
    </div>
  );
}
