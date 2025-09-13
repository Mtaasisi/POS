import React, { useState, useRef } from 'react';
import { Upload, X, Image, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { hostingerUploadService } from '../../../../lib/hostingerUploadService';
import toast from 'react-hot-toast';

interface LogoUploadProps {
  currentLogo?: string;
  onLogoChange: (logoUrl: string) => void;
  title?: string;
  description?: string;
  maxSize?: number; // in MB
  className?: string;
}

const LogoUpload: React.FC<LogoUploadProps> = ({
  currentLogo,
  onLogoChange,
  title = "App Logo",
  description = "Upload your app logo. Recommended size: 200x200px",
  maxSize = 2,
  className = ""
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentLogo || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`Image size must be less than ${maxSize}MB`);
      return;
    }

    setIsUploading(true);
    try {
      // Check if we're in development mode
      if (hostingerUploadService.isDevelopment()) {
        // In development: use base64 for immediate preview
        const base64Data = await hostingerUploadService.fileToBase64(file);
        setPreview(base64Data);
        onLogoChange(base64Data);
        toast.success('Logo uploaded successfully! (Development mode)');
      } else {
        // In production: upload to Hostinger
        if (!hostingerUploadService.isConfigured()) {
          toast.error('Hostinger configuration not found. Please configure your hosting settings.');
          return;
        }

        const fileExtension = file.name.split('.').pop() || 'png';
        const fileName = `app-logo.${fileExtension}`;
        const filePath = hostingerUploadService.generateAppLogoPath(fileName);
        
        const uploadResult = await hostingerUploadService.uploadFile(file, filePath);
        
        if (uploadResult.success && uploadResult.url) {
          setPreview(uploadResult.url);
          onLogoChange(uploadResult.url);
          toast.success('Logo uploaded successfully! (Hosted on Hostinger)');
        } else {
          throw new Error(uploadResult.error || 'Upload failed');
        }
      }
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setPreview(null);
    onLogoChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success('Logo removed');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const event = { target: { files: [file] } } as React.ChangeEvent<HTMLInputElement>;
      handleFileSelect(event);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>

      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
          preview 
            ? 'border-green-300 bg-green-50 dark:bg-green-900/20' 
            : 'border-gray-300 hover:border-blue-400 dark:border-gray-600 dark:hover:border-blue-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {preview ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <img
                src={preview}
                alt="App Logo"
                className="max-w-32 max-h-32 object-contain rounded-lg shadow-sm"
              />
            </div>
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-sm text-green-600 dark:text-green-400">
                Logo uploaded successfully
              </span>
            </div>
            <div className="flex justify-center space-x-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Change Logo
              </button>
              <button
                onClick={handleRemoveLogo}
                disabled={isUploading}
                className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            {isUploading ? (
              <div className="space-y-3">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Uploading to {hostingerUploadService.isDevelopment() ? 'local storage' : 'Hostinger'}...
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <Image className="w-8 h-8 text-gray-400" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Drag and drop your logo here, or{' '}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-500 hover:text-blue-600 font-medium"
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    PNG, JPG, SVG up to {maxSize}MB
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {!hostingerUploadService.isDevelopment() && !hostingerUploadService.isConfigured() && (
        <div className="flex items-center space-x-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-yellow-500" />
          <div className="text-sm">
            <p className="text-yellow-800 dark:text-yellow-200 font-medium">
              Hostinger not configured
            </p>
            <p className="text-yellow-700 dark:text-yellow-300">
              Set VITE_HOSTINGER_API_TOKEN and VITE_HOSTINGER_DOMAIN for production uploads
            </p>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default LogoUpload; 