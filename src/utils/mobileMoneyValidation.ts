/**
 * Mobile Money Payment Validation Utilities
 * Provides consistent validation for mobile money payment reference numbers
 */

export interface MobileMoneyValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates mobile money reference number format
 * @param reference - The reference number to validate
 * @param provider - The mobile money provider (optional, for provider-specific validation)
 * @returns Validation result with error message if invalid
 */
export const validateMobileMoneyReference = (
  reference: string,
  provider?: string
): MobileMoneyValidationResult => {
  // Check if reference is provided
  if (!reference || !reference.trim()) {
    return {
      isValid: false,
      error: 'Reference number is required for mobile money payments'
    };
  }

  const trimmedReference = reference.trim();

  // Basic format validation - 6-12 alphanumeric characters
  const referenceRegex = /^[0-9A-Za-z]{6,12}$/;
  if (!referenceRegex.test(trimmedReference)) {
    return {
      isValid: false,
      error: 'Please enter a valid reference number (6-12 alphanumeric characters)'
    };
  }

  // Provider-specific validation (if needed)
  if (provider) {
    const providerLower = provider.toLowerCase();
    
    // M-Pesa specific validation
    if (providerLower.includes('mpesa') || providerLower.includes('m-pesa')) {
      // M-Pesa reference numbers are typically 7-10 digits
      const mpesaRegex = /^[0-9]{7,10}$/;
      if (!mpesaRegex.test(trimmedReference)) {
        return {
          isValid: false,
          error: 'M-Pesa reference number should be 7-10 digits'
        };
      }
    }
    
    // Airtel Money specific validation
    if (providerLower.includes('airtel')) {
      // Airtel Money reference numbers are typically 6-12 alphanumeric
      const airtelRegex = /^[0-9A-Za-z]{6,12}$/;
      if (!airtelRegex.test(trimmedReference)) {
        return {
          isValid: false,
          error: 'Airtel Money reference number should be 6-12 alphanumeric characters'
        };
      }
    }
    
    // ZenoPay specific validation
    if (providerLower.includes('zenopay')) {
      // ZenoPay reference numbers are typically 8-12 alphanumeric
      const zenopayRegex = /^[0-9A-Za-z]{8,12}$/;
      if (!zenopayRegex.test(trimmedReference)) {
        return {
          isValid: false,
          error: 'ZenoPay reference number should be 8-12 alphanumeric characters'
        };
      }
    }
  }

  return {
    isValid: true
  };
};

/**
 * Validates if a payment method requires a reference number
 * @param paymentMethod - The payment method object
 * @returns True if reference number is required
 */
export const requiresReferenceNumber = (paymentMethod: {
  type: string;
  requiresReference?: boolean;
}): boolean => {
  // Check explicit requiresReference flag first
  if (paymentMethod.requiresReference !== undefined) {
    return paymentMethod.requiresReference;
  }
  
  // Default logic based on payment type
  return paymentMethod.type === 'mobile_money' || 
         paymentMethod.type === 'card' || 
         paymentMethod.type === 'bank_transfer';
};

/**
 * Gets the appropriate placeholder text for reference number input
 * @param provider - The mobile money provider
 * @returns Placeholder text for the input field
 */
export const getReferencePlaceholder = (provider?: string): string => {
  if (!provider) {
    return 'Enter reference number';
  }
  
  const providerLower = provider.toLowerCase();
  
  if (providerLower.includes('mpesa') || providerLower.includes('m-pesa')) {
    return 'Enter M-Pesa reference (7-10 digits)';
  }
  
  if (providerLower.includes('airtel')) {
    return 'Enter Airtel Money reference';
  }
  
  if (providerLower.includes('zenopay')) {
    return 'Enter ZenoPay reference';
  }
  
  return 'Enter reference number (6-12 characters)';
};

/**
 * Gets the appropriate help text for reference number input
 * @param provider - The mobile money provider
 * @returns Help text for the input field
 */
export const getReferenceHelpText = (provider?: string): string => {
  if (!provider) {
    return 'Reference number from your mobile money transaction';
  }
  
  const providerLower = provider.toLowerCase();
  
  if (providerLower.includes('mpesa') || providerLower.includes('m-pesa')) {
    return 'Enter the transaction reference from your M-Pesa confirmation message';
  }
  
  if (providerLower.includes('airtel')) {
    return 'Enter the transaction reference from your Airtel Money confirmation message';
  }
  
  if (providerLower.includes('zenopay')) {
    return 'Enter the transaction reference from your ZenoPay confirmation message';
  }
  
  return 'Enter the transaction reference from your mobile money confirmation message';
};
