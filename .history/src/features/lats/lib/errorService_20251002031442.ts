// Centralized Error Handling Service for LATS Inventory
// Replaces 1500+ console.error statements with proper error handling

export enum ErrorLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  DATABASE = 'database',
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  BUSINESS_LOGIC = 'business_logic',
  UI = 'ui',
  UNKNOWN = 'unknown'
}

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

export interface LoggedError {
  id: string;
  level: ErrorLevel;
  category: ErrorCategory;
  message: string;
  error?: Error;
  context: ErrorContext;
  timestamp: Date;
  stack?: string;
}

class ErrorService {
  private errors: LoggedError[] = [];
  private maxErrors = 1000; // Keep last 1000 errors
  private isDevelopment = import.meta.env.MODE === 'development';

  /**
   * Log an error with proper categorization and context
   */
  log(
    level: ErrorLevel,
    category: ErrorCategory,
    message: string,
    error?: Error,
    context: ErrorContext = {}
  ): void {
    const loggedError: LoggedError = {
      id: this.generateId(),
      level,
      category,
      message,
      error,
      context: {
        ...context,
        timestamp: new Date()
      },
      timestamp: new Date(),
      stack: error?.stack
    };

    // Add to errors array
    this.errors.unshift(loggedError);
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Log to console based on level and environment
    this.logToConsole(loggedError);

    // Send to external service in production (if configured)
    if (!this.isDevelopment && level === ErrorLevel.ERROR || level === ErrorLevel.CRITICAL) {
      this.sendToExternalService(loggedError);
    }

    // Show user notification for critical errors
    if (level === ErrorLevel.CRITICAL) {
      this.showCriticalErrorNotification(loggedError);
    }
  }

  /**
   * Log database errors
   */
  logDatabase(
    message: string,
    error?: Error,
    context: ErrorContext = {}
  ): void {
    this.log(ErrorLevel.ERROR, ErrorCategory.DATABASE, message, error, context);
  }

  /**
   * Log network errors
   */
  logNetwork(
    message: string,
    error?: Error,
    context: ErrorContext = {}
  ): void {
    this.log(ErrorLevel.ERROR, ErrorCategory.NETWORK, message, error, context);
  }

  /**
   * Log validation errors
   */
  logValidation(
    message: string,
    error?: Error,
    context: ErrorContext = {}
  ): void {
    this.log(ErrorLevel.WARN, ErrorCategory.VALIDATION, message, error, context);
  }

  /**
   * Log authentication errors
   */
  logAuth(
    message: string,
    error?: Error,
    context: ErrorContext = {}
  ): void {
    this.log(ErrorLevel.ERROR, ErrorCategory.AUTHENTICATION, message, error, context);
  }

  /**
   * Log business logic errors
   */
  logBusiness(
    message: string,
    error?: Error,
    context: ErrorContext = {}
  ): void {
    this.log(ErrorLevel.ERROR, ErrorCategory.BUSINESS_LOGIC, message, error, context);
  }

  /**
   * Log UI errors
   */
  logUI(
    message: string,
    error?: Error,
    context: ErrorContext = {}
  ): void {
    this.log(ErrorLevel.WARN, ErrorCategory.UI, message, error, context);
  }

  /**
   * Log debug information (development only)
   */
  logDebug(
    message: string,
    context: ErrorContext = {}
  ): void {
    if (this.isDevelopment) {
      this.log(ErrorLevel.DEBUG, ErrorCategory.UNKNOWN, message, undefined, context);
    }
  }

  /**
   * Log info messages
   */
  logInfo(
    message: string,
    context: ErrorContext = {}
  ): void {
    this.log(ErrorLevel.INFO, ErrorCategory.UNKNOWN, message, undefined, context);
  }

  /**
   * Log warnings
   */
  logWarning(
    message: string,
    context: ErrorContext = {}
  ): void {
    this.log(ErrorLevel.WARN, ErrorCategory.UNKNOWN, message, undefined, context);
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 50): LoggedError[] {
    return this.errors.slice(0, limit);
  }

