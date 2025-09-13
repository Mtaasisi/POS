// Universal Form Components for Settings
import React from 'react';

// Toggle Switch Component
interface ToggleSwitchProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  id,
  label,
  description,
  checked,
  onChange,
  disabled = false
}) => {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="font-medium text-gray-900">{label}</div>
        {description && <div className="text-sm text-gray-600">{description}</div>}
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}></div>
      </label>
    </div>
  );
};

// Number Input Component
interface NumberInputProps {
  id: string;
  label: string;
  description?: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  disabled?: boolean;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  id,
  label,
  description,
  value,
  onChange,
  min,
  max,
  step = 1,
  placeholder,
  disabled = false
}) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        type="number"
        id={id}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
    </div>
  );
};

// Text Input Component
interface TextInputProps {
  id: string;
  label: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  multiline?: boolean;
  rows?: number;
}

export const TextInput: React.FC<TextInputProps> = ({
  id,
  label,
  description,
  value,
  onChange,
  placeholder,
  disabled = false,
  multiline = false,
  rows = 3
}) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
        />
      ) : (
        <input
          type="text"
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      )}
      {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
    </div>
  );
};

// Select Component
interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  id: string;
  label: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  multiple?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  id,
  label,
  description,
  value,
  onChange,
  options,
  disabled = false,
  multiple = false
}) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        multiple={multiple}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
    </div>
  );
};

// Time Input Component
interface TimeInputProps {
  id: string;
  label: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const TimeInput: React.FC<TimeInputProps> = ({
  id,
  label,
  description,
  value,
  onChange,
  disabled = false
}) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        type="time"
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
    </div>
  );
};

// Settings Section Component
interface SettingsSectionProps {
  title: string;
  description?: string;
  icon: React.ReactNode;
  colorClass?: string;
  children: React.ReactNode;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  description,
  icon,
  colorClass = "bg-white border-gray-200",
  children
}) => {
  return (
    <div className={`p-6 rounded-xl border ${colorClass}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="p-1 rounded">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          {description && <p className="text-sm text-gray-600">{description}</p>}
        </div>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};
