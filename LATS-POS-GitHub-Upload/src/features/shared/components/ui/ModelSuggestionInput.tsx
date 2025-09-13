import React, { useState, useRef, useEffect } from 'react';
import { Layers } from 'lucide-react';
import deviceModels from '../../../../data/deviceModels';

interface ModelSuggestionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  modelLogos?: Record<string, string>; // Optional mapping of model name to logo URL
  brand?: string; // Optional brand filter
}

const startsWithAllTerms = (str: string, terms: string[]): boolean =>
  terms.every(term => str.split(/[^a-z0-9]+/).some((word: string) => word.startsWith(term)));

const ModelSuggestionInput: React.FC<ModelSuggestionInputProps> = ({
  value,
  onChange,
  placeholder = 'Enter model or model number',
  required = false,
  className = '',
  modelLogos,
  brand,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }
    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  // Filter and sort models
  let filteredModels = deviceModels;
  if (brand) {
    const brandLower = brand.toLowerCase();
    filteredModels = filteredModels.filter(model => {
      // Apple: match iPhone, iPad, MacBook
      if (brandLower === 'apple') {
        return (
          model.toLowerCase().startsWith('iphone') ||
          model.toLowerCase().startsWith('ipad') ||
          model.toLowerCase().startsWith('macbook')
        );
      }
      // Samsung: match Samsung
      if (brandLower === 'samsung') {
        return model.toLowerCase().startsWith('samsung');
      }
      // Google: match Google
      if (brandLower === 'google') {
        return model.toLowerCase().startsWith('google');
      }
      // Microsoft: match Surface
      if (brandLower === 'microsoft') {
        return model.toLowerCase().startsWith('surface');
      }
      // HP: match HP
      if (brandLower === 'hp') {
        return model.toLowerCase().startsWith('hp');
      }
      // Fallback: substring match
      return model.toLowerCase().includes(brandLower);
    });
  }
  filteredModels = filteredModels
    .filter(model => {
      if (!value) return true;
      const terms = value.toLowerCase().split(/\s+/).filter(Boolean);
      const modelLower = model.toLowerCase();
      return terms.every(term => modelLower.includes(term));
    })
    .sort((a, b) => {
      if (!value) return 0;
      const terms = value.toLowerCase().split(/\s+/).filter(Boolean);
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      const aStarts = startsWithAllTerms(aLower, terms);
      const bStarts = startsWithAllTerms(bLower, terms);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return 0;
    });

  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={e => {
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg pl-12 bg-white/30 backdrop-blur-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        ref={inputRef}
      />
      <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
      {showSuggestions && (
        <div ref={dropdownRef} className="absolute z-[9999] w-full mt-1 bg-white/95 backdrop-blur-md border border-gray-300 rounded-md shadow-xl max-h-60 overflow-y-auto">
          {filteredModels.map((model, idx) => (
            <button
              key={`${model}-${idx}`}
              type="button"
              className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none flex items-center gap-2"
              onClick={() => {
                onChange(model);
                setShowSuggestions(false);
              }}
            >
              {modelLogos && modelLogos[model] ? (
                <img
                  src={modelLogos[model]}
                  alt={model}
                  className="w-6 h-6 object-contain"
                />
              ) : (
                <Layers size={18} className="text-blue-500 flex-shrink-0" />
              )}
              <span>{model}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModelSuggestionInput; 