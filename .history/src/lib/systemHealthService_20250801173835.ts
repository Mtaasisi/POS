import { supabase } from './supabaseClient';

export interface SystemHealth {
  database: {
    status: 'online' | 'offline' | 'degraded';
    responseTime: number;
    lastCheck: string;
  };
  cache: {
    status: 'healthy' | 'warning' | 'error';
    size: number;
    items: number;
  };
  performance: {
    memoryUsage: number;
    cpuUsage: number;
    uptime: number;
  };
  errors: {
    count: number;
    lastError?: string;
    lastErrorTime?: string;
  };
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  responseTime: number;
  details?: string;
}

/**
 * Check database connectivity
 */
export const checkDatabaseHealth = async (): Promise<HealthCheck> => {
  const startTime = Date.now();
  
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('key')
      .limit(1);

    const responseTime = Date.now() - startTime;
    
    if (error) {
      return {
        name: 'Database Connection',
        status: 'fail',
        responseTime,
        details: error.message
      };
    }

    return {
      name: 'Database Connection',
      status: 'pass',
      responseTime,
      details: 'Connected successfully'
    };
  } catch (error) {
    return {
      name: 'Database Connection',
      status: 'fail',
      responseTime: Date.now() - startTime,
      details: String(error)
    };
  }
};

/**
 * Check cache health
 */
export const checkCacheHealth = async (): Promise<HealthCheck> => {
  const startTime = Date.now();
  
  try {
    // Check IndexedDB
    const databases = ['offline-cache', 'pending-actions', 'user-goals'];
    let totalItems = 0;
    let hasErrors = false;

    for (const dbName of databases) {
      try {
        const request = indexedDB.open(dbName);
        await new Promise((resolve, reject) => {
          request.onsuccess = () => resolve(true);
          request.onerror = () => reject(request.error);
        });
        totalItems++;
      } catch {
        hasErrors = true;
      }
    }

    const responseTime = Date.now() - startTime;
    
    return {
      name: 'Cache Health',
      status: hasErrors ? 'warning' : 'pass',
      responseTime,
      details: `${totalItems}/${databases.length} databases accessible`
    };
  } catch (error) {
    return {
      name: 'Cache Health',
      status: 'fail',
      responseTime: Date.now() - startTime,
      details: String(error)
    };
  }
};

/**
 * Check performance metrics
 */
export const checkPerformanceHealth = async (): Promise<HealthCheck> => {
  const startTime = Date.now();
  
  try {
    // Get memory usage if available
    const memoryInfo = (performance as any).memory;
    const memoryUsage = memoryInfo ? memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit : 0;
    
    // Get uptime
    const uptime = performance.now();
    
    const responseTime = Date.now() - startTime;
    
    return {
      name: 'Performance',
      status: memoryUsage > 0.8 ? 'warning' : 'pass',
      responseTime,
      details: `Memory: ${Math.round(memoryUsage * 100)}%, Uptime: ${Math.round(uptime / 1000)}s`
    };
  } catch (error) {
    return {
      name: 'Performance',
      status: 'warning',
      responseTime: Date.now() - startTime,
      details: 'Unable to get performance metrics'
    };
  }
};

/**
 * Run comprehensive health check
 */
export const runHealthCheck = async (): Promise<SystemHealth> => {
  const checks = await Promise.all([
    checkDatabaseHealth(),
    checkCacheHealth(),
    checkPerformanceHealth()
  ]);

  const database = checks.find(c => c.name === 'Database Connection');
  const cache = checks.find(c => c.name === 'Cache Health');
  const performance = checks.find(c => c.name === 'Performance');

  return {
    database: {
      status: database?.status === 'pass' ? 'online' : database?.status === 'warning' ? 'degraded' : 'offline',
      responseTime: database?.responseTime || 0,
      lastCheck: new Date().toISOString()
    },
    cache: {
      status: cache?.status === 'pass' ? 'healthy' : cache?.status === 'warning' ? 'warning' : 'error',
      size: 0, // Would need to calculate actual cache size
      items: 0 // Would need to count actual items
    },
    performance: {
      memoryUsage: performance?.details?.includes('Memory:') ? 
        parseInt(performance.details.match(/Memory: (\d+)%/)?.[1] || '0') / 100 : 0,
      cpuUsage: 0, // Not available in browser
      uptime: performance?.details?.includes('Uptime:') ? 
        parseInt(performance.details.match(/Uptime: (\d+)s/)?.[1] || '0') : 0
    },
    errors: {
      count: checks.filter(c => c.status === 'fail').length,
      lastError: checks.find(c => c.status === 'fail')?.details,
      lastErrorTime: checks.find(c => c.status === 'fail') ? new Date().toISOString() : undefined
    }
  };
};

/**
 * Get system statistics
 */
export const getSystemStatistics = async () => {
  try {
    // Get basic counts
    const [customers, devices, payments, users] = await Promise.all([
      supabase.from('customers').select('id', { count: 'exact' }),
      supabase.from('devices').select('id', { count: 'exact' }),
      supabase.from('payments').select('id', { count: 'exact' }),
      supabase.from('auth_users').select('id', { count: 'exact' })
    ]);

    return {
      customers: customers.count || 0,
      devices: devices.count || 0,
      payments: payments.count || 0,
      users: users.count || 0,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting system statistics:', error);
    return null;
  }
}; 