import { WHATSAPP_CREDENTIALS, isNumberAllowed, formatPhoneForWhatsApp } from '../config/whatsappCredentials';

export interface WhatsAppMessageResponse {
  idMessage: string;
  status: 'sent' | 'failed';
  error?: string;
}

export interface WhatsAppMessageRequest {
  phoneNumber: string;
  message: string;
  type?: 'text' | 'image' | 'document';
  mediaUrl?: string;
  fileName?: string;
}

/**
 * WhatsApp Message Service
 * Handles sending messages through the Green API
 */
export class WhatsAppMessageService {
  private static instance: WhatsAppMessageService;
  private apiUrl: string;
  private instanceId: string;
  private apiToken: string;

  constructor() {
    this.apiUrl = WHATSAPP_CREDENTIALS.apiUrl;
    this.instanceId = WHATSAPP_CREDENTIALS.instanceId;
    this.apiToken = WHATSAPP_CREDENTIALS.apiToken;
  }

  static getInstance(): WhatsAppMessageService {
    if (!WhatsAppMessageService.instance) {
      WhatsAppMessageService.instance = new WhatsAppMessageService();
    }
    return WhatsAppMessageService.instance;
  }

  /**
   * Send a text message
   */
  async sendTextMessage(phoneNumber: string, message: string): Promise<WhatsAppMessageResponse> {
    try {
      const formattedNumber = formatPhoneForWhatsApp(phoneNumber);
      
      // Check if number is allowed
      if (!isNumberAllowed(formattedNumber)) {
        return {
          idMessage: '',
          status: 'failed',
          error: `Number ${phoneNumber} is not allowed due to quota limits. Allowed numbers: ${WHATSAPP_CREDENTIALS.allowedNumbers.join(', ')}`
        };
      }

      const response = await fetch(`${this.apiUrl}/waInstance${this.instanceId}/sendMessage/${this.apiToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: formattedNumber,
          message: message
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          idMessage: data.idMessage || '',
          status: 'sent'
        };
      } else {
        const errorData = await response.text();
        return {
          idMessage: '',
          status: 'failed',
          error: `HTTP ${response.status}: ${errorData}`
        };
      }
    } catch (error) {
      return {
        idMessage: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send a file message (image, document, etc.)
   */
  async sendFileMessage(phoneNumber: string, fileUrl: string, fileName: string, caption?: string): Promise<WhatsAppMessageResponse> {
    try {
      const formattedNumber = formatPhoneForWhatsApp(phoneNumber);
      
      // Check if number is allowed
      if (!isNumberAllowed(formattedNumber)) {
        return {
          idMessage: '',
          status: 'failed',
          error: `Number ${phoneNumber} is not allowed due to quota limits. Allowed numbers: ${WHATSAPP_CREDENTIALS.allowedNumbers.join(', ')}`
        };
      }

      const response = await fetch(`${this.apiUrl}/waInstance${this.instanceId}/sendFileByUrl/${this.apiToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: formattedNumber,
          urlFile: fileUrl,
          fileName: fileName,
          caption: caption || ''
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          idMessage: data.idMessage || '',
          status: 'sent'
        };
      } else {
        const errorData = await response.text();
        return {
          idMessage: '',
          status: 'failed',
          error: `HTTP ${response.status}: ${errorData}`
        };
      }
    } catch (error) {
      return {
        idMessage: '',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send a message with retry logic
   */
  async sendMessageWithRetry(request: WhatsAppMessageRequest, maxRetries: number = 3): Promise<WhatsAppMessageResponse> {
    let lastError: string = '';
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        let response: WhatsAppMessageResponse;
        
        if (request.type === 'image' || request.type === 'document') {
          if (!request.mediaUrl || !request.fileName) {
            return {
              idMessage: '',
              status: 'failed',
              error: 'Media URL and file name are required for file messages'
            };
          }
          response = await this.sendFileMessage(request.phoneNumber, request.mediaUrl, request.fileName, request.message);
        } else {
          response = await this.sendTextMessage(request.phoneNumber, request.message);
        }

        if (response.status === 'sent') {
          return response;
        }
        
        lastError = response.error || 'Unknown error';
        
        // If it's a quota error, don't retry
        if (lastError.includes('quota') || lastError.includes('QUOTE')) {
          break;
        }
        
        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    return {
      idMessage: '',
      status: 'failed',
      error: `Failed after ${maxRetries} attempts. Last error: ${lastError}`
    };
  }

  /**
   * Check if a phone number is allowed
   */
  isNumberAllowed(phoneNumber: string): boolean {
    return isNumberAllowed(formatPhoneForWhatsApp(phoneNumber));
  }

  /**
   * Get allowed numbers
   */
  getAllowedNumbers(): string[] {
    return [...WHATSAPP_CREDENTIALS.allowedNumbers];
  }

  /**
   * Get quota information
   */
  getQuotaInfo() {
    return WHATSAPP_CREDENTIALS.quota;
  }
}

// Export a singleton instance
export const whatsappMessageService = WhatsAppMessageService.getInstance();
