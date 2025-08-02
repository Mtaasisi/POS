import { supabase } from './supabaseClient';

export interface BackupResult {
  success: boolean;
  duration?: number;
  summary?: {
    totalTables: number;
    totalRecords: number;
    tablesWithData: number;
    errors: any[];
  };
  error?: string;
}

/**
 * Run a manual backup
 */
export const runManualBackup = async (): Promise<BackupResult> => {
  try {
    const startTime = Date.now();
    
    // Get all tables
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .not('table_name', 'like', 'pg_%')
      .not('table_name', 'like', 'information_schema%');

    if (tablesError) {
      throw new Error(`Failed to get tables: ${tablesError.message}`);
    }

    const tableNames = tables?.map(t => t.table_name) || [];
    const tablesData = [];
    let totalRecords = 0;
    let tablesWithData = 0;
    const errors = [];

    // Export each table
    for (const tableName of tableNames) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*');

        if (error) {
          errors.push({ table: tableName, error: error.message });
          tablesData.push({ tableName, data: [], error: error.message });
        } else {
          const recordCount = data?.length || 0;
          totalRecords += recordCount;
          if (recordCount > 0) tablesWithData++;
          
          tablesData.push({ tableName, data: data || [], error: null });
        }
      } catch (error) {
        errors.push({ table: tableName, error: error.message });
        tablesData.push({ tableName, data: [], error: error.message });
      }
    }

    const duration = (Date.now() - startTime) / 1000;
    
    const summary = {
      totalTables: tableNames.length,
      totalRecords,
      tablesWithData,
      errors
    };

    // Store backup data in localStorage for demo purposes
    // In production, this would be stored on the server
    const backupData = {
      timestamp: new Date().toISOString(),
      duration,
      success: true,
      summary,
      data: tablesData
    };

    localStorage.setItem('latest_backup', JSON.stringify(backupData));
    
    // Add to backup logs
    const existingLogs = JSON.parse(localStorage.getItem('backup_logs') || '[]');
    existingLogs.push(backupData);
    localStorage.setItem('backup_logs', JSON.stringify(existingLogs));

    return {
      success: true,
      duration,
      summary
    };

  } catch (error) {
    console.error('Backup failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Test backup connections
 */
export const testBackupConnection = async (): Promise<BackupResult> => {
  try {
    // Test Supabase connection
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(1);

    if (tablesError) {
      throw new Error(`Supabase connection failed: ${tablesError.message}`);
    }

    return {
      success: true,
      summary: {
        totalTables: 0,
        totalRecords: 0,
        tablesWithData: 0,
        errors: []
      }
    };

  } catch (error) {
    console.error('Connection test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get backup status
 */
export const getBackupStatus = async () => {
  try {
    const logs = JSON.parse(localStorage.getItem('backup_logs') || '[]');
    
    if (logs.length === 0) {
      return {
        hasBackups: false,
        lastBackup: null,
        totalBackups: 0,
        successRate: 0,
        averageDuration: 0
      };
    }

    const lastBackup = logs[logs.length - 1];
    const successfulBackups = logs.filter(log => log.success);
    const averageDuration = logs.reduce((sum, log) => sum + (log.duration || 0), 0) / logs.length;

    return {
      hasBackups: true,
      lastBackup,
      totalBackups: logs.length,
      successRate: (successfulBackups.length / logs.length) * 100,
      averageDuration
    };

  } catch (error) {
    console.error('Error getting backup status:', error);
    return {
      hasBackups: false,
      lastBackup: null,
      totalBackups: 0,
      successRate: 0,
      averageDuration: 0
    };
  }
};

/**
 * Get backup logs
 */
export const getBackupLogs = async () => {
  try {
    const logs = JSON.parse(localStorage.getItem('backup_logs') || '[]');
    return logs.slice(-20).reverse(); // Return last 20 logs
  } catch (error) {
    console.error('Error getting backup logs:', error);
    return [];
  }
};

/**
 * Download backup data
 */
export const downloadBackup = async (backupId?: string) => {
  try {
    let backupData;
    
    if (backupId) {
      // Download specific backup
      backupData = JSON.parse(localStorage.getItem(`backup_${backupId}`) || '{}');
    } else {
      // Download latest backup
      backupData = JSON.parse(localStorage.getItem('latest_backup') || '{}');
    }

    if (!backupData || !backupData.data) {
      throw new Error('No backup data found');
    }

    // Create downloadable blob
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_${backupData.timestamp || Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true };

  } catch (error) {
    console.error('Download failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Restore from backup data
 */
export const restoreFromBackup = async (backupData: any): Promise<BackupResult> => {
  try {
    if (!backupData.data || !Array.isArray(backupData.data)) {
      throw new Error('Invalid backup format');
    }

    let restoredTables = 0;
    let restoredRecords = 0;
    const errors = [];

    for (const tableData of backupData.data) {
      if (tableData.error || tableData.data.length === 0) {
        continue;
      }

      try {
        // Clear existing data
        const { error: deleteError } = await supabase
          .from(tableData.tableName)
          .delete()
          .neq('id', 0);

        if (deleteError) {
          console.warn(`Could not clear ${tableData.tableName}: ${deleteError.message}`);
        }

        // Insert backup data
        const { error: insertError } = await supabase
          .from(tableData.tableName)
          .insert(tableData.data);

        if (insertError) {
          errors.push({ table: tableData.tableName, error: insertError.message });
        } else {
          restoredTables++;
          restoredRecords += tableData.data.length;
        }

      } catch (error) {
        errors.push({ table: tableData.tableName, error: error.message });
      }
    }

    return {
      success: errors.length === 0,
      summary: {
        totalTables: backupData.data.length,
        totalRecords: restoredRecords,
        tablesWithData: restoredTables,
        errors
      }
    };

  } catch (error) {
    console.error('Restore failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}; 