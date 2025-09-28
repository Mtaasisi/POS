import { supabase } from './supabaseClient';
import { toast } from 'react-hot-toast';
import {
  DiagnosticRequest,
  DiagnosticDevice,
  DiagnosticCheck,
  DiagnosticTemplate,
  CreateDiagnosticRequestData,
  UpdateDiagnosticCheckData,
  DiagnosticFilters,
  DiagnosticStats,
  UpdateAdminFeedbackData,
  MarkActionCompletedData,
  AdminFeedbackData
} from '../types/diagnostics';

// =============================================
// DIAGNOSTIC REQUESTS
// =============================================

export const createDiagnosticRequest = async (data: CreateDiagnosticRequestData): Promise<DiagnosticRequest | null> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Create the diagnostic request
    const { data: request, error: requestError } = await supabase
      .from('diagnostic_requests')
      .insert({
        title: data.title,
        created_by: user.id,
        assigned_to: data.assigned_to,
        description: data.notes, // Map notes to description column
        priority: data.priority || 'medium' // Default to medium priority
      })
      .select()
      .single();

    if (requestError) throw requestError;

    // Expand devices based on quantity and create diagnostic devices
    const expandedDevices = [];
    
    for (const device of data.devices) {
      const quantity = device.quantity || 1;
      
      if (quantity === 1) {
        // Single device
        expandedDevices.push({
          diagnostic_request_id: request.id,
          device_name: device.device_name,
          serial_number: device.serial_number,
          model: device.model,
          notes: device.notes
        });
      } else {
        // Multiple devices with individual serials
        for (let i = 0; i < quantity; i++) {
          const individualSerial = device.individual_serials?.[i] || `${device.serial_number || 'SN'}-${i + 1}`;
          expandedDevices.push({
            diagnostic_request_id: request.id,
            device_name: device.device_name,
            serial_number: individualSerial,
            model: device.model,
            notes: device.notes
          });
        }
      }
    }

    const { error: devicesError } = await supabase
      .from('diagnostic_devices')
      .insert(expandedDevices);

    if (devicesError) throw devicesError;

    toast.success('Diagnostic request created successfully');
    return request;
  } catch (error: any) {
    console.error('Error creating diagnostic request:', error);
    toast.error(error.message || 'Failed to create diagnostic request');
    return null;
  }
};

