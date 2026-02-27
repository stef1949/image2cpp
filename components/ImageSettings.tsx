'use client';

import { Settings, ImageObject } from '@/lib/types';

interface ImageSettingsProps {
  settings: Settings;
  setSettings: (settings: Settings) => void;
  images: ImageObject[];
}

export default function ImageSettings({ settings, setSettings, images }: ImageSettingsProps) {
  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings({ ...settings, [key]: value });
  };

  return (
    <div className="card">
      <h2 className="section-title">2. Image Settings</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Canvas Size */}
        {images.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Canvas Size
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={settings.screenWidth}
                onChange={(e) => updateSetting('screenWidth', parseInt(e.target.value) || 128)}
                className="input-field w-24"
                min="1"
              />
              <span className="text-gray-500">×</span>
              <input
                type="number"
                value={settings.screenHeight}
                onChange={(e) => updateSetting('screenHeight', parseInt(e.target.value) || 64)}
                className="input-field w-24"
                min="1"
              />
              <span className="text-gray-500 text-sm">px</span>
            </div>
          </div>
        )}

        {/* Background Color */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Background Color
          </label>
          <div className="flex gap-4">
            {['white', 'black', 'transparent'].map((color) => (
              <label key={color} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="backgroundColor"
                  value={color}
                  checked={settings.backgroundColor === color}
                  onChange={(e) => updateSetting('backgroundColor', e.target.value as 'white' | 'black' | 'transparent')}
                  className="w-4 h-4 text-emerald-600"
                />
                <span className="text-sm text-gray-700 capitalize">{color}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Invert Colors */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.invertColors}
              onChange={(e) => updateSetting('invertColors', e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded"
            />
            <span className="text-sm font-medium text-gray-700">Invert image colors</span>
          </label>
        </div>

        {/* Dithering */}
        <div>
          <label htmlFor="dithering" className="block text-sm font-medium text-gray-700 mb-2">
            Dithering
          </label>
          <select
            id="dithering"
            value={settings.ditheringMode}
            onChange={(e) => updateSetting('ditheringMode', parseInt(e.target.value))}
            className="input-field w-full"
          >
            <option value="0">Binary</option>
            <option value="1">Bayer</option>
            <option value="2">Floyd-Steinberg</option>
            <option value="3">Atkinson</option>
          </select>
        </div>

        {/* Brightness Threshold */}
        <div>
          <label htmlFor="threshold" className="block text-sm font-medium text-gray-700 mb-2">
            Brightness / Alpha Threshold: {settings.ditheringThreshold}
          </label>
          <input
            id="threshold"
            type="range"
            min="0"
            max="255"
            value={settings.ditheringThreshold}
            onChange={(e) => updateSetting('ditheringThreshold', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
          />
          <p className="text-xs text-gray-500 mt-1">
            0-255: Pixels above this level become white, otherwise black
          </p>
        </div>

        {/* Scaling */}
        <div>
          <label htmlFor="scaling" className="block text-sm font-medium text-gray-700 mb-2">
            Scaling
          </label>
          <select
            id="scaling"
            value={settings.scale}
            onChange={(e) => updateSetting('scale', parseInt(e.target.value))}
            className="input-field w-full"
          >
            <option value="1">Original size</option>
            <option value="2">Scale to fit, keeping proportions</option>
            <option value="3">Stretch to fill canvas</option>
            <option value="4">Stretch to fill canvas horizontally</option>
            <option value="5">Stretch to fill canvas vertically</option>
          </select>
        </div>

        {/* Center Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Center Image
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.centerHorizontally}
                onChange={(e) => updateSetting('centerHorizontally', e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <span className="text-sm text-gray-700">Horizontally</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.centerVertically}
                onChange={(e) => updateSetting('centerVertically', e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <span className="text-sm text-gray-700">Vertically</span>
            </label>
          </div>
        </div>

        {/* Rotation */}
        <div>
          <label htmlFor="rotation" className="block text-sm font-medium text-gray-700 mb-2">
            Rotate Image
          </label>
          <select
            id="rotation"
            value={settings.rotation}
            onChange={(e) => updateSetting('rotation', parseInt(e.target.value))}
            className="input-field w-full"
          >
            <option value="0">0°</option>
            <option value="90">90°</option>
            <option value="180">180°</option>
            <option value="270">270°</option>
          </select>
        </div>

        {/* Flip Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Flip Image
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.flipHorizontally}
                onChange={(e) => updateSetting('flipHorizontally', e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <span className="text-sm text-gray-700">Horizontally</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.flipVertically}
                onChange={(e) => updateSetting('flipVertically', e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <span className="text-sm text-gray-700">Vertically</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
