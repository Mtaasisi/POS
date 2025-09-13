import { supabase } from '../lib/supabaseClient';

export interface SupabaseStatus {
  isConnected: boolean;
  lastCheck: Date;
  error?: string;
  statusCode?: number;
  retryCount: number;
}

class SupabaseStatusMonitor {
  private status: SupabaseStatus = {
    isConnected: false,
    lastCheck: new Date(),
    retryCount: 0
  };

  private checkInterval: NodeJS.Timeout | null = null;
  private subscribers: ((status: SupabaseStatus) => void)[] = [];

  /**
   * Test the Supabase connection
   */
  async testConnection(): Promise<SupabaseStatus> {
    try {
      console.log('🔍 Testing Supabase connection...');
      
      const { data, error, status } = await supabase
        .from('devices')
        .select('count')
        .limit(1)
        .single();

      if (error) {
        this.status = {
          isConnected: false,
          lastCheck: new Date(),
          error: error.message,
          statusCode: status,
          retryCount: this.status.retryCount + 1
        };
        
        console.error('❌ Supabase connection test failed:', error);
      } else {
        this.status = {
          isConnected: true,
          lastCheck: new Date(),
          retryCount: 0
        };
        
        console.log('✅ Supabase connection test successful');
      }
    } catch (error: any) {
      this.status = {
        isConnected: false,
        lastCheck: new Date(),
        error: error.message,
        retryCount: this.status.retryCount + 1
      };
      
      console.error('❌ Supabase connection test failed with exception:', error);
    }

    this.notifySubscribers();
    return this.status;
  }

  /**
   * Get current status
   */
  getStatus(): SupabaseStatus {
    return { ...this.status };
  }

  /**
   * Start monitoring connection status
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Initial check
    this.testConnection();

    // Set up periodic checks
    this.checkInterval = setInterval(() => {
      this.testConnection();
    }, intervalMs);

    console.log(`🔍 Started Supabase connection monitoring (${intervalMs}ms intervals)`);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('🛑 Stopped Supabase connection monitoring');
    }
  }

  /**
   * Subscribe to status changes
   */
  subscribe(callback: (status: SupabaseStatus) => void): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Notify all subscribers
   */
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback({ ...this.status });
      } catch (error) {
        console.error('Error in status subscriber:', error);
      }
    });
  }

  /**
   * Get helpful information about 503 errors
   */
  get503ErrorInfo(): string[] {
    return [
      '🔧 503 Service Unavailable Error',
      '',
      'This error indicates that your Supabase service is temporarily unavailable.',
      '',
      'Possible causes:',
      '• Supabase service maintenance',
      '• Database overload or high traffic',
      '• Service quota exceeded',
      '• Network connectivity issues',
      '• Regional service outage',
      '',
      'Recommended actions:',
      '• Wait a few minutes and try again',
      '• Check your internet connection',
      '• Verify your Supabase project status',
      '• Contact Supabase support if the issue persists',
      '',
      'The app will automatically retry failed requests with exponential backoff.'
    ];
  }

  /**
   * Check if we should show offline mode
   */
  shouldShowOfflineMode(): boolean {
    return !this.status.isConnected && this.status.retryCount >= 3;
  }

  /**
   * Get user-friendly status message
   */
  getStatusMessage(): string {
    if (this.status.isConnected) {
      return 'Database connection is healthy';
    }

    if (this.status.statusCode === 503) {
      return 'Database service is temporarily unavailable';
    }

    if (this.status.retryCount > 0) {
      return `Connection failed (${this.status.retryCount} attempts)`;
    }

    return 'Checking database connection...';
  }
}

// Create singleton instance
export const supabaseStatusMonitor = new SupabaseStatusMonitor();

// Export convenience functions
export const testSupabaseConnection = () => supabaseStatusMonitor.testConnection();
export const getSupabaseStatus = () => supabaseStatusMonitor.getStatus();
export const startSupabaseMonitoring = (intervalMs?: number) => supabaseStatusMonitor.startMonitoring(intervalMs);
export const stopSupabaseMonitoring = () => supabaseStatusMonitor.stopMonitoring();
export const subscribeToSupabaseStatus = (callback: (status: SupabaseStatus) => void) => 
  supabaseStatusMonitor.subscribe(callback);
