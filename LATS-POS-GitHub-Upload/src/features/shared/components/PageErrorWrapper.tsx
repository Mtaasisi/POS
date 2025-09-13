import React from 'react';
import { PageErrorBoundary } from './PageErrorBoundary';
import { useErrorHandler } from '../../../hooks/useErrorHandler';
import ErrorState from '../../lats/components/ui/ErrorState';

interface PageErrorWrapperProps {
  children: React.ReactNode;
  pageName?: string;
  showDetails?: boolean;
  errorHandlerOptions?: {
    maxRetries?: number;
    showToast?: boolean;
    logToConsole?: boolean;
  };
  onError?: (error: Error) => void;
  onRetry?: () => void;
}

export const PageErrorWrapper: React.FC<PageErrorWrapperProps> = ({
  children,
  pageName = 'this page',
  showDetails = false,
  errorHandlerOptions = {},
  onError,
  onRetry
}) => {
  const { errorState, handleError, clearError } = useErrorHandler({
    maxRetries: 3,
    showToast: true,
    logToConsole: true,
    ...errorHandlerOptions
  });

  // Show error state if there's an error
  if (errorState.hasError) {
    return (
      <ErrorState
        title={`${pageName} Error`}
        message={errorState.errorMessage || undefined}
        error={errorState.error || undefined}
        action={{
          label: 'Try Again',
          onClick: () => {
            clearError();
            if (onRetry) {
              onRetry();
            } else {
              window.location.reload();
            }
          }
        }}
        secondaryAction={{
          label: 'Go Back',
          onClick: () => window.history.back()
        }}
        showDetails={showDetails}
      />
    );
  }

  return (
    <PageErrorBoundary 
      pageName={pageName} 
      showDetails={showDetails}
      onError={onError}
    >
      {children}
    </PageErrorBoundary>
  );
};

// Higher-order component for adding error handling to page components
export function withErrorHandling<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    pageName?: string;
    showDetails?: boolean;
    errorHandlerOptions?: {
      maxRetries?: number;
      showToast?: boolean;
      logToConsole?: boolean;
    };
  } = {}
) {
  const WrappedComponent: React.FC<P> = (props) => {
    return (
      <PageErrorWrapper
        pageName={options.pageName}
        showDetails={options.showDetails}
        errorHandlerOptions={options.errorHandlerOptions}
      >
        <Component {...props} />
      </PageErrorWrapper>
    );
  };

  WrappedComponent.displayName = `withErrorHandling(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Specialized wrappers for different page types
export const withDataErrorHandling = <P extends object>(Component: React.ComponentType<P>) =>
  withErrorHandling(Component, { showDetails: true });

export const withFormErrorHandling = <P extends object>(Component: React.ComponentType<P>) =>
  withErrorHandling(Component, { showDetails: false });

export const withDashboardErrorHandling = <P extends object>(Component: React.ComponentType<P>) =>
  withErrorHandling(Component, { showDetails: true });
