export interface HostingerUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export class HostingerUploadService {
  private static instance: HostingerUploadService;
  private apiToken: string;
  private domain: string;

  constructor() {
    this.apiToken = import.meta.env.VITE_HOSTINGER_API_TOKEN || '';
    this.domain = import.meta.env.VITE_HOSTINGER_DOMAIN || '';
  }

  static getInstance(): HostingerUploadService {
    if (!HostingerUploadService.instance) {
      HostingerUploadService.instance = new HostingerUploadService();
    }
    return HostingerUploadService.instance;
  }

  /**
   * Upload file to Hostinger storage
   */
  async uploadFile(file: File, remotePath: string): Promise<HostingerUploadResult> {
    try {
      console.log('📤 Uploading file to Hostinger...', { path: remotePath, size: file.size });

      if (!this.apiToken) {
        return {
          success: false,
          error: 'Hostinger API token not configured'
        };
      }

      // Create FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', remotePath);

      // Try multiple API endpoints for reliability
      const apiEndpoints = [
        'https://api.hostinger.com/v1',
        'https://api.hostinger.com',
        'https://api.hostinger.com/v2'
      ];

      let lastError = null;

      for (const endpoint of apiEndpoints) {
        try {
          const response = await fetch(`${endpoint}/files/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.apiToken}`
            },
            body: formData
          });

          if (response.ok) {
            const result = await response.json();
            const publicUrl = this.generatePublicUrl(remotePath);
            
            console.log('✅ File uploaded to Hostinger:', publicUrl);
            
            return {
              success: true,
              url: publicUrl
            };
          } else {
            const errorText = await response.text();
            lastError = `Upload failed: ${response.status} - ${errorText}`;
            console.log(`❌ Failed with ${endpoint}: ${lastError}`);
          }
        } catch (error: any) {
          lastError = error.message || 'Network error';
          console.log(`❌ Error with ${endpoint}: ${lastError}`);
        }
      }

      return {
        success: false,
        error: lastError || 'All upload attempts failed'
      };
    } catch (error: any) {
      console.error('❌ Hostinger upload service error:', error);
      return {
        success: false,
        error: error.message || 'Upload failed'
      };
    }
  }

  /**
   * Delete file from Hostinger storage
   */
  async deleteFile(remotePath: string): Promise<HostingerUploadResult> {
    try {
      console.log('🗑️ Deleting file from Hostinger...', { path: remotePath });

      if (!this.apiToken) {
        return {
          success: false,
          error: 'Hostinger API token not configured'
        };
      }

      const apiEndpoints = [
        'https://api.hostinger.com/v1',
        'https://api.hostinger.com',
        'https://api.hostinger.com/v2'
      ];

      let lastError = null;

      for (const endpoint of apiEndpoints) {
        try {
          const response = await fetch(`${endpoint}/files/delete`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${this.apiToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ path: remotePath })
          });

          if (response.ok) {
            console.log('✅ File deleted from Hostinger');
            return { success: true };
          } else {
            const errorText = await response.text();
            lastError = `Delete failed: ${response.status} - ${errorText}`;
            console.log(`❌ Failed with ${endpoint}: ${lastError}`);
          }
        } catch (error: any) {
          lastError = error.message || 'Network error';
          console.log(`❌ Error with ${endpoint}: ${lastError}`);
        }
      }

      return {
        success: false,
        error: lastError || 'All delete attempts failed'
      };
    } catch (error: any) {
      console.error('❌ Hostinger delete service error:', error);
      return {
        success: false,
        error: error.message || 'Delete failed'
      };
    }
  }

  /**
   * Generate public URL for uploaded file
   */
  private generatePublicUrl(remotePath: string): string {
    const cleanDomain = this.domain.replace(/^https?:\/\//, '');
    return `https://${cleanDomain}/${remotePath}`;
  }

  /**
   * Generate unique path for app logo
   */
  generateAppLogoPath(fileName: string): string {
    const timestamp = Date.now();
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '-');
    return `app-assets/logos/${timestamp}-${sanitizedName}`;
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

  /**
   * Check if Hostinger is configured
   */
  isConfigured(): boolean {
    return !!(this.apiToken && this.domain);
  }
}

export const hostingerUploadService = HostingerUploadService.getInstance(); 