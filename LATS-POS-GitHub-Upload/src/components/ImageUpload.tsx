import React, { useState, useCallback, useRef, useEffect } from 'react';
import { EnhancedImageUploadService, UploadedImage, UploadResult } from '../lib/enhancedImageUpload';
import { ImageCompressionStats } from './ImageCompressionStats';
import { supabase } from '../lib/supabaseClient';

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
  compressionStats?: {
    originalSize: number;
    compressedSize: number;
    format: string;
  };
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

      // Create preview - compression stats will be generated later
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
    
    // Automatically start uploading new files in background
    if (newFiles.length > 0) {
      setTimeout(() => uploadFilesInBackground(newFiles), 100);
    }
  }, [files.length, maxFiles]);

  // Generate compression stats for files (simplified for now)
  const generateCompressionStats = useCallback(async (file: File) => {
    try {
      // For now, just estimate compression without actual processing
      const estimatedCompressedSize = Math.round(file.size * 0.3); // Estimate 70% reduction
      return {
        originalSize: file.size,
        compressedSize: estimatedCompressedSize,
        format: 'webp'
      };
    } catch (error) {
      console.warn('Failed to generate compression preview:', error);
      return null;
    }
  }, []);

  // Generate compression stats for all files when files change
  useEffect(() => {
    const generateStats = async () => {
      const updatedFiles = await Promise.all(
        files.map(async (fileWrapper) => {
          if (!fileWrapper.compressionStats) {
            const stats = await generateCompressionStats(fileWrapper.file);
            return {
              ...fileWrapper,
              compressionStats: stats
            };
          }
          return fileWrapper;
        })
      );
      setFiles(updatedFiles);
    };

    if (files.length > 0) {
      generateStats();
    }
  }, [files.length, generateCompressionStats]);

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

  // Upload files in background (non-blocking)
  const uploadFilesInBackground = async (filesToUpload: FileWithPreview[]) => {
    if (filesToUpload.length === 0) return;

    console.log('🔍 DEBUG: uploadFilesInBackground called');
    console.log('🔍 DEBUG: Files to upload:', filesToUpload.map(f => ({ name: f.file.name, size: f.file.size, type: f.file.type })));

    setUploading(true);
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      filesToUpload.forEach(fileWrapper => {
        newProgress[fileWrapper.file.name] = 0;
      });
      return newProgress;
    });
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

      // Check network connectivity
      console.log('🌐 Checking network connectivity...');
      const isOnline = navigator.onLine;
      console.log('🌐 Network status:', { isOnline, connectionType: (navigator as any).connection?.type });

      if (!isOnline) {
        throw new Error('No internet connection. Please check your network and try again.');
      }

      // Test Supabase connection
      console.log('🔍 Testing Supabase connection...');
      try {
        const { data, error } = await supabase.from('devices').select('count').limit(1);
        if (error) {
          console.warn('⚠️ Supabase connection test failed:', error);
        } else {
          console.log('✅ Supabase connection test successful');
        }
      } catch (connectionError) {
        console.warn('⚠️ Supabase connection test failed:', connectionError);
      }

      // Run comprehensive diagnostics
      console.log('🔍 Running upload environment diagnostics...');
      const diagnostics = await EnhancedImageUploadService.diagnoseUploadEnvironment();
      console.log('📊 Upload environment diagnostics:', diagnostics);
      
      if (diagnostics.issues.length > 0) {
        console.warn('⚠️ Upload environment issues detected:', diagnostics.issues);
        // Don't fail the upload yet, but log the issues
      }

      const successfulUploads: UploadedImage[] = [];
      const failedUploads: string[] = [];

      // Force Supabase storage mode - no more development mode fallback
      console.log('🚀 DEBUG: FORCED: Using Supabase storage mode only');
      
      for (let i = 0; i < filesToUpload.length; i++) {
        const fileWrapper = filesToUpload[i];
        const file = fileWrapper.file;
        const isPrimary = files.length === 0 && i === 0; // First image is primary if no existing files
        
        console.log(`📤 Uploading file ${i + 1}/${files.length} to Supabase:`, {
          fileName: file.name,
          fileSize: file.size,
          isPrimary
        });
        
        setUploadProgress(prev => ({ ...prev, [file.name]: 25 }));
        
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

          setUploadProgress(prev => ({ ...prev, [file.name]: 50 }));

          // Use enhanced image upload service with compression and retry
          console.log(`🔍 DEBUG: Calling EnhancedImageUploadService.uploadImage...`);
          
          // Add retry mechanism
          let uploadResult: UploadResult;
          let retryCount = 0;
          const maxRetries = 2;
          
          do {
            try {
              uploadResult = await EnhancedImageUploadService.uploadImage(
                file,
                productId,
                userId,
                {
                  generateThumbnail: true,
                  thumbnailSize: { width: 150, height: 150 }, // Use optimal small size
                  isPrimary: isPrimary
                }
              );
              break; // Success, exit retry loop
            } catch (retryError: any) {
              retryCount++;
              console.warn(`⚠️ Upload attempt ${retryCount} failed for ${file.name}:`, retryError);
              
              if (retryCount <= maxRetries) {
                console.log(`🔄 Retrying upload for ${file.name} (attempt ${retryCount + 1}/${maxRetries + 1})...`);
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
              } else {
                throw retryError; // Re-throw if all retries failed
              }
            }
          } while (retryCount <= maxRetries);
          
          setUploadProgress(prev => ({ ...prev, [file.name]: 75 }));
          
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

      // Call completion callback
      if (successfulUploads.length > 0 && onUploadComplete) {
        onUploadComplete(successfulUploads);
      }

      if (failedUploads.length > 0 && onUploadError) {
        onUploadError(failedUploads.join(', '));
      }

      setUploading(false);
      console.log('✅ DEBUG: Background upload completed');
    } catch (error: any) {
      console.error('❌ DEBUG: Background upload failed:', error);
      setErrors(prev => [...prev, error.message]);
      setUploading(false);
    }
  };

  // Manual upload function (for backward compatibility)
  const uploadFiles = async () => {
    if (files.length === 0) return;
    await uploadFilesInBackground(files);
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

      {/* Drop Zone with File Previews */}
      <div
        ref={dropZoneRef}
        className="border-2 border-dashed border-gray-300 rounded-lg p-4 transition-colors duration-200 hover:border-gray-400"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {files.length === 0 ? (
          /* Empty State */
          <label htmlFor="file-upload" className="flex items-center justify-center gap-3 py-8 cursor-pointer hover:bg-gray-50 transition-colors">
            <svg className="h-6 w-6 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 24 24">
              <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-sm">
              <span className="font-medium text-blue-600 hover:text-blue-500">
                Upload images
              </span>
              <span className="text-gray-500"> or drag & drop</span>
            </span>
            <input
              id="file-upload"
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </label>
        ) : (
          /* Files Display */
          <div className="space-y-3 cursor-pointer hover:bg-gray-50 transition-colors p-2 -m-2 rounded" onClick={() => fileInputRef.current?.click()}>
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {files.length} file{files.length !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={clearAllFiles}
                className="text-xs text-red-600 hover:text-red-700"
                disabled={uploading}
              >
                Clear
              </button>
            </div>

            {/* Image Grid */}
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {files.map((fileWrapper, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={fileWrapper.preview}
                      alt={fileWrapper.file.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                    
                                      {/* Upload Progress Overlay */}
                  {uploadProgress[fileWrapper.file.name] !== undefined && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center rounded-xl">
                      {uploadProgress[fileWrapper.file.name] === 100 ? (
                        <div className="text-center">
                          <div className="text-green-400 text-2xl mb-1">✓</div>
                          <div className="text-white text-xs">Uploaded</div>
                        </div>
                      ) : uploadProgress[fileWrapper.file.name] === -1 ? (
                        <div className="text-center">
                          <div className="text-red-400 text-2xl mb-1">✗</div>
                          <div className="text-white text-xs">Failed</div>
                        </div>
                      ) : (
                        <div className="text-center w-full px-2">
                          <div className="text-white text-xs mb-2">Uploading...</div>
                          <div className="w-full bg-gray-600 rounded-full h-1.5 mb-2">
                            <div 
                              className="bg-blue-400 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${Math.max(0, uploadProgress[fileWrapper.file.name])}%` }}
                            ></div>
                          </div>
                          <div className="text-white text-xs">
                            {uploadProgress[fileWrapper.file.name]}%
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  </div>
                  
                  {/* Remove Button */}
                  <button
                    onClick={() => removeFile(index)}
                    disabled={uploading && uploadProgress[fileWrapper.file.name] !== undefined}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Add More Button */}
            <div className="flex items-center justify-center pt-2 border-t border-gray-100">
              <label htmlFor="file-upload-more" className="cursor-pointer text-sm text-blue-600 hover:text-blue-700">
                <span className="font-medium">+ Add more images</span>
              </label>
              <input
                id="file-upload-more"
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
