import { supabase } from './supabaseClient';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export class FileUploadService {
  private static instance: FileUploadService;
  private bucketName = 'brand-assets';

  static getInstance(): FileUploadService {
    if (!FileUploadService.instance) {
      FileUploadService.instance = new FileUploadService();
    }
    return FileUploadService.instance;
  }

  /**
   * Upload a file to Supabase storage
   */
  async uploadFile(file: File, path: string): Promise<UploadResult> {
    try {
      console.log('📤 Uploading file to Supabase storage...', { path, size: file.size });

      // Upload the file to Supabase storage
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.error('❌ Upload error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(path);

      console.log('✅ File uploaded successfully:', urlData.publicUrl);

      return {
        success: true,
        url: urlData.publicUrl
      };
    } catch (error: any) {
      console.error('❌ Upload service error:', error);
      return {
        success: false,
        error: error.message || 'Upload failed'
      };
    }
  }

  /**
   * Delete a file from Supabase storage
   */
  async deleteFile(path: string): Promise<UploadResult> {
    try {
      console.log('🗑️ Deleting file from Supabase storage...', { path });

      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([path]);

      if (error) {
        console.error('❌ Delete error:', error);
        return {
          success: false,
          error: error.message
        };
      }

      console.log('✅ File deleted successfully');
      return {
        success: true
      };
    } catch (error: any) {
      console.error('❌ Delete service error:', error);
      return {
        success: false,
        error: error.message || 'Delete failed'
      };
    }
  }

  /**
   * Generate a unique file path for brand logos
   */
  generateBrandLogoPath(brandName: string, fileExtension: string): string {
    const timestamp = Date.now();
    const sanitizedName = brandName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    return `brand-logos/${timestamp}-${sanitizedName}.${fileExtension}`;
  }

  /**
   * Convert file to base64 for local development
   */
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Check if we're in development mode
   */
  isDevelopment(): boolean {
    return import.meta.env.DEV || window.location.hostname === 'localhost';
  }
}

export const fileUploadService = FileUploadService.getInstance(); 