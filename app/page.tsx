'use client';

import { useState, useRef, useEffect } from 'react';
import { Settings, ImageObject } from '@/lib/types';
import { placeImage, processImage, getImageType, conversionFunctions } from '@/lib/imageConverter';
import ImageUploader from '@/components/ImageUploader';
import ImageSettings from '@/components/ImageSettings';
import PreviewSection from '@/components/PreviewSection';
import OutputSection from '@/components/OutputSection';

export default function Home() {
  const [settings, setSettings] = useState<Settings>({
    screenWidth: 128,
    screenHeight: 64,
    scaleToFit: true,
    preserveRatio: true,
    centerHorizontally: false,
    centerVertically: false,
    flipHorizontally: false,
    flipVertically: false,
    backgroundColor: 'white',
    scale: 1,
    drawMode: 'horizontal',
    removeZeroesCommas: false,
    ditheringThreshold: 128,
    ditheringMode: 0,
    outputFormat: 'arduino',
    invertColors: false,
    rotation: 0,
  });

  const [images, setImages] = useState<ImageObject[]>([]);
  const [outputCode, setOutputCode] = useState<string>('');

  const updateAllImages = () => {
    images.forEach(image => {
      placeImage(image, settings);
    });
  };

  useEffect(() => {
    updateAllImages();
  }, [settings]);

  const handleFileSelect = (files: FileList) => {
    const newImages: ImageObject[] = [];
    const fileArray = Array.from(files).filter(file => file.type.match('image.*'));

    fileArray.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          
          const imageObj: ImageObject = {
            img,
            canvas,
            glyph: file.name.split('.')[0],
          };
          
          placeImage(imageObj, settings);
          
          setImages(prev => [...prev, imageObj]);
        };
        if (e.target?.result) {
          img.src = e.target.result as string;
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const generateOutput = () => {
    let outputString = '';
    let code = '';

    switch (settings.outputFormat) {
      case 'arduino': {
        const varQuickArray: string[] = [];
        let bytesUsed = 0;
        
        images.forEach((image) => {
          code = processImage(image, settings);
          code = code.replace(/,\s*$/, '');
          code = `\t${code.split('\n').join('\n\t')}\n`;
          const comment = `// '${image.glyph}', ${image.canvas.width}x${image.canvas.height}px\n`;
          bytesUsed += code.split('\n').length * 16;

          const varname = 'epd_bitmap_' + (image.glyph || '').replace(/[^a-zA-Z0-9]/g, '_');
          varQuickArray.push(varname);
          code = `${comment}const ${getImageType(settings.drawMode)} ${varname} [] PROGMEM = {\n${code}};\n`;
          outputString += code;
        });

        varQuickArray.sort();
        outputString += `\n// Array of all bitmaps for convenience. (Total bytes used to store images in PROGMEM = ${bytesUsed})\n`;
        outputString += `const int epd_bitmap_allArray_LEN = ${varQuickArray.length};\n`;
        outputString += `const ${getImageType(settings.drawMode)}* epd_bitmap_allArray[${varQuickArray.length}] = {\n\t${varQuickArray.join(',\n\t')}\n};\n`;
        break;
      }

      case 'arduino_single': {
        let comment = '';
        images.forEach((image) => {
          code = processImage(image, settings);
          code = `\t${code.split('\n').join('\n\t')}\n`;
          comment = `\t// '${image.glyph}, ${image.canvas.width}x${image.canvas.height}px\n`;
          outputString += comment + code;
        });

        outputString = outputString.replace(/,\s*$/, '');
        outputString = `const ${getImageType(settings.drawMode)} epd_bitmap_ [] PROGMEM = {\n${outputString}\n};`;
        break;
      }

      default: {
        images.forEach((image) => {
          code = processImage(image, settings);
          let comment = '';
          if (image.glyph) {
            comment = `// '${image.glyph}', ${image.canvas.width}x${image.canvas.height}px\n`;
          }
          if (image !== images[0]) {
            comment = `\n${comment}`;
          }
          code = comment + code;
          outputString += code;
        });
        outputString = outputString.replace(/,\s*$/g, '');
      }
    }

    setOutputCode(outputString);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-emerald-600">image2cpp</h1>
              <p className="text-gray-600 mt-1">Convert images to byte arrays for embedded displays</p>
            </div>
            <div className="flex gap-3">
              <a 
                href="https://github.com/javl/image2cpp" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                GitHub
              </a>
              <a 
                href="https://github.com/sponsors/javl" 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-primary"
              >
                ❤️ Sponsor
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Info Card */}
          <div className="card">
            <p className="text-gray-700">
              <strong className="text-emerald-600">image2cpp</strong> is a simple tool to change images into byte arrays (or arrays back into images) for use with monochrome displays such as OLEDs on your Arduino or Raspberry Pi.
            </p>
            <p className="text-sm text-gray-600 mt-3">
              All processing is done locally in your browser; your images are not uploaded or stored anywhere online.
            </p>
          </div>

          {/* Image Uploader */}
          <ImageUploader 
            onFileSelect={handleFileSelect}
            images={images}
            onRemoveImage={handleRemoveImage}
          />

          {/* Image Settings */}
          <ImageSettings 
            settings={settings}
            setSettings={setSettings}
            images={images}
          />

          {/* Preview */}
          <PreviewSection images={images} />

          {/* Output */}
          <OutputSection 
            settings={settings}
            setSettings={setSettings}
            outputCode={outputCode}
            onGenerate={generateOutput}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-8 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-600 text-sm">
            Made with ❤️ by <a href="https://github.com/javl" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700">javl</a> and the community
          </p>
        </div>
      </footer>
    </div>
  );
}
