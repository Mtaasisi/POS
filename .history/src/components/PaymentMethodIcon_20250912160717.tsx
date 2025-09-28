import React from 'react';
import { 
  DollarSign, 
  CreditCard, 
  Smartphone, 
  Building, 
  CheckCircle,
  XCircle 
} from 'lucide-react';

interface PaymentMethodIconProps {
  type: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const PaymentMethodIcon: React.FC<PaymentMethodIconProps> = ({
  type,
  name,
  size = 'md',
  className = ''
}) => {
  // Icon size mapping
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  // Payment method icon mapping
  const getIconPath = (methodType: string, methodName?: string) => {
    const typeLower = methodType.toLowerCase();
    const nameLower = methodName?.toLowerCase() || '';

    // Direct type matches
    if (typeLower === 'cash') return '/icons/payment-methods/cash-new.svg';
    if (typeLower === 'credit_card' || typeLower === 'card') return '/icons/payment-methods/visa.svg';
    if (typeLower === 'mobile_money') {
      if (nameLower.includes('mpesa')) return '/icons/payment-methods/mpesa.svg';
      if (nameLower.includes('airtel')) return '/icons/payment-methods/airtel-money.svg';
      return '/icons/payment-methods/mpesa.svg'; // default mobile money
    }
    if (typeLower === 'bank' || typeLower === 'bank_transfer') return '/icons/payment-methods/bank-transfer.svg';

    // Name-based matches
    if (nameLower.includes('mpesa')) return '/icons/payment-methods/mpesa.svg';
    if (nameLower.includes('visa')) return '/icons/payment-methods/visa.svg';
    if (nameLower.includes('mastercard') || nameLower.includes('master')) return '/icons/payment-methods/mastercard.svg';
    if (nameLower.includes('airtel')) return '/icons/payment-methods/airtel-money.svg';
    if (nameLower.includes('bank') && nameLower.includes('transfer')) return '/icons/payment-methods/bank-transfer.svg';
    if (nameLower.includes('cash')) return '/icons/payment-methods/cash.svg';

    return null;
  };

  const iconPath = getIconPath(type, name);

  // If we have an SVG icon path, render it
  if (iconPath) {
    return (
      <img
        src={iconPath}
        alt={`${name || type} payment method`}
        className={`${sizeClasses[size]} ${className}`}
        style={{ objectFit: 'contain' }}
      />
    );
  }

  // Fallback to Lucide icons
  const getFallbackIcon = () => {
    const typeLower = type.toLowerCase();
    
    switch (typeLower) {
      case 'cash':
        return <DollarSign className={`${sizeClasses[size]} ${className}`} />;
      case 'credit_card':
      case 'card':
        return <CreditCard className={`${sizeClasses[size]} ${className}`} />;
      case 'mobile_money':
        return <Smartphone className={`${sizeClasses[size]} ${className}`} />;
      case 'bank':
      case 'bank_transfer':
        return <Building className={`${sizeClasses[size]} ${className}`} />;
      default:
        return <DollarSign className={`${sizeClasses[size]} ${className}`} />;
    }
  };

  return getFallbackIcon();
};

export default PaymentMethodIcon;
