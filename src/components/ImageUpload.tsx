import React, { useState, useCallback, useRef } from 'react';
import { ImageUploadService, UploadedImage, UploadResult } from '../lib/imageUpload';
import { localProductStorage } from '../lib/localProductStorage';

interface ImageUploadProps {
  productId: string;
  userId: string;
  onUploadComplete?: (images: UploadedImage[]) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  className?: string;
}

interface FileWithPreview {
  file: File;
  preview?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  productId,
  userId,
  onUploadComplete,
  onUploadError,
  maxFiles = 5,
  className = ''
}) => {
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

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
      setTimeout(() => setErrors([]), 5000); // Clear errors after 5 seconds
    }

    setFiles(prev => [...prev, ...newFiles]);
  }, [files.length, maxFiles]);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add('border-blue-500', 'bg-blue-50');
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-blue-500', 'bg-blue-50');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-blue-500', 'bg-blue-50');
    }
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  // Upload files
  const uploadFiles = async () => {
    if (files.length === 0) return;

    console.log('🔍 DEBUG: uploadFiles called');
    console.log('🔍 DEBUG: Files to upload:', files.map(f => ({ name: f.file.name, size: f.file.size, type: f.file.type })));

    setUploading(true);
    setUploadProgress({});
    setErrors([]);

    try {
      console.log('🔍 DEBUG: Starting upload process');
      console.log('🔍 DEBUG: Environment check:', {
        productId,
        userId,
        fileCount: files.length,
        isDev: import.meta.env.DEV,
        hostname: window.location.hostname
      });

      const successfulUploads: UploadedImage[] = [];
      const failedUploads: string[] = [];

      // Force Supabase storage mode - no more development mode fallback
      console.log('🚀 DEBUG: FORCED: Using Supabase storage mode only');
      
      for (let i = 0; i < files.length; i++) {
        const fileWrapper = files[i];
        const file = fileWrapper.file;
        const isPrimary = i === 0; // First image is primary
        
        console.log(`📤 Uploading file ${i + 1}/${files.length} to Supabase:`, {
          fileName: file.name,
          fileSize: file.size,
          isPrimary
        });
        
        setUploadProgress(prev => ({ ...prev, [file.name]: 50 }));
        
        try {
          console.log(`🔍 DEBUG: About to upload ${file.name} to Supabase`);
          console.log(`🔍 DEBUG: Upload parameters:`, {
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            productId,
            userId,
            isPrimary
          });
          
          // Additional debugging for file object before upload
          console.log(`🔍 DEBUG: File object before upload:`, {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            isFile: file instanceof File,
            constructor: file.constructor.name,
            hasPreview: 'preview' in fileWrapper
          });

          // Force use of Supabase storage service
          console.log(`🔍 DEBUG: Calling ImageUploadService.uploadImage...`);
          const uploadResult = await ImageUploadService.uploadImage(
            file,
            productId,
            userId,
            isPrimary
          );
          
          console.log(`📥 DEBUG: Supabase upload result for ${file.name}:`, uploadResult);
          console.log(`📥 DEBUG: Upload success: ${uploadResult.success}`);
          console.log(`📥 DEBUG: Upload error: ${uploadResult.error}`);
          console.log(`📥 DEBUG: Upload image data:`, uploadResult.image);
          
          if (uploadResult.success && uploadResult.image) {
            successfulUploads.push(uploadResult.image);
            setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
            console.log(`✅ DEBUG: Successfully uploaded to Supabase: ${file.name}`);
            console.log(`✅ DEBUG: Image data:`, uploadResult.image);
          } else {
            failedUploads.push(`${file.name}: ${uploadResult.error}`);
            setUploadProgress(prev => ({ ...prev, [file.name]: -1 }));
            console.error(`❌ DEBUG: Supabase upload failed: ${file.name} - ${uploadResult.error}`);
            console.error(`❌ DEBUG: Full error details:`, uploadResult);
          }
        } catch (error: any) {
          console.error(`❌ DEBUG: Error uploading ${file.name} to Supabase:`, error);
          console.error(`❌ DEBUG: Error type:`, typeof error);
          console.error(`❌ DEBUG: Error message:`, error.message);
          console.error(`❌ DEBUG: Error stack:`, error.stack);
          failedUploads.push(`${file.name}: ${error.message}`);
          setUploadProgress(prev => ({ ...prev, [file.name]: -1 }));
        }
      }

      if (successfulUploads.length > 0) {
        console.log('✅ Supabase uploads completed successfully:', successfulUploads);
        onUploadComplete?.(successfulUploads);
      }

      if (failedUploads.length > 0) {
        console.error('❌ Some Supabase uploads failed:', failedUploads);
        const errorMessage = failedUploads.join(', ');
        setErrors(failedUploads);
        onUploadError?.(errorMessage);
      }

    } catch (error: any) {
      console.error('❌ Supabase upload process failed:', error);
      const errorMessage = error.message || 'Supabase upload failed';
      setErrors([errorMessage]);
      onUploadError?.(errorMessage);
    } finally {
      setUploading(false);
      setFiles([]);
      setUploadProgress({});
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
  const clearAllFiles = () => {
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
      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          {errors.map((error, index) => (
            <div key={index} className="text-red-700 text-sm">
              ❌ {error}
            </div>
          ))}
        </div>
      )}

      {/* Drop Zone */}
      <div
        ref={dropZoneRef}
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors duration-200 hover:border-gray-400"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-2">
          <div className="text-gray-600">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="text-gray-600">
            <label htmlFor="file-upload" className="cursor-pointer">
              <span className="font-medium text-blue-600 hover:text-blue-500">
                Click to upload
              </span>
              <span className="text-gray-500"> or drag and drop</span>
            </label>
            <input
              id="file-upload"
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </div>
          <p className="text-xs text-gray-500">
            PNG, JPG, GIF, WebP up to 10MB each (max {maxFiles} files)
          </p>
        </div>
      </div>

      {/* File Previews */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Selected Files ({files.length}/{maxFiles})
            </h3>
            <div className="space-x-2">
              <button
                onClick={clearAllFiles}
                className="text-sm text-red-600 hover:text-red-700"
                disabled={uploading}
              >
                Clear All
              </button>
              <button
                onClick={uploadFiles}
                disabled={uploading || files.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Uploading...' : `Upload ${files.length} File${files.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((fileWrapper, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={fileWrapper.preview}
                    alt={fileWrapper.file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Progress Overlay */}
                {uploadProgress[fileWrapper.file.name] !== undefined && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="text-white text-center">
                      {uploadProgress[fileWrapper.file.name] === 100 ? (
                        <div className="text-green-400">✅ Uploaded</div>
                      ) : uploadProgress[fileWrapper.file.name] === -1 ? (
                        <div className="text-red-400">❌ Failed</div>
                      ) : (
                        <div className="text-white">Uploading...</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Remove Button */}
                <button
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                >
                  ×
                </button>

                {/* File Info */}
                <div className="mt-2 text-xs text-gray-600">
                  <div className="font-medium truncate">{fileWrapper.file.name}</div>
                  <div>{(fileWrapper.file.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
