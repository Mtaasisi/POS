import React, { useState } from 'react';
import { Smartphone, Loader2 } from 'lucide-react';
import { GlassButton } from '../../ui';
import ZenoPayPaymentModal from './ZenoPayPaymentModal';
import { CartItem, Sale } from '../../types/pos';

interface ZenoPayPaymentButtonProps {
  cartItems: CartItem[];
  total: number;
  customer?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  onPaymentComplete: (sale: Sale) => void;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}

const ZenoPayPaymentButton: React.FC<ZenoPayPaymentButtonProps> = ({
  cartItems,
  total,
  customer,
  onPaymentComplete,
  disabled = false,
  className = '',
  size = 'md',
  variant = 'primary'
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if customer has required information for mobile money payment
  const isCustomerValid = customer && customer.email && customer.phone;
  const isDisabled = disabled || !isCustomerValid || cartItems.length === 0;

  const handleClick = () => {
    if (!isCustomerValid) {
      alert('Customer email and phone number are required for mobile money payment');
      return;
    }
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handlePaymentComplete = (sale: Sale) => {
    onPaymentComplete(sale);
    setIsModalOpen(false);
  };

  return (
    <>
      <GlassButton
        onClick={handleClick}
        disabled={isDisabled}
        className={`flex items-center gap-2 ${className}`}
        size={size}
        variant={variant}
        title={!isCustomerValid ? 'Customer email and phone required' : 'Pay with Mobile Money'}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Smartphone className="w-4 h-4" />
        )}
        <span>Mobile Money</span>
      </GlassButton>

      <ZenoPayPaymentModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onPaymentComplete={handlePaymentComplete}
        cartItems={cartItems}
        total={total}
        customer={customer}
      />
    </>
  );
};

export default ZenoPayPaymentButton;