export const getDiagnosticRequests = async (filters?: DiagnosticFilters): Promise<DiagnosticRequest[]> => {
  try {
    // First, try the complex query with joins
    let query = supabase
      .from('diagnostic_requests')
      .select(`
        *,
        created_by_user:auth_users!diagnostic_requests_created_by_fkey(id, name, username),
        assigned_to_user:auth_users!diagnostic_requests_assigned_to_fkey(id, name, username),
        devices:diagnostic_devices(
          *,
          checks:diagnostic_checks(*)
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }
    if (filters?.created_by) {
      query = query.eq('created_by', filters.created_by);
    }
    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error with complex query:', error);
      
      // Check if the error is due to missing tables
      if (error.message && (
        error.message.includes('relation "diagnostic_requests" does not exist') ||
        error.message.includes('relation "diagnostic_devices" does not exist') ||
        error.message.includes('relation "diagnostic_checks" does not exist') ||
        error.code === 'PGRST116' || // Table not found
        error.code === '42P01' // Undefined table
      )) {
        console.warn('Diagnostic tables do not exist yet. Returning empty array.');
        return [];
      }
      
      // If it's a 400 error (likely foreign key or join issue), try a simpler query
      if (error.code === '400' || error.message?.includes('400')) {
        console.warn('Complex query failed, trying simpler approach...');
        
        // Try a simpler query without the complex joins
        const { data: simpleData, error: simpleError } = await supabase
          .from('diagnostic_requests')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (simpleError) {
          console.error('Simple query also failed:', simpleError);
          throw simpleError;
        }
        
        // Return data without the complex relationships for now
        return (simpleData || []).map(request => ({
          ...request,
          created_by_user: null,
          assigned_to_user: null,
          devices: [],
          device_count: 0,
          passed_devices: 0,
          failed_devices: 0,
          pending_devices: 0
        }));
      }
      
      throw error;
    }

    // Process the data to add calculated fields
    const processedData = (data || []).map(request => {
      const devices = request.devices || [];
      const deviceCount = devices.length;
      const passedDevices = devices.filter((device: any) => device.result_status === 'passed').length;
      const failedDevices = devices.filter((device: any) => device.result_status === 'failed').length;
      const pendingDevices = devices.filter((device: any) => device.result_status === 'pending').length;

      return {
        ...request,
        device_count: deviceCount,
        passed_devices: passedDevices,
        failed_devices: failedDevices,
        pending_devices: pendingDevices
      };
    });

    return processedData;
  } catch (error: any) {
    console.error('Error fetching diagnostic requests:', error);
    
    // Don't show toast error for missing tables - just return empty array
    if (error.message && (
      error.message.includes('relation "diagnostic_requests" does not exist') ||
      error.message.includes('relation "diagnostic_devices" does not exist') ||
      error.message.includes('relation "diagnostic_checks" does not exist') ||
      error.code === 'PGRST116' ||
      error.code === '42P01'
    )) {
      console.warn('Diagnostic tables do not exist yet. Returning empty array.');
      return [];
    }
    
    // For 400 errors, try a simple fallback query
    if (error.code === '400' || error.message?.includes('400')) {
      try {
        console.warn('Trying fallback simple query...');
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('diagnostic_requests')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (!fallbackError && fallbackData) {
          return fallbackData.map(request => ({
            ...request,
            created_by_user: null,
            assigned_to_user: null,
            devices: [],
            device_count: 0,
            passed_devices: 0,
            failed_devices: 0,
            pending_devices: 0
          }));
        }
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
      }
    }
    
    toast.error(error.message || 'Failed to fetch diagnostic requests');
    return [];
  }
};

export const getDiagnosticRequest = async (id: string): Promise<DiagnosticRequest | null> => {
  try {
    const { data, error } = await supabase
      .from('diagnostic_requests')
      .select(`
        *,
        created_by_user:auth_users(id, name, username),
        assigned_to_user:auth_users(id, name, username),
        devices:diagnostic_devices(
          *,
          checks:diagnostic_checks(*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      // Check if the error is due to missing tables
      if (error.message && (
        error.message.includes('relation "diagnostic_requests" does not exist') ||
        error.message.includes('relation "diagnostic_devices" does not exist') ||
        error.message.includes('relation "diagnostic_checks" does not exist') ||
        error.code === 'PGRST116' ||
        error.code === '42P01'
      )) {
        console.warn('Diagnostic tables do not exist yet. Returning null.');
        return null;
      }
      throw error;
    }
    return data;
  } catch (error: any) {
    console.error('Error fetching diagnostic request:', error);
    
    // Don't show toast error for missing tables
    if (error.message && (
      error.message.includes('relation "diagnostic_requests" does not exist') ||
      error.message.includes('relation "diagnostic_devices" does not exist') ||
      error.message.includes('relation "diagnostic_checks" does not exist') ||
      error.code === 'PGRST116' ||
      error.code === '42P01'
    )) {
      console.warn('Diagnostic tables do not exist yet. Returning null.');
      return null;
    }
    
    toast.error(error.message || 'Failed to fetch diagnostic request');
    return null;
  }
};

export const updateDiagnosticRequest = async (id: string, updates: Partial<DiagnosticRequest>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('diagnostic_requests')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    toast.success('Diagnostic request updated successfully');
    return true;
  } catch (error: any) {
    console.error('Error updating diagnostic request:', error);
    toast.error(error.message || 'Failed to update diagnostic request');
    return false;
  }
};

// =============================================
// DIAGNOSTIC DEVICES
// =============================================

export const getDiagnosticDevices = async (requestId: string): Promise<DiagnosticDevice[]> => {
  try {
    const { data, error } = await supabase
      .from('diagnostic_devices')
      .select(`
        *,
        checks:diagnostic_checks(*)
      `)
      .eq('diagnostic_request_id', requestId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Calculate check counts and result status
    const devicesWithStats = (data || []).map(device => {
      const checks = device.checks || [];
      const passedChecks = checks.filter((check: DiagnosticCheck) => check.result === 'passed').length;
      const failedChecks = checks.filter((check: DiagnosticCheck) => check.result === 'failed').length;
      const totalChecks = checks.length;

      let resultStatus = device.result_status;
      if (totalChecks > 0) {
        if (failedChecks === 0) {
          resultStatus = 'passed';
        } else if (passedChecks === 0) {
          resultStatus = 'failed';
        } else {
          resultStatus = 'partially_failed';
        }
      }

      return {
        ...device,
        check_count: totalChecks,
        passed_checks: passedChecks,
        failed_checks: failedChecks,
        result_status: resultStatus
      };
    });

    return devicesWithStats;
  } catch (error: any) {
    console.error('Error fetching diagnostic devices:', error);
    toast.error(error.message || 'Failed to fetch diagnostic devices');
    return [];
  }
};

export const updateDiagnosticDevice = async (id: string, updates: Partial<DiagnosticDevice>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('diagnostic_devices')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    toast.success('Device updated successfully');
    return true;
  } catch (error: any) {
    console.error('Error updating diagnostic device:', error);
    toast.error(error.message || 'Failed to update device');
    return false;
  }
};

// =============================================
// DIAGNOSTIC CHECKS
// =============================================

export const createDiagnosticCheck = async (deviceId: string, data: UpdateDiagnosticCheckData): Promise<DiagnosticCheck | null> => {
  try {
    const { data: check, error } = await supabase
      .from('diagnostic_checks')
      .insert({
        diagnostic_device_id: deviceId,
        test_item: data.test_item,
        result: data.result,
        remarks: data.remarks,
        image_url: data.image_url
      })
      .select()
      .single();

    if (error) throw error;

    toast.success('Check result saved successfully');
    return check;
  } catch (error: any) {
    console.error('Error creating diagnostic check:', error);
    toast.error(error.message || 'Failed to save check result');
    return null;
  }
};

export const updateDiagnosticCheck = async (id: string, data: UpdateDiagnosticCheckData): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('diagnostic_checks')
      .update({
        test_item: data.test_item,
        result: data.result,
        remarks: data.remarks,
        image_url: data.image_url
      })
      .eq('id', id);

    if (error) throw error;

    toast.success('Check result updated successfully');
    return true;
  } catch (error: any) {
    console.error('Error updating diagnostic check:', error);
    toast.error(error.message || 'Failed to update check result');
    return false;
  }
};

