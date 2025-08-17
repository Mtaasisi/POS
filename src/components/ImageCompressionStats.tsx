import React from 'react';

interface ImageCompressionStatsProps {
  originalSize: number;
  compressedSize: number;
  format: string;
  className?: string;
}

export const ImageCompressionStats: React.FC<ImageCompressionStatsProps> = ({
  originalSize,
  compressedSize,
  format,
  className = ''
}) => {
  // Calculate stats manually
  const savings = originalSize - compressedSize;
  const savingsPercent = parseFloat(((savings / originalSize) * 100).toFixed(1));
  const compressionRatio = (originalSize / compressedSize).toFixed(2);
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const size = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
    return `${size} ${sizes[i]}`;
  };
  
  // Determine color based on compression efficiency
  const getEfficiencyColor = (percent: number) => {
    if (percent >= 70) return 'text-green-600 bg-green-100';
    if (percent >= 50) return 'text-blue-600 bg-blue-100';
    if (percent >= 30) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <div className={`p-3 rounded-lg border ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-700">Compression Stats</h4>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEfficiencyColor(savingsPercent)}`}>
          {savingsPercent}% smaller
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <div className="text-gray-500">Original</div>
          <div className="font-medium">{formatFileSize(originalSize)}</div>
        </div>
        <div>
          <div className="text-gray-500">Compressed</div>
          <div className="font-medium">{formatFileSize(compressedSize)}</div>
        </div>
        <div>
          <div className="text-gray-500">Format</div>
          <div className="font-medium uppercase">{format}</div>
        </div>
        <div>
          <div className="text-gray-500">Ratio</div>
          <div className="font-medium">{compressionRatio}x</div>
        </div>
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-200">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Space saved:</span>
          <span className="font-medium text-green-600">{formatFileSize(savings)}</span>
        </div>
      </div>
    </div>
  );
};
