import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Tag } from 'lucide-react';
import { getBrandSuggestions } from '../../lib/brandApi';

interface BrandInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  required?: boolean;
}

const BrandInput: React.FC<BrandInputProps> = ({
  value,
  onChange,
  placeholder = "e.g., Apple, Samsung",
  className = "",
  error,
  required = false
}) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Handle input change with debounced suggestions
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (inputValue.length >= 2) {
        setIsLoading(true);
        try {
          const brandSuggestions = await getBrandSuggestions(inputValue);
          setSuggestions(brandSuggestions);
          setShowSuggestions(brandSuggestions.length > 0);
        } catch (error) {
          console.error('Error fetching brand suggestions:', error);
          setSuggestions([]);
          setShowSuggestions(false);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [inputValue]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    onChange(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      // Focus first suggestion
      const firstSuggestion = suggestionsRef.current?.querySelector('button');
      if (firstSuggestion) {
        (firstSuggestion as HTMLButtonElement).focus();
      }
    }
  };

  const clearInput = () => {
    setInputValue('');
    onChange('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          className={`w-full py-3 pl-12 pr-10 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none transition-colors text-sm ${
            error 
              ? 'border-red-500 focus:border-red-600' 
              : 'border-gray-300 focus:border-blue-500'
          } ${className}`}
          placeholder={placeholder}
          required={required}
          autoComplete="off"
          spellCheck={false}
        />
        
        {/* Tag icon */}
        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
        
        {/* Clear button */}
        {inputValue && (
          <button
            type="button"
            onClick={clearInput}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Clear input"
          >
            <X size={14} className="text-gray-500" />
          </button>
        )}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0 transition-colors"
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  const nextButton = e.currentTarget.nextElementSibling as HTMLButtonElement;
                  if (nextButton) {
                    nextButton.focus();
                  }
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  const prevButton = e.currentTarget.previousElementSibling as HTMLButtonElement;
                  if (prevButton) {
                    prevButton.focus();
                  } else {
                    inputRef.current?.focus();
                  }
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSuggestionClick(suggestion);
                }
              }}
            >
              <div className="flex items-center gap-3">
                <Search size={14} className="text-gray-400" />
                <span className="text-sm text-gray-900">{suggestion}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
};

export default BrandInput;
