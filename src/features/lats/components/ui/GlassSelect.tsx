// GlassSelect component for LATS module
import React, { forwardRef, useState, useRef, useEffect } from 'react';
import { LATS_CLASSES } from '../../tokens';

interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  description?: string;
}

interface GlassSelectProps {
  options: SelectOption[];
  value?: string | number;
  defaultValue?: string | number;
  placeholder?: string;
  label?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  loading?: boolean;
  required?: boolean;
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  name?: string;
  id?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outline';
  leftIcon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
  maxHeight?: string;
  onChange?: (value: string | number | (string | number)[], option: SelectOption | SelectOption[]) => void;
  onFocus?: (event: React.FocusEvent<HTMLDivElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLDivElement>) => void;
  onSearch?: (query: string) => void;
}

const GlassSelect = forwardRef<HTMLDivElement, GlassSelectProps>(({
  options,
  value,
  defaultValue,
  placeholder = 'Select an option...',
  label,
  helperText,
  error,
  disabled = false,
  loading = false,
  required = false,
  multiple = false,
  searchable = false,
  clearable = false,
  name,
  id,
  size = 'md',
  variant = 'default',
  leftIcon,
  fullWidth = false,
  className = '',
  maxHeight = '200px',
  onChange,
  onFocus,
  onBlur,
  onSearch
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedValue, setSelectedValue] = useState<string | number | (string | number)[]>(
    value || defaultValue || (multiple ? [] : '')
  );
  const selectRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Update selected value when prop changes
  useEffect(() => {
    if (value !== undefined) {
      setSelectedValue(value);
    }
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  // Base classes
  const baseClasses = [
    'transition-all duration-200',
    'focus:outline-none focus:ring-2',
    'disabled:opacity-50 disabled:cursor-not-allowed'
  ];

  // Variant classes
  const variantClasses = {
    default: [
      'bg-lats-surface border border-lats-glass-border',
      'focus:border-lats-primary focus:ring-lats-primary/50',
      'hover:border-lats-glass-border/50'
    ],
    filled: [
      'bg-lats-surface/80 border border-lats-glass-border/50',
      'focus:border-lats-primary focus:ring-lats-primary/50',
      'hover:bg-lats-surface'
    ],
    outline: [
      'bg-transparent border border-lats-glass-border',
      'focus:border-lats-primary focus:ring-lats-primary/50',
      'hover:border-lats-glass-border/70'
    ]
  };

  // Size classes
  const sizeClasses = {
    sm: ['px-3 py-1.5 text-sm', 'min-h-8'],
    md: ['px-4 py-2 text-sm', 'min-h-10'],
    lg: ['px-4 py-3 text-base', 'min-h-12']
  };

  // Border radius classes
  const roundedClasses = 'rounded-lats-radius-md';

  // Width classes
  const widthClasses = fullWidth ? 'w-full' : '';

  // Error classes
  const errorClasses = error ? [
    'border-lats-error focus:border-lats-error focus:ring-lats-error/50'
  ] : [];

  // Icon spacing classes
  const hasLeftIcon = leftIcon ? 'pl-10' : '';

  // Combine select classes
  const selectClasses = [
    ...baseClasses,
    ...variantClasses[variant],
    ...sizeClasses[size],
    roundedClasses,
    widthClasses,
    ...errorClasses,
    hasLeftIcon,
    'text-lats-text cursor-pointer',
    'flex items-center justify-between',
    className
  ].filter(Boolean).join(' ');

  // Filter options based on search query
  const filteredOptions = searchable && searchQuery
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  // Get selected option(s)
  const getSelectedOptions = () => {
    if (multiple) {
      const selectedValues = selectedValue as (string | number)[];
      return options.filter(option => selectedValues.includes(option.value));
    } else {
      const selectedValueSingle = selectedValue as string | number;
      return options.filter(option => option.value === selectedValueSingle);
    }
  };

  // Get display text
  const getDisplayText = () => {
    const selectedOptions = getSelectedOptions();
    
    if (selectedOptions.length === 0) {
      return placeholder;
    }
    
    if (multiple) {
      if (selectedOptions.length === 1) {
        return selectedOptions[0].label;
      }
      return `${selectedOptions.length} items selected`;
    }
    
    return selectedOptions[0].label;
  };

  // Handle option selection
  const handleOptionSelect = (option: SelectOption) => {
    if (option.disabled) return;

    let newValue: string | number | (string | number)[];
    
    if (multiple) {
      const currentValues = selectedValue as (string | number)[];
      const isSelected = currentValues.includes(option.value);
      
      if (isSelected) {
        newValue = currentValues.filter(v => v !== option.value);
      } else {
        newValue = [...currentValues, option.value];
      }
    } else {
      newValue = option.value;
      setIsOpen(false);
      setSearchQuery('');
    }

    setSelectedValue(newValue);
    
    if (onChange) {
      if (multiple) {
        const selectedOptions = options.filter(opt => (newValue as (string | number)[]).includes(opt.value));
        onChange(newValue, selectedOptions);
      } else {
        onChange(newValue, option);
      }
    }
  };

  // Handle clear selection
  const handleClear = (event: React.MouseEvent) => {
    event.stopPropagation();
    const newValue = multiple ? [] : '';
    setSelectedValue(newValue);
    
    if (onChange) {
      onChange(newValue, multiple ? [] : {} as SelectOption);
    }
  };

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value;
    setSearchQuery(query);
    
    if (onSearch) {
      onSearch(query);
    }
  };

  // Generate unique ID if not provided
  const selectId = id || name || `lats-select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`${fullWidth ? 'w-full' : ''} space-y-1`}>
      {/* Label */}
      {label && (
        <label
          htmlFor={selectId}
          className={`block text-sm font-medium text-lats-text ${
            error ? 'text-lats-error' : ''
          }`}
        >
          {label}
          {required && <span className="text-lats-error ml-1">*</span>}
        </label>
      )}

      {/* Select container */}
      <div className="relative" ref={selectRef}>
        {/* Left icon */}
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-lats-text-secondary pointer-events-none z-10">
            <div className={`${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'}`}>
              {leftIcon}
            </div>
          </div>
        )}

        {/* Loading spinner */}
        {loading && (
          <div className="absolute right-10 top-1/2 transform -translate-y-1/2">
            <div className={`animate-spin rounded-full border-b-2 border-lats-primary ${
              size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'
            }`} />
          </div>
        )}

        {/* Select button */}
        <div
          ref={ref}
          className={selectClasses}
          onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
          onFocus={onFocus}
          onBlur={onBlur}
          role="combobox"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-labelledby={label ? selectId : undefined}
          tabIndex={disabled ? -1 : 0}
        >
          <span className={`flex-1 text-left ${!getSelectedOptions().length ? 'text-lats-text-secondary' : ''}`}>
            {getDisplayText()}
          </span>

          {/* Clear button */}
          {clearable && getSelectedOptions().length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="ml-2 p-1 hover:bg-lats-surface-hover rounded-lats-radius-sm transition-colors"
              aria-label="Clear selection"
            >
              <svg className="w-4 h-4 text-lats-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Dropdown arrow */}
          <svg
            className={`ml-2 w-4 h-4 text-lats-text-secondary transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Dropdown menu */}
        {isOpen && (
          <div
            className={`absolute top-full left-0 right-0 mt-1 bg-lats-surface border border-lats-glass-border rounded-lats-radius-md shadow-lats-glass-shadow z-50 max-h-60 overflow-auto`}
            style={{ maxHeight }}
          >
            {/* Search input */}
            {searchable && (
              <div className="p-2 border-b border-lats-glass-border">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder="Search options..."
                  className="w-full px-3 py-1.5 text-sm bg-lats-surface/50 border border-lats-glass-border rounded-lats-radius-sm text-lats-text placeholder-lats-text-secondary focus:outline-none focus:ring-2 focus:ring-lats-primary/50 focus:border-lats-primary"
                />
              </div>
            )}

            {/* Options list */}
            <div role="listbox">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-2 text-sm text-lats-text-secondary">
                  {searchQuery ? 'No options found' : 'No options available'}
                </div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = multiple
                    ? (selectedValue as (string | number)[]).includes(option.value)
                    : selectedValue === option.value;

                  return (
                    <div
                      key={option.value}
                      className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-lats-primary text-white'
                          : option.disabled
                          ? 'text-lats-text-secondary cursor-not-allowed'
                          : 'text-lats-text hover:bg-lats-surface-hover'
                      }`}
                      onClick={() => handleOptionSelect(option)}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <div className="flex items-center gap-2">
                        {option.icon && (
                          <span className="flex-shrink-0">{option.icon}</span>
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{option.label}</div>
                          {option.description && (
                            <div className={`text-xs ${
                              isSelected ? 'text-white/70' : 'text-lats-text-secondary'
                            }`}>
                              {option.description}
                            </div>
                          )}
                        </div>
                        {isSelected && (
                          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Helper text */}
      {helperText && !error && (
        <p className="text-xs text-lats-text-secondary">
          {helperText}
        </p>
      )}

      {/* Error message */}
      {error && (
        <p className="text-xs text-lats-error">
          {error}
        </p>
      )}
    </div>
  );
});

// Export with display name for debugging
GlassSelect.displayName = 'GlassSelect';

export default GlassSelect;
