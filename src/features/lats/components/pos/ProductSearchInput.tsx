// ProductSearchInput component for LATS module
import React, { useState, useRef, useEffect } from 'react';
import { LATS_CLASSES } from '../../tokens';
import GlassInput from '../ui/GlassInput';
import GlassButton from '../ui/GlassButton';
import GlassBadge from '../ui/GlassBadge';
import { t } from '../../lib/i18n/t';
import { barcodeScanner } from '../../lib/barcode';

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  stockQuantity: number;
  categoryName?: string;
  brandName?: string;
  images?: string[];
  isActive: boolean;
}

interface ProductSearchInputProps {
  onSearch: (query: string) => void;
  onBarcodeScan?: (barcode: string) => void;
  onProductSelect?: (product: Product) => void;
  placeholder?: string;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  showBarcodeButton?: boolean;
  autoFocus?: boolean;
}

const ProductSearchInput: React.FC<ProductSearchInputProps> = ({
  onSearch,
  onBarcodeScan,
  onProductSelect,
  placeholder = 'Search products by name, SKU, or barcode...',
  loading = false,
  disabled = false,
  className = '',
  showBarcodeButton = true,
  autoFocus = false
}) => {
  const [query, setQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Handle input change with debouncing
  const handleInputChange = (value: string) => {
    setQuery(value);
    setScanError(null);

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      if (value.trim()) {
        onSearch(value.trim());
      }
    }, 300);
  };

  // Handle barcode scanning
  const handleBarcodeScan = async () => {
    if (!onBarcodeScan) return;

    setIsScanning(true);
    setScanError(null);

    try {
      // Check if barcode scanning is supported
      if (!barcodeScanner.isBarcodeSupported()) {
        throw new Error('Barcode scanning is not supported in this browser');
      }

      // Initialize scanner
      const initialized = await barcodeScanner.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize barcode scanner');
      }

      // Start scanning
      await barcodeScanner.startScanning(
        (result) => {
          setIsScanning(false);
          if (result.valid) {
            onBarcodeScan(result.text);
            setQuery(result.text);
            // Trigger search with barcode
            onSearch(result.text);
          } else {
            setScanError('Invalid barcode format');
          }
        },
        (error) => {
          setIsScanning(false);
          setScanError(error);
        }
      );
    } catch (error) {
      setIsScanning(false);
      setScanError(error instanceof Error ? error.message : 'Barcode scanning failed');
    }
  };

  // Stop scanning
  const stopScanning = () => {
    barcodeScanner.stopScanning();
    setIsScanning(false);
    setScanError(null);
  };

  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (query.trim()) {
        onSearch(query.trim());
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setQuery('');
      if (isScanning) {
        stopScanning();
      }
    }
  };

  // Handle clear
  const handleClear = () => {
    setQuery('');
    setScanError(null);
    if (isScanning) {
      stopScanning();
    }
    inputRef.current?.focus();
  };

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (isScanning) {
        stopScanning();
      }
    };
  }, [isScanning]);

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <GlassInput
          ref={inputRef}
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isScanning}
          loading={loading}
          className="pr-20"
          icon={
            <svg className="w-5 h-5 text-lats-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
        />

        {/* Action Buttons */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {/* Clear Button */}
          {query && !isScanning && (
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={handleClear}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              }
              className="w-8 h-8 p-0"
            />
          )}

          {/* Barcode Scan Button */}
          {showBarcodeButton && onBarcodeScan && (
            <GlassButton
              variant={isScanning ? "error" : "ghost"}
              size="sm"
              onClick={isScanning ? stopScanning : handleBarcodeScan}
              loading={isScanning}
              disabled={disabled}
              icon={
                isScanning ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V6a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1zm12 0h2a1 1 0 001-1V6a1 1 0 00-1-1h-2a1 1 0 00-1 1v1a1 1 0 001 1zM5 20h2a1 1 0 001-1v-1a1 1 0 00-1-1H5a1 1 0 00-1 1v1a1 1 0 001 1z" />
                  </svg>
                )
              }
              className="w-8 h-8 p-0"
              title={isScanning ? 'Stop scanning' : 'Scan barcode'}
            />
          )}

          {/* Search Button */}
          <GlassButton
            variant="primary"
            size="sm"
            onClick={() => query.trim() && onSearch(query.trim())}
            disabled={disabled || !query.trim() || isScanning}
            loading={loading}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
            className="w-8 h-8 p-0"
          />
        </div>
      </div>

      {/* Status Indicators */}
      <div className="flex items-center gap-2 mt-2">
        {/* Scanning Status */}
        {isScanning && (
          <GlassBadge variant="info" size="sm">
            <svg className="w-3 h-3 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Scanning...
          </GlassBadge>
        )}

        {/* Error Status */}
        {scanError && (
          <GlassBadge variant="error" size="sm">
            {scanError}
          </GlassBadge>
        )}

        {/* Loading Status */}
        {loading && !isScanning && (
          <GlassBadge variant="info" size="sm">
            Searching...
          </GlassBadge>
        )}

        {/* Query Length Indicator */}
        {query && !loading && !isScanning && (
          <GlassBadge variant="ghost" size="sm">
            {query.length} characters
          </GlassBadge>
        )}
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="text-xs text-lats-text-secondary mt-2">
        <span className="mr-4">Press <kbd className="px-1 py-0.5 bg-lats-surface/50 rounded text-xs">Enter</kbd> to search</span>
        <span>Press <kbd className="px-1 py-0.5 bg-lats-surface/50 rounded text-xs">Esc</kbd> to clear</span>
      </div>
    </div>
  );
};

// Export with display name for debugging
ProductSearchInput.displayName = 'ProductSearchInput';

export default ProductSearchInput;
