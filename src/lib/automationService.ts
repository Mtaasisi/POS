import { supabase } from './supabaseClient';
import { createSettingsBackup, getSettings } from './settingsApi';
import { runHealthCheck, SystemHealth } from './systemHealthService';
import { logSystemEvent } from './auditService';
import { trackPerformance } from './analyticsService';

export interface AutomationTask {
  id?: string;
  name: string;
  type: 'backup' | 'health_check' | 'cleanup' | 'alert';
  schedule: 'daily' | 'weekly' | 'monthly' | 'manual';
  enabled: boolean;
  last_run?: string;
  next_run?: string;
  config: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface Alert {
  id?: string;
  type: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  user_id?: string;
  read: boolean;
  created_at?: string;
}

export interface AutomationConfig {
  autoBackup: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    retention: number; // days
    time: string; // HH:mm format
  };
  healthMonitoring: {
    enabled: boolean;
    checkInterval: number; // minutes
    alertThreshold: number; // response time in ms
  };
  cleanup: {
    enabled: boolean;
    frequency: 'daily' | 'weekly';
    retentionDays: number;
  };
}

/**
 * Create a new automation task
 */
export const createAutomationTask = async (task: Omit<AutomationTask, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('automation_tasks')
      .insert({
        ...task,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error creating automation task:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error creating automation task:', error);
    return false;
  }
};

/**
 * Get all automation tasks
 */
export const getAutomationTasks = async (): Promise<AutomationTask[]> => {
  try {
    const { data, error } = await supabase
      .from('automation_tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching automation tasks:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching automation tasks:', error);
    return [];
  }
};

/**
 * Update automation task
 */
export const updateAutomationTask = async (id: string, updates: Partial<AutomationTask>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('automation_tasks')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating automation task:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating automation task:', error);
    return false;
  }
};

/**
 * Delete automation task
 */
export const deleteAutomationTask = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('automation_tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting automation task:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting automation task:', error);
    return false;
  }
};

/**
 * Execute automation task
 */
export const executeAutomationTask = async (task: AutomationTask): Promise<boolean> => {
  try {
    switch (task.type) {
      case 'backup':
        return await executeBackupTask(task);
      case 'health_check':
        return await executeHealthCheckTask(task);
      case 'cleanup':
        return await executeCleanupTask(task);
      case 'alert':
        return await executeAlertTask(task);
      default:
        console.error('Unknown automation task type:', task.type);
        return false;
    }
  } catch (error) {
    console.error('Error executing automation task:', error);
    return false;
  }
};

/**
 * Execute backup task
 */
