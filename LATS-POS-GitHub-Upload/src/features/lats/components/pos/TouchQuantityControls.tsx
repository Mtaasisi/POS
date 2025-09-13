import React from 'react';
import { Plus, Minus } from 'lucide-react';

interface TouchQuantityControlsProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  maxQuantity?: number;
  minQuantity?: number;
  disabled?: boolean;
  className?: string;
}

const TouchQuantityControls: React.FC<TouchQuantityControlsProps> = ({
  quantity,
  onQuantityChange,
  maxQuantity = 999,
  minQuantity = 1,
  disabled = false,
  className = ''
}) => {
  const handleIncrease = () => {
    if (!disabled && quantity < maxQuantity) {
      onQuantityChange(quantity + 1);
    }
  };

  const handleDecrease = () => {
    if (!disabled && quantity > minQuantity) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || minQuantity;
    const clampedValue = Math.max(minQuantity, Math.min(maxQuantity, value));
    onQuantityChange(clampedValue);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Decrease Button */}
      <button
        onClick={handleDecrease}
        disabled={disabled || quantity <= minQuantity}
        className="touch-button bg-red-500 hover:bg-red-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg flex items-center justify-center"
        style={{ minWidth: '48px', minHeight: '48px' }}
        title="Decrease quantity"
      >
        <Minus className="w-5 h-5" />
      </button>

      {/* Quantity Input */}
      <input
        type="number"
        value={quantity}
        onChange={handleInputChange}
        min={minQuantity}
        max={maxQuantity}
        disabled={disabled}
        className="touch-input w-20 text-center font-semibold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
        style={{ minHeight: '48px' }}
      />

      {/* Increase Button */}
      <button
        onClick={handleIncrease}
        disabled={disabled || quantity >= maxQuantity}
        className="touch-button bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg flex items-center justify-center"
        style={{ minWidth: '48px', minHeight: '48px' }}
        title="Increase quantity"
      >
        <Plus className="w-5 h-5" />
      </button>
    </div>
  );
};

export default TouchQuantityControls;
