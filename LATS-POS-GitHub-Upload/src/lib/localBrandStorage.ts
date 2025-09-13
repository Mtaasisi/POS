import { supabase } from './supabaseClient';

export interface LocalBrandUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export class LocalBrandStorageService {
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ];

  // Base path for storing brand logos on the hosting server
  private static readonly BASE_UPLOAD_PATH = '/public/uploads/brands';
  private static readonly BASE_URL_PATH = '/uploads/brands';

  /**
   * Validate file before upload
   */
  private static validateFile(file: File): { valid: boolean; error?: string } {
    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return { 
        valid: false, 
        error: `Invalid file type. Allowed: ${this.ALLOWED_TYPES.join(', ')}` 
      };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return { 
        valid: false, 
        error: `File too large. Maximum size: ${this.MAX_FILE_SIZE / (1024 * 1024)}MB` 
      };
    }

    return { valid: true };
  }

  /**
   * Generate safe filename for brand logo
   */
  private static generateSafeFileName(brandName: string, originalName: string): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const sanitizedName = brandName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const fileExtension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    return `${sanitizedName}_${timestamp}_${randomId}.${fileExtension}`;
  }

  /**
   * Upload brand logo to local storage
   */
  static async uploadBrandLogo(
    file: File,
    brandName: string,
    brandId: string
  ): Promise<LocalBrandUploadResult> {
    try {
      console.log('🔍 uploadBrandLogo: Starting upload process');
      
      // Validate inputs
      if (!file) {
        console.error('❌ No file provided');
        return { success: false, error: 'No file provided' };
      }
      if (!brandName) {
        console.error('❌ Brand name is required');
        return { success: false, error: 'Brand name is required' };
      }
      if (!brandId) {
        console.error('❌ Brand ID is required');
        return { success: false, error: 'Brand ID is required' };
      }

      console.log('✅ Input validation passed');

      // Validate file
      const validationResult = this.validateFile(file);
      if (!validationResult.valid) {
        console.error('❌ File validation failed:', validationResult.error);
        return { success: false, error: validationResult.error };
      }

      console.log('✅ File validation passed');

      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('❌ Authentication failed:', authError);
        return { success: false, error: 'User not authenticated' };
      }

      console.log('✅ Authentication passed');

      console.log('📤 Uploading brand logo to local storage:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        brandName: brandName,
        brandId: brandId
      });

      // Generate safe filename
      const safeFileName = this.generateSafeFileName(brandName, file.name);
      const filePath = `${this.BASE_UPLOAD_PATH}/${safeFileName}`;
      const publicUrl = `${this.BASE_URL_PATH}/${safeFileName}`;

      console.log('📁 Generated paths:', {
        safeFileName,
        filePath,
        publicUrl
      });

      // Upload to server handler
      const formData = new FormData();
      formData.append('file', file);
      formData.append('brand_id', brandId);
      formData.append('brand_name', brandName);
      formData.append('file_path', filePath);

      console.log('📋 FormData prepared:', {
        brand_id: brandId,
        brand_name: brandName,
        file_path: filePath
      });

      // Get the server upload handler URL
      const uploadUrl = '/server-brand-upload-handler.php';
      
      console.log('🌐 Making request to:', uploadUrl);
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      });

      console.log('📥 Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP error:', errorText);
        throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('📄 Response JSON:', result);

      if (!result.success) {
        console.error('❌ Upload failed:', result.error);
        return { success: false, error: result.error || 'Upload failed' };
      }

      console.log('✅ Brand logo uploaded successfully:', result.url);
      return {
        success: true,
        url: result.url || publicUrl
      };

    } catch (error: any) {
      console.error('❌ Error uploading brand logo:', error);
      console.error('❌ Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      return {
        success: false,
        error: error.message || 'Upload failed'
      };
    }
  }

  /**
   * Delete brand logo from local storage
   */
  static async deleteBrandLogo(filePath: string): Promise<LocalBrandUploadResult> {
    try {
      console.log('🗑️ Deleting brand logo:', filePath);

      const response = await fetch('/server-brand-upload-handler.php', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ file_path: filePath })
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        return { success: false, error: result.error || 'Delete failed' };
      }

      console.log('✅ Brand logo deleted successfully');
      return { success: true };

    } catch (error: any) {
      console.error('❌ Error deleting brand logo:', error);
      return {
        success: false,
        error: error.message || 'Delete failed'
      };
    }
  }

  /**
   * Check if we're in development mode
   */
  static isDevelopment(): boolean {
    return import.meta.env.DEV || window.location.hostname === 'localhost';
  }

  /**
   * Convert file to base64 for development mode
   */
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

export const localBrandStorage = LocalBrandStorageService;
