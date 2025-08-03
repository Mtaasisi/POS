import React, { useState } from 'react';
import TouchOptimizedButton from '../ui/TouchOptimizedButton';
import {
  Plus,
  Users,
  Calculator,
  DollarSign,
  Package,
  Search,
  Settings,
  Receipt
} from 'lucide-react';

interface FloatingActionButtonsProps {
  onAddProduct: () => void;
  onSelectCustomer: () => void;
  onPayment: () => void;
  onSearch: () => void;
  onSettings: () => void;
  onReceipt: () => void;
  onQuickSale: () => void;
}

const FloatingActionButtons: React.FC<FloatingActionButtonsProps> = ({
  onAddProduct,
  onSelectCustomer,
  onPayment,
  onSearch,
  onSettings,
  onReceipt,
  onQuickSale
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="fixed bottom-8 right-8 z-50">
      {/* Main Action Button */}
      <div className="mb-6">
        <TouchOptimizedButton
          onClick={onQuickSale}
          variant="primary"
          size="xl"
          icon={Receipt}
          className="w-24 h-24 rounded-full shadow-2xl"
        >
          Sale
        </TouchOptimizedButton>
      </div>

      {/* Expandable Action Buttons */}
      <div className={`space-y-4 transition-all duration-300 ${isExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <TouchOptimizedButton
          onClick={onAddProduct}
          variant="success"
          size="lg"
          icon={Plus}
          className="w-20 h-20 rounded-full shadow-xl"
        >
          Add
        </TouchOptimizedButton>

        <TouchOptimizedButton
          onClick={onSelectCustomer}
          variant="secondary"
          size="lg"
          icon={Users}
          className="w-20 h-20 rounded-full shadow-xl"
        >
          Customer
        </TouchOptimizedButton>

        <TouchOptimizedButton
          onClick={onPayment}
          variant="primary"
          size="lg"
          icon={DollarSign}
          className="w-20 h-20 rounded-full shadow-xl"
        >
          Pay
        </TouchOptimizedButton>

        <TouchOptimizedButton
          onClick={onSearch}
          variant="secondary"
          size="lg"
          icon={Search}
          className="w-20 h-20 rounded-full shadow-xl"
        >
          Search
        </TouchOptimizedButton>

        <TouchOptimizedButton
          onClick={onSettings}
          variant="secondary"
          size="lg"
          icon={Settings}
          className="w-20 h-20 rounded-full shadow-xl"
        >
          Settings
        </TouchOptimizedButton>
      </div>

      {/* Toggle Button */}
      <TouchOptimizedButton
        onClick={toggleExpanded}
        variant="secondary"
        size="lg"
        icon={Calculator}
        className="w-20 h-20 rounded-full shadow-xl mt-4"
      >
        {isExpanded ? 'Close' : 'More'}
      </TouchOptimizedButton>
    </div>
  );
};

export default FloatingActionButtons; 