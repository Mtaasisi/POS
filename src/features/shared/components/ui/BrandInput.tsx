import React, { useState, useRef, useEffect } from 'react';
import { Store, ChevronDown } from 'lucide-react';
import { useBrands } from '../../../../context/BrandsContext';

interface BrandInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  category?: string;
  showSuggestions?: boolean;
  disabled?: boolean;
}

const BrandInput: React.FC<BrandInputProps> = ({
  value,
  onChange,
  placeholder = "Enter brand name",
  required = false,
  className = '',
  category,
  showSuggestions = true,
  disabled = false
}) => {
  const { brands, loading, searchBrandsByName } = useBrands();
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredBrands, setFilteredBrands] = useState<typeof brands>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter brands by category if specified
  const availableBrands = category 
    ? brands.filter(brand => brand.category?.includes(category))
    : brands;

  // Handle input change and search
  const handleInputChange = async (inputValue: string) => {
    onChange(inputValue);
    
    if (!showSuggestions) {
      return;
    }

    if (!inputValue.trim()) {
      setFilteredBrands(availableBrands);
      // Don't automatically show dropdown for empty input
      return;
    }

    setSearchLoading(true);
    try {
      const results = await searchBrandsByName(inputValue);
      // Filter by category if specified
      const filtered = category 
        ? results.filter(brand => brand.category?.includes(category))
        : results;
      setFilteredBrands(filtered);
      setShowDropdown(true);
    } catch (error) {
      console.error('Error searching brands:', error);
      // Fallback to local search
      const filtered = availableBrands.filter(brand =>
        brand.name.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredBrands(filtered);
      setShowDropdown(true);
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle brand selection
  const handleBrandSelect = (brandName: string) => {
    onChange(brandName);
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Initialize filtered brands when component mounts or brands change
  useEffect(() => {
    setFilteredBrands(availableBrands);
    // Don't automatically show dropdown - only show when user explicitly interacts
  }, [brands, category, showSuggestions, value]);

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            // Don't automatically show dropdown on focus
          }}
          onClick={() => {
            // Don't automatically show dropdown on click
          }}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg pl-12 bg-white/30 backdrop-blur-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
        />
        <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
        
        {searchLoading ? (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (showSuggestions) {
                setShowDropdown(!showDropdown);
              }
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <ChevronDown className="text-gray-400" size={16} />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-[9999] w-full mt-2 bg-white/95 backdrop-blur-md border-2 border-gray-300 rounded-lg shadow-xl max-h-80 overflow-y-auto"
        >
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600">Loading brands...</span>
            </div>
          ) : filteredBrands.length > 0 ? (
            <div className="p-3">
              {/* Grid Layout for Brands */}
              <div className="grid grid-cols-3 gap-3">
                {filteredBrands.map(brand => (
                  <button
                    key={brand.id}
                    type="button"
                    className="flex flex-col items-center gap-3 p-4 hover:bg-gray-100 rounded-lg transition-all duration-200 text-center hover:shadow-md"
                    onClick={() => handleBrandSelect(brand.name)}
                  >
                    {/* Brand Logo */}
                    <div className="w-16 h-16 flex items-center justify-center rounded-lg">
                      {brand.logo_url ? (
                        <img
                          src={brand.logo_url}
                          alt={brand.name}
                          className="w-14 h-14 object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`text-2xl font-bold text-gray-400 ${brand.logo_url ? 'hidden' : ''}`}>
                        {brand.name.charAt(0)}
                      </div>
                    </div>
                    
                    {/* Brand Name */}
                    <div className="w-full">
                      <div className="font-medium text-gray-900 text-sm truncate">{brand.name}</div>
                    </div>
                  </button>
                ))}
              </div>
              
              {/* Show total count */}
              <div className="text-xs text-gray-500 text-center mt-3 pt-2 border-t border-gray-200">
                {filteredBrands.length} brand{filteredBrands.length !== 1 ? 's' : ''} available
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              {value.trim() ? 'No brands found' : 'Click to see all brands'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BrandInput;
