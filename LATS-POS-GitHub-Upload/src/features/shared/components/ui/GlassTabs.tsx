import React, { useState } from 'react';
import { cn } from '../../../../lib/utils';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

interface GlassTabsProps {
  tabs: Tab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

const GlassTabs: React.FC<GlassTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  variant = 'default',
  size = 'md',
  className,
  children
}) => {
  const [internalActiveTab, setInternalActiveTab] = useState(activeTab || tabs[0]?.id);

  const currentActiveTab = activeTab || internalActiveTab;

  const handleTabClick = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId);
    } else {
      setInternalActiveTab(tabId);
    }
  };

  const tabClasses = cn(
    'flex transition-all duration-200',
    {
      'border-b border-gray-200': variant === 'default',
      'bg-gray-100 rounded-lg p-1': variant === 'pills',
      'border-b-2 border-gray-200': variant === 'underline',
    },
    className
  );

  const getTabButtonClasses = (isActive: boolean, isDisabled: boolean) => cn(
    'flex items-center gap-2 font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-blue-500/50',
    {
      // Sizes
      'px-3 py-2 text-sm': size === 'sm',
      'px-4 py-3 text-base': size === 'md',
      'px-6 py-4 text-lg': size === 'lg',
      
      // Variants
      'border-b-2': variant === 'default' || variant === 'underline',
      'rounded-md': variant === 'pills',
      
      // States
      'opacity-50 cursor-not-allowed': isDisabled,
      'cursor-pointer hover:bg-gray-50': !isDisabled,
      
      // Active states by variant
      'border-blue-500 text-blue-600 bg-blue-50': isActive && variant === 'default',
      'bg-white text-gray-900 shadow-sm': isActive && variant === 'pills',
      'border-blue-500 text-blue-600': isActive && variant === 'underline',
      
      // Inactive states
      'border-transparent text-gray-600': !isActive && (variant === 'default' || variant === 'underline'),
      'text-gray-600': !isActive && variant === 'pills',
    }
  );

  return (
    <div className="w-full">
      <div className={tabClasses}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && handleTabClick(tab.id)}
            className={getTabButtonClasses(currentActiveTab === tab.id, tab.disabled)}
            disabled={tab.disabled}
          >
            {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      
      {children && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </div>
  );
};

export default GlassTabs;
