'use client';

import { useState } from 'react';
import { Settings } from '@/lib/types';

interface OutputSectionProps {
  settings: Settings;
  setSettings: (settings: Settings) => void;
  outputCode: string;
  onGenerate: () => void;
}

export default function OutputSection({ settings, setSettings, outputCode, onGenerate }: OutputSectionProps) {
  const [copied, setCopied] = useState(false);

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings({ ...settings, [key]: value });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(outputCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="card">
      <h2 className="section-title">4. Output</h2>
      
      <div className="space-y-6">
        {/* Output Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Output Format */}
          <div>
            <label htmlFor="outputFormat" className="block text-sm font-medium text-gray-700 mb-2">
              Code Output Format
            </label>
            <select
              id="outputFormat"
              value={settings.outputFormat}
              onChange={(e) => updateSetting('outputFormat', e.target.value)}
              className="input-field w-full"
            >
              <option value="plain">Plain bytes</option>
              <option value="arduino">Arduino code</option>
              <option value="arduino_single">Arduino code, single bitmap</option>
              <option value="adafruit_gfx">Adafruit GFXbitmapFont</option>
            </select>
          </div>

          {/* Draw Mode */}
          <div>
            <label htmlFor="drawMode" className="block text-sm font-medium text-gray-700 mb-2">
              Draw Mode
            </label>
            <select
              id="drawMode"
              value={settings.drawMode}
              onChange={(e) => updateSetting('drawMode', e.target.value)}
              className="input-field w-full"
            >
              <option value="horizontal">Horizontal - 1 bit per pixel</option>
              <option value="vertical">Vertical - 1 bit per pixel</option>
              <option value="horizontal565">Horizontal - 2 bytes per pixel (565)</option>
              <option value="horizontalAlpha">Horizontal - 1 bit per pixel alpha map</option>
              <option value="horizontal888">Horizontal - 3 bytes per pixel (rgb888)</option>
            </select>
          </div>
        </div>

        {/* Additional Options */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.bitswap || false}
              onChange={(e) => updateSetting('bitswap', e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded"
            />
            <span className="text-sm text-gray-700">Swap bits in byte</span>
          </label>
          <span className="text-xs text-gray-500">(Useful for u8g2 library)</span>
        </div>

        {/* Generate Button */}
        <div>
          <button
            onClick={onGenerate}
            className="btn-primary w-full md:w-auto"
          >
            Generate Code
          </button>
        </div>

        {/* Output Code */}
        {outputCode && (
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">
                Generated Code
              </label>
              <button
                onClick={handleCopy}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>
            <textarea
              value={outputCode}
              readOnly
              className="w-full h-64 p-4 font-mono text-sm bg-gray-900 text-green-400 rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        )}
      </div>
    </div>
  );
}
