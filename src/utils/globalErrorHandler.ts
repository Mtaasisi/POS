/**
 * Global Error Handler
 * Catches and handles WebSocket, PostMessage, and other global errors
 */

// WhatsApp error handler has been removed
const whatsAppErrorHandler = {
  handleWebSocketError: (error: Error, context: any) => {
    console.log('WebSocket error (WhatsApp service disabled):', error.message);
  },
  handlePostMessageError: (error: Error, context: any) => {
    console.log('PostMessage error (WhatsApp service disabled):', error.message);
  }
};

export class GlobalErrorHandler {
  private isInitialized = false;

  /**
   * Initialize global error handling
   */
  initialize(): void {
    if (this.isInitialized) return;

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));

    // Handle global errors
    window.addEventListener('error', this.handleGlobalError.bind(this));

    // Handle WebSocket errors
    this.interceptWebSocket();

    // Handle PostMessage errors
    this.interceptPostMessage();

    this.isInitialized = true;
    console.log('✅ Global error handler initialized');
  }

  /**
   * Handle unhandled promise rejections
   */
  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    const error = event.reason;
    
    // Check if it's a WebSocket error
    if (error?.message?.includes('WebSocket') || error?.message?.includes('wss://')) {
      whatsAppErrorHandler.handleWebSocketError(error, { source: 'unhandledrejection' });
      event.preventDefault(); // Prevent default handling
      return;
    }

    // Check if it's a PostMessage error
    if (error?.message?.includes('postMessage') || error?.message?.includes('target origin')) {
      whatsAppErrorHandler.handlePostMessageError(error, { source: 'unhandledrejection' });
      event.preventDefault(); // Prevent default handling
      return;
    }

    // Log other unhandled rejections
    console.warn('⚠️ Unhandled promise rejection:', error);
  }

  /**
   * Handle global errors
   */
  private handleGlobalError(event: ErrorEvent): void {
    const error = event.error || new Error(event.message);

    // Check if it's a WebSocket error
    if (event.message?.includes('WebSocket') || event.message?.includes('wss://')) {
      whatsAppErrorHandler.handleWebSocketError(error, { source: 'global', filename: event.filename, lineno: event.lineno });
      event.preventDefault(); // Prevent default handling
      return;
    }

    // Check if it's a PostMessage error
    if (event.message?.includes('postMessage') || event.message?.includes('target origin')) {
      whatsAppErrorHandler.handlePostMessageError(error, { source: 'global', filename: event.filename, lineno: event.lineno });
      event.preventDefault(); // Prevent default handling
      return;
    }

    // Check if it's a Yandex WebSocket error (external service)
    if (event.message?.includes('mc.yandex.ru')) {
      console.log('ℹ️ External analytics service (Yandex) connection failed - this is normal and safe to ignore');
      event.preventDefault(); // Prevent default handling
      return;
    }

    // Log other errors
    console.error('❌ Global error:', error);
  }

  /**
   * Intercept WebSocket constructor to catch connection errors
   */
  private interceptWebSocket(): void {
    const originalWebSocket = window.WebSocket;
    
    window.WebSocket = function(url: string | URL, protocols?: string | string[]) {
      const ws = new originalWebSocket(url, protocols);
      
      // Add error handling
      ws.addEventListener('error', (event) => {
        const error = new Error(`WebSocket connection failed: ${url}`);
        whatsAppErrorHandler.handleWebSocketError(error, { 
          url, 
          protocols, 
          event: event 
        });
      });

      // Add close handling
      ws.addEventListener('close', (event) => {
        if (event.code !== 1000) { // Not a normal closure
          const error = new Error(`WebSocket connection closed: ${event.code} ${event.reason}`);
          whatsAppErrorHandler.handleWebSocketError(error, { 
            url, 
            code: event.code, 
            reason: event.reason 
          });
        }
      });

      return ws;
    } as any;

    // Copy static properties
    Object.setPrototypeOf(window.WebSocket, originalWebSocket);
    Object.setPrototypeOf(window.WebSocket.prototype, originalWebSocket.prototype);
  }

  /**
   * Intercept PostMessage to catch origin mismatch errors
   */
  private interceptPostMessage(): void {
    const originalPostMessage = window.postMessage;
    
    window.postMessage = function(message: any, targetOrigin: string, transfer?: Transferable[]) {
      try {
        return originalPostMessage.call(this, message, targetOrigin, transfer);
      } catch (error: any) {
        // Check if it's an origin mismatch error
        if (error.message?.includes('target origin') || error.message?.includes('postMessage')) {
          whatsAppErrorHandler.handlePostMessageError(error, { 
            message, 
            targetOrigin, 
            transfer 
          });
        } else {
          throw error; // Re-throw other errors
        }
      }
    };
  }

  /**
   * Get error summary for debugging
   */
  getErrorSummary() {
    return whatsAppErrorHandler.getErrorSummary();
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    whatsAppErrorHandler.clearHistory();
  }

  /**
   * Get recent errors for debugging
   */
  getRecentErrors(limit: number = 10) {
    return whatsAppErrorHandler.getRecentErrors(limit);
  }
}

// Export singleton instance
export const globalErrorHandler = new GlobalErrorHandler();

// Auto-initialize when module is loaded
if (typeof window !== 'undefined') {
  globalErrorHandler.initialize();
}
