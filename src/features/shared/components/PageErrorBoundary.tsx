import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, RefreshCw, Home, ArrowLeft, AlertCircle } from 'lucide-react';
import GlassButton from './ui/GlassButton';
import GlassCard from './ui/GlassCard';
import { ErrorBoundary } from './ErrorBoundary';

interface PageErrorFallbackProps {
  error: Error;
  errorInfo: React.ErrorInfo | null;
  retry: () => void;
  pageName?: string;
  showDetails?: boolean;
}

const PageErrorFallback: React.FC<PageErrorFallbackProps> = ({
  error,
  errorInfo,
  retry,
  pageName = 'this page',
  showDetails = false
}) => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  const getErrorMessage = (error: Error): string => {
    // Provide user-friendly messages for common errors
    if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
      return 'Network connection issue. Please check your internet connection and try again.';
    }
    if (error.message.includes('permission') || error.message.includes('unauthorized')) {
      return 'You don\'t have permission to access this content. Please contact your administrator.';
    }
    if (error.message.includes('not found') || error.message.includes('404')) {
      return 'The requested content could not be found. It may have been moved or deleted.';
    }
    if (error.message.includes('timeout')) {
      return 'The request took too long to complete. Please try again.';
    }
    return error.message || 'An unexpected error occurred while loading this page.';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <GlassCard className="max-w-2xl w-full p-8">
        <div className="text-center space-y-6">
          {/* Error Icon */}
          <div className="flex justify-center">
            <div className="p-4 bg-red-100 rounded-full">
              <AlertCircle className="w-12 h-12 text-red-600" />
            </div>
          </div>

          {/* Error Title */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Page Error
            </h1>
            <p className="text-gray-600">
              There was a problem loading {pageName}. We're working to fix this issue.
            </p>
          </div>

          {/* Error Message */}
          <div className="bg-gray-50 rounded-lg p-4 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">What happened:</h3>
            <p className="text-sm text-gray-700 mb-4">
              {getErrorMessage(error)}
            </p>
            
            {showDetails && errorInfo && (
              <details className="text-sm text-gray-600">
                <summary className="cursor-pointer hover:text-gray-800 mb-2">
                  Show technical details
                </summary>
                <div className="space-y-2">
                  <div>
                    <strong>Error:</strong> {error.name}
                  </div>
                  <div>
                    <strong>Message:</strong> {error.message}
                  </div>
                  <div>
                    <strong>Stack:</strong>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-32 mt-1">
                      {error.stack}
                    </pre>
                  </div>
                  <div>
                    <strong>Component Stack:</strong>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-auto max-h-32 mt-1">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                </div>
              </details>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <GlassButton
              onClick={retry}
              icon={<RefreshCw className="w-4 h-4" />}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Try Again
            </GlassButton>
            
            <GlassButton
              onClick={handleGoBack}
              variant="secondary"
              icon={<ArrowLeft className="w-4 h-4" />}
            >
              Go Back
            </GlassButton>
            
            <GlassButton
              onClick={handleGoHome}
              variant="secondary"
              icon={<Home className="w-4 h-4" />}
            >
              Go Home
            </GlassButton>
          </div>

          {/* Additional Help */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>If this problem persists, try:</p>
            <ul className="text-left space-y-1">
              <li>• Refreshing the page</li>
              <li>• Checking your internet connection</li>
              <li>• Clearing your browser cache</li>
              <li>• Contacting support if the issue continues</li>
            </ul>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

interface PageErrorBoundaryProps {
  children: React.ReactNode;
  pageName?: string;
  showDetails?: boolean;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  maxRetries?: number;
}

export const PageErrorBoundary: React.FC<PageErrorBoundaryProps> = ({
  children,
  pageName,
  showDetails = false,
  onError,
  maxRetries = 3
}) => {
  const FallbackComponent = ({ error, errorInfo, retry }: any) => (
    <PageErrorFallback
      error={error}
      errorInfo={errorInfo}
      retry={retry}
      pageName={pageName}
      showDetails={showDetails}
    />
  );

  return (
    <ErrorBoundary
      fallback={FallbackComponent}
      onError={onError}
      maxRetries={maxRetries}
    >
      {children}
    </ErrorBoundary>
  );
};

// Specialized error boundaries for different page types
export const DataPageErrorBoundary: React.FC<PageErrorBoundaryProps> = (props) => (
  <PageErrorBoundary
    {...props}
    pageName={props.pageName || 'data'}
    showDetails={true}
  />
);

export const FormPageErrorBoundary: React.FC<PageErrorBoundaryProps> = (props) => (
  <PageErrorBoundary
    {...props}
    pageName={props.pageName || 'form'}
    showDetails={false}
  />
);

export const DashboardPageErrorBoundary: React.FC<PageErrorBoundaryProps> = (props) => (
  <PageErrorBoundary
    {...props}
    pageName={props.pageName || 'dashboard'}
    showDetails={true}
  />
);
