import { supabase } from './supabaseClient';
import { cacheSetAll, cacheGetAll } from './offlineCache';
import { Device } from '../types';

// Optimized function using efficient JOIN queries instead of N+1
export async function fetchAllDevices(): Promise<Device[]> {
  if (navigator.onLine) {
    try {
      // First try with customer join - use explicit column selection
      const { data, error } = await supabase
        .from('devices')
        .select(`
          id,
          customer_id,
          brand,
          model,
          serial_number,
          issue_description,
          status,
          assigned_to,
          expected_return_date,
          created_at,
          updated_at,
          unlock_code,
          repair_cost,
          deposit_amount,
          diagnosis_required,
          device_notes,
          device_cost,
          estimated_hours,
          device_condition,
          customers (id, name, phone, email),
          remarks:device_remarks(*),
          transitions:device_transitions(*),
          ratings:device_ratings(*)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.warn('Customer join failed, trying without customer data:', error);
        
        // Fallback: fetch devices without customer join - use explicit column selection
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('devices')
          .select(`
            id,
            customer_id,
            brand,
            model,
            serial_number,
            issue_description,
            status,
            assigned_to,
            expected_return_date,
            created_at,
            updated_at,
            remarks:device_remarks(*),
            transitions:device_transitions(*),
            ratings:device_ratings(*)
          `)
          .order('created_at', { ascending: false });
        
        if (fallbackError) {
          console.error('Error fetching devices:', fallbackError);
          throw fallbackError;
        }
        
        const devicesWithData = (fallbackData || []).map(device => {
          const transformedRemarks = (device.remarks || []).map((remark: any) => ({
            id: remark.id,
            content: remark.content,
            createdBy: remark.created_by,
            createdAt: remark.created_at
          }));
          
          const transformedTransitions = (device.transitions || []).map((transition: any) => ({
            id: transition.id,
            fromStatus: transition.from_status,
            toStatus: transition.to_status,
            performedBy: transition.performed_by,
            timestamp: transition.created_at,
            signature: transition.signature || ''
          }));
          
          const transformedRatings = (device.ratings || []).map((rating: any) => ({
            id: rating.id,
            deviceId: rating.device_id,
            technicianId: rating.technician_id,
            score: rating.score,
            comment: rating.comment,
            createdAt: rating.created_at
          }));

          return {
            ...device,
            serialNumber: device.serial_number,
            issueDescription: device.issue_description,
            customerId: device.customer_id,
            assignedTo: device.assigned_to,
            expectedReturnDate: device.expected_return_date,
            customerName: '', // No customer data available
            phoneNumber: '', // No customer data available
            remarks: transformedRemarks,
            transitions: transformedTransitions,
            ratings: transformedRatings,
            createdAt: device.created_at,
            updatedAt: device.updated_at,
          };
        });
        
        await cacheSetAll('devices', devicesWithData);
        return devicesWithData;
      }
      
      const devicesWithData = (data || []).map(device => {
        const transformedRemarks = (device.remarks || []).map((remark: any) => ({
          id: remark.id,
          content: remark.content,
          createdBy: remark.created_by,
          createdAt: remark.created_at
        }));
        
        const transformedTransitions = (device.transitions || []).map((transition: any) => ({
          id: transition.id,
          fromStatus: transition.from_status,
          toStatus: transition.to_status,
          performedBy: transition.performed_by,
          timestamp: transition.created_at,
          signature: transition.signature || ''
        }));
        
        const transformedRatings = (device.ratings || []).map((rating: any) => ({
          id: rating.id,
          deviceId: rating.device_id,
          technicianId: rating.technician_id,
          score: rating.score,
          comment: rating.comment,
          createdAt: rating.created_at
        }));

        return {
          ...device,
          serialNumber: device.serial_number,
          issueDescription: device.issue_description,
          customerId: device.customer_id,
          assignedTo: device.assigned_to,
          expectedReturnDate: device.expected_return_date,
          customerName: Array.isArray(device.customers) && device.customers.length > 0 ? device.customers[0]?.name || '' : '',
          phoneNumber: Array.isArray(device.customers) && device.customers.length > 0 ? device.customers[0]?.phone || '' : '',
          remarks: transformedRemarks,
          transitions: transformedTransitions,
          ratings: transformedRatings,
          createdAt: device.created_at,
          updatedAt: device.updated_at,
        };
      });
      
      await cacheSetAll('devices', devicesWithData);
      return devicesWithData;
    } catch (error) {
      console.error('Error fetching devices:', error);
      return await cacheGetAll('devices');
    }
  } else {
    return await cacheGetAll('devices');
  }
}

export async function fetchAllDevicesDirect() {
  const { data, error } = await supabase
    .from('devices')
    .select(`
      id,
      customer_id,
      brand,
      model,
      serial_number,
      issue_description,
      status,
      assigned_to,
      expected_return_date,
      created_at,
      updated_at
    `);
  if (error) throw error;
  return (data || []).map(device => ({
    ...device,
    createdAt: device.created_at,
    updatedAt: device.updated_at,
  }));
}

export async function addDeviceToDb(device: Device) {
  // Map camelCase fields to snake_case for DB
  const dbDevice = {
    id: device.id,
    customer_id: device.customerId,
    brand: device.brand,
    model: device.model,
    serial_number: device.serialNumber,
    issue_description: device.issueDescription,
    status: device.status,
    assigned_to: device.assignedTo || null,
    // Fix: set expected_return_date to null if empty string
    expected_return_date: device.expectedReturnDate === '' ? null : device.expectedReturnDate,
    created_at: device.createdAt,
    updated_at: device.updatedAt,

  };
  
  // Insert device first
  const { data: deviceData, error: deviceError } = await supabase.from('devices').insert([dbDevice]).select();
  if (deviceError) throw deviceError;
  

  
  return deviceData && deviceData[0] ? deviceData[0] : null;
}

export async function updateDeviceInDb(deviceId: string, updates: Partial<Device>) {
  // Map camelCase fields to snake_case for DB
  const dbUpdates: any = { ...updates };
  if ('assignedTo' in dbUpdates) {
    dbUpdates.assigned_to = dbUpdates.assignedTo;
    delete dbUpdates.assignedTo;
  }
  if ('serialNumber' in dbUpdates) {
    dbUpdates.serial_number = dbUpdates.serialNumber;
    delete dbUpdates.serialNumber;
  }
  if ('issueDescription' in dbUpdates) {
    dbUpdates.issue_description = dbUpdates.issueDescription;
    delete dbUpdates.issueDescription;
  }
  if ('customerId' in dbUpdates) {
    dbUpdates.customer_id = dbUpdates.customerId;
    delete dbUpdates.customerId;
  }
  if ('expectedReturnDate' in dbUpdates) {
    dbUpdates.expected_return_date = dbUpdates.expectedReturnDate;
    delete dbUpdates.expectedReturnDate;
  }
  

  
  // Only allow fields that are valid columns in the devices table
  const validDeviceFields = [
    'id', 'customer_id', 'brand', 'model', 'serial_number', 'issue_description', 'status', 'assigned_to', 'estimated_hours', 'expected_return_date', 'created_at', 'updated_at'
  ];
  Object.keys(dbUpdates).forEach(key => {
    if (!validDeviceFields.includes(key)) {
      delete dbUpdates[key];
    }
  });
  
  console.log('[updateDeviceInDb] Sending update to DB:', dbUpdates);
  const { data, error } = await supabase
    .from('devices')
    .update(dbUpdates)
    .eq('id', deviceId)
    .select();
  if (error) throw error;
  

  
  return data && data[0] ? { ...data[0], assignedTo: data[0].assigned_to } : null;
}

export async function deleteDeviceFromDb(deviceId: string) {
  const { error } = await supabase
    .from('devices')
    .delete()
    .eq('id', deviceId);
  if (error) throw error;
  return true;
}

// Enhanced pagination with efficient JOIN queries
export async function fetchDevicesPage(page: number, pageSize: number = 20): Promise<Device[]> {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  
  if (navigator.onLine) {
    try {
      // First try with customer join - use explicit column selection
      const { data, error } = await supabase
        .from('devices')
        .select(`
          id,
          customer_id,
          brand,
          model,
          serial_number,
          issue_description,
          status,
          assigned_to,
          expected_return_date,
          created_at,
          updated_at,
          unlock_code,
          repair_cost,
          deposit_amount,
          diagnosis_required,
          device_notes,
          device_cost,
          estimated_hours,
          device_condition,
          customers (id, name, phone, email),
          remarks:device_remarks(*),
          transitions:device_transitions(*),
          ratings:device_ratings(*)
        `)
        .order('created_at', { ascending: false })
        .range(from, to);
      
      if (error) {
        console.warn('Customer join failed in pagination, trying without customer data:', error);
        
        // Fallback: fetch devices without customer join - use explicit column selection
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('devices')
          .select(`
            id,
            customer_id,
            brand,
            model,
            serial_number,
            issue_description,
            status,
            assigned_to,
            expected_return_date,
            created_at,
            updated_at,
            remarks:device_remarks(*),
            transitions:device_transitions(*),
            ratings:device_ratings(*)
          `)
          .order('created_at', { ascending: false })
          .range(from, to);
        
        if (fallbackError) {
          console.error('Error fetching devices page:', fallbackError);
          throw fallbackError;
        }
        
        const devicesWithData = (fallbackData || []).map(device => {
          const transformedRemarks = (device.remarks || []).map((remark: any) => ({
            id: remark.id,
            content: remark.content,
            createdBy: remark.created_by,
            createdAt: remark.created_at
          }));
          
          const transformedTransitions = (device.transitions || []).map((transition: any) => ({
            id: transition.id,
            fromStatus: transition.from_status,
            toStatus: transition.to_status,
            performedBy: transition.performed_by,
            timestamp: transition.created_at,
            signature: transition.signature || ''
          }));
          
          const transformedRatings = (device.ratings || []).map((rating: any) => ({
            id: rating.id,
            deviceId: rating.device_id,
            technicianId: rating.technician_id,
            score: rating.score,
            comment: rating.comment,
            createdAt: rating.created_at
          }));

          return {
            ...device,
            serialNumber: device.serial_number,
            issueDescription: device.issue_description,
            customerId: device.customer_id,
            assignedTo: device.assigned_to,
            expectedReturnDate: device.expected_return_date,
            customerName: '', // No customer data available
            phoneNumber: '', // No customer data available
            remarks: transformedRemarks,
            transitions: transformedTransitions,
            ratings: transformedRatings,
            createdAt: device.created_at,
            updatedAt: device.updated_at,
          };
        });
        
        return devicesWithData;
      }
      
      const devicesWithData = (data || []).map(device => {
        const transformedRemarks = (device.remarks || []).map((remark: any) => ({
          id: remark.id,
          content: remark.content,
          createdBy: remark.created_by,
          createdAt: remark.created_at
        }));
        
        const transformedTransitions = (device.transitions || []).map((transition: any) => ({
          id: transition.id,
          fromStatus: transition.from_status,
          toStatus: transition.to_status,
          performedBy: transition.performed_by,
          timestamp: transition.created_at,
          signature: transition.signature || ''
        }));
        
        const transformedRatings = (device.ratings || []).map((rating: any) => ({
          id: rating.id,
          deviceId: rating.device_id,
          technicianId: rating.technician_id,
          score: rating.score,
          comment: rating.comment,
          createdAt: rating.created_at
        }));

        return {
          ...device,
          serialNumber: device.serial_number,
          issueDescription: device.issue_description,
          customerId: device.customer_id,
          assignedTo: device.assigned_to,
          expectedReturnDate: device.expected_return_date,
          customerName: Array.isArray(device.customers) && device.customers.length > 0 ? device.customers[0]?.name || '' : '',
          phoneNumber: Array.isArray(device.customers) && device.customers.length > 0 ? device.customers[0]?.phone || '' : '',
          remarks: transformedRemarks,
          transitions: transformedTransitions,
          ratings: transformedRatings,
          createdAt: device.created_at,
          updatedAt: device.updated_at,
        };
      });
      
      return devicesWithData;
    } catch (error) {
      console.error('Error fetching devices page:', error);
      throw error;
    }
  } else {
    return await cacheGetAll('devices');
  }
}

// Get total count for pagination
export async function getDevicesCount(): Promise<number> {
  if (navigator.onLine) {
    const { count, error } = await supabase
      .from('devices')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    return count || 0;
  } else {
    const all = await cacheGetAll('devices');
    return all.length;
  }
}

export const deviceServices = {};
export const inventoryService = {};
export default inventoryService; 