// CurrencySelector component - For selecting currencies in purchase orders
import React, { useState } from 'react';
import { ChevronDown, TrendingUp } from 'lucide-react';
import { Currency } from '../../lib/purchaseOrderUtils';

interface CurrencySelectorProps {
  selectedCurrency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  currencies: Currency[];
  className?: string;
}

const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  selectedCurrency,
  onCurrencyChange,
  currencies,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleCurrencySelect = (currency: Currency) => {
    onCurrencyChange(currency);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Currency Selector Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{selectedCurrency.flag}</span>
          <span className="font-medium">{selectedCurrency.code}</span>
          <span className="text-sm text-gray-600 hidden sm:inline">
            {selectedCurrency.symbol}
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Currency Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Menu */}
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-20 max-h-80 overflow-y-auto">
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide px-3 py-2 border-b border-gray-100">
                Select Currency
              </div>
              {currencies.map((currency) => (
                <button
                  key={currency.code}
                  onClick={() => handleCurrencySelect(currency)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left hover:bg-gray-50 transition-colors ${
                    selectedCurrency.code === currency.code 
                      ? 'bg-orange-50 text-orange-700 ring-1 ring-orange-200' 
                      : 'text-gray-700'
                  }`}
                >
                  <span className="text-lg">{currency.flag}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{currency.code}</span>
                      <span className="text-sm text-gray-500">{currency.symbol}</span>
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {currency.name}
                    </div>
                  </div>
                  {selectedCurrency.code === currency.code && (
                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>
            
            {/* Exchange Rate Notice */}
            <div className="border-t border-gray-100 p-3 bg-gray-50">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <TrendingUp className="w-3 h-3" />
                <span>Exchange rates are updated automatically</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CurrencySelector;