export const getDiagnosticChecks = async (deviceId: string): Promise<DiagnosticCheck[]> => {
  try {
    const { data, error } = await supabase
      .from('diagnostic_checks')
      .select('*')
      .eq('diagnostic_device_id', deviceId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error: any) {
    console.error('Error fetching diagnostic checks:', error);
    toast.error(error.message || 'Failed to fetch diagnostic checks');
    return [];
  }
};

// =============================================
// DIAGNOSTIC TEMPLATES
// =============================================

export const getDiagnosticTemplates = async (): Promise<DiagnosticTemplate[]> => {
  try {
    const { data, error } = await supabase
      .from('diagnostic_templates')
      .select('*')
      .order('device_type', { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error: any) {
    console.error('Error fetching diagnostic templates:', error);
    toast.error(error.message || 'Failed to fetch diagnostic templates');
    return [];
  }
};

export const getDiagnosticTemplate = async (deviceType: string): Promise<DiagnosticTemplate | null> => {
  try {
    const { data, error } = await supabase
      .from('diagnostic_templates')
      .select('*')
      .eq('device_type', deviceType)
      .single();

    if (error) throw error;

    return data;
  } catch (error: any) {
    console.error('Error fetching diagnostic template:', error);
    return null;
  }
};

export const getDiagnosticTemplateForDevice = async (deviceModel: string): Promise<DiagnosticTemplate | null> => {
  try {
    console.log('[DiagnosticTemplate] Getting template for device model:', deviceModel);
    
    // Determine device type based on model
    const modelLower = deviceModel.toLowerCase();
    let deviceType = 'general';
    
    if (modelLower.includes('laptop') || modelLower.includes('notebook') || modelLower.includes('macbook')) {
      deviceType = 'laptop';
    } else if (modelLower.includes('phone') || modelLower.includes('mobile') || modelLower.includes('iphone') || modelLower.includes('android')) {
      deviceType = 'phone';
    } else if (modelLower.includes('tablet') || modelLower.includes('ipad')) {
      deviceType = 'mobile';
    }
    
    console.log('[DiagnosticTemplate] Determined device type:', deviceType);
    
    // Try to get specific template first
    let template = await getDiagnosticTemplate(deviceType);
    
    // Fallback to general template if specific template not found
    if (!template && deviceType !== 'general') {
      console.log('[DiagnosticTemplate] Specific template not found, falling back to general template');
      template = await getDiagnosticTemplate('general');
    }
    
    console.log('[DiagnosticTemplate] Retrieved template:', template ? 'Found' : 'Not found');
    return template;
  } catch (error: any) {
    console.error('Error getting diagnostic template for device:', error);
    return null;
  }
};

export const createDiagnosticTemplate = async (template: Omit<DiagnosticTemplate, 'id' | 'created_at'>): Promise<DiagnosticTemplate | null> => {
  try {
    const { data, error } = await supabase
      .from('diagnostic_templates')
      .insert(template)
      .select()
      .single();

    if (error) throw error;

    toast.success('Diagnostic template created successfully');
    return data;
  } catch (error: any) {
    console.error('Error creating diagnostic template:', error);
    toast.error(error.message || 'Failed to create diagnostic template');
    return null;
  }
};

export const updateDiagnosticTemplate = async (id: string, updates: Partial<DiagnosticTemplate>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('diagnostic_templates')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    toast.success('Diagnostic template updated successfully');
    return true;
  } catch (error: any) {
    console.error('Error updating diagnostic template:', error);
    toast.error(error.message || 'Failed to update diagnostic template');
    return false;
  }
};

export const deleteDiagnosticTemplate = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('diagnostic_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;

    toast.success('Diagnostic template deleted successfully');
    return true;
  } catch (error: any) {
    console.error('Error deleting diagnostic template:', error);
    toast.error(error.message || 'Failed to delete diagnostic template');
    return false;
  }
};

// =============================================
// STATISTICS
// =============================================

export const getDiagnosticStats = async (): Promise<DiagnosticStats> => {
  try {
    // Get request stats
    const { data: requests, error: requestsError } = await supabase
      .from('diagnostic_requests')
      .select('status');

    if (requestsError) {
      // Check if the error is due to missing tables
      if (requestsError.message && (
        requestsError.message.includes('relation "diagnostic_requests" does not exist') ||
        requestsError.code === 'PGRST116' ||
        requestsError.code === '42P01'
      )) {
        console.warn('Diagnostic tables do not exist yet. Returning empty stats.');
        return {
          total_requests: 0,
          pending_requests: 0,
          in_progress_requests: 0,
          completed_requests: 0,
          total_devices: 0,
          passed_devices: 0,
          failed_devices: 0,
          partially_failed_devices: 0,
          pending_devices: 0
        };
      }
      throw requestsError;
    }

    // Get device stats
    const { data: devices, error: devicesError } = await supabase
      .from('diagnostic_devices')
      .select('result_status');

    if (devicesError) {
      // Check if the error is due to missing tables
      if (devicesError.message && (
        devicesError.message.includes('relation "diagnostic_devices" does not exist') ||
        devicesError.code === 'PGRST116' ||
        devicesError.code === '42P01'
      )) {
        console.warn('Diagnostic tables do not exist yet. Returning empty stats.');
        return {
          total_requests: 0,
          pending_requests: 0,
          in_progress_requests: 0,
          completed_requests: 0,
          total_devices: 0,
          passed_devices: 0,
          failed_devices: 0,
          partially_failed_devices: 0,
          pending_devices: 0
        };
      }
      throw devicesError;
    }

    const stats: DiagnosticStats = {
      total_requests: requests?.length || 0,
      pending_requests: requests?.filter(r => r.status === 'pending').length || 0,
      in_progress_requests: requests?.filter(r => r.status === 'in_progress').length || 0,
      completed_requests: requests?.filter(r => r.status === 'completed').length || 0,
      total_devices: devices?.length || 0,
      passed_devices: devices?.filter(d => d.result_status === 'passed').length || 0,
      failed_devices: devices?.filter(d => d.result_status === 'failed').length || 0,
      partially_failed_devices: devices?.filter(d => d.result_status === 'partially_failed').length || 0,
      pending_devices: devices?.filter(d => d.result_status === 'pending').length || 0
    };

    return stats;
  } catch (error: any) {
    console.error('Error fetching diagnostic stats:', error);
    
    // Don't show toast error for missing tables - just return empty stats
    if (error.message && (
      error.message.includes('relation "diagnostic_requests" does not exist') ||
      error.message.includes('relation "diagnostic_devices" does not exist') ||
      error.code === 'PGRST116' ||
      error.code === '42P01'
    )) {
      console.warn('Diagnostic tables do not exist yet. Returning empty stats.');
    }
    
    return {
      total_requests: 0,
      pending_requests: 0,
      in_progress_requests: 0,
      completed_requests: 0,
      total_devices: 0,
      passed_devices: 0,
      failed_devices: 0,
      partially_failed_devices: 0,
      pending_devices: 0
    };
  }
};

// =============================================
// ADMIN FEEDBACK FUNCTIONS
// =============================================

export const submitAdminFeedback = async (data: UpdateAdminFeedbackData): Promise<boolean> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Determine new status based on admin action
    let newStatus = 'admin_reviewed';
    switch (data.next_action) {
      case 'repair':
        newStatus = 'repair_required';
        break;
      case 'replace':
        newStatus = 'replacement_required';
        break;
      case 'ignore':
        newStatus = 'no_action_required';
        break;
      case 'escalate':
        newStatus = 'escalated';
        break;
    }

    const { error } = await supabase
      .from('diagnostic_devices')
      .update({
        admin_feedback: data.admin_feedback,
        next_action: data.next_action,
        feedback_submitted_at: new Date().toISOString(),
        feedback_submitted_by: user.id,
        result_status: newStatus
      })
      .eq('id', data.device_id);

    if (error) throw error;

    toast.success('Admin feedback submitted successfully');
    return true;
  } catch (error: any) {
    console.error('Error submitting admin feedback:', error);
    toast.error(error.message || 'Failed to submit admin feedback');
    return false;
  }
};

