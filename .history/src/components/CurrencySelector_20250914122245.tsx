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
        className={`w-full flex items-center justify-between bg-white border-2 border-gray-200 rounded-2xl text-gray-900 hover:border-orange-300 hover:bg-orange-50 focus:outline-none focus:ring-4 focus:ring-orange-100 focus:border-orange-400 transition-all duration-300 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5'
        } ${sizeClasses[size]}`}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-md">
              <span className="text-sm">{selectedCurrency.flag}</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
          </div>
          <div className="text-left">
            <div className="font-bold text-sm text-gray-900">{selectedCurrency.code}</div>
            <div className="text-xs text-gray-500">{selectedCurrency.symbol}</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-1 h-1 bg-orange-400 rounded-full"></div>
          <div className="w-1 h-1 bg-orange-400 rounded-full"></div>
          <div className="w-1 h-1 bg-orange-400 rounded-full"></div>
          <ChevronDown className={`${iconSizes[size]} text-orange-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
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
