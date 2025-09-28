/**
 * URL Validated Route Component
 * 
 * This component wraps React Router routes to validate URLs and prevent
 * HTTP 431 "Request Header Fields Too Large" errors by sanitizing
 * problematic URLs before they reach the route handlers.
 */

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { UrlValidationMiddleware } from '../lib/urlValidationMiddleware';
import { ImageUrlSanitizer } from '../lib/imageUrlSanitizer';

interface UrlValidatedRouteProps {
  children: React.ReactNode;
  fallbackPath?: string;
  enableImageUrlValidation?: boolean;
  enableUrlLogging?: boolean;
}

const UrlValidatedRoute: React.FC<UrlValidatedRouteProps> = ({
  children,
  fallbackPath = '/lats/unified-inventory',
  enableImageUrlValidation = true,
  enableUrlLogging = false
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isValidating, setIsValidating] = useState(true);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    sanitizedUrl?: string;
    reason?: string;
  } | null>(null);

  useEffect(() => {
    const validateCurrentUrl = () => {
      const currentUrl = location.pathname + location.search;
      
      if (enableUrlLogging) {
        console.log('🔍 Validating URL:', {
          pathname: location.pathname,
          search: location.search,
          fullUrl: currentUrl,
          length: currentUrl.length
        });
      }

      // Validate the URL
      const result = UrlValidationMiddleware.validateUrl(currentUrl);
      
      if (!result.isValid) {
        console.warn('🚨 URL validation failed:', {
          reason: result.reason,
          originalLength: result.originalLength,
          sanitizedUrl: result.sanitizedUrl
        });

        setValidationResult({
          isValid: false,
          sanitizedUrl: result.sanitizedUrl,
          reason: result.reason
        });

        // Redirect to safe URL
        if (result.sanitizedUrl) {
          navigate(result.sanitizedUrl, { replace: true });
        } else {
          navigate(fallbackPath, { replace: true });
        }
        return;
      }

      // Additional image URL validation if enabled
      if (enableImageUrlValidation) {
        const imageValidationResult = validateImageUrlsInPath(location.pathname);
        if (!imageValidationResult.isValid) {
          console.warn('🚨 Image URL validation failed:', {
            reason: imageValidationResult.reason,
            sanitizedUrl: imageValidationResult.sanitizedUrl
          });

          setValidationResult({
            isValid: false,
            sanitizedUrl: imageValidationResult.sanitizedUrl,
            reason: imageValidationResult.reason
          });

          // Redirect to safe URL
          if (imageValidationResult.sanitizedUrl) {
            navigate(imageValidationResult.sanitizedUrl, { replace: true });
          } else {
            navigate(fallbackPath, { replace: true });
          }
          return;
        }
      }

      setValidationResult({ isValid: true });
      setIsValidating(false);
    };

    validateCurrentUrl();
  }, [location.pathname, location.search, navigate, fallbackPath, enableImageUrlValidation, enableUrlLogging]);

  // Show loading state while validating
  if (isValidating) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating URL...</p>
        </div>
      </div>
    );
  }

  // Show error state if validation failed
  if (validationResult && !validationResult.isValid) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">URL Too Large</h2>
          <p className="text-gray-600 mb-4">
            The URL you're trying to access is too large and could cause server errors.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Reason: {validationResult.reason}
          </p>
          <button
            onClick={() => navigate(fallbackPath)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Go to Safe Page
          </button>
        </div>
      </div>
    );
  }

  // Render children if validation passed
  return <>{children}</>;
};

/**
 * Validate image URLs in the current path
 */
function validateImageUrlsInPath(pathname: string): {
  isValid: boolean;
  sanitizedUrl?: string;
  reason?: string;
} {
  // Check if path contains product ID patterns that might have image data
  const productIdPattern = /\/lats\/products\/([^\/]+)/;
  const match = pathname.match(productIdPattern);
  
  if (match) {
    const productId = match[1];
    
    // Check if product ID contains Base64-like patterns
    const base64Pattern = /[A-Za-z0-9+/]{100,}={0,2}/;
    if (base64Pattern.test(productId)) {
      return {
        isValid: false,
        sanitizedUrl: '/lats/unified-inventory',
        reason: 'Product ID contains Base64 data'
      };
    }
    
    // Check if product ID is too long
    if (productId.length > 100) {
      return {
        isValid: false,
        sanitizedUrl: '/lats/unified-inventory',
        reason: 'Product ID too long'
      };
    }
  }
  
  return { isValid: true };
}

export default UrlValidatedRoute;
