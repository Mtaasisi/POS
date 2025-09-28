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
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-20 max-h-64 overflow-y-auto backdrop-blur-sm">
            <div className="p-2">
              {currencies.map((currency) => (
                <button
                  key={currency.code}
                  onClick={() => handleCurrencySelect(currency)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 transition-all duration-200 text-sm group ${
                    selectedCurrency.code === currency.code 
                      ? 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 shadow-sm' 
                      : 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:shadow-md transition-shadow">
                    <span className="text-xs">{currency.flag}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{currency.code}</span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {currency.symbol}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {currency.name}
                    </div>
                  </div>
                  {selectedCurrency.code === currency.code && (
                    <div className="w-2 h-2 bg-orange-500 rounded-full shadow-sm" />
                  )}
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
