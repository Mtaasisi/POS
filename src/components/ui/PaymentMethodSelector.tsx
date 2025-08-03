import React, { useState, useEffect } from 'react';
import { usePaymentMethods } from '../../hooks/usePaymentMethods';
import { PaymentMethod } from '../../lib/paymentMethodService';

interface PaymentMethodSelectorProps {
  value?: string;
  onChange: (paymentMethodId: string) => void;
  type?: 'pos' | 'finance' | 'all';
  showIcons?: boolean;
  showDescriptions?: boolean;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  value,
  onChange,
  type = 'all',
  showIcons = true,
  showDescriptions = false,
  className = '',
  placeholder = 'Select payment method',
  disabled = false,
  required = false
}) => {
  const { paymentMethods, loading, getPOSPaymentMethods, getFinancePaymentMethods } = usePaymentMethods();
  const [filteredMethods, setFilteredMethods] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    const loadPaymentMethods = async () => {
      let methods: PaymentMethod[] = [];
      
      switch (type) {
        case 'pos':
          methods = await getPOSPaymentMethods();
          break;
        case 'finance':
          methods = await getFinancePaymentMethods();
          break;
        default:
          methods = paymentMethods;
          break;
      }
      
      setFilteredMethods(methods);
    };

    loadPaymentMethods();
  }, [type, paymentMethods, getPOSPaymentMethods, getFinancePaymentMethods]);

  const getIconForMethod = (method: PaymentMethod) => {
    const iconMap: Record<string, string> = {
      'dollar-sign': '💰',
      'credit-card': '💳',
      'building': '🏦',
      'smartphone': '📱',
      'file-text': '📄',
      'calendar': '📅',
      'truck': '🚚',
      'package': '📦',
      'globe': '🌐',
      'zap': '⚡'
    };
    
    return iconMap[method.icon] || '💳';
  };

  const getColorForMethod = (method: PaymentMethod) => {
    return method.color || '#3B82F6';
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-10 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className={className}>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value="">{placeholder}</option>
        {filteredMethods.map((method) => (
          <option key={method.id} value={method.id}>
            {showIcons && getIconForMethod(method)} {method.name}
            {showDescriptions && method.description && ` - ${method.description}`}
          </option>
        ))}
      </select>
    </div>
  );
};

// Card-based payment method selector
interface PaymentMethodCardSelectorProps {
  value?: string;
  onChange: (paymentMethodId: string) => void;
  type?: 'pos' | 'finance' | 'all';
  showDescriptions?: boolean;
  className?: string;
  disabled?: boolean;
}

export const PaymentMethodCardSelector: React.FC<PaymentMethodCardSelectorProps> = ({
  value,
  onChange,
  type = 'all',
  showDescriptions = true,
  className = '',
  disabled = false
}) => {
  const { paymentMethods, loading, getPOSPaymentMethods, getFinancePaymentMethods } = usePaymentMethods();
  const [filteredMethods, setFilteredMethods] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    const loadPaymentMethods = async () => {
      let methods: PaymentMethod[] = [];
      
      switch (type) {
        case 'pos':
          methods = await getPOSPaymentMethods();
          break;
        case 'finance':
          methods = await getFinancePaymentMethods();
          break;
        default:
          methods = paymentMethods;
          break;
      }
      
      setFilteredMethods(methods);
    };

    loadPaymentMethods();
  }, [type, paymentMethods, getPOSPaymentMethods, getFinancePaymentMethods]);

  const getIconForMethod = (method: PaymentMethod) => {
    const iconMap: Record<string, string> = {
      'dollar-sign': '💰',
      'credit-card': '💳',
      'building': '🏦',
      'smartphone': '📱',
      'file-text': '📄',
      'calendar': '📅',
      'truck': '🚚',
      'package': '📦',
      'globe': '🌐',
      'zap': '⚡'
    };
    
    return iconMap[method.icon] || '💳';
  };

  const getColorForMethod = (method: PaymentMethod) => {
    return method.color || '#3B82F6';
  };

  if (loading) {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 ${className}`}>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-20 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 ${className}`}>
      {filteredMethods.map((method) => (
        <button
          key={method.id}
          type="button"
          onClick={() => !disabled && onChange(method.id)}
          disabled={disabled}
          className={`
            p-4 rounded-lg border-2 transition-all duration-200 text-left
            ${value === method.id 
              ? 'border-blue-500 bg-blue-50 shadow-md' 
              : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          style={{
            borderColor: value === method.id ? getColorForMethod(method) : undefined,
            backgroundColor: value === method.id ? `${getColorForMethod(method)}10` : undefined
          }}
        >
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{getIconForMethod(method)}</div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 truncate">{method.name}</div>
              {showDescriptions && method.description && (
                <div className="text-sm text-gray-500 truncate">{method.description}</div>
              )}
            </div>
            {value === method.id && (
              <div 
                className="w-4 h-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: getColorForMethod(method) }}
              >
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
};

// Payment method display component
interface PaymentMethodDisplayProps {
  paymentMethodId?: string;
  showIcon?: boolean;
  showDescription?: boolean;
  className?: string;
}

export const PaymentMethodDisplay: React.FC<PaymentMethodDisplayProps> = ({
  paymentMethodId,
  showIcon = true,
  showDescription = false,
  className = ''
}) => {
  const { getPaymentMethodById } = usePaymentMethods();
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadMethod = async () => {
      if (!paymentMethodId) {
        setMethod(null);
        return;
      }

      setLoading(true);
      const paymentMethod = await getPaymentMethodById(paymentMethodId);
      setMethod(paymentMethod);
      setLoading(false);
    };

    loadMethod();
  }, [paymentMethodId, getPaymentMethodById]);

  const getIconForMethod = (method: PaymentMethod) => {
    const iconMap: Record<string, string> = {
      'dollar-sign': '💰',
      'credit-card': '💳',
      'building': '🏦',
      'smartphone': '📱',
      'file-text': '📄',
      'calendar': '📅',
      'truck': '🚚',
      'package': '📦',
      'globe': '🌐',
      'zap': '⚡'
    };
    
    return iconMap[method.icon] || '💳';
  };

  if (loading) {
    return <div className={`animate-pulse h-6 bg-gray-200 rounded ${className}`}></div>;
  }

  if (!method) {
    return <span className={`text-gray-500 ${className}`}>No payment method</span>;
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {showIcon && (
        <span className="text-lg">{getIconForMethod(method)}</span>
      )}
      <div>
        <div className="font-medium">{method.name}</div>
        {showDescription && method.description && (
          <div className="text-sm text-gray-500">{method.description}</div>
        )}
      </div>
    </div>
  );
}; 