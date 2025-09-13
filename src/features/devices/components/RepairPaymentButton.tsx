import React, { useState } from 'react';
import { DollarSign } from 'lucide-react';
import GlassButton from '../../shared/components/ui/GlassButton';
import PaymentsPopupModal from '../../../components/PaymentsPopupModal';

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

  const handlePaymentComplete = async (payments: any[], totalPaid: number) => {
    try {
      if (onPaymentComplete) {
        await onPaymentComplete({ payments, totalPaid });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error('Payment processing error:', error);
      throw error; // This will be caught by the modal and show error toast
    }
  };

  return (
    <>
      <GlassButton
        onClick={() => setIsModalOpen(true)}
        variant={variant}
        size={size}
        className={className}
      >
        <DollarSign className="w-4 h-4 mr-1" />
        Pay Repair
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
