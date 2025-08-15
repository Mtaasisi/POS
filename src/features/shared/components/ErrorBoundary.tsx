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
                  Something went wrong
                </h1>
                <p className="text-gray-600">
                  An unexpected error occurred. We're sorry for the inconvenience.
                </p>
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
                <GlassButton
                  onClick={this.handleRetry}
                  disabled={retryCount >= maxRetries}
                  icon={<RefreshCw className="w-4 h-4" />}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {retryCount >= maxRetries ? 'Max Retries Reached' : 'Try Again'}
                </GlassButton>
                
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