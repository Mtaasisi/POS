// ZenoPay API Configuration
export const ZENOPAY_CONFIG = {
  // PHP server URL - change this to your actual server URL
  API_BASE_URL: 'http://localhost:8000',
  
  // API endpoints
  ENDPOINTS: {
    CREATE_ORDER: '/zenopay-create-order.php',
    CHECK_STATUS: '/zenopay-check-status.php',
    WEBHOOK: '/zenopay-webhook.php',
    USSD_POPUP: '/zenopay-ussd-popup.php', // New USSD popup endpoint
    TRIGGER_USSD: '/zenopay-trigger-ussd.php' // New USSD trigger endpoint
  },
  
  // Get full URL for an endpoint
  getUrl: (endpoint: string) => `${ZENOPAY_CONFIG.API_BASE_URL}${endpoint}`,
  
  // Get create order URL
  getCreateOrderUrl: () => ZENOPAY_CONFIG.getUrl(ZENOPAY_CONFIG.ENDPOINTS.CREATE_ORDER),
  
  // Get check status URL
  getCheckStatusUrl: (orderId: string) => 
    `${ZENOPAY_CONFIG.getUrl(ZENOPAY_CONFIG.ENDPOINTS.CHECK_STATUS)}?order_id=${orderId}`,
  
  // Get webhook URL
  getWebhookUrl: () => ZENOPAY_CONFIG.getUrl(ZENOPAY_CONFIG.ENDPOINTS.WEBHOOK),
  
  // Get USSD popup URL
  getUssdPopupUrl: () => ZENOPAY_CONFIG.getUrl(ZENOPAY_CONFIG.ENDPOINTS.USSD_POPUP),
  
  // Get USSD trigger URL
  getUssdTriggerUrl: (phoneNumber: string, amount: number, orderId: string) => 
    `${ZENOPAY_CONFIG.getUrl(ZENOPAY_CONFIG.ENDPOINTS.TRIGGER_USSD)}?phone=${encodeURIComponent(phoneNumber)}&amount=${amount}&order_id=${orderId}`
};

// Development vs Production configuration
export const isDevelopment = () => process.env.NODE_ENV === 'development';

// Get the appropriate API base URL
export const getApiBaseUrl = () => {
  if (isDevelopment()) {
    return 'http://localhost:8000'; // Local PHP server
  }
  return window.location.origin; // Same domain as the app
};

// USSD Popup Configuration
export const USSD_CONFIG = {
  // USSD popup settings
  POPUP_TIMEOUT: 300000, // 5 minutes timeout
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 10000, // 10 seconds between retries
  
  // USSD message templates
  MESSAGES: {
    INITIATING: 'Initiating USSD popup on customer phone...',
    SENT: 'USSD popup sent successfully to customer phone',
    PENDING: 'Waiting for customer to complete USSD payment...',
    TIMEOUT: 'USSD popup timeout. Please try again.',
    ERROR: 'Failed to send USSD popup. Please try again.',
    SUCCESS: 'USSD payment completed successfully!',
    FAILED: 'USSD payment failed. Please try again.',
    CANCELLED: 'USSD payment was cancelled by customer.'
  },
  
  // Debug logging
  DEBUG: {
    ENABLED: true,
    LOG_PREFIX: '[ZenoPay USSD]',
    LOG_LEVELS: {
      INFO: 'info',
      WARN: 'warn',
      ERROR: 'error',
      DEBUG: 'debug'
    }
  }
};

