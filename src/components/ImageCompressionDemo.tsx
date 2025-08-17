import React, { useState, useCallback } from 'react';
import { ImageCompressionService } from '../lib/imageCompressionService';
import { ImageCompressionStats } from './ImageCompressionStats';

export const ImageCompressionDemo: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [compressedImage, setCompressedImage] = useState<any>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [webpSupported, setWebpSupported] = useState(false);

  // Check WebP support on component mount
  React.useEffect(() => {
    setWebpSupported(ImageCompressionService.isWebPSupported());
  }, []);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setCompressedImage(null);
    }
  }, []);

  const handleCompress = useCallback(async () => {
    if (!selectedFile) return;

    setIsCompressing(true);
    try {
      const optimalFormat = ImageCompressionService.getOptimalFormat(selectedFile.type);
      
      const compressed = await ImageCompressionService.compressImage(selectedFile, {
        maxWidth: 300,
        maxHeight: 300,
        quality: 0.8,
        format: optimalFormat as 'jpeg' | 'webp' | 'png'
      });

      setCompressedImage(compressed);
    } catch (error) {
      console.error('Compression failed:', error);
      alert('Failed to compress image');
    } finally {
      setIsCompressing(false);
    }
  }, [selectedFile]);

  const downloadCompressed = useCallback(() => {
    if (!compressedImage) return;

    const url = URL.createObjectURL(compressedImage.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compressed_${selectedFile?.name || 'image'}.${compressedImage.format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [compressedImage, selectedFile]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Image Compression Demo</h1>
        <p className="text-gray-600">
          Upload an image to see how our compression system optimizes it for fast loading
        </p>
        
        {/* WebP Support Indicator */}
        <div className="mt-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            webpSupported 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {webpSupported ? '✅ WebP Supported' : '⚠️ WebP Not Supported (will use JPEG)'}
          </span>
        </div>
      </div>

      {/* File Upload */}
      <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
        <div className="space-y-4">
          <div className="text-gray-600">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <label htmlFor="image-upload" className="cursor-pointer">
              <span className="font-medium text-blue-600 hover:text-blue-500">
                Click to upload an image
              </span>
            </label>
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
          <p className="text-sm text-gray-500">
            PNG, JPG, GIF, WebP up to 10MB
          </p>
        </div>
      </div>

      {/* Selected File Info */}
      {selectedFile && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Selected Image</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="Original"
                className="w-full h-64 object-cover rounded-lg"
              />
              <div className="mt-2 text-sm text-gray-600">
                <div>Name: {selectedFile.name}</div>
                <div>Size: {ImageCompressionService.formatFileSize(selectedFile.size)}</div>
                <div>Type: {selectedFile.type}</div>
              </div>
            </div>
            
            <div className="flex flex-col justify-center space-y-4">
              <button
                onClick={handleCompress}
                disabled={isCompressing}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCompressing ? 'Compressing...' : 'Compress Image'}
              </button>
              
              {compressedImage && (
                <div className="space-y-4">
                  <div>
                    <img
                      src={URL.createObjectURL(compressedImage.blob)}
                      alt="Compressed"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>
                  
                  <ImageCompressionStats
                    originalSize={selectedFile.size}
                    compressedSize={compressedImage.size}
                    format={compressedImage.format}
                  />
                  
                  <button
                    onClick={downloadCompressed}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Download Compressed
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border p-6">
          <div className="text-2xl mb-2">🚀</div>
          <h3 className="font-medium text-gray-900 mb-2">Fast Loading</h3>
          <p className="text-sm text-gray-600">
            Compressed thumbnails load up to 10x faster than original images
          </p>
        </div>
        
        <div className="bg-white rounded-lg border p-6">
          <div className="text-2xl mb-2">💾</div>
          <h3 className="font-medium text-gray-900 mb-2">Space Saving</h3>
          <p className="text-sm text-gray-600">
            Reduce file sizes by up to 80% while maintaining visual quality
          </p>
        </div>
        
        <div className="bg-white rounded-lg border p-6">
          <div className="text-2xl mb-2">📱</div>
          <h3 className="font-medium text-gray-900 mb-2">Mobile Optimized</h3>
          <p className="text-sm text-gray-600">
            Automatically optimized for mobile devices and slow connections
          </p>
        </div>
      </div>
    </div>
  );
};