const executeBackupTask = async (task: AutomationTask): Promise<boolean> => {
  try {
    const backup = await createSettingsBackup();
    
    // Save backup to storage (could be cloud storage in production)
    const backupData = {
      task_id: task.id,
      backup_data: backup,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('backup_logs')
      .insert(backupData);

    if (error) {
      console.error('Error saving backup log:', error);
      return false;
    }

    // Update task last run time
    await updateAutomationTask(task.id!, {
      last_run: new Date().toISOString()
    });

    await logSystemEvent('backup_completed', `Automated backup completed for task: ${task.name}`);
    return true;
  } catch (error) {
    console.error('Error executing backup task:', error);
    return false;
  }
};

/**
 * Execute health check task
 */
const executeHealthCheckTask = async (task: AutomationTask): Promise<boolean> => {
  try {
    const health = await runHealthCheck();
    
    // Track performance metrics
    await trackPerformance('response_time', health.database.responseTime);
    await trackPerformance('memory_usage', health.performance.memoryUsage);

    // Check for alerts
    if (health.database.responseTime > (task.config.alertThreshold || 1000)) {
      await createAlert({
        type: 'warning',
        title: 'High Database Response Time',
        message: `Database response time is ${health.database.responseTime}ms, which is above the threshold.`
      });
    }

    if (health.errors.count > 0) {
      await createAlert({
        type: 'error',
        title: 'System Errors Detected',
        message: `${health.errors.count} errors detected in the last health check.`
      });
    }

    // Update task last run time
    await updateAutomationTask(task.id!, {
      last_run: new Date().toISOString()
    });

    await logSystemEvent('health_check_completed', `Automated health check completed for task: ${task.name}`);
    return true;
  } catch (error) {
    console.error('Error executing health check task:', error);
    return false;
  }
};

/**
 * Execute cleanup task
 */
const executeCleanupTask = async (task: AutomationTask): Promise<boolean> => {
  try {
    const retentionDays = task.config.retentionDays || 30;
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    // Clean up old backup logs
    const { error: backupError } = await supabase
      .from('backup_logs')
      .delete()
      .lt('created_at', cutoffDate.toISOString());

    if (backupError) {
      console.error('Error cleaning up backup logs:', backupError);
    }

    // Clean up old audit logs (keep last 90 days)
    const auditCutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const { error: auditError } = await supabase
      .from('audit_logs')
      .delete()
      .lt('created_at', auditCutoffDate.toISOString());

    if (auditError) {
      console.error('Error cleaning up audit logs:', auditError);
    }

    // Update task last run time
    await updateAutomationTask(task.id!, {
      last_run: new Date().toISOString()
    });

    await logSystemEvent('cleanup_completed', `Automated cleanup completed for task: ${task.name}`);
    return true;
  } catch (error) {
    console.error('Error executing cleanup task:', error);
    return false;
  }
};

/**
 * Execute alert task
 */
const executeAlertTask = async (task: AutomationTask): Promise<boolean> => {
  try {
    // This would typically check for specific conditions and create alerts
    // For now, we'll just log the task execution
    await logSystemEvent('alert_task_executed', `Alert task executed: ${task.name}`);
    
    // Update task last run time
    await updateAutomationTask(task.id!, {
      last_run: new Date().toISOString()
    });

    return true;
  } catch (error) {
    console.error('Error executing alert task:', error);
    return false;
  }
};

/**
 * Create an alert
 */
export const createAlert = async (alert: Omit<Alert, 'id' | 'created_at'>): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const alertData = {
      ...alert,
      user_id: alert.user_id || user?.id,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('alerts')
      .insert(alertData);

    if (error) {
      console.error('Error creating alert:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error creating alert:', error);
    return false;
  }
};

/**
 * Get all alerts
 */
export const getAlerts = async (): Promise<Alert[]> => {
  try {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching alerts:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return [];
  }
};

/**
 * Mark alert as read
 */
export const markAlertAsRead = async (alertId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('alerts')
      .update({ read: true })
      .eq('id', alertId);

    if (error) {
      console.error('Error marking alert as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error marking alert as read:', error);
    return false;
  }
};

/**
 * Get automation configuration
 */
export const getAutomationConfig = async (): Promise<AutomationConfig> => {
  try {
    const settings = await getSettings();
    
    return {
      autoBackup: {
        enabled: settings.auto_backup_enabled || false,
        frequency: settings.auto_backup_frequency || 'daily',
        retention: settings.auto_backup_retention || 30,
        time: settings.auto_backup_time || '02:00'
      },
      healthMonitoring: {
        enabled: settings.health_monitoring_enabled || false,
        checkInterval: settings.health_check_interval || 30,
        alertThreshold: settings.health_alert_threshold || 1000
      },
      cleanup: {
        enabled: settings.cleanup_enabled || false,
        frequency: settings.cleanup_frequency || 'weekly',
        retentionDays: settings.cleanup_retention_days || 90
      }
    };
  } catch (error) {
    console.error('Error getting automation config:', error);
    return {
      autoBackup: { enabled: false, frequency: 'daily', retention: 30, time: '02:00' },
      healthMonitoring: { enabled: false, checkInterval: 30, alertThreshold: 1000 },
      cleanup: { enabled: false, frequency: 'weekly', retentionDays: 90 }
    };
  }
};

/**
 * Update automation configuration
 */
export const updateAutomationConfig = async (config: AutomationConfig): Promise<boolean> => {
  try {
    const settings = {
      auto_backup_enabled: config.autoBackup.enabled,
      auto_backup_frequency: config.autoBackup.frequency,
      auto_backup_retention: config.autoBackup.retention,
      auto_backup_time: config.autoBackup.time,
      health_monitoring_enabled: config.healthMonitoring.enabled,
      health_check_interval: config.healthMonitoring.checkInterval,
      health_alert_threshold: config.healthMonitoring.alertThreshold,
      cleanup_enabled: config.cleanup.enabled,
      cleanup_frequency: config.cleanup.frequency,
      cleanup_retention_days: config.cleanup.retentionDays
    };

    const { error } = await supabase
      .from('settings')
      .upsert(
        Object.entries(settings).map(([key, value]) => ({
          key,
          value: JSON.stringify(value)
        })),
        { onConflict: 'key' }
      );

    if (error) {
      console.error('Error updating automation config:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating automation config:', error);
    return false;
  }
}; 