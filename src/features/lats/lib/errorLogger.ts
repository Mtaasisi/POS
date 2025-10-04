// Enhanced Error Logging Utility for Purchase Order System
export interface ErrorContext {
  operation: string;
  timestamp: string;
  userId?: string;
  purchaseOrderId?: string;
  productId?: string;
  variantId?: string;
  supplierId?: string;
  userAgent: string;
  url: string;
  additionalData?: any;
}

export interface DatabaseError {
  code: string;
  message: string;
  details?: string;
  hint?: string;
  table?: string;
  column?: string;
}

export class ErrorLogger {
  private static instance: ErrorLogger;
  private errorHistory: Array<{
    context: ErrorContext;
    error: any;
    databaseError?: DatabaseError;
  }> = [];

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  // Enhanced error logging with detailed context
  logError(
    operation: string,
    error: any,
    context: Partial<ErrorContext> = {},
    databaseError?: DatabaseError
  ): void {
    const fullContext: ErrorContext = {
      operation,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...context
    };

    const errorEntry = {
      context: fullContext,
      error,
      databaseError
    };

    // Store in memory for debugging
    this.errorHistory.push(errorEntry);
    
    // Keep only last 100 errors to prevent memory leaks
    if (this.errorHistory.length > 100) {
      this.errorHistory = this.errorHistory.slice(-100);
    }

    // Enhanced console logging
    this.logToConsole(errorEntry);
    
    // Log to localStorage for debugging (optional)
    this.logToStorage(errorEntry);
  }

  private logToConsole(errorEntry: any): void {
    const { context, error, databaseError } = errorEntry;
    
    console.group(`❌ Purchase Order Error: ${context.operation}`);
    
    console.error('Error Details:', {
      message: error.message || 'Unknown error',
      stack: error.stack,
      name: error.name,
      code: error.code
    });

    if (databaseError) {
      console.error('Database Error:', {
        code: databaseError.code,
        message: databaseError.message,
        details: databaseError.details,
        hint: databaseError.hint,
        table: databaseError.table,
        column: databaseError.column
      });
    }

    console.error('Context:', {
      operation: context.operation,
      timestamp: context.timestamp,
      purchaseOrderId: context.purchaseOrderId,
      productId: context.productId,
      variantId: context.variantId,
      supplierId: context.supplierId,
      userId: context.userId,
      url: context.url,
      additionalData: context.additionalData
    });

    console.groupEnd();
  }

  private logToStorage(errorEntry: any): void {
    try {
      const existingLogs = JSON.parse(localStorage.getItem('purchase_order_errors') || '[]');
      existingLogs.push(errorEntry);
      
      // Keep only last 50 errors in localStorage
      const recentLogs = existingLogs.slice(-50);
      localStorage.setItem('purchase_order_errors', JSON.stringify(recentLogs));
    } catch (error) {
      console.warn('Failed to log error to localStorage:', error);
    }
  }

  // Get user-friendly error message
  getUserFriendlyMessage(error: any, context: ErrorContext): string {
    // Database error messages
    if (error.code) {
      switch (error.code) {
        case 'PGRST116':
          return 'Resource not found: The requested purchase order does not exist';
        case 'PGRST301':
          return 'Permission denied: You do not have access to this resource';
        case '23505': // Unique constraint violation
          return 'Duplicate entry: This purchase order already exists';
        case '23503': // Foreign key constraint violation
          return 'Invalid reference: The supplier or product does not exist';
        case '23502': // Not null constraint violation
          return 'Missing required information: Please fill in all required fields';
        default:
          return `Database error (${error.code}): ${error.message}`;
      }
    }

    // Network errors
    if (error.message?.includes('Failed to fetch') || error.message?.includes('ERR_CONNECTION_CLOSED')) {
      return 'Network error: Please check your internet connection and try again';
    }

    if (error.message?.includes('timeout')) {
      return 'Request timeout: The server is taking too long to respond';
    }

    // Permission errors
    if (error.message?.includes('permission') || error.message?.includes('unauthorized')) {
      return 'Permission denied: You do not have access to this resource';
    }

    // Not found errors
    if (error.message?.includes('not found')) {
      return `The requested ${context.operation.replace('get_', '').replace('_', ' ')} was not found`;
    }

    // Validation errors
    if (error.message?.includes('Invalid') || error.message?.includes('validation')) {
      return error.message;
    }

    // Generic error
    return error.message || 'An unexpected error occurred. Please try again.';
  }

  // Get error history for debugging
  getErrorHistory(): Array<any> {
    return [...this.errorHistory];
  }

  // Clear error history
  clearErrorHistory(): void {
    this.errorHistory = [];
    localStorage.removeItem('purchase_order_errors');
  }

  // Export errors for debugging
  exportErrors(): string {
    return JSON.stringify(this.errorHistory, null, 2);
  }
}

// Convenience function for logging errors
export const logPurchaseOrderError = (
  operation: string,
  error: any,
  context: Partial<ErrorContext> = {},
  databaseError?: DatabaseError
): string => {
  const logger = ErrorLogger.getInstance();
  logger.logError(operation, error, context, databaseError);
  return logger.getUserFriendlyMessage(error, { ...context, operation, timestamp: '', userAgent: '', url: '' } as ErrorContext);
};

// Product ID validation utility
export const validateProductId = (productId: any, context: string = 'Product ID'): { isValid: boolean; error?: string } => {
  if (!productId) {
    return { isValid: false, error: `${context} is required` };
  }

  if (typeof productId !== 'string') {
    return { isValid: false, error: `${context} must be a string, got ${typeof productId}` };
  }

  const trimmedId = productId.trim();
  if (trimmedId === '') {
    return { isValid: false, error: `${context} cannot be empty or whitespace only` };
  }

  // UUID validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(trimmedId)) {
    return { 
      isValid: false, 
      error: `${context} has invalid format: "${trimmedId}". Expected UUID format.` 
    };
  }

  return { isValid: true };
};

// Enhanced error handling wrapper
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  context: Partial<ErrorContext> = {}
): Promise<{ success: boolean; data?: T; error?: string }> => {
  try {
    console.log(`🔄 Starting ${operationName}...`);
    const result = await operation();
    console.log(`✅ ${operationName} completed successfully`);
    return { success: true, data: result };
  } catch (error) {
    const errorMessage = logPurchaseOrderError(operationName, error, context);
    console.error(`❌ ${operationName} failed:`, error);
    return { success: false, error: errorMessage };
  }
};
