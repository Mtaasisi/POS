import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Currency, SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } from '../lib/currencyUtils';

interface CurrencySelectorProps {
  selectedCurrency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  currencies?: Currency[];
  className?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  selectedCurrency,
  onCurrencyChange,
  currencies = SUPPORTED_CURRENCIES,
  className = '',
  disabled = false,
  size = 'md'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleCurrencySelect = (currency: Currency) => {
    onCurrencyChange(currency);
    setIsOpen(false);
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2 py-1.5 text-sm',
    lg: 'px-3 py-2 text-base'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div className={`relative ${className}`}>
      {/* Currency Selector Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl text-gray-800 hover:from-gray-100 hover:to-gray-200 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-300 transition-all duration-200 shadow-sm hover:shadow-md ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${sizeClasses[size]}`}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center">
            <span className="text-xs">{selectedCurrency.flag}</span>
          </div>
          <span className="font-semibold text-sm text-gray-800">{selectedCurrency.code}</span>
        </div>
        <ChevronDown className={`${iconSizes[size]} text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Currency Dropdown */}
      {isOpen && !disabled && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
            <div className="p-1">
              {currencies.map((currency) => (
                <button
                  key={currency.code}
                  onClick={() => handleCurrencySelect(currency)}
                  className={`w-full flex items-center gap-2 px-2 py-2 rounded text-left hover:bg-gray-50 transition-colors text-sm ${
                    selectedCurrency.code === currency.code 
                      ? 'bg-orange-50 text-orange-700' 
                      : 'text-gray-700'
                  }`}
                >
                  <span className="text-sm">{currency.flag}</span>
                  <span className="font-medium">{currency.code}</span>
                  <span className="text-xs text-gray-500 ml-auto">{currency.symbol}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CurrencySelector;
