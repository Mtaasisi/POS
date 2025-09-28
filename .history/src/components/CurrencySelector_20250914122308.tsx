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
          <div className="absolute top-full left-0 right-0 mt-3 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-3xl shadow-2xl z-20 max-h-72 overflow-y-auto">
            <div className="p-3">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
                Select Currency
              </div>
              {currencies.map((currency, index) => (
                <button
                  key={currency.code}
                  onClick={() => handleCurrencySelect(currency)}
                  className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-left transition-all duration-300 group ${
                    selectedCurrency.code === currency.code 
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg transform scale-105' 
                      : 'text-gray-700 hover:bg-gray-50 hover:shadow-md hover:scale-102'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className={`relative ${selectedCurrency.code === currency.code ? 'animate-pulse' : ''}`}>
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 ${
                      selectedCurrency.code === currency.code 
                        ? 'bg-white/20 backdrop-blur-sm' 
                        : 'bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-orange-100 group-hover:to-orange-200'
                    }`}>
                      <span className="text-lg">{currency.flag}</span>
                    </div>
                    {selectedCurrency.code === currency.code && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-bounce"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`font-bold text-lg ${selectedCurrency.code === currency.code ? 'text-white' : 'text-gray-900'}`}>
                        {currency.code}
                      </span>
                      <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                        selectedCurrency.code === currency.code 
                          ? 'bg-white/20 text-white' 
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {currency.symbol}
                      </span>
                    </div>
                    <div className={`text-sm truncate ${
                      selectedCurrency.code === currency.code ? 'text-white/80' : 'text-gray-500'
                    }`}>
                      {currency.name}
                    </div>
                  </div>
                  {selectedCurrency.code === currency.code && (
                    <div className="w-6 h-6 bg-white/30 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
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
