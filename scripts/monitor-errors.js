import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Error monitoring utility
class ErrorMonitor {
  constructor() {
    this.errorCounts = new Map();
    this.requestCounts = new Map();
    this.startTime = Date.now();
  }

  logRequest(endpoint) {
    const count = this.requestCounts.get(endpoint) || 0;
    this.requestCounts.set(endpoint, count + 1);
  }

  logError(endpoint, error) {
    const key = `${endpoint}:${error}`;
    const count = this.errorCounts.get(key) || 0;
    this.errorCounts.set(key, count + 1);
  }

  getStats() {
    const duration = Date.now() - this.startTime;
    const totalRequests = Array.from(this.requestCounts.values()).reduce((a, b) => a + b, 0);
    const totalErrors = Array.from(this.errorCounts.values()).reduce((a, b) => a + b, 0);
    
    return {
      duration: Math.round(duration / 1000),
      totalRequests,
      totalErrors,
      errorRate: totalRequests > 0 ? (totalErrors / totalRequests * 100).toFixed(2) : 0,
      requestsPerSecond: (totalRequests / (duration / 1000)).toFixed(2),
      errorCounts: Object.fromEntries(this.errorCounts),
      requestCounts: Object.fromEntries(this.requestCounts)
    };
  }
}

// Request throttling utility
class RequestThrottler {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.maxConcurrent = 2;
    this.delayBetweenRequests = 500;
  }

  async execute(request) {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, this.delayBetweenRequests));
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.maxConcurrent);
      await Promise.all(batch.map(request => request()));
    }
    
    this.processing = false;
  }
}

async function monitorErrors() {
  console.log('🔍 Starting error monitoring...');
  console.log('Press Ctrl+C to stop and see statistics\n');
  
  const monitor = new ErrorMonitor();
  const throttler = new RequestThrottler();
  
  // Test different endpoints that commonly cause ERR_INSUFFICIENT_RESOURCES
  const testEndpoints = [
    {
      name: 'Product Variants',
      query: () => supabase
        .from('lats_product_variants')
        .select('id, product_id, name, sku, cost_price, selling_price, quantity')
        .limit(10)
    },
    {
      name: 'Devices by Customer',
      query: () => supabase
        .from('devices')
        .select('*')
        .eq('customer_id', '2c9d15d8-cd70-4c5f-b2e0-354978b566cd')
    },
    {
      name: 'Customers with Relations',
      query: () => supabase
        .from('customers')
        .select(`
          id, name, email, phone,
          customer_notes(*),
          customer_payments(*),
          devices(*)
        `)
        .limit(5)
    }
  ];

  let requestId = 0;
  
  // Continuous monitoring loop
  const interval = setInterval(async () => {
    requestId++;
    
    for (const endpoint of testEndpoints) {
      try {
        monitor.logRequest(endpoint.name);
        
        const result = await throttler.execute(async () => {
          const { data, error } = await endpoint.query();
          
          if (error) {
            monitor.logError(endpoint.name, error.message);
            throw error;
          }
          
          return data;
        });
        
        console.log(`✅ Request ${requestId} - ${endpoint.name}: ${result?.length || 0} records`);
        
      } catch (error) {
        console.error(`❌ Request ${requestId} - ${endpoint.name}: ${error.message}`);
        
        if (error.message.includes('ERR_INSUFFICIENT_RESOURCES')) {
          console.log('🚨 ERR_INSUFFICIENT_RESOURCES detected!');
        }
      }
    }
    
    // Print stats every 10 requests
    if (requestId % 10 === 0) {
      const stats = monitor.getStats();
      console.log('\n📊 Current Statistics:');
      console.log(`Duration: ${stats.duration}s`);
      console.log(`Total Requests: ${stats.totalRequests}`);
      console.log(`Total Errors: ${stats.totalErrors}`);
      console.log(`Error Rate: ${stats.errorRate}%`);
      console.log(`Requests/sec: ${stats.requestsPerSecond}`);
      console.log('');
    }
    
  }, 1000); // Run every second
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    clearInterval(interval);
    
    console.log('\n\n📊 Final Statistics:');
    const stats = monitor.getStats();
    console.log(`Duration: ${stats.duration}s`);
    console.log(`Total Requests: ${stats.totalRequests}`);
    console.log(`Total Errors: ${stats.totalErrors}`);
    console.log(`Error Rate: ${stats.errorRate}%`);
    console.log(`Requests/sec: ${stats.requestsPerSecond}`);
    
    console.log('\n📈 Error Breakdown:');
    for (const [error, count] of Object.entries(stats.errorCounts)) {
      console.log(`  ${error}: ${count} times`);
    }
    
    console.log('\n📈 Request Breakdown:');
    for (const [endpoint, count] of Object.entries(stats.requestCounts)) {
      console.log(`  ${endpoint}: ${count} requests`);
    }
    
    process.exit(0);
  });
}

// Run the monitoring
monitorErrors().catch(console.error);
