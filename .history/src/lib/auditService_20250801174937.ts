import { supabase } from './supabaseClient';

export interface AuditLog {
  id?: string;
  action: string;
  details: string;
  created_by?: string;
  created_at?: string;
  ip_address?: string;
  user_agent?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface AuditLogFilters {
  action?: string;
  severity?: string;
  dateFrom?: string;
  dateTo?: string;
  created_by?: string;
}

/**
 * Log an audit event
 */
export const logAuditEvent = async (log: AuditLog): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const auditLog = {
      ...log,
      created_by: log.created_by || user?.id,
      created_at: log.created_at || new Date().toISOString(),
      severity: log.severity || 'low'
    };

    const { error } = await supabase
      .from('audit_logs')
      .insert(auditLog);

    if (error) {
      console.error('Error logging audit event:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error logging audit event:', error);
    return false;
  }
};

/**
 * Get audit logs with filters
 */
export const getAuditLogs = async (filters: AuditLogFilters = {}): Promise<AuditLog[]> => {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.action) {
      query = query.eq('action', filters.action);
    }
    if (filters.severity) {
      query = query.eq('severity', filters.severity);
    }
    if (filters.created_by) {
      query = query.eq('created_by', filters.created_by);
    }
    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
};

/**
 * Log settings change
 */
export const logSettingsChange = async (
  action: string, 
  details: string, 
  severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
): Promise<boolean> => {
  return logAuditEvent({
    action: `settings_${action}`,
    details,
    severity
  });
};

/**
 * Log user activity
 */
export const logUserActivity = async (
  action: string, 
  details: string, 
  severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
): Promise<boolean> => {
  return logAuditEvent({
    action: `user_${action}`,
    details,
    severity
  });
};

/**
 * Log system event
 */
export const logSystemEvent = async (
  action: string, 
  details: string, 
  severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
): Promise<boolean> => {
  return logAuditEvent({
    action: `system_${action}`,
    details,
    severity
  });
};

/**
 * Get audit statistics
 */
export const getAuditStatistics = async () => {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('action, severity, created_at');

    if (error) {
      console.error('Error fetching audit statistics:', error);
      return null;
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const stats = {
      total: data?.length || 0,
      today: data?.filter(log => new Date(log.created_at) > oneDayAgo).length || 0,
      thisWeek: data?.filter(log => new Date(log.created_at) > oneWeekAgo).length || 0,
      bySeverity: {
        low: data?.filter(log => log.severity === 'low').length || 0,
        medium: data?.filter(log => log.severity === 'medium').length || 0,
        high: data?.filter(log => log.severity === 'high').length || 0,
        critical: data?.filter(log => log.severity === 'critical').length || 0
      },
      byAction: {} as Record<string, number>
    };

    // Count by action
    data?.forEach(log => {
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('Error getting audit statistics:', error);
    return null;
  }
};

/**
 * Log device status change
 */
export const logDeviceStatusChange = async (
  deviceId: string,
  userId: string,
  userRole: string,
  oldStatus: string,
  newStatus: string,
  signature: string
): Promise<boolean> => {
  return logAuditEvent({
    action: 'device_status_change',
    details: `Device ${deviceId} status changed from ${oldStatus} to ${newStatus} by ${userRole} (${userId}). Signature: ${signature}`,
    severity: 'medium'
  });
};

// Default export object for easier importing
export const auditService = {
  logAuditEvent,
  getAuditLogs,
  logSettingsChange,
  logUserActivity,
  logSystemEvent,
  getAuditStatistics,
  logDeviceStatusChange
}; 