// Configuration for automatic data loading on login
export interface AutoLoadConfig {
  enabled: boolean;
  dataSources: {
    inventory: {
      enabled: boolean;
      priority: number; // 1 = highest priority
      description: string;
    };
    customers: {
      enabled: boolean;
      priority: number;
      description: string;
    };
    devices: {
      enabled: boolean;
      priority: number;
      description: string;
    };
    settings: {
      enabled: boolean;
      priority: number;
      description: string;
    };
    payments: {
      enabled: boolean;
      priority: number;
      description: string;
    };
    communications: {
      enabled: boolean;
      priority: number;
      description: string;
    };
    analytics: {
      enabled: boolean;
      priority: number;
      description: string;
    };
    reports: {
      enabled: boolean;
      priority: number;
      description: string;
    };
  };
  options: {
    delayBeforeStart: number; // milliseconds
    showProgressIndicator: boolean;
    showToastNotification: boolean;
    retryOnFailure: boolean;
    maxRetries: number;
    cacheResults: boolean;
  };
}

// Default configuration
export const defaultAutoLoadConfig: AutoLoadConfig = {
  enabled: true,
  dataSources: {
    inventory: {
      enabled: true,
      priority: 1,
      description: "Products, categories, suppliers"
    },
    customers: {
      enabled: true,
      priority: 2,
      description: "Customer profiles, loyalty data, tags"
    },
    devices: {
      enabled: true,
      priority: 3,
      description: "Device inventory, repair history"
    },
    settings: {
      enabled: true,
      priority: 4,
      description: "User preferences, POS settings"
    },
    payments: {
      enabled: false, // Disabled by default to avoid performance issues
      priority: 5,
      description: "Payment methods, transaction history"
    },
    communications: {
      enabled: false, // Disabled by default
      priority: 6,
      description: "WhatsApp templates, SMS templates"
    },
    analytics: {
      enabled: false, // Disabled by default
      priority: 7,
      description: "Sales analytics, performance metrics"
    },
    reports: {
      enabled: false, // Disabled by default
      priority: 8,
      description: "Generated reports, exports"
    }
  },
  options: {
    delayBeforeStart: 500,
    showProgressIndicator: true,
    showToastNotification: true,
    retryOnFailure: true,
    maxRetries: 3,
    cacheResults: true
  }
};

// Get enabled data sources sorted by priority
export const getEnabledDataSources = (config: AutoLoadConfig = defaultAutoLoadConfig) => {
  return Object.entries(config.dataSources)
    .filter(([_, source]) => source.enabled)
    .sort(([_, a], [__, b]) => a.priority - b.priority)
    .map(([key, source]) => ({ key, ...source }));
};

// Validate configuration
export const validateAutoLoadConfig = (config: AutoLoadConfig): boolean => {
  if (!config.enabled) return true;
  
  const enabledSources = getEnabledDataSources(config);
  if (enabledSources.length === 0) {
    console.warn('⚠️ No data sources enabled for auto-loading');
    return false;
  }
  
  return true;
};