  /**
   * Get errors by category
   */
  getErrorsByCategory(category: ErrorCategory): LoggedError[] {
    return this.errors.filter(error => error.category === category);
  }

  /**
   * Clear all errors
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    byLevel: Record<ErrorLevel, number>;
    byCategory: Record<ErrorCategory, number>;
    recent: LoggedError[];
  } {
    const byLevel: Record<ErrorLevel, number> = {
      [ErrorLevel.DEBUG]: 0,
      [ErrorLevel.INFO]: 0,
      [ErrorLevel.WARN]: 0,
      [ErrorLevel.ERROR]: 0,
      [ErrorLevel.CRITICAL]: 0
    };

    const byCategory: Record<ErrorCategory, number> = {
      [ErrorCategory.DATABASE]: 0,
      [ErrorCategory.NETWORK]: 0,
      [ErrorCategory.VALIDATION]: 0,
      [ErrorCategory.AUTHENTICATION]: 0,
      [ErrorCategory.BUSINESS_LOGIC]: 0,
      [ErrorCategory.UI]: 0,
      [ErrorCategory.UNKNOWN]: 0
    };

    this.errors.forEach(error => {
      byLevel[error.level]++;
      byCategory[error.category]++;
    });

    return {
      total: this.errors.length,
      byLevel,
      byCategory,
      recent: this.errors.slice(0, 10)
    };
  }

  private generateId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private logToConsole(loggedError: LoggedError): void {
    const { level, category, message, error, context } = loggedError;
    const timestamp = loggedError.timestamp.toISOString();
    const contextStr = context.component ? `[${context.component}]` : '';
    const actionStr = context.action ? `(${context.action})` : '';

    const logMessage = `[${timestamp}] [${level.toUpperCase()}] [${category.toUpperCase()}] ${contextStr} ${actionStr} ${message}`;

    switch (level) {
      case ErrorLevel.DEBUG:
        console.debug(logMessage, error);
        break;
      case ErrorLevel.INFO:
        console.info(logMessage, error);
        break;
      case ErrorLevel.WARN:
        console.warn(logMessage, error);
        break;
      case ErrorLevel.ERROR:
        console.error(logMessage, error);
        break;
      case ErrorLevel.CRITICAL:
        console.error(`🚨 CRITICAL: ${logMessage}`, error);
        break;
    }
  }

  private sendToExternalService(loggedError: LoggedError): void {
    // In production, you would send this to your error tracking service
    // Example: Sentry, LogRocket, Bugsnag, etc.
    
    if (this.isDevelopment) {
      console.log('📤 Would send to external service:', loggedError);
    }
    
    // Example implementation:
    // Sentry.captureException(loggedError.error, {
    //   tags: {
    //     category: loggedError.category,
    //     component: loggedError.context.component,
    //     action: loggedError.context.action
    //   },
    //   extra: loggedError.context.metadata
    // });
  }

  private showCriticalErrorNotification(loggedError: LoggedError): void {
    // Show critical error notification to user
    // This would integrate with your notification system
    
    if (this.isDevelopment) {
      console.error('🚨 CRITICAL ERROR - User notification should be shown:', loggedError.message);
    }
    
    // Example implementation:
    // toast.error(`Critical Error: ${loggedError.message}`, {
    //   duration: 10000,
    //   position: 'top-center'
    // });
  }
}

// Create singleton instance
export const errorService = new ErrorService();

// Export convenience functions for common use cases
export const logError = errorService.log.bind(errorService);
export const logDatabase = errorService.logDatabase.bind(errorService);
export const logNetwork = errorService.logNetwork.bind(errorService);
export const logValidation = errorService.logValidation.bind(errorService);
export const logAuth = errorService.logAuth.bind(errorService);
export const logBusiness = errorService.logBusiness.bind(errorService);
export const logUI = errorService.logUI.bind(errorService);
export const logDebug = errorService.logDebug.bind(errorService);
export const logInfo = errorService.logInfo.bind(errorService);
export const logWarning = errorService.logWarning.bind(errorService);

// Export the service instance
export default errorService;
