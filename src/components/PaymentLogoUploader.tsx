import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

interface PaymentLogoUploaderProps {
  currentIcon?: string;
  onIconChange: (iconUrl: string) => void;
  paymentMethodName: string;
  className?: string;
}

const PaymentLogoUploader: React.FC<PaymentLogoUploaderProps> = ({
  currentIcon,
  onIconChange,
  paymentMethodName,
  className = ''
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to determine if it's an emoji
  const isEmoji = (str: string) => {
    return /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(str);
  };

  // Helper function to check if it's a URL
  const isUrl = (str: string) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    setIsUploading(true);

    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${paymentMethodName.toLowerCase().replace(/\s+/g, '_')}_logo_${Date.now()}.${fileExt}`;
      const filePath = `payment-logos/${fileName}`;

      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        onIconChange(urlData.publicUrl);
        toast.success('Logo uploaded successfully!');
      }

    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload logo');
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = () => {
    setPreviewUrl(null);
    onIconChange('');
    toast.success('Logo removed');
  };

  const handleUrlInput = (url: string) => {
    if (url.trim() === '') {
      onIconChange('');
      return;
    }

    // Validate URL format
    if (!isUrl(url) && !url.startsWith('/')) {
      toast.error('Please enter a valid URL or path');
      return;
    }

    onIconChange(url);
    setPreviewUrl(url);
  };

  const displayIcon = previewUrl || currentIcon;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Logo Display */}
      <div className="flex items-center space-x-4">
        <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
          {displayIcon ? (
            isEmoji(displayIcon) ? (
              <span className="text-2xl">{displayIcon}</span>
            ) : (
              <img
                src={displayIcon}
                alt={`${paymentMethodName} logo`}
                className="w-12 h-12 object-contain"
                onError={() => setPreviewUrl(null)}
              />
            )
          ) : (
            <ImageIcon className="w-8 h-8 text-gray-400" />
          )}
        </div>
        
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Payment Logo
          </label>
          <p className="text-xs text-gray-500">
            Upload an image or enter a URL for the payment method logo
          </p>
        </div>
      </div>

      {/* Upload Options */}
      <div className="space-y-3">
        {/* File Upload */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-4 h-4" />
            <span>{isUploading ? 'Uploading...' : 'Upload Image'}</span>
          </button>
        </div>

        {/* URL Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Or enter image URL:
          </label>
          <input
            type="url"
            placeholder="https://example.com/logo.png or /icons/logo.svg"
            value={displayIcon && !isEmoji(displayIcon) ? displayIcon : ''}
            onChange={(e) => handleUrlInput(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Remove Button */}
        {displayIcon && (
          <button
            type="button"
            onClick={handleRemoveLogo}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:text-red-800"
          >
            <X className="w-4 h-4" />
            <span>Remove Logo</span>
          </button>
        )}
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Supported formats:</p>
            <ul className="text-xs space-y-1 ml-2">
              <li>• Images: PNG, JPG, JPEG, GIF (max 2MB)</li>
              <li>• URLs: Full image URLs or local paths</li>
              <li>• Emojis: Single emoji characters (💳, 🏦, etc.)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentLogoUploader;
