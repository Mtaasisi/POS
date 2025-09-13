import { useState, useCallback } from 'react';

export interface ErrorState {
  hasError: boolean;
  error: Error | null;
  errorMessage: string | null;
  retryCount: number;
  isLoading: boolean;
}

export interface ErrorHandlerOptions {
  maxRetries?: number;
  showToast?: boolean;
  logToConsole?: boolean;
  onError?: (error: Error) => void;
  onRetry?: () => void;
}

export const useErrorHandler = (options: ErrorHandlerOptions = {}) => {
  const {
    maxRetries = 3,
    showToast = true,
    logToConsole = true,
    onError,
    onRetry
  } = options;

  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    errorMessage: null,
    retryCount: 0,
    isLoading: false
  });

  const handleError = useCallback((error: Error | string, context?: string) => {
    const errorObj = error instanceof Error ? error : new Error(error);
    const errorMessage = errorObj.message || 'An unexpected error occurred';
    const contextMessage = context ? ` (${context})` : '';
    const fullMessage = `${errorMessage}${contextMessage}`;

    if (logToConsole) {
      console.error('🚨 Error occurred:', {
        error: errorObj,
        context,
        message: fullMessage,
        stack: errorObj.stack
      });
    }

    if (showToast) {
      // Simple toast implementation
      console.log('Toast:', fullMessage);
    }

    setErrorState(prev => ({
      ...prev,
      hasError: true,
      error: errorObj,
      errorMessage: fullMessage,
      isLoading: false
    }));

    if (onError) {
      onError(errorObj);
    }
  }, [logToConsole, showToast, onError]);

  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      errorMessage: null,
      retryCount: 0,
      isLoading: false
    });
  }, []);

  const retry = useCallback(async (retryFunction: () => Promise<any>) => {
    const { retryCount } = errorState;
    
    if (retryCount >= maxRetries) {
      handleError(new Error(`Maximum retry attempts (${maxRetries}) exceeded`));
      return false;
    }

    setErrorState(prev => ({
      ...prev,
      isLoading: true,
      retryCount: prev.retryCount + 1
    }));

    try {
      await retryFunction();
      clearError();
      
      if (showToast) {
        console.log('Toast: Operation completed successfully');
      }
      
      if (onRetry) {
        onRetry();
      }
      
      return true;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      handleError(errorObj, `Retry attempt ${retryCount + 1}`);
      return false;
    }
  }, [errorState.retryCount, maxRetries, handleError, clearError, showToast, onRetry]);

  const withErrorHandling = useCallback(async <T,>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T | null> => {
    setErrorState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const result = await operation();
      setErrorState(prev => ({ ...prev, isLoading: false }));
      return result;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      handleError(errorObj, context);
      return null;
    }
  }, [handleError]);

  const setLoading = useCallback((isLoading: boolean) => {
    setErrorState(prev => ({ ...prev, isLoading }));
  }, []);

  return {
    errorState,
    handleError,
    clearError,
    retry,
    withErrorHandling,
    setLoading
  };
};

export const useAsyncErrorHandler = (options?: ErrorHandlerOptions) => {
  const errorHandler = useErrorHandler(options);
  
  const handleAsyncOperation = useCallback(async <T,>(
    operation: () => Promise<T>,
    successMessage?: string,
    context?: string
  ): Promise<T | null> => {
    const result = await errorHandler.withErrorHandling(operation, context);
    
    if (result !== null && successMessage) {
      console.log('Toast:', successMessage);
    }
    
    return result;
  }, [errorHandler]);

  return {
    ...errorHandler,
    handleAsyncOperation
  };
};
