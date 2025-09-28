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
    sm: 'px-2 py-1 text-sm',
    md: 'px-3 py-2',
    lg: 'px-4 py-3 text-lg'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className={`relative ${className}`}>
      {/* Currency Selector Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between border border-gray-300 rounded-lg bg-white text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${sizeClasses[size]}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{selectedCurrency.flag}</span>
          <span className="font-medium">{selectedCurrency.code}</span>
          <span className="text-sm text-gray-600 hidden sm:inline">
            {selectedCurrency.symbol}
          </span>
        </div>
        <ChevronDown className={`${iconSizes[size]} text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-20 max-h-80 overflow-y-auto">
            <div className="p-3">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide px-2 py-2 border-b border-gray-100 mb-3">
                Select Currency
              </div>
              <div className="grid grid-cols-2 gap-2">
                {currencies.map((currency) => (
                  <button
                    key={currency.code}
                    onClick={() => handleCurrencySelect(currency)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left hover:bg-gray-50 transition-colors ${
                      selectedCurrency.code === currency.code 
                        ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-200' 
                        : 'text-gray-700'
                    }`}
                  >
                    <span className="text-lg">{currency.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="font-medium text-sm">{currency.code}</span>
                        <span className="text-xs text-gray-500">{currency.symbol}</span>
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {currency.name}
                      </div>
                    </div>
                    {selectedCurrency.code === currency.code && (
                      <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CurrencySelector;