// USSD Popup Service
export class UssdPopupService {
  private static debugLog(level: string, message: string, data?: any) {
    if (!USSD_CONFIG.DEBUG.ENABLED) return;
    
    const timestamp = new Date().toISOString();
    const logMessage = `${USSD_CONFIG.DEBUG.LOG_PREFIX} [${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    switch (level) {
      case USSD_CONFIG.DEBUG.LOG_LEVELS.ERROR:
        console.error(logMessage, data);
        break;
      case USSD_CONFIG.DEBUG.LOG_LEVELS.WARN:
        console.warn(logMessage, data);
        break;
      case USSD_CONFIG.DEBUG.LOG_LEVELS.DEBUG:
        console.debug(logMessage, data);
        break;
      default:
        console.log(logMessage, data);
    }
  }

  // Trigger USSD popup on customer mobile
  static async triggerUssdPopup(
    phoneNumber: string, 
    amount: number, 
    orderId: string,
    customerName?: string
  ): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      this.debugLog('info', `Triggering USSD popup for order ${orderId}`, {
        phoneNumber,
        amount,
        orderId,
        customerName
      });

      const url = ZENOPAY_CONFIG.getUssdTriggerUrl(phoneNumber, amount, orderId);
      
      this.debugLog('debug', `Making USSD trigger request to: ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          amount: amount,
          order_id: orderId,
          customer_name: customerName,
          timestamp: new Date().toISOString(),
          pos_session: `pos_${Date.now()}`
        })
      });

      const result = await response.json();
      
      this.debugLog('debug', 'USSD trigger response received', result);

      if (response.ok && result.success) {
        this.debugLog('info', 'USSD popup triggered successfully', result);
        return {
          success: true,
          message: USSD_CONFIG.MESSAGES.SENT,
          data: result
        };
      } else {
        this.debugLog('error', 'USSD popup trigger failed', result);
        return {
          success: false,
          message: result.message || USSD_CONFIG.MESSAGES.ERROR,
          data: result
        };
      }
    } catch (error) {
      this.debugLog('error', 'USSD popup trigger error', error);
      return {
        success: false,
        message: `USSD popup error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        data: error
      };
    }
  }

  // Check USSD popup status
  static async checkUssdStatus(orderId: string): Promise<{ success: boolean; status: string; data?: any }> {
    try {
      this.debugLog('debug', `Checking USSD status for order ${orderId}`);

      const response = await fetch(ZENOPAY_CONFIG.getUssdPopupUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: orderId,
          check_type: 'ussd_status'
        })
      });

      const result = await response.json();
      
      this.debugLog('debug', 'USSD status check response', result);

      if (response.ok && result.success) {
        return {
          success: true,
          status: result.status || 'pending',
          data: result
        };
      } else {
        return {
          success: false,
          status: 'error',
          data: result
        };
      }
    } catch (error) {
      this.debugLog('error', 'USSD status check error', error);
      return {
        success: false,
        status: 'error',
        data: error
      };
    }
  }

  // Poll USSD status with timeout
  static async pollUssdStatus(
    orderId: string, 
    onStatusUpdate?: (status: string, data?: any) => void
  ): Promise<{ success: boolean; finalStatus: string; data?: any }> {
    const startTime = Date.now();
    let attempts = 0;

    this.debugLog('info', `Starting USSD status polling for order ${orderId}`);

    while (Date.now() - startTime < USSD_CONFIG.POPUP_TIMEOUT) {
      attempts++;
      
      this.debugLog('debug', `USSD status check attempt ${attempts} for order ${orderId}`);

      const statusResult = await this.checkUssdStatus(orderId);
      
      if (statusResult.success) {
        onStatusUpdate?.(statusResult.status, statusResult.data);
        
        if (statusResult.status === 'completed') {
          this.debugLog('info', `USSD payment completed for order ${orderId}`);
          return {
            success: true,
            finalStatus: 'completed',
            data: statusResult.data
          };
        } else if (statusResult.status === 'failed') {
          this.debugLog('warn', `USSD payment failed for order ${orderId}`);
          return {
            success: false,
            finalStatus: 'failed',
            data: statusResult.data
          };
        } else if (statusResult.status === 'cancelled') {
          this.debugLog('warn', `USSD payment cancelled for order ${orderId}`);
          return {
            success: false,
            finalStatus: 'cancelled',
            data: statusResult.data
          };
        }
      }

      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    this.debugLog('warn', `USSD polling timeout for order ${orderId} after ${attempts} attempts`);
    return {
      success: false,
      finalStatus: 'timeout',
      data: { attempts, timeout: USSD_CONFIG.POPUP_TIMEOUT }
    };
  }
}
