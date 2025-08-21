import { supabase } from './supabaseClient';

export interface TableStatus {
  exists: boolean;
  accessible: boolean;
  error?: string;
}

export class DatabaseUtils {
  private static tableCache = new Map<string, TableStatus>();

  // Check if a table exists and is accessible
  static async checkTableExists(tableName: string): Promise<TableStatus> {
    // Check cache first
    if (this.tableCache.has(tableName)) {
      return this.tableCache.get(tableName)!;
    }

    try {
      // Try to select a single row to test table access
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      const status: TableStatus = {
        exists: true,
        accessible: !error,
        error: error?.message
      };

      // Cache the result
      this.tableCache.set(tableName, status);
      return status;
    } catch (error) {
      const status: TableStatus = {
        exists: false,
        accessible: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      // Cache the result
      this.tableCache.set(tableName, status);
      return status;
    }
  }

  // Check multiple tables at once
  static async checkTablesExist(tableNames: string[]): Promise<Record<string, TableStatus>> {
    const results: Record<string, TableStatus> = {};
    
    await Promise.all(
      tableNames.map(async (tableName) => {
        results[tableName] = await this.checkTableExists(tableName);
      })
    );

    return results;
  }

  // Get a safe query function that handles missing tables
  static getSafeQuery<T = any>(tableName: string) {
    return {
      async select(columns: string = '*') {
        const status = await this.checkTableExists(tableName);
        if (!status.accessible) {
          console.warn(`Table ${tableName} is not accessible:`, status.error);
          return { data: [], error: null };
        }

        return supabase.from(tableName).select(columns);
      },

      async insert(data: any) {
        const status = await this.checkTableExists(tableName);
        if (!status.accessible) {
          console.warn(`Cannot insert into ${tableName}:`, status.error);
          return { data: null, error: new Error(`Table ${tableName} not accessible`) };
        }

        return supabase.from(tableName).insert(data);
      },

      async update(data: any, filter?: any) {
        const status = await this.checkTableExists(tableName);
        if (!status.accessible) {
          console.warn(`Cannot update ${tableName}:`, status.error);
          return { data: null, error: new Error(`Table ${tableName} not accessible`) };
        }

        let query = supabase.from(tableName).update(data);
        if (filter) {
          Object.entries(filter).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }
        return query;
      },

      async delete(filter?: any) {
        const status = await this.checkTableExists(tableName);
        if (!status.accessible) {
          console.warn(`Cannot delete from ${tableName}:`, status.error);
          return { data: null, error: new Error(`Table ${tableName} not accessible`) };
        }

        let query = supabase.from(tableName).delete();
        if (filter) {
          Object.entries(filter).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }
        return query;
      }
    };
  }

  // Clear cache (useful for testing or when tables are created)
  static clearCache() {
    this.tableCache.clear();
  }

  // Get cache status for debugging
  static getCacheStatus(): Record<string, TableStatus> {
    return Object.fromEntries(this.tableCache);
  }
}

// Common table names used in the app
export const COMMON_TABLES = {
  DEVICES: 'devices',
  CUSTOMERS: 'customers',
  PRODUCTS: 'lats_products',
  SALES: 'lats_sales',
  NOTIFICATION_SETTINGS: 'notification_settings',
  CATEGORIES: 'lats_categories',
  BRANDS: 'lats_brands',
  SUPPLIERS: 'lats_suppliers'
} as const;

// Pre-check common tables on app startup
export const initializeDatabaseCheck = async () => {
  console.log('🔍 Checking database table accessibility...');
  
  const tableStatuses = await DatabaseUtils.checkTablesExist(Object.values(COMMON_TABLES));
  
  console.log('📊 Database table status:');
  Object.entries(tableStatuses).forEach(([table, status]) => {
    const icon = status.accessible ? '✅' : '❌';
    console.log(`${icon} ${table}: ${status.accessible ? 'accessible' : 'not accessible'}`);
    if (status.error) {
      console.log(`   Error: ${status.error}`);
    }
  });

  return tableStatuses;
};

export default DatabaseUtils;
