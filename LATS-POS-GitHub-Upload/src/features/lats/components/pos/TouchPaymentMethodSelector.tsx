import React from 'react';
import { CheckCircle } from 'lucide-react';
import PaymentMethodIcon from '../../../components/PaymentMethodIcon';

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  type?: string;
  description: string;
}

interface TouchPaymentMethodSelectorProps {
  methods: PaymentMethod[];
  selectedMethod: PaymentMethod | null;
  onSelectMethod: (method: PaymentMethod) => void;
  className?: string;
}

const TouchPaymentMethodSelector: React.FC<TouchPaymentMethodSelectorProps> = ({
  methods,
  selectedMethod,
  onSelectMethod,
  className = ''
}) => {
  return (
    <div className={`grid grid-cols-2 gap-4 ${className}`}>
      {methods.map((method) => (
        <div
          key={method.id}
          onClick={() => onSelectMethod(method)}
          className={`touch-card p-5 border-2 rounded-xl cursor-pointer transition-all duration-200 transform hover:scale-105 ${
            selectedMethod?.id === method.id
              ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100 shadow-xl ring-4 ring-green-200/50'
              : 'border-gray-200 bg-white hover:border-gray-400 hover:shadow-lg'
          }`}
          style={{ minHeight: '90px' }}
        >
          <div className="flex items-center space-x-4">
            {/* Payment Icon */}
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <PaymentMethodIcon 
                type={method.type || method.name.toLowerCase().replace(/\s+/g, '_')} 
                name={method.name} 
                size="lg" 
              />
            </div>
            
            {/* Payment Info */}
            <div className="flex-1 min-w-0">
              <div className={`font-bold text-lg ${selectedMethod?.id === method.id ? 'text-green-900' : 'text-gray-900'}`}>{method.name}</div>
              <div className={`text-sm mt-1 ${selectedMethod?.id === method.id ? 'text-green-700' : 'text-gray-600'}`}>{method.description}</div>
            </div>
            
            {/* Selection Indicator */}
            {selectedMethod?.id === method.id && (
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TouchPaymentMethodSelector;
