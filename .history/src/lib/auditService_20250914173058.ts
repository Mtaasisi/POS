import { supabase } from './supabaseClient';

export interface AuditLog {
  id?: string;
  action: string;
  details: string;
  user_id?: string;
  timestamp?: string;
  ip_address?: string;
  user_agent?: string;
  entity_type?: string;
  entity_id?: string;
  user_role?: string;
}

export interface AuditLogFilters {
  action?: string;
  entity_type?: string;
  dateFrom?: string;
  dateTo?: string;
  user_id?: string;
}

/**
 * Log an audit event
 */
export const logAuditEvent = async (log: AuditLog): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const auditLog = {
      action: log.action,
      details: log.details,
      user_id: log.user_id || user?.id,
      timestamp: log.timestamp || new Date().toISOString(),
      entity_type: log.entity_type || 'system',
      entity_id: log.entity_id,
      user_role: log.user_role || 'user',
      ip_address: log.ip_address,
      user_agent: log.user_agent
    };

    const { error } = await supabase
      .from('audit_logs')
      .insert(auditLog);

    if (error) {
      console.error('Error logging audit event:', error);
      // Don't throw error, just return false to prevent breaking functionality
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error logging audit event:', error);
    // Don't throw error, just return false to prevent breaking functionality
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
      .order('timestamp', { ascending: false });

    // Apply filters
    if (filters.action) {
      query = query.eq('action', filters.action);
    }
    if (filters.entity_type) {
      query = query.eq('entity_type', filters.entity_type);
    }
    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }
    if (filters.dateFrom) {
      query = query.gte('timestamp', filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte('timestamp', filters.dateTo);
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
  entity_type: string = 'system'
): Promise<boolean> => {
  return logAuditEvent({
    action: `settings_${action}`,
    details,
    entity_type
  });
};

/**
 * Log user activity
 */
export const logUserActivity = async (
  action: string, 
  details: string, 
  entity_type: string = 'user'
): Promise<boolean> => {
  return logAuditEvent({
    action: `user_${action}`,
    details,
    entity_type
  });
};

/**
 * Log system event
 */
export const logSystemEvent = async (
  action: string, 
  details: string, 
  entity_type: string = 'system'
): Promise<boolean> => {
  return logAuditEvent({
    action: `system_${action}`,
    details,
    entity_type
  });
};

/**
 * Get audit logs for a specific entity
 */
export const getEntityAuditLogs = async (entityType: string, entityId: string): Promise<AuditLog[]> => {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching entity audit logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching entity audit logs:', error);
    return [];
  }
};

/**
 * Get audit statistics
 */
export const getAuditStatistics = async () => {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('action, entity_type, timestamp');

    if (error) {
      console.error('Error fetching audit statistics:', error);
      return null;
    }

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const stats = {
      total: data?.length || 0,
      today: data?.filter(log => new Date(log.timestamp) > oneDayAgo).length || 0,
      thisWeek: data?.filter(log => new Date(log.timestamp) > oneWeekAgo).length || 0,
      byEntityType: {
        device: data?.filter(log => log.entity_type === 'device').length || 0,
        customer: data?.filter(log => log.entity_type === 'customer').length || 0,
        user: data?.filter(log => log.entity_type === 'user').length || 0,
        system: data?.filter(log => log.entity_type === 'system').length || 0
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
    entity_type: 'device',
    entity_id: deviceId,
    user_id: userId,
    user_role: userRole
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