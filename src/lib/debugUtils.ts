// Debug utilities for tracking initialization and reducing console spam

interface DebugConfig {
  enabled: boolean;
  logLevel: 'none' | 'error' | 'warn' | 'info' | 'debug';
}

class DebugManager {
  private static instance: DebugManager;
  private config: DebugConfig;
  private initializedComponents: Set<string> = new Set();

  private constructor() {
    this.config = {
      enabled: process.env.NODE_ENV === 'development',
      logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'error'
    };
  }

  static getInstance(): DebugManager {
    if (!DebugManager.instance) {
      DebugManager.instance = new DebugManager();
    }
    return DebugManager.instance;
  }

  log(level: 'error' | 'warn' | 'info' | 'debug', component: string, message: string, ...args: any[]) {
    if (!this.config.enabled) return;

    const levels = { none: 0, error: 1, warn: 2, info: 3, debug: 4 };
    const currentLevel = levels[this.config.logLevel];
    const messageLevel = levels[level];

    if (messageLevel <= currentLevel) {
      const prefix = `[${component.toUpperCase()}]`;
      switch (level) {
        case 'error':
          console.error(prefix, message, ...args);
          break;
        case 'warn':

          break;
        case 'info':

          break;
        case 'debug':

          break;
      }
    }
  }

  trackInitialization(component: string): boolean {
    if (this.initializedComponents.has(component)) {
      this.log('warn', component, 'Already initialized, skipping...');
      return false;
    }
    
    this.initializedComponents.add(component);
    this.log('info', component, 'Initializing...');
    return true;
  }

  resetInitialization(component?: string) {
    if (component) {
      this.initializedComponents.delete(component);
      this.log('info', component, 'Reset initialization state');
    } else {
      this.initializedComponents.clear();
      this.log('info', 'DEBUG', 'Reset all initialization states');
    }
  }

  getInitializedComponents(): string[] {
    return Array.from(this.initializedComponents);
  }
}

export const debug = DebugManager.getInstance();

// Convenience functions
export const logError = (component: string, message: string, ...args: any[]) => 
  debug.log('error', component, message, ...args);

export const logWarn = (component: string, message: string, ...args: any[]) => 
  debug.log('warn', component, message, ...args);

export const logInfo = (component: string, message: string, ...args: any[]) => 
  debug.log('info', component, message, ...args);

export const logDebug = (component: string, message: string, ...args: any[]) => 
  debug.log('debug', component, message, ...args);

export const trackInit = (component: string) => debug.trackInitialization(component);
