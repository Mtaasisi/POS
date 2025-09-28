// Connection monitoring service for better visibility
export class ConnectionMonitor {
  private static connectionStatus: 'connected' | 'disconnected' | 'unstable' = 'connected';
  private static retryCount = 0;
  private static lastSuccessfulConnection = Date.now();

  static getConnectionStatus() {
    return this.connectionStatus;
  }

  static getRetryCount() {
    return this.retryCount;
  }

  static getLastSuccessfulConnection() {
    return this.lastSuccessfulConnection;
  }

  static updateConnectionStatus(status: 'connected' | 'disconnected' | 'unstable') {
    this.connectionStatus = status;
    if (status === 'connected') {
      this.lastSuccessfulConnection = Date.now();
      this.retryCount = 0;
    }
  }

  static incrementRetryCount() {
    this.retryCount++;
  }

  static getConnectionHealth() {
    const timeSinceLastSuccess = Date.now() - this.lastSuccessfulConnection;
    const isHealthy = timeSinceLastSuccess < 30000; // 30 seconds
    
    return {
      status: this.connectionStatus,
      retryCount: this.retryCount,
      isHealthy,
      timeSinceLastSuccess,
      lastSuccessfulConnection: new Date(this.lastSuccessfulConnection).toISOString()
    };
  }
}
