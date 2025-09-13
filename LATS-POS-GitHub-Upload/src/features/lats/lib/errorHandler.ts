import { toast } from 'react-hot-toast';
import { ApiError, ValidationError } from '../types/inventory';

// Simple error handler functions without singleton pattern
export const handleApiError = (error: any, context: string = 'Operation'): ApiError => {
  console.error(`[LATS Error] ${context}:`, error);
  
  const apiError: ApiError = {
    code: 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred',
    details: error
  };

  // Handle Supabase errors
  if (error?.code) {
    apiError.code = error.code;
    
    switch (error.code) {
      case '23505': // Unique violation
        apiError.message = 'This item already exists';
        break;
      case '23503': // Foreign key violation
        apiError.message = 'Referenced item does not exist';
        break;
      case '42P01': // Undefined table
        apiError.message = 'Database table not found';
        break;
      case '42703': // Undefined column
        apiError.message = 'Database column not found';
        break;
      case 'PGRST116': // JWT error
        apiError.message = 'Authentication error';
        break;
      case 'PGRST301': // Row not found
        apiError.message = 'Item not found';
        break;
      default:
        apiError.message = error.message || 'Database error occurred';
    }
  }
  
  // Handle network errors
  else if (error?.message?.includes('fetch')) {
    apiError.code = 'NETWORK_ERROR';
    apiError.message = 'Network connection error';
  }
  
  // Handle validation errors
  else if (error?.message?.includes('validation')) {
    apiError.code = 'VALIDATION_ERROR';
    apiError.message = 'Invalid data provided';
  }

  // Show toast notification
  showErrorToast(apiError.message, context);
  
  return apiError;
};

// Handle validation errors
export const handleValidationError = (errors: ValidationError[], context: string = 'Form'): void => {
  console.error(`[LATS Validation Error] ${context}:`, errors);
  
  if (errors.length > 0) {
    const firstError = errors[0];
    showErrorToast(`${firstError.field}: ${firstError.message}`, context);
  }
};

// Handle form submission errors
export const handleFormError = (error: any, formName: string): void => {
  console.error(`[LATS Form Error] ${formName}:`, error);
  
  if (error?.response?.data?.message) {
    showErrorToast(error.response.data.message, formName);
  } else if (error?.message) {
    showErrorToast(error.message, formName);
  } else {
    showErrorToast('Failed to submit form', formName);
  }
};

// Handle data loading errors
export const handleLoadError = (error: any, dataType: string): void => {
  console.error(`[LATS Load Error] ${dataType}:`, error);
  
  let message = `Failed to load ${dataType}`;
  
  if (error?.code === 'NETWORK_ERROR') {
    message = `Network error while loading ${dataType}`;
  } else if (error?.code === 'AUTH_ERROR') {
    message = `Authentication required to load ${dataType}`;
  }
  
  showErrorToast(message, dataType);
};

// Handle success messages
export const handleSuccess = (message: string, context: string = 'Operation'): void => {
  console.log(`[LATS Success] ${context}: ${message}`);
  toast.success(message);
};

// Handle warning messages
export const handleWarning = (message: string, context: string = 'Operation'): void => {
  console.warn(`[LATS Warning] ${context}: ${message}`);
  toast(message, {
    icon: '⚠️',
    style: {
      background: '#fbbf24',
      color: '#92400e'
    }
  });
};

// Handle info messages
export const handleInfo = (message: string, context: string = 'Operation'): void => {
  console.log(`[LATS Info] ${context}: ${message}`);
  toast(message, {
    icon: 'ℹ️',
    style: {
      background: '#3b82f6',
      color: '#ffffff'
    }
  });
};

// Show error toast with context
const showErrorToast = (message: string, context: string): void => {
  toast.error(`${context}: ${message}`, {
    duration: 5000,
    position: 'top-right',
    style: {
      background: '#ef4444',
      color: '#ffffff',
      borderRadius: '8px',
      padding: '12px 16px',
      fontSize: '14px',
      fontWeight: '500'
    }
  });
};

// Validate required fields
export const validateRequiredFields = (data: Record<string, any>, requiredFields: string[]): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  requiredFields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      errors.push({
        field,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} is required`
      });
    }
  });
  
  return errors;
};

// Validate email format
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone format
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

// Validate numeric range
export const validateNumericRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

// Validate string length
export const validateStringLength = (value: string, min: number, max: number): boolean => {
  return value.length >= min && value.length <= max;
};

// Create retry function with exponential backoff
export const createRetryFunction = <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): () => Promise<T> => {
  return async (): Promise<T> => {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        console.warn(`[LATS Retry] Attempt ${attempt} failed, retrying in ${delay}ms...`);
      }
    }
    
    throw lastError;
  };
};

// Handle async operations with error handling
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  context: string,
  onError?: (error: ApiError) => void
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error) {
    const apiError = handleApiError(error, context);
    if (onError) {
      onError(apiError);
    }
    return null;
  }
};

// Handle async operations with loading state
export const withLoadingState = async <T>(
  operation: () => Promise<T>,
  setLoading: (loading: boolean) => void,
  context: string,
  onError?: (error: ApiError) => void
): Promise<T | null> => {
  setLoading(true);
  try {
    const result = await operation();
    handleSuccess(`${context} completed successfully`, context);
    return result;
  } catch (error) {
    const apiError = handleApiError(error, context);
    if (onError) {
      onError(apiError);
    }
    return null;
  } finally {
    setLoading(false);
  }
};
