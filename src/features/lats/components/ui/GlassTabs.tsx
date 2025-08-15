// GlassTabs component for LATS module
import React, { useState, useEffect } from 'react';
import { LATS_CLASSES } from '../../tokens';

interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  badge?: string | number;
  content: React.ReactNode;
}

interface GlassTabsProps {
  tabs: TabItem[];
  defaultActiveTab?: string;
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline' | 'cards';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  vertical?: boolean;
  className?: string;
  tabClassName?: string;
  contentClassName?: string;
}

const GlassTabs: React.FC<GlassTabsProps> = ({
  tabs,
  defaultActiveTab,
  activeTab: controlledActiveTab,
  onTabChange,
  variant = 'default',
  size = 'md',
  fullWidth = false,
  vertical = false,
  className = '',
  tabClassName = '',
  contentClassName = ''
}) => {
  const [activeTab, setActiveTab] = useState<string>(
    controlledActiveTab || defaultActiveTab || tabs[0]?.id || ''
  );

  // Update active tab when controlled prop changes
  useEffect(() => {
    if (controlledActiveTab !== undefined) {
      setActiveTab(controlledActiveTab);
    }
  }, [controlledActiveTab]);

  // Handle tab change
  const handleTabChange = (tabId: string) => {
    if (controlledActiveTab === undefined) {
      setActiveTab(tabId);
    }
    onTabChange?.(tabId);
  };

  // Get active tab content
  const activeTabContent = tabs.find(tab => tab.id === activeTab)?.content;

  // Base container classes
  const containerClasses = [
    vertical ? 'flex' : 'block',
    className
  ].filter(Boolean).join(' ');

  // Tab list classes
  const tabListClasses = [
    vertical ? 'flex-col space-y-1' : 'flex space-x-1',
    fullWidth && !vertical ? 'w-full' : '',
    'border-b border-lats-glass-border',
    variant === 'underline' ? 'border-b-2' : variant === 'cards' ? 'border-b-0' : '',
    tabClassName
  ].filter(Boolean).join(' ');

  // Tab button classes
  const getTabButtonClasses = (tab: TabItem) => {
    const isActive = tab.id === activeTab;
    const isDisabled = tab.disabled;

    const baseClasses = [
      'flex items-center justify-center',
      'font-medium transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-lats-primary/50',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      fullWidth && !vertical ? 'flex-1' : ''
    ];

    const sizeClasses = {
      sm: ['px-3 py-2 text-sm', 'min-h-8'],
      md: ['px-4 py-2.5 text-sm', 'min-h-10'],
      lg: ['px-6 py-3 text-base', 'min-h-12']
    };

    const variantClasses = {
      default: [
        'border-b-2 border-transparent',
        isActive ? 'border-lats-primary text-lats-primary' : 'text-lats-text-secondary hover:text-lats-text',
        'hover:border-lats-primary/50'
      ],
      pills: [
        'rounded-lats-radius-md border border-transparent',
        isActive 
          ? 'bg-lats-primary text-white border-lats-primary' 
          : 'text-lats-text-secondary hover:text-lats-text hover:bg-lats-surface-hover'
      ],
      underline: [
        'border-b-2 border-transparent',
        isActive ? 'border-lats-primary text-lats-primary' : 'text-lats-text-secondary hover:text-lats-text',
        'hover:border-lats-primary/50'
      ],
      cards: [
        'rounded-lats-radius-md border border-lats-glass-border',
        isActive 
          ? 'bg-lats-surface text-lats-text border-lats-primary' 
          : 'text-lats-text-secondary hover:text-lats-text hover:bg-lats-surface-hover'
      ]
    };

    return [
      ...baseClasses,
      ...sizeClasses[size],
      ...variantClasses[variant],
      isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'
    ].filter(Boolean).join(' ');
  };

  // Content classes
  const contentClasses = [
    vertical ? 'flex-1 ml-4' : 'mt-4',
    contentClassName
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {/* Tab list */}
      <div className={tabListClasses} role="tablist" aria-orientation={vertical ? 'vertical' : 'horizontal'}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={getTabButtonClasses(tab)}
            onClick={() => !tab.disabled && handleTabChange(tab.id)}
            disabled={tab.disabled}
            role="tab"
            aria-selected={tab.id === activeTab}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
          >
            {/* Icon */}
            {tab.icon && (
              <span className={`mr-2 ${size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'}`}>
                {tab.icon}
              </span>
            )}

            {/* Label */}
            <span className="flex-shrink-0">
              {tab.label}
            </span>

            {/* Badge */}
            {tab.badge && (
              <span className={`ml-2 px-1.5 py-0.5 text-xs rounded-full ${
                tab.id === activeTab 
                  ? 'bg-white/20 text-white' 
                  : 'bg-lats-surface text-lats-text-secondary'
              }`}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div
        className={contentClasses}
        role="tabpanel"
        id={`panel-${activeTab}`}
        aria-labelledby={`tab-${activeTab}`}
      >
        {activeTabContent}
      </div>
    </div>
  );
};

// Export with display name for debugging
GlassTabs.displayName = 'GlassTabs';

export default GlassTabs;
