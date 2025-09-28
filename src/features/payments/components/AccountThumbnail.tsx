import React from 'react';
import { 
  CreditCard, Smartphone, Building, DollarSign, 
  Wallet, PiggyBank, Settings 
} from 'lucide-react';

interface AccountThumbnailProps {
  type: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const AccountThumbnail: React.FC<AccountThumbnailProps> = ({ 
  type, 
  size = 'md', 
  className = '' 
}) => {
  // Size configurations
  const sizeConfig = {
    sm: { container: 'w-8 h-8', icon: 16 },
    md: { container: 'w-12 h-12', icon: 24 },
    lg: { container: 'w-16 h-16', icon: 32 }
  };

  // Get account type styling and icon
  const getAccountThumbnail = (accountType: string) => {
    switch (accountType) {
      case 'cash':
        return {
          icon: <DollarSign size={sizeConfig[size].icon} />,
          bgColor: 'bg-gradient-to-br from-green-400 to-green-600',
          borderColor: 'border-green-200',
          shadowColor: 'shadow-green-200'
        };
      case 'bank':
        return {
          icon: <Building size={sizeConfig[size].icon} />,
          bgColor: 'bg-gradient-to-br from-blue-400 to-blue-600',
          borderColor: 'border-blue-200',
          shadowColor: 'shadow-blue-200'
        };
      case 'mobile_money':
        return {
          icon: <Smartphone size={sizeConfig[size].icon} />,
          bgColor: 'bg-gradient-to-br from-purple-400 to-purple-600',
          borderColor: 'border-purple-200',
          shadowColor: 'shadow-purple-200'
        };
      case 'credit_card':
        return {
          icon: <CreditCard size={sizeConfig[size].icon} />,
          bgColor: 'bg-gradient-to-br from-orange-400 to-orange-600',
          borderColor: 'border-orange-200',
          shadowColor: 'shadow-orange-200'
        };
      case 'savings':
        return {
          icon: <PiggyBank size={sizeConfig[size].icon} />,
          bgColor: 'bg-gradient-to-br from-indigo-400 to-indigo-600',
          borderColor: 'border-indigo-200',
          shadowColor: 'shadow-indigo-200'
        };
      case 'wallet':
        return {
          icon: <Wallet size={sizeConfig[size].icon} />,
          bgColor: 'bg-gradient-to-br from-teal-400 to-teal-600',
          borderColor: 'border-teal-200',
          shadowColor: 'shadow-teal-200'
        };
      default:
        return {
          icon: <Settings size={sizeConfig[size].icon} />,
          bgColor: 'bg-gradient-to-br from-gray-400 to-gray-600',
          borderColor: 'border-gray-200',
          shadowColor: 'shadow-gray-200'
        };
    }
  };

  const thumbnail = getAccountThumbnail(type);

  return (
    <div 
      className={`
        ${sizeConfig[size].container}
        ${thumbnail.bgColor}
        ${thumbnail.borderColor}
        ${thumbnail.shadowColor}
        rounded-xl
        border-2
        shadow-lg
        flex
        items-center
        justify-center
        text-white
        transition-all
        duration-200
        hover:scale-105
        hover:shadow-xl
        ${className}
      `}
    >
      {thumbnail.icon}
    </div>
  );
};

export default AccountThumbnail;
