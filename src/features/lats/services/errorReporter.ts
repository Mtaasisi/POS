// Enhanced error reporting for connection issues
export class ErrorReporter {
  private static errorLog: Array<{
    timestamp: Date;
    error: string;
    operation: string;
    retryCount: number;
    resolved: boolean;
  }> = [];

  static logError(error: string, operation: string, retryCount: number = 0) {
    this.errorLog.push({
      timestamp: new Date(),
      error,
      operation,
      retryCount,
      resolved: false
    });

    // Keep only last 100 errors
    if (this.errorLog.length > 100) {
      this.errorLog = this.errorLog.slice(-100);
    }

    console.error(`❌ [ErrorReporter] ${operation}:`, error, `(Retry: ${retryCount})`);
  }

  static markResolved(operation: string) {
    const recentErrors = this.errorLog.filter(
      log => log.operation === operation && !log.resolved
    );
    
    recentErrors.forEach(log => {
      log.resolved = true;
    });

    console.log(`✅ [ErrorReporter] ${operation} resolved`);
  }

  static getErrorSummary() {
    const totalErrors = this.errorLog.length;
    const unresolvedErrors = this.errorLog.filter(log => !log.resolved).length;
    const recentErrors = this.errorLog.filter(
      log => Date.now() - log.timestamp.getTime() < 300000 // Last 5 minutes
    ).length;

    return {
      totalErrors,
      unresolvedErrors,
      recentErrors,
      errorRate: recentErrors / 5, // Errors per minute
      isHealthy: recentErrors < 5 // Less than 5 errors in 5 minutes
    };
  }

  static getRecentErrors(limit: number = 10) {
    return this.errorLog
      .slice(-limit)
      .reverse()
      .map(log => ({
        ...log,
        timestamp: log.timestamp.toISOString()
      }));
  }

  static clearLogs() {
    this.errorLog = [];
    console.log('🧹 [ErrorReporter] Error logs cleared');
  }
}
