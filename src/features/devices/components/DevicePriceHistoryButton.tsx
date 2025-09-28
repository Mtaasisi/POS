import React, { useState } from 'react';
import { History, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import GlassButton from '../../../shared/components/ui/GlassButton';
import DevicePriceHistoryModal from './DevicePriceHistoryModal';

interface DevicePriceHistoryButtonProps {
  deviceId: string;
  deviceName: string;
  currentPrice: number;
  previousPrice?: number;
  className?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const DevicePriceHistoryButton: React.FC<DevicePriceHistoryButtonProps> = ({
  deviceId,
  deviceName,
  currentPrice,
  previousPrice,
  className = '',
  variant = 'secondary',
  size = 'sm'
}) => {
  const [showModal, setShowModal] = useState(false);

  const getPriceChangeIcon = () => {
    if (!previousPrice) return <History className="w-4 h-4" />;
    
    const change = currentPrice - previousPrice;
    if (change > 0) return <TrendingUp className="w-4 h-4 text-red-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-green-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getPriceChangeText = () => {
    if (!previousPrice) return 'Price History';
    
    const change = currentPrice - previousPrice;
    const percentage = previousPrice > 0 ? ((change / previousPrice) * 100) : 0;
    
    if (change > 0) return `+${change.toLocaleString()} TZS (+${percentage.toFixed(1)}%)`;
    if (change < 0) return `${change.toLocaleString()} TZS (${percentage.toFixed(1)}%)`;
    return 'No change';
  };

  return (
    <>
      <GlassButton
        onClick={() => setShowModal(true)}
        variant={variant}
        size={size}
        className={`flex items-center gap-2 ${className}`}
      >
        {getPriceChangeIcon()}
        <span className="hidden sm:inline">{getPriceChangeText()}</span>
        <span className="sm:hidden">History</span>
      </GlassButton>

      <DevicePriceHistoryModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        deviceId={deviceId}
        deviceName={deviceName}
        currentPrice={currentPrice}
      />
    </>
  );
};

export default DevicePriceHistoryButton;
