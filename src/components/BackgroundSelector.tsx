import React, { useState, useEffect } from 'react';
import { wallpaperOptions, changeWallpaper, getCurrentWallpaper, type WallpaperOption } from '../lib/backgroundUtils';

interface BackgroundSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({ isOpen, onClose }) => {
  const [selectedBackground, setSelectedBackground] = useState(getCurrentWallpaper());

  const handleBackgroundSelect = (wallpaperId: string) => {
    changeWallpaper(wallpaperId);
    setSelectedBackground(wallpaperId);
  };

  // Update selected background when component mounts or wallpaper changes
  useEffect(() => {
    setSelectedBackground(getCurrentWallpaper());
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="glass max-w-md w-full mx-4 p-6 rounded-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Choose Background</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {wallpaperOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleBackgroundSelect(option.id)}
              className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                selectedBackground === option.id
                  ? 'border-blue-500 shadow-lg scale-105'
                  : 'border-gray-200 hover:border-gray-300 hover:scale-102'
              }`}
            >
              <div
                className="w-full h-20 rounded-lg mb-2"
                style={{ background: option.preview }}
              />
              <p className="text-sm font-medium text-gray-700 text-center">
                {option.name}
              </p>
              {selectedBackground === option.id && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackgroundSelector; 