import React, { useState } from 'react';
import { DollarSign, Wrench } from 'lucide-react';
import GlassButton from '../../shared/components/ui/GlassButton';
import RepairPaymentModal from '../../customers/components/RepairPaymentModal';

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

  const handlePaymentComplete = (paymentData: any) => {
    if (onPaymentComplete) {
      onPaymentComplete(paymentData);
    }
    setIsModalOpen(false);
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

      <RepairPaymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customerId={customerId}
        customerName={customerName}
        deviceId={deviceId}
        deviceName={deviceName}
        repairAmount={repairAmount}
        onPaymentComplete={handlePaymentComplete}
      />
    </>
  );
};

export default RepairPaymentButton;