export const markActionCompleted = async (data: MarkActionCompletedData): Promise<boolean> => {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('diagnostic_devices')
      .update({
        repair_completed_at: new Date().toISOString(),
        repair_notes: data.completion_notes,
        parts_used: data.parts_used,
        repair_time: data.repair_time,
        result_status: 'sent_to_care' // Send back to customer care after completion
      })
      .eq('id', data.device_id);

    if (error) throw error;

    // Show action-specific success message
    const actionMessages = {
      'repair': 'Repair completed successfully',
      'replace': 'Device replacement completed',
      'ignore': 'Device marked as no action required',
      'escalate': 'Device escalation completed'
    };

    toast.success(actionMessages[data.next_action] || 'Action completed successfully');
    return true;
  } catch (error: any) {
    console.error('Error marking action as completed:', error);
    toast.error(error.message || 'Failed to mark action as completed');
    return false;
  }
};

// =============================================
// UTILITY FUNCTIONS
// =============================================

export const getTechnicians = async (): Promise<{ id: string; name: string; username: string }[]> => {
  try {
    const { data, error } = await supabase
      .from('auth_users')
      .select('id, name, username')
      .eq('role', 'technician')
      .order('name', { ascending: true });

    if (error) throw error;

    return data || [];
  } catch (error: any) {
    console.error('Error fetching technicians:', error);
    return [];
  }
};

export const uploadDiagnosticImage = async (file: File): Promise<string | null> => {
  try {
    const fileName = `diagnostic-${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from('diagnostic-images')
      .upload(fileName, file);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('diagnostic-images')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error: any) {
    console.error('Error uploading image:', error);
    toast.error('Failed to upload image');
    return null;
  }
};