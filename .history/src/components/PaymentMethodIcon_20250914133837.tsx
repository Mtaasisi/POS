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
  customIcon?: string; // Support for custom image URLs or paths
}

const PaymentMethodIcon: React.FC<PaymentMethodIconProps> = ({
  type,
  name,
  size = 'md',
  className = '',
  customIcon
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
      if (nameLower.includes('mpesa')) return '/icons/payment-methods/mpesa-google.png';
      if (nameLower.includes('airtel')) return '/icons/payment-methods/airtel-money.svg';
      return '/icons/payment-methods/mpesa-google.png'; // default mobile money
    }
    if (typeLower === 'bank' || typeLower === 'bank_transfer') {
      if (nameLower.includes('crdb')) return '/icons/payment-methods/crdb-bank.png';
      return '/icons/payment-methods/crdb-bank.png';
    }

    // Name-based matches
    if (nameLower.includes('mpesa')) return '/icons/payment-methods/mpesa-google.png';
    if (nameLower.includes('visa')) return '/icons/payment-methods/visa.svg';
    if (nameLower.includes('mastercard') || nameLower.includes('master')) return '/icons/payment-methods/mastercard.svg';
    if (nameLower.includes('airtel')) return '/icons/payment-methods/airtel-money.svg';
    if (nameLower.includes('crdb')) return '/icons/payment-methods/crdb-bank.webp';
    if (nameLower.includes('bank') && nameLower.includes('transfer')) return '/icons/payment-methods/crdb-bank.webp';
    if (nameLower.includes('bank')) return '/icons/payment-methods/crdb-bank.webp';
    if (nameLower.includes('cash')) return '/icons/payment-methods/cash-new.svg';

    return null;
  };

  // Check if we have a custom icon (image URL or path)
  const iconPath = customIcon || getIconPath(type, name);

  // Helper function to determine if it's an emoji
  const isEmoji = (str: string) => {
    return /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(str);
  };

  // If we have an icon path (SVG, image URL, or emoji), render it
  if (iconPath) {
    // Handle emoji icons
    if (isEmoji(iconPath)) {
      return (
        <span className={`${sizeClasses[size]} ${className} flex items-center justify-center text-lg`}>
          {iconPath}
        </span>
      );
    }

    // Handle image URLs and SVG paths
    return (
      <img
        src={iconPath}
        alt={`${name || type} payment method`}
        className={className || sizeClasses[size]}
        style={{ objectFit: 'contain' }}
        onError={(e) => {
          // Fallback to default icon if image fails to load
          console.warn(`Failed to load payment icon: ${iconPath}`);
          e.currentTarget.style.display = 'none';
        }}
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
