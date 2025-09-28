import React, { useState } from 'react';
import { CreditCard, DollarSign, Settings } from 'lucide-react';
import GlassButton from '../features/shared/components/ui/GlassButton';
import PaymentsPopupModal from './PaymentsPopupModal';

interface PaymentData {
  amount: number;
  paymentMethod: string;
  paymentAccountId: string;
  reference?: string;
  notes?: string;
  customerId?: string;
  customerName?: string;
  description?: string;
}

const PaymentsModalExample: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(100);
  const [customerName, setCustomerName] = useState('John Doe');
  const [customerId, setCustomerId] = useState('customer-123');

  const handlePaymentComplete = async (paymentData: PaymentData) => {
    console.log('Payment completed:', paymentData);
    
    // Here you would typically:
    // 1. Save payment to database
    // 2. Update account balances
    // 3. Send confirmation notifications
    // 4. Update UI state
    
    // Example implementation:
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Handle the payment data
      console.log('Processing payment:', {
        amount: paymentData.amount,
        method: paymentData.paymentMethod,
        account: paymentData.paymentAccountId,
        reference: paymentData.reference,
        notes: paymentData.notes
      });
      
      // You can add your payment processing logic here
      
    } catch (error) {
      console.error('Payment processing failed:', error);
      throw error; // This will be caught by the modal and show error toast
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Payments Modal Example</h2>
      
      {/* Example Controls */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Amount
          </label>
          <input
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(Number(e.target.value))}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            min="0"
            step="0.01"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer Name
          </label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter customer name"
          />
        </div>
      </div>

      {/* Payment Buttons */}
      <div className="space-y-3">
        <GlassButton
          onClick={() => setIsModalOpen(true)}
          variant="primary"
          className="w-full"
          icon={<CreditCard className="w-4 h-4" />}
        >
          Process Payment - ${paymentAmount.toFixed(2)}
        </GlassButton>
        
        <GlassButton
          onClick={() => {
            setPaymentAmount(50);
            setCustomerName('Jane Smith');
            setIsModalOpen(true);
          }}
          variant="secondary"
          className="w-full"
          icon={<DollarSign className="w-4 h-4" />}
        >
          Quick Payment - $50
        </GlassButton>
      </div>

      {/* Payments Modal */}
      <PaymentsPopupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        amount={paymentAmount}
        customerId={customerId}
        customerName={customerName}
        description="Example payment transaction"
        onPaymentComplete={handlePaymentComplete}
        title="Process Payment"
        showCustomerInfo={true}
      />
    </div>
  );
};

export default PaymentsModalExample;
