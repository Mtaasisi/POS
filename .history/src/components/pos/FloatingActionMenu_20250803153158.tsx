import React, { useState } from 'react';
import { 
  DollarSign, 
  CreditCard, 
  Save, 
  Receipt, 
  RotateCcw,
  Plus,
  User,
  Package,
  Settings
} from 'lucide-react';

interface FloatingActionMenuProps {
  onCashPayment: () => void;
  onCardPayment: () => void;
  onHoldOrder: () => void;
  onPrintReceipt: () => void;
  onClearCart: () => void;
  onAddCustomer: () => void;
  onQuickSale: () => void;
  onOpenSettings: () => void;
  cartItemCount: number;
  isVisible: boolean;
}

const FloatingActionMenu: React.FC<FloatingActionMenuProps> = ({
  onCashPayment,
  onCardPayment,
  onHoldOrder,
  onPrintReceipt,
  onClearCart,
  onAddCustomer,
  onQuickSale,
  onOpenSettings,
  cartItemCount,
  isVisible
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const actions = [
    {
      icon: DollarSign,
      label: 'Cash',
      action: onCashPayment,
      color: 'bg-green-500 hover:bg-green-600',
      disabled: cartItemCount === 0
    },
    {
      icon: CreditCard,
      label: 'Card',
      action: onCardPayment,
      color: 'bg-blue-500 hover:bg-blue-600',
      disabled: cartItemCount === 0
    },
    {
      icon: Save,
      label: 'Hold',
      action: onHoldOrder,
      color: 'bg-amber-500 hover:bg-amber-600',
      disabled: cartItemCount === 0
    },
    {
      icon: Receipt,
      label: 'Print',
      action: onPrintReceipt,
      color: 'bg-purple-500 hover:bg-purple-600',
      disabled: cartItemCount === 0
    },
    {
      icon: RotateCcw,
      label: 'Clear',
      action: onClearCart,
      color: 'bg-red-500 hover:bg-red-600',
      disabled: cartItemCount === 0
    },
    {
      icon: User,
      label: 'Customer',
      action: onAddCustomer,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      disabled: false
    },
    {
      icon: Package,
      label: 'Quick Sale',
      action: onQuickSale,
      color: 'bg-teal-500 hover:bg-teal-600',
      disabled: false
    },
    {
      icon: Settings,
      label: 'Settings',
      action: onOpenSettings,
      color: 'bg-gray-500 hover:bg-gray-600',
      disabled: false
    }
  ];

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 right-6 z-40">
      {/* Main Floating Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center"
      >
        <Plus size={24} className={`transition-transform duration-300 ${isExpanded ? 'rotate-45' : ''}`} />
      </button>

      {/* Action Buttons */}
      {isExpanded && (
        <div className="absolute bottom-20 right-0 space-y-3">
          {actions.map((action, index) => (
            <button
              key={action.label}
              onClick={() => {
                action.action();
                setIsExpanded(false);
              }}
              disabled={action.disabled}
              className={`
                w-14 h-14 ${action.color} text-white rounded-full shadow-lg hover:shadow-xl 
                transition-all duration-300 transform hover:scale-110 flex items-center justify-center
                ${action.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'}
                animate-in slide-in-from-bottom-${index + 1} duration-300
              `}
              style={{
                animationDelay: `${index * 50}ms`
              }}
            >
              <action.icon size={20} />
            </button>
          ))}
        </div>
      )}

      {/* Tooltip for main button */}
      {!isExpanded && (
        <div className="absolute bottom-20 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Quick Actions
        </div>
      )}
    </div>
  );
};

export default FloatingActionMenu; 