// Debug utilities to control console logging
class DebugUtils {
  private static isVerboseLogging = import.meta.env.DEV && localStorage.getItem('verbose_logging') === 'true';
  private static logCounts: Record<string, number> = {};
  private static lastLogTime: Record<string, number> = {};

  /**
   * Log only in development mode and respect verbose logging setting
   */
  static log(message: string, ...args: any[]) {
    if (import.meta.env.DEV) {
      console.log(message, ...args);
    }
  }

  /**
   * Log with throttling to prevent spam
   */
  static throttledLog(key: string, message: string, throttleMs: number = 1000, ...args: any[]) {
    if (!import.meta.env.DEV) return;

    const now = Date.now();
    const lastTime = this.lastLogTime[key] || 0;
    
    if (now - lastTime > throttleMs) {
      console.log(message, ...args);
      this.lastLogTime[key] = now;
      this.logCounts[key] = (this.logCounts[key] || 0) + 1;
    }
  }

  /**
   * Log only if verbose logging is enabled
   */
  static verboseLog(message: string, ...args: any[]) {
    if (this.isVerboseLogging) {
      console.log(message, ...args);
    }
  }

  /**
   * Enable/disable verbose logging
   */
  static setVerboseLogging(enabled: boolean) {
    this.isVerboseLogging = enabled;
    if (enabled) {
      localStorage.setItem('verbose_logging', 'true');
    } else {
      localStorage.removeItem('verbose_logging');
    }
  }

  /**
   * Get log counts for debugging
   */
  static getLogCounts() {
    return { ...this.logCounts };
  }

  /**
   * Clear log counts
   */
  static clearLogCounts() {
    this.logCounts = {};
    this.lastLogTime = {};
  }
}

export default DebugUtils;
