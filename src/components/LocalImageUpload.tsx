import React, { useState, useCallback, useRef } from 'react';
import { LocalImageStorageService, LocalImageData, LocalUploadResult } from '../lib/localImageStorage';

interface LocalImageUploadProps {
  productId: string;
  userId: string;
  onUploadComplete?: (images: LocalImageData[]) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  className?: string;
}

interface FileWithPreview {
  file: File;
  preview?: string;
}

export const LocalImageUpload: React.FC<LocalImageUploadProps> = ({
  productId,
  userId,
  onUploadComplete,
  onUploadError,
  maxFiles = 5,
  className = ''
}) => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: FileWithPreview[] = [];
    const newErrors: string[] = [];

    Array.from(selectedFiles).forEach((file) => {
      // Validate file count
      if (files.length + newFiles.length >= maxFiles) {
        newErrors.push(`Maximum ${maxFiles} files allowed`);
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        newErrors.push(`${file.name} is not an image file`);
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        newErrors.push(`${file.name} is too large (max 10MB)`);
        return;
      }

      // Create preview - wrap the original file object to preserve its integrity
      const fileWithPreview: FileWithPreview = {
        file: file,
        preview: URL.createObjectURL(file)
      };

      newFiles.push(fileWithPreview);
    });

    if (newErrors.length > 0) {
      setErrors(prev => [...prev, ...newErrors]);
      setTimeout(() => setErrors([]), 5000);
    }

    setFiles(prev => [...prev, ...newFiles]);
  }, [files.length, maxFiles]);

  // Upload files to local storage
  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setErrors([]);

    try {
      const results = await LocalImageStorageService.uploadMultipleImages(files.map(f => f.file), productId, userId);
      
      const successfulUploads: LocalImageData[] = [];
      const failedUploads: string[] = [];

      results.forEach((result, index) => {
        if (result.success && result.image) {
          successfulUploads.push({
            id: result.image.id,
            url: result.image.url,
            localPath: result.image.localPath,
            fileName: result.image.fileName,
            fileSize: result.image.fileSize,
            mimeType: result.image.mimeType,
            uploadedAt: result.image.uploadedAt,
            isPrimary: index === 0
          });
        } else {
          failedUploads.push(`${files[index].file.name}: ${result.error}`);
        }
      });

      if (successfulUploads.length > 0) {
        onUploadComplete?.(successfulUploads);
        setFiles([]);
      }

      if (failedUploads.length > 0) {
        setErrors(failedUploads);
        onUploadError?.(failedUploads.join(', '));
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setErrors([errorMessage]);
      onUploadError?.(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  // Remove file
  const removeFile = (index: number) => {
    const fileWrapper = files[index];
    if (fileWrapper.preview) {
      URL.revokeObjectURL(fileWrapper.preview);
    }
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Clear all files
  const clearFiles = () => {
    files.forEach(fileWrapper => {
      if (fileWrapper.preview) {
        URL.revokeObjectURL(fileWrapper.preview);
      }
    });
    setFiles([]);
    setErrors([]);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Error Display */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          {errors.map((error, index) => (
            <div key={index} className="text-red-600 text-sm">{error}</div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors cursor-pointer hover:border-blue-400"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="space-y-2">
          <div className="text-gray-600">
            <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="text-gray-600">
            <span className="font-medium text-blue-600 hover:text-blue-500">
              Click to upload
            </span>{' '}
            images
          </div>
          <p className="text-xs text-gray-500">
            PNG, JPG, GIF, WebP up to 10MB
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              Selected Files ({files.length}/{maxFiles})
            </h3>
            <div className="space-x-2">
              <button
                onClick={clearFiles}
                className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
              >
                Clear All
              </button>
              <button
                onClick={uploadFiles}
                disabled={uploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload Images'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((fileWrapper, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  {fileWrapper.preview && (
                    <img
                      src={fileWrapper.preview}
                      alt={fileWrapper.file.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ×
                </button>

                {/* File Info */}
                <div className="mt-2 text-xs text-gray-600">
                  <div className="font-medium truncate">{fileWrapper.file.name}</div>
                  <div>{(() => {
                  const formatted = (fileWrapper.file.size / 1024 / 1024).toFixed(2);
                  return formatted.replace(/\.00$/, '').replace(/\.0$/, '');
                })()} MB</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
