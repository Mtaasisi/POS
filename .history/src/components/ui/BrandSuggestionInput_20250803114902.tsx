import React, { useState, useRef, useEffect } from 'react';
import { Store } from 'lucide-react';
import { getActiveBrands, Brand } from '../../lib/brandApi';

interface BrandSuggestionInputProps {
  value: string;
  onChange: (value: string) => void;
  brands?: Array<{ name: string; logo: string }>;
  placeholder?: string;
  required?: boolean;
  className?: string;
  category?: string; // Optional category filter
}

const PLACEHOLDER_LOGO = '/logos/placeholder.svg';

const BrandSuggestionInput: React.FC<BrandSuggestionInputProps> = ({
  value,
  onChange,
  brands,
  placeholder,
  required
  className = '',
  category,
}) => {
  const [localBrands, setLocalBrands] = useState<Array<{ name: string; logo: string }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch brands from database
  const fetchBrands = async () => {
    try {
      setLoading(true);
      let brandsData: Brand[] = [];
      
      if (category) {
        // Import getBrandsByCategory dynamically to avoid circular dependency
        const { getBrandsByCategory } = await import('../../lib/brandApi');
        brandsData = await getBrandsByCategory(category);
      } else {
        brandsData = await getActiveBrands();
      }
      
      const formattedBrands = brandsData.map(brand => ({
        name: brand.name,
        logo: brand.logo_url || PLACEHOLDER_LOGO
      }));
      
      setLocalBrands(formattedBrands);
    } catch (error) {
      console.error('Error fetching brands:', error);
      // Fallback to default brands if API fails (sorted by popularity)
      setLocalBrands([
        { name: 'Apple', logo: '/logos/apple.svg' },
        { name: 'Samsung', logo: '/logos/samsung.svg' },
        { name: 'Google', logo: '/logos/google.svg' },
        { name: 'Microsoft', logo: '/logos/microsoft.svg' },
        { name: 'Lenovo', logo: '/logos/lenovo.svg' },
        { name: 'HP', logo: '/logos/hp.svg' },
        { name: 'Dell', logo: '/logos/dell.svg' },
        { name: 'Huawei', logo: '/logos/huawei.svg' },
        { name: 'Xiaomi', logo: '/logos/xiaomi.svg' },
        { name: 'OnePlus', logo: '/logos/oneplus.svg' },
        { name: 'Sony', logo: '/logos/sony.svg' },
        { name: 'LG', logo: '/logos/lg.svg' },
        { name: 'Motorola', logo: '/logos/motorola.svg' },
        { name: 'Nokia', logo: '/logos/nokia.svg' },
        { name: 'Tecno', logo: '/logos/tecno.svg' },
        { name: 'Infinix', logo: '/logos/infinix.svg' },
        { name: 'Itel', logo: '/logos/itel.svg' },
        { name: 'HTC', logo: '/logos/htc.svg' },
        { name: 'Asus', logo: '/logos/asus.svg' },
        { name: 'Acer', logo: '/logos/acer.svg' },
        { name: 'Canon', logo: '/logos/canon.svg' },
        { name: 'Epson', logo: '/logos/epson.svg' },
        { name: 'Brother', logo: '/logos/brother.svg' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!brands) {
      fetchBrands();
    } else {
      setLocalBrands(brands);
    }
  }, [brands, category]);

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

  // Filter brands
  const filteredBrands = localBrands.filter(brand =>
    !value ? true : brand.name.toLowerCase().includes(value.toLowerCase())
  );

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
      {/* Brand icon on the left inside the input */}
      <Store className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
      
      {showSuggestions && (
        <div
          ref={dropdownRef}
          className="absolute z-[9999] w-full mt-2 bg-white/95 backdrop-blur-md border-2 border-gray-300 rounded-lg shadow-xl max-h-80 overflow-y-auto grid grid-cols-3 gap-3 p-4"
        >
          {loading ? (
            <div className="col-span-3 flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredBrands.length > 0 ? (
            filteredBrands.map(brand => (
                          <button
              key={brand.name}
              type="button"
              className="flex flex-col items-center gap-2 p-3 hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-105"
              onClick={() => {
                onChange(brand.name);
                setShowSuggestions(false);
              }}
            >
              <img
                src={brand.logo || PLACEHOLDER_LOGO}
                alt={brand.name}
                className="w-12 h-12 object-contain"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = PLACEHOLDER_LOGO;
                }}
              />
              <span className="text-sm font-medium">{brand.name}</span>
            </button>
            ))
          ) : (
            <div className="col-span-3 text-center py-4 text-gray-500 text-sm">
              No brands found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BrandSuggestionInput; 