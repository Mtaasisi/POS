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
          estimated_hours,
          diagnosis_required,
          device_notes,
          repair_cost,
          deposit_amount,
          device_cost,
          repair_price,
          customers (id, name, phone, email, loyalty_level, total_spent, last_visit, color_tag)
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
            estimated_hours,
            diagnosis_required,
            device_notes,
            repair_cost,
            deposit_amount,
            device_cost,
            repair_price
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
            score: rating.score || 5, // Default to 5 if score column doesn't exist
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
        // Related data will be fetched separately on details page

        return {
          ...device,
          serialNumber: device.serial_number,
          issueDescription: device.issue_description,
          customerId: device.customer_id,
          assignedTo: device.assigned_to,
          expectedReturnDate: device.expected_return_date,
          customerName: device.customers?.name || '',
          phoneNumber: Array.isArray(device.customers) && device.customers.length > 0 ? device.customers[0]?.phone || '' : '',
          customerEmail: Array.isArray(device.customers) && device.customers.length > 0 ? device.customers[0]?.email || '' : '',
          customerLoyaltyLevel: Array.isArray(device.customers) && device.customers.length > 0 ? device.customers[0]?.loyalty_level || '' : '',
          customerTotalSpent: Array.isArray(device.customers) && device.customers.length > 0 ? device.customers[0]?.total_spent || 0 : 0,
          customerLastVisit: Array.isArray(device.customers) && device.customers.length > 0 ? device.customers[0]?.last_visit || null : null,
          customerColorTag: Array.isArray(device.customers) && device.customers.length > 0 ? device.customers[0]?.color_tag || '' : '',
          // Cost fields
          repairCost: device.repair_cost,
          depositAmount: device.deposit_amount,
          deviceCost: device.device_cost,
          repairPrice: device.repair_price,
          // Additional device fields
          unlockCode: null,
          diagnosisRequired: device.diagnosis_required,
          deviceNotes: device.device_notes,
          deviceCondition: null,
          // Checklist fields
          diagnosticChecklist: null,
          repairChecklist: null,
          remarks: [],
          transitions: [],
          ratings: [],
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
    unlock_code: device.unlockCode || null,
    repair_cost: device.repairCost || null,
    deposit_amount: device.depositAmount || null,
    diagnosis_required: device.diagnosisRequired || false,
    device_notes: device.deviceNotes || null,
    device_cost: device.deviceCost || null,
    estimated_hours: device.estimatedHours || null,
    device_condition: device.deviceCondition || null,
  };
  
  // Insert device first
  const { data: deviceData, error: deviceError } = await supabase.from('devices').insert([dbDevice]).select();
  if (deviceError) throw deviceError;
  

  
  return deviceData && deviceData[0] ? deviceData[0] : null;
}

// Utility function to fix corrupted device data
export async function fixCorruptedDeviceData(deviceId: string) {
  console.log('[fixCorruptedDeviceData] Attempting to fix corrupted device:', deviceId);
  
  try {
    // Get the current device data
    const { data: device, error: fetchError } = await supabase
      .from('devices')
      .select('*')
      .eq('id', deviceId)
      .single();
      
    if (fetchError || !device) {
      console.error('[fixCorruptedDeviceData] Could not fetch device:', fetchError);
      return false;
    }
    
    // Check if status is a UUID
    if (device.status && device.status.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      console.log('[fixCorruptedDeviceData] Found corrupted status field:', device.status);
      
      // Reset to a safe default status
      const { error: updateError } = await supabase
        .from('devices')
        .update({ status: 'assigned' })
        .eq('id', deviceId);
        
      if (updateError) {
        console.error('[fixCorruptedDeviceData] Failed to fix device:', updateError);
        return false;
      }
      
      console.log('[fixCorruptedDeviceData] ✅ Successfully fixed corrupted device data');
      return true;
    }
    
    return false; // No corruption found
  } catch (error) {
    console.error('[fixCorruptedDeviceData] Error fixing device:', error);
    return false;
  }
}

export async function updateDeviceInDb(deviceId: string, updates: Partial<Device>) {
  console.log('[updateDeviceInDb] Called with:', { deviceId, updates });
  
  // Valid device status values
  const validStatusValues = [
    'assigned', 'diagnosis-started', 'awaiting-parts', 'in-repair',
    'reassembled-testing', 'repair-complete', 'returned-to-customer-care', 'done', 'failed'
  ];
  
  // Only process fields that exist in the database schema
  const validUpdateFields = [
    'assignedTo', 'serialNumber', 'issueDescription', 'customerId', 
    'expectedReturnDate', 'estimatedHours', 'warrantyStart', 'warrantyEnd', 
    'warrantyStatus', 'repairCount', 'lastReturnDate', 'brand', 'model', 'status'
  ];
  
  // Filter updates to only include valid fields and validate status
  const filteredUpdates: any = {};
  Object.keys(updates).forEach(key => {
    if (validUpdateFields.includes(key) && updates[key as keyof Device] !== undefined) {
      const value = updates[key as keyof Device];
      
      // Special validation for status field
      if (key === 'status') {
        if (typeof value === 'string' && validStatusValues.includes(value)) {
          filteredUpdates[key] = value;
          console.log('[updateDeviceInDb] ✅ Valid status value:', value);
        } else {
          console.warn('[updateDeviceInDb] ❌ Invalid status value rejected:', value);
          console.warn('[updateDeviceInDb] Valid status values are:', validStatusValues);
          
          // Check if it's a UUID (common bug)
          if (typeof value === 'string' && value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            console.error('[updateDeviceInDb] 🚨 CRITICAL BUG: Status field contains UUID instead of valid status!');
            console.error('[updateDeviceInDb] This indicates a data corruption bug in the application.');
            console.error('[updateDeviceInDb] Device ID:', deviceId, 'Invalid status UUID:', value);
          }
          
          // Don't add invalid status values
          return;
        }
      } else {
        filteredUpdates[key] = value;
      }
    }
  });
  
  console.log('[updateDeviceInDb] Filtered updates:', filteredUpdates);
  
  // Check if there are any valid updates to process
  if (Object.keys(filteredUpdates).length === 0) {
    console.warn('[updateDeviceInDb] No valid updates to process after filtering');
    return { success: false, message: 'No valid updates to process' };
  }
  
  // Map camelCase fields to snake_case for DB
  const dbUpdates: any = { ...filteredUpdates };
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
  if ('estimatedHours' in dbUpdates) {
    dbUpdates.estimated_hours = dbUpdates.estimatedHours;
    delete dbUpdates.estimatedHours;
  }
  if ('warrantyStart' in dbUpdates) {
    dbUpdates.warranty_start = dbUpdates.warrantyStart;
    delete dbUpdates.warrantyStart;
  }
  if ('warrantyEnd' in dbUpdates) {
    dbUpdates.warranty_end = dbUpdates.warrantyEnd;
    delete dbUpdates.warrantyEnd;
  }
  if ('warrantyStatus' in dbUpdates) {
    dbUpdates.warranty_status = dbUpdates.warrantyStatus;
    delete dbUpdates.warrantyStatus;
  }
  if ('repairCount' in dbUpdates) {
    dbUpdates.repair_count = dbUpdates.repairCount;
    delete dbUpdates.repairCount;
  }
  if ('lastReturnDate' in dbUpdates) {
    dbUpdates.last_return_date = dbUpdates.lastReturnDate;
    delete dbUpdates.lastReturnDate;
  }
  

  
  // Only allow fields that are valid columns in the devices table (based on actual database schema)
  const validDeviceFields = [
    'id', 'customer_id', 'brand', 'model', 'serial_number', 'issue_description', 'status', 'assigned_to', 'estimated_hours', 'expected_return_date', 'warranty_start', 'warranty_end', 'warranty_status', 'repair_count', 'last_return_date', 'diagnostic_checklist', 'repair_checklist', 'created_at', 'updated_at'
  ];
  Object.keys(dbUpdates).forEach(key => {
    if (!validDeviceFields.includes(key)) {
      console.warn(`[updateDeviceInDb] Removing invalid field: ${key}`);
      delete dbUpdates[key];
    }
  });
  
  console.log('[updateDeviceInDb] Sending update to DB:', dbUpdates);
  console.log('[updateDeviceInDb] Device ID:', deviceId);
  console.log('[updateDeviceInDb] Update fields count:', Object.keys(dbUpdates).length);
  
  // First check if the device exists and get current data
  console.log('[updateDeviceInDb] Checking if device exists...');
  const { data: existingDevice, error: checkError } = await supabase
    .from('devices')
    .select('*')
    .eq('id', deviceId)
    .single();
    
  if (checkError) {
    console.error('[updateDeviceInDb] Device not found:', checkError);
    console.error('[updateDeviceInDb] Check error details:', {
      message: checkError.message,
      details: checkError.details,
      hint: checkError.hint,
      code: checkError.code
    });
    throw new Error(`Device with ID ${deviceId} not found`);
  }
  
  console.log('[updateDeviceInDb] ✅ Device exists:', {
    id: existingDevice.id,
    brand: existingDevice.brand,
    model: existingDevice.model,
    status: existingDevice.status,
    customer_id: existingDevice.customer_id
  });
  
  // Show what fields will be updated
  console.log('[updateDeviceInDb] Fields being updated:');
  Object.keys(dbUpdates).forEach(key => {
    const oldValue = existingDevice[key];
    const newValue = dbUpdates[key];
    console.log(`  ${key}: "${oldValue}" → "${newValue}"`);
  });
  
  console.log('[updateDeviceInDb] Executing database update...');
  const { data, error } = await supabase
    .from('devices')
    .update(dbUpdates)
    .eq('id', deviceId)
    .select();
    
  if (error) {
    console.error('[updateDeviceInDb] ❌ Database update failed:', error);
    console.error('[updateDeviceInDb] Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    console.error('[updateDeviceInDb] Failed update data:', dbUpdates);
    throw error;
  }
  
  console.log('[updateDeviceInDb] ✅ Database update successful!');
  console.log('[updateDeviceInDb] Updated device data:', data && data[0] ? {
    id: data[0].id,
    brand: data[0].brand,
    model: data[0].model,
    status: data[0].status,
    updated_at: data[0].updated_at
  } : 'No data returned');
  
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
          estimated_hours,
          diagnosis_required,
          device_notes,
          repair_cost,
          deposit_amount,
          device_cost,
          repair_price,
          customers (id, name, phone, email, loyalty_level, total_spent, last_visit, color_tag)
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
            estimated_hours,
            diagnosis_required,
            device_notes,
            repair_cost,
            deposit_amount,
            device_cost,
            repair_price
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
            score: rating.score || 5, // Default to 5 if score column doesn't exist
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
        // Related data will be fetched separately on details page

        return {
          ...device,
          serialNumber: device.serial_number,
          issueDescription: device.issue_description,
          customerId: device.customer_id,
          assignedTo: device.assigned_to,
          expectedReturnDate: device.expected_return_date,
          customerName: device.customers?.name || '',
          phoneNumber: Array.isArray(device.customers) && device.customers.length > 0 ? device.customers[0]?.phone || '' : '',
          customerEmail: Array.isArray(device.customers) && device.customers.length > 0 ? device.customers[0]?.email || '' : '',
          customerLoyaltyLevel: Array.isArray(device.customers) && device.customers.length > 0 ? device.customers[0]?.loyalty_level || '' : '',
          customerTotalSpent: Array.isArray(device.customers) && device.customers.length > 0 ? device.customers[0]?.total_spent || 0 : 0,
          customerLastVisit: Array.isArray(device.customers) && device.customers.length > 0 ? device.customers[0]?.last_visit || null : null,
          customerColorTag: Array.isArray(device.customers) && device.customers.length > 0 ? device.customers[0]?.color_tag || '' : '',
          // Cost fields
          repairCost: device.repair_cost,
          depositAmount: device.deposit_amount,
          deviceCost: device.device_cost,
          repairPrice: device.repair_price,
          // Additional device fields
          unlockCode: null,
          diagnosisRequired: device.diagnosis_required,
          deviceNotes: device.device_notes,
          deviceCondition: null,
          // Checklist fields
          diagnosticChecklist: null,
          repairChecklist: null,
          remarks: [],
          transitions: [],
          ratings: [],
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
      .select('id', { count: 'exact', head: true });
    
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