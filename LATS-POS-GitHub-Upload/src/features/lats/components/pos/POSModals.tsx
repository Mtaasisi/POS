import React, { Suspense } from 'react';

// Lazy load large modal components to reduce bundle size
const POSSettingsModal = React.lazy(() => import('./POSSettingsModal'));
const POSDiscountModal = React.lazy(() => import('./POSDiscountModal'));
const POSReceiptModal = React.lazy(() => import('./POSReceiptModal'));

// Loading fallback component
const ModalLoadingFallback: React.FC = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-center text-gray-600">Loading...</p>
    </div>
  </div>
);

// Settings Modal Wrapper
export const POSSettingsModalWrapper: React.FC<any> = (props) => (
  <Suspense fallback={<ModalLoadingFallback />}>
    <POSSettingsModal {...props} />
  </Suspense>
);

// Discount Modal Wrapper
export const POSDiscountModalWrapper: React.FC<any> = (props) => (
  <Suspense fallback={<ModalLoadingFallback />}>
    <POSDiscountModal {...props} />
  </Suspense>
);

// Receipt Modal Wrapper
export const POSReceiptModalWrapper: React.FC<any> = (props) => (
  <Suspense fallback={<ModalLoadingFallback />}>
    <POSReceiptModal {...props} />
  </Suspense>
);

// Export types
export type { POSSettingsModalRef } from './POSSettingsModal';
