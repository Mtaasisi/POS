import React from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import GlassButton from './ui/GlassButton';
import GlassCard from './ui/GlassCard';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; errorInfo: React.ErrorInfo | null; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  maxRetries?: number;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({ errorInfo });
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console for debugging
    console.group('🚨 Error Details');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();

    // Check if this is a React refresh error
    const isReactRefreshError = error.message.includes('React Refresh') || 
                               error.message.includes('@react-refresh') ||
                               errorInfo.componentStack.includes('React Refresh');
    
    if (isReactRefreshError) {
      console.log('🔄 Detected React refresh error, attempting to recover...');
      // For React refresh errors, we might want to show a different message
      // or handle them differently
    }

    // You could also send to an error reporting service here
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;
    
    if (retryCount < maxRetries) {
      console.log(`🔄 Retrying... Attempt ${retryCount + 1} of ${maxRetries}`);
      this.setState({ 
        hasError: false, 
        error: null, 
        errorInfo: null,
        retryCount: retryCount + 1 
      });
    } else {
      console.error('❌ Max retries exceeded');
      // Could show a different message or redirect to a safe page
    }
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  handleGoBack = () => {
    window.history.back();
  };

  handleRefreshPage = () => {
    window.location.reload();
  };

  // Handle React refresh errors specifically
  handleReactRefreshError = () => {
    console.log('🔄 Handling React refresh error, reloading page...');
    // Clear any cached data that might be causing issues
    if (typeof window !== 'undefined') {
      // Clear session storage
      sessionStorage.clear();
      // Clear any problematic cached data
      localStorage.removeItem('pos_setup_complete');
      // Reload the page
      window.location.reload();
    }
  };

  render() {
    const { hasError, error, errorInfo, retryCount } = this.state;
    const { children, fallback, maxRetries = 3 } = this.props;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return React.createElement(fallback, {
          error: error!,
          errorInfo,
          retry: this.handleRetry
        });
      }

      // Check if this is a React refresh error
      const isReactRefreshError = error?.message?.includes('React Refresh') || 
                                 error?.message?.includes('@react-refresh') ||
                                 errorInfo?.componentStack?.includes('React Refresh');

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <GlassCard className="max-w-2xl w-full p-8">
            <div className="text-center space-y-6">
              {/* Error Icon */}
              <div className="flex justify-center">
                <div className="p-4 bg-red-100 rounded-full">
                  <AlertTriangle className="w-12 h-12 text-red-600" />
                </div>
              </div>

              {/* Error Title */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {isReactRefreshError ? 'Development Refresh Error' : 'Something went wrong'}
                </h1>
                <p className="text-gray-600">
                  {isReactRefreshError 
                    ? process.env.NODE_ENV === 'development'
                      ? 'A development refresh error occurred. This is usually temporary and can be resolved by refreshing the page. This error typically happens during hot reloading in development mode.'
                      : 'A refresh error occurred. This is usually temporary and can be resolved by refreshing the page.'
                    : 'An unexpected error occurred. We\'re sorry for the inconvenience.'
                  }
                </p>
                {isReactRefreshError && process.env.NODE_ENV === 'development' && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                    💡 <strong>Development Tip:</strong> This error often occurs during hot reloading. Try saving your file again or manually refreshing the page.
                  </div>
                )}
              </div>

              {/* Error Details */}
              {error && (
                <div className="bg-gray-50 rounded-lg p-4 text-left">
                  <h3 className="font-semibold text-gray-900 mb-2">Error Details:</h3>
                  <p className="text-sm text-red-600 font-mono mb-2">
                    {error.message}
                  </p>
                  {errorInfo && (
                    <details className="text-sm text-gray-600">
                      <summary className="cursor-pointer hover:text-gray-800 mb-2">
                        Show technical details
                      </summary>
                      <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-32">
                        {errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Retry Information */}
              {retryCount > 0 && (
                <div className="text-sm text-gray-500">
                  Retry attempt {retryCount} of {maxRetries}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {isReactRefreshError ? (
                  <GlassButton
                    onClick={this.handleRefreshPage}
                    icon={<RefreshCw className="w-4 h-4" />}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Refresh Page
                  </GlassButton>
                ) : (
                  <GlassButton
                    onClick={this.handleRetry}
                    disabled={retryCount >= maxRetries}
                    icon={<RefreshCw className="w-4 h-4" />}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {retryCount >= maxRetries ? 'Max Retries Reached' : 'Try Again'}
                  </GlassButton>
                )}
                
                <GlassButton
                  onClick={this.handleGoBack}
                  variant="secondary"
                  icon={<ArrowLeft className="w-4 h-4" />}
                >
                  Go Back
                </GlassButton>
                
                <GlassButton
                  onClick={this.handleGoHome}
                  variant="secondary"
                  icon={<Home className="w-4 h-4" />}
                >
                  Go Home
                </GlassButton>
              </div>

              {/* Additional Help */}
              <div className="text-xs text-gray-500">
                If this problem persists, please contact support with the error details above.
              </div>
            </div>
          </GlassCard>
        </div>
      );
    }

    return children;
  }
} 