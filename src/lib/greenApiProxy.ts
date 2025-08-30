interface ProxyRequest {
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

interface ProxyResponse<T = any> {
  success: boolean;
  status: number;
  data: T;
  headers?: Record<string, string>;
  error?: string;
}

class GreenApiProxy {
  private proxyUrl: string;
  private directUrl: string;

  constructor() {
    // Use local development proxy in development, production URL in production
    this.proxyUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:8889/green-api-proxy'
      : 'https://inauzwa.store/.netlify/functions/green-api-proxy';
    
    // Fallback to direct Green API if proxy fails
    this.directUrl = 'https://api.green-api.com';
  }

  async makeRequest<T = any>(request: ProxyRequest): Promise<ProxyResponse<T>> {
    try {
      console.log(`🌐 Making proxy request to: ${request.path}`);
      
      const response = await fetch(this.proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Proxy request failed: ${response.status} ${response.statusText}`);
      }

      const result: ProxyResponse<T> = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Proxy request failed');
      }

      console.log(`✅ Proxy request successful:`, result.data);
      return result;
    } catch (error: any) {
      console.error('❌ Proxy request error:', error);
      
      // Always try direct Green API as fallback when proxy fails
      console.log('🔄 Proxy failed, trying direct Green API...');
      return this.makeDirectRequest<T>(request);
    }
  }

  // Fallback method to make direct requests to Green API
  private async makeDirectRequest<T = any>(request: ProxyRequest): Promise<ProxyResponse<T>> {
    try {
      const url = `${this.directUrl}${request.path}`;
      console.log(`🌐 Making direct request to: ${url}`);
      
      const response = await fetch(url, {
        method: request.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...request.headers,
        },
        body: request.body ? JSON.stringify(request.body) : undefined,
      });

      const data = await response.json();
      
      return {
        success: response.ok,
        status: response.status,
        data: data,
        error: response.ok ? undefined : data.error || 'Direct request failed'
      };
    } catch (error: any) {
      console.error('❌ Direct request error:', error);
      throw new Error(`Direct request failed: ${error.message}`);
    }
  }

  // Helper methods for common Green API operations
  async getSettings(instanceId: string, apiToken: string) {
    return this.makeRequest({
      path: `/waInstance${instanceId}/getSettings/${apiToken}`,
      method: 'GET',
    });
  }

  async setSettings(instanceId: string, apiToken: string, settings: any) {
    return this.makeRequest({
      path: `/waInstance${instanceId}/setSettings/${apiToken}`,
      method: 'POST',
      body: settings,
    });
  }

  async getStateInstance(instanceId: string, apiToken: string) {
    return this.makeRequest({
      path: `/waInstance${instanceId}/getStateInstance/${apiToken}`,
      method: 'GET',
    });
  }

  async rebootInstance(instanceId: string, apiToken: string) {
    return this.makeRequest({
      path: `/waInstance${instanceId}/reboot`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
      },
    });
  }

  async logoutInstance(instanceId: string, apiToken: string) {
    return this.makeRequest({
      path: `/waInstance${instanceId}/logout`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
      },
    });
  }

  async getQRCode(instanceId: string, apiToken: string) {
    return this.makeRequest({
      path: `/waInstance${instanceId}/qr/${apiToken}`,
      method: 'GET',
    });
  }

  async getAuthCode(instanceId: string, apiToken: string) {
    return this.makeRequest({
      path: `/waInstance${instanceId}/getAuthorizationCode`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
      },
    });
  }

  async updateApiToken(instanceId: string, apiToken: string, newApiToken: string) {
    return this.makeRequest({
      path: `/waInstance${instanceId}/updateApiToken`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
      },
      body: { apiToken: newApiToken },
    });
  }

  async getWaSettings(instanceId: string, apiToken: string) {
    return this.makeRequest({
      path: `/waInstance${instanceId}/getWaSettings/${apiToken}`,
      method: 'GET',
    });
  }

  async sendMessage(instanceId: string, apiToken: string, chatId: string, message: string) {
    return this.makeRequest({
      path: `/waInstance${instanceId}/sendMessage/${chatId}`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
      },
      body: { message },
    });
  }

  async getChatHistory(instanceId: string, apiToken: string, chatId: string, count: number = 20) {
    return this.makeRequest({
      path: `/waInstance${instanceId}/getChatHistory/${chatId}`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
      },
      body: { count },
    });
  }

  async getContacts(instanceId: string, apiToken: string) {
    return this.makeRequest({
      path: `/waInstance${instanceId}/getContacts`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
      },
    });
  }

  async getChats(instanceId: string, apiToken: string) {
    return this.makeRequest({
      path: `/waInstance${instanceId}/getChats`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
      },
    });
  }

  async setProfilePicture(instanceId: string, apiToken: string, file: File) {
    // Convert file to base64 for Green API
    const base64 = await this.fileToBase64(file);
    return this.makeRequest({
      path: `/waInstance${instanceId}/setAvatar/${apiToken}`,
      method: 'POST',
      body: {
        file: base64,
        fileName: file.name || 'profile.jpg'
      },
    });
  }

  // Helper method to convert file to base64
  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data:image/... prefix to get just the base64 data
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  }
}

// Export singleton instance
export const greenApiProxy = new GreenApiProxy();
export default greenApiProxy;
