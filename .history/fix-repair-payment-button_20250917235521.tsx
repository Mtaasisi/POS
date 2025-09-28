// Fixed RepairPaymentButton component
// This version actually creates repair payment records in the database

import React, { useState } from 'react';
import { DollarSign } from 'lucide-react';
import GlassButton from '../../shared/components/ui/GlassButton';
import PaymentsPopupModal from '../../../components/PaymentsPopupModal';
import { repairPaymentService } from '../../../lib/repairPaymentService';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';

interface RepairPaymentButtonProps {
  customerId: string;
  customerName: string;
  deviceId: string;
  deviceName: string;
  repairAmount: number;
  onPaymentComplete?: (paymentData: any) => void;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const RepairPaymentButton: React.FC<RepairPaymentButtonProps> = ({
  customerId,
  customerName,
  deviceId,
  deviceName,
  repairAmount,
  onPaymentComplete,
  className = '',
  variant = 'primary',
  size = 'sm'
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();

  const handlePaymentComplete = async (payments: any[], totalPaid: number) => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Process each payment and create repair payment records
      const results = await Promise.all(
        payments.map(async (payment) => {
          try {
            // Create repair payment record using the service
            const repairPayment = await repairPaymentService.createRepairPayment({
              customerId: customerId,
              deviceId: deviceId,
              amount: payment.amount,
              paymentMethod: payment.paymentMethod,
              paymentAccountId: payment.paymentAccountId,
              reference: payment.reference,
              notes: payment.notes,
              currency: payment.currency || 'TZS'
            }, user.id);

            console.log('✅ Repair payment created:', repairPayment);
            return { success: true, payment: repairPayment };
          } catch (error) {
            console.error('❌ Error creating repair payment:', error);
            throw error;
          }
        })
      );

      // Show success message
      toast.success(`Repair payment of ${totalPaid} TZS processed successfully!`);
      
      // Call the callback if provided
      if (onPaymentComplete) {
        await onPaymentComplete({ payments, totalPaid, results });
      }
      
      setIsModalOpen(false);
    } catch (error) {
      console.error('Payment processing error:', error);
      toast.error('Failed to process repair payment. Please try again.');
      throw error; // This will be caught by the modal and show error toast
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <GlassButton
        onClick={() => setIsModalOpen(true)}
        variant={variant}
        size={size}
        className={className}
        disabled={isProcessing}
      >
        <DollarSign className="w-4 h-4 mr-1" />
        {isProcessing ? 'Processing...' : 'Pay Repair'}
      </GlassButton>

      <PaymentsPopupModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        amount={repairAmount}
        customerId={customerId}
        customerName={customerName}
        description={`Repair payment for ${deviceName}`}
        onPaymentComplete={handlePaymentComplete}
        title="Process Repair Payment"
        showCustomerInfo={true}
      />
    </>
  );
};

export default RepairPaymentButton;
