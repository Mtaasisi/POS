import React from 'react';
import QuickPaymentViewer from '../components/QuickPaymentViewer';
import PaymentDetailsViewer from '../components/PaymentDetailsViewer';

const TestPaymentDetails: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Payment Details Test</h1>
          <p className="text-gray-600">Test the payment details viewer for transaction TXN-3304CA9C</p>
        </div>

        {/* Quick Viewer */}
        <QuickPaymentViewer defaultTransactionId="TXN-3304CA9C" />

        {/* Direct Viewer */}
        <div className="bg-white rounded-lg shadow-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Direct Payment Details</h3>
          <PaymentDetailsViewer 
            transactionId="TXN-3304CA9C" 
            isModal={false}
          />
        </div>
      </div>
    </div>
  );
};

export default TestPaymentDetails;
