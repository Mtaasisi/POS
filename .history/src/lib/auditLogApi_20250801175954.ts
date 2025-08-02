import { supabase } from './supabaseClient';

export async function logAuditAction({ userId, action, entityType, entityId, details }: {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  details?: any;
}) {
  await supabase.from('audit_logs').insert({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    details: details ? JSON.stringify(details) : null,
    user_role: 'admin', // Default role, should be passed from context
    timestamp: new Date().toISOString(),
  });
} 