import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Device, DeviceStatus, Remark, Transition, Rating } from '../types';
import { AuthContext } from './AuthContext';
import { fetchAllDevices, addDeviceToDb, updateDeviceInDb, deleteDeviceFromDb } from '../lib/deviceApi';
import { addDeviceRating } from '../lib/customerExtrasApi';
import { updateCustomerInDb } from '../lib/customerApi';
import { smsService } from '../services/smsService';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { calculatePointsForDevice } from '../lib/pointsConfig';
import { emailService } from '../services/emailService';
import { auditService } from '../lib/auditService';
import { SoundManager } from '../lib/soundUtils';

interface DevicesContextType {
  devices: Device[];
  loading: boolean;
  addDevice: (device: Omit<Device, 'id' | 'createdAt' | 'updatedAt' | 'transitions' | 'remarks'>) => Promise<Device>;
  updateDeviceStatus: (deviceId: string, newStatus: DeviceStatus, signature: string) => Promise<boolean>;
  assignToTechnician: (deviceId: string, technicianId: string, signature: string) => Promise<boolean>;
  addRemark: (deviceId: string, content: string) => Promise<boolean>;
  getDeviceById: (id: string) => Device | undefined;
  getDevicesByStatus: (status: DeviceStatus) => Device[];
  getDevicesByTechnician: (technicianId: string) => Device[];
  addRating: (deviceId: string, technicianId: string, score: number, comment: string) => Promise<boolean>;
  getTechnicianRating: (technicianId: string) => number;
  deleteDevice: (deviceId: string) => Promise<boolean>;
  getDevicesDueToday: () => Device[];
  getOverdueDevices: () => Device[];
  getDeviceOverdueStatus: (device: Device) => { isOverdue: boolean; overdueTime: string | null; status: string };
}

const DevicesContext = createContext<DevicesContextType | undefined>(undefined);

export const useDevices = () => {
  const context = useContext(DevicesContext);
  if (!context) {
    throw new Error('useDevices must be used within a DevicesProvider');
  }
  return context;
};

// Export the context for debugging
export { DevicesContext };

// Stub: get all customer care emails (replace with real query in production)
async function getAllCustomerCareEmails(): Promise<string[]> {
  // Example: fetch from supabase users table where role = 'customer-care'
  const { data, error } = await supabase
    .from('auth_users')
    .select('email')
    .eq('role', 'customer-care');
  if (error || !data) return [];
  return data.map((u: { email: string }) => u.email).filter(Boolean);
}

export const DevicesProvider: React.FC<{ children: React.ReactNode }> = React.memo(({ children }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Safely get auth context with fallback
  const authContext = useContext(AuthContext);
  const currentUser = authContext?.currentUser || null;
  
  // Track seen remark IDs to avoid duplicate sounds
  const seenRemarkIds = useRef<Set<string>>(new Set());

  // Play sound for new incoming remarks (not sent by current user)
  useEffect(() => {
    if (!currentUser) return;
    for (const device of devices) {
      for (const remark of device.remarks || []) {
        if (!seenRemarkIds.current.has(remark.id) && remark.createdBy !== currentUser.id) {
          // Use the safe sound play method that handles user interaction
          SoundManager.playRemarkSound().catch(() => {
            // Silently ignore sound play errors
          });
          seenRemarkIds.current.add(remark.id);
        }
      }
    }
  }, [devices, currentUser]);

  useEffect(() => {
    // Only fetch devices if we have a current user
    if (!currentUser) {
      return;
    }
    
    setLoading(true);
    
    // Use role-based device fetching
    const fetchDevices = async () => {
      try {
        let devicesData: Device[];
        
        if (currentUser.role === 'technician') {
          // For technicians, fetch only assigned devices
          const { deviceServices } = await import('../lib/deviceServices');
          devicesData = await deviceServices.getDevicesByTechnician(currentUser.id);
        } else {
          // For other roles, fetch all devices
          devicesData = await fetchAllDevices();
        }
        
        setDevices(devicesData);
      } catch (error) {
        console.error('Error fetching devices:', error);
        setDevices([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDevices();
  }, [currentUser]);

  // Persist device to DB
  const addDevice = async (deviceData: Omit<Device, 'id' | 'createdAt' | 'updatedAt' | 'transitions' | 'remarks'>) => {
    if (!currentUser) throw new Error('User not authenticated');
    if (currentUser.role === 'technician') {
      throw new Error('Technicians are not allowed to create devices.');
    }
    const newDeviceId = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const newDevice: Device = {
      ...deviceData,
      id: newDeviceId,
      createdAt: timestamp,
      updatedAt: timestamp,
      status: 'assigned', // Start as assigned to match DB constraint
      remarks: [],
      transitions: [{
        id: `t-${Date.now()}`,
        fromStatus: 'assigned',
        toStatus: 'assigned',
        performedBy: currentUser.id,
        timestamp: timestamp,
        signature: ''
      }]
    };
    const dbDevice = await addDeviceToDb(newDevice);
    if (!dbDevice) throw new Error('Failed to add device to database');
    
    // Automatically add points to customer for new device creation
    try {
      const customerId = deviceData.customerId;
      
      // Get current customer data to calculate new points
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('points, loyalty_level')
        .eq('id', customerId)
        .single();
      
      if (!customerError && customerData) {
        const pointsToAdd = calculatePointsForDevice(deviceData, customerData.loyalty_level);
        
        if (pointsToAdd === 0) {
          console.log('⚠️ No points awarded. This could be because:');
          console.log('   - Points system is disabled');
          console.log('   - Device brand/model not in bonus list');
          console.log('   - Customer loyalty level issue');
        }
        
        const currentPoints = customerData.points || 0;
        const newPoints = currentPoints + pointsToAdd;
        
        // Update customer points in database
        const updateResult = await updateCustomerInDb(customerId, { points: newPoints });
        
        // Add a note about the points being added
        try {
          const noteData = {
            content: `+${pointsToAdd} points for new device: ${deviceData.brand} ${deviceData.model}`,
            created_by: currentUser.id,
            customer_id: customerId
          };
          const noteResult = await supabase.from('customer_notes').insert(noteData);
          
          if (noteResult.error) {
            console.error('❌ Note insertion error:', noteResult.error);
          }
        } catch (noteError) {
          console.warn('Could not add note about points:', noteError);
        }
        
        console.debug(`✅ Added ${pointsToAdd} points to customer ${customerId}. New total: ${newPoints}`);
        
        // Show success notification
        toast.success(`Added ${pointsToAdd} loyalty points to customer for new device intake!`);
      } else {
        console.warn('❌ Could not update customer points:', customerError);
        console.warn('Customer data:', customerData);
      }
    } catch (error) {
      console.error('💥 Error adding points to customer:', error);
      // Don't fail the device creation if points update fails
    }
    
    setDevices(prev => {
      // Remove any device with the same id or serialNumber before adding the new one
      const filtered = prev.filter(d => d.id !== dbDevice.id && d.serialNumber !== dbDevice.serialNumber);
      return [...filtered, dbDevice];
    });

    // Send SMS notification to customer
    try {
      // Get customer information for SMS
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('name, phone')
        .eq('id', deviceData.customerId)
        .single();

      if (!customerError && customerData && customerData.phone) {
        console.log('📱 Sending device received SMS to:', customerData.phone);
        
        const smsResult = await smsService.sendDeviceReceivedSMS(
          customerData.phone,
          customerData.name || 'Mteja',
          deviceData.brand,
          deviceData.model,
          newDeviceId,
          deviceData.issueDescription || 'Ukarabati wa kifaa',
          deviceData.customerId
        );

        if (smsResult.success) {
          console.log('✅ SMS sent successfully');
          toast.success('SMS notification sent to customer');
        } else {
          console.error('❌ SMS sending failed:', smsResult.error);
          toast.error('SMS notification failed to send');
        }
      } else {
        console.warn('⚠️ Could not send SMS - customer phone not found:', customerError);
      }
    } catch (smsError) {
      console.error('💥 Error sending SMS notification:', smsError);
      // Don't fail device creation if SMS fails
    }

    // Play sound when device is received
    try {
      await SoundManager.playSuccessSound();
    } catch (error) {
      console.warn('Could not play device received sound:', error);
    }

    return { ...newDevice, ...dbDevice };
  };

  // Persist status update to DB
  const updateDeviceStatus = async (deviceId: string, newStatus: DeviceStatus, signature: string) => {
    if (!currentUser) return false;
    const device = devices.find(d => d.id === deviceId);
    if (!device) return false;
    const transition: Transition = {
      id: `t-${Date.now()}`,
      fromStatus: device.status,
      toStatus: newStatus,
      performedBy: currentUser.id,
      timestamp: new Date().toISOString(),
      signature: signature
    };
    // Insert transition into device_transitions table
    await supabase.from('device_transitions').insert({
      device_id: deviceId,
      from_status: device.status,
      to_status: newStatus,
      performed_by: currentUser.id,
      created_at: transition.timestamp,
      signature: signature
    });
    const updatedDevice: Device = {
      ...device,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      transitions: [...(device.transitions || []), transition]
    };
    const dbDevice = await updateDeviceInDb(deviceId, updatedDevice);
    if (!dbDevice) return false;
    setDevices(prev => prev.map(d => d.id === deviceId ? { ...updatedDevice, ...dbDevice } : d));

    // --- Automatic SMS Trigger Logic ---
    // 1. Check for trigger for this status
    let triggers = [];
    try {
      const { data, error, status } = await supabase.from('sms_triggers').select('*').eq('trigger_type', newStatus);
      if (error && status !== 406 && status !== 400) throw error;
      triggers = data || [];
    } catch (err) {
      // Silently ignore errors for missing triggers
      triggers = [];
    }
    if (triggers && triggers.length > 0) {
      // 2. For each trigger, fetch template and customer phone
      for (const trigger of triggers) {
        // Fetch template
        const { data: template, error: templateError } = await supabase
          .from('communication_templates')
          .select('*')
          .eq('id', trigger.template_id)
          .eq('is_active', true)
          .single();
        if (!template || templateError) continue;
        // Fetch customer phone and data
        const { data: customer, error: customerError } = await supabase
          .from('customers')
          .select('*')
          .eq('id', device.customerId)
          .single();
        if (!customer || customerError || !customer.phone) continue;
        // --- Check trigger conditions ---
        if (trigger.condition) {
          if (trigger.condition.brand && device.brand !== trigger.condition.brand) continue;
          if (trigger.condition.customerTag && customer.customerTag !== trigger.condition.customerTag) continue;
        }
        // Try to auto-fill variables from device/customer
        const variables: Record<string, string> = {};
        let missingVariable = false;
        if (template.variables && Array.isArray(template.variables)) {
          for (const v of template.variables) {
            const key = v as keyof typeof device;
            const custKey = v as keyof typeof customer;
            if (device[key] !== undefined) variables[v] = String(device[key]);
            else if (customer[custKey] !== undefined) variables[v] = String(customer[custKey]);
            else { missingVariable = true; variables[v] = ''; }
          }
        }
        if (missingVariable) {
          // Log as missing variable, skip sending
          await supabase.from('sms_trigger_logs').insert({
            trigger_id: trigger.id,
            device_id: deviceId,
            customer_id: device.customerId,
            status: newStatus,
            template_id: template.id,
            recipient: customer.phone,
            result: 'skipped',
            error: 'Missing variable(s) for template'
          });
          continue;
        }
        // Send SMS
        const result = await smsService.sendTemplateSMS(customer.phone, template.id, variables, device.customerId);
        // Log trigger action
        await supabase.from('sms_trigger_logs').insert({
          trigger_id: trigger.id,
          device_id: deviceId,
          customer_id: device.customerId,
          status: newStatus,
          template_id: template.id,
          recipient: customer.phone,
          result: result.success ? 'sent' : 'failed',
          error: result.error || null
        });
      }
    }
    // --- End SMS Trigger Logic ---

    // --- Custom Notification Logic ---
    if (newStatus === 'repair-complete') {
      // Award points to technician for completing repair
      if (device.assignedTo && currentUser?.role === 'technician') {
        try {
          // Update technician points in auth_users table
          try {
            const { data: technicianData, error: technicianError } = await supabase
              .from('auth_users')
              .select('points')
              .eq('id', device.assignedTo)
              .single();
            
            if (!technicianError && technicianData) {
              const currentPoints = technicianData.points || 0;
              const newPoints = currentPoints + 20;
              
              const { error: updateError } = await supabase
                .from('auth_users')
                .update({ points: newPoints })
                .eq('id', device.assignedTo);
              
              if (!updateError) {
                toast.success(`Repair completed! +20 points awarded. Total: ${newPoints} points`);
                
                // Log points transaction
                await supabase
                  .from('points_transactions')
                  .insert({
                    user_id: device.assignedTo,
                    points_change: 20,
                    transaction_type: 'repair_completion',
                    reason: `Repair completed for device ${device.brand} ${device.model}`,
                    created_by: currentUser.id
                  });
              } else {
                console.error('Error updating technician points:', updateError);
                // Still show success message even if points update fails
                toast.success('Repair completed successfully!');
              }
            } else {
              console.error('Error fetching technician data:', technicianError);
              toast.success('Repair completed successfully!');
            }
          } catch (error) {
            console.error('Error awarding points for repair completion:', error);
            toast.success('Repair completed successfully!');
          }
        } catch (error) {
          console.error('Error awarding points for repair completion:', error);
        }
      }
      
      // Notify customer care (in-app and email)
      toast.success('Device ready for handover. Customer care notified.');
      // Example: send email to all customer care staff (stub, implement getAllCustomerCareEmails)
      if (typeof emailService !== 'undefined' && emailService.sendEmail) {
        const ccEmails = await getAllCustomerCareEmails();
        if (ccEmails.length > 0) {
          await emailService.sendEmail({
            to: ccEmails.join(','),
            subject: 'Device Ready for Handover',
            content: `Device ${device.brand} ${device.model} (SN: ${device.serialNumber}) is ready for customer handover.`,
          });
        }
      }
    }
    if (newStatus === 'done') {
      // Notify customer (SMS/email)
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('name, phone, email')
        .eq('id', device.customerId)
        .single();
      if (!customerError && customer) {
        if (customer.phone && smsService && smsService.sendDeviceReadySMS) {
          await smsService.sendDeviceReadySMS(
            customer.phone,
            customer.name || 'Customer',
            device.brand,
            device.model,
            device.id,
            device.customerId
          );
        }
        if (customer.email && typeof emailService !== 'undefined' && emailService.sendEmail) {
          await emailService.sendEmail({
            to: customer.email,
            subject: 'Your Device is Ready for Pickup',
            content: `Dear ${customer.name},\n\nYour device (${device.brand} ${device.model}, SN: ${device.serialNumber}) is ready for pickup.\n\nThank you.`
          });
        }
      }
    }
    // --- End Custom Notification Logic ---

    // Log audit trail
    await auditService.logDeviceStatusChange(
      deviceId,
      currentUser.id,
      currentUser.role,
      device.status,
      newStatus,
      signature
    );

    // (Stub) Reminder system for overdue handovers would be implemented as a background job or scheduled check.

    return true;
  };

  // Persist device deletion to DB
  const deleteDevice = async (deviceId: string) => {
    await deleteDeviceFromDb(deviceId);
    setDevices(prev => prev.filter(d => d.id !== deviceId));
    return true;
  };

  const assignToTechnician = async (deviceId: string, technicianId: string, signature: string) => {
    if (!currentUser) return false;
    const device = devices.find(d => d.id === deviceId);
    if (!device) return false;
    // Only update assignedTo, do not change status
    const updates = {
      assignedTo: technicianId,
      updatedAt: new Date().toISOString(),
    };
    try {
      const dbDevice = await updateDeviceInDb(deviceId, updates);
      if (!dbDevice) return false;
      setDevices(prev => prev.map(d => d.id === deviceId ? { ...d, ...updates, ...dbDevice, assignedTo: dbDevice.assigned_to } : d));
      return true;
    } catch (err) {
      console.error('[assignToTechnician] Error updating device:', err);
      return false;
    }
  };

  const addRemark = async (deviceId: string, content: string) => {
    if (!currentUser) return false;
    
    const newRemark: Remark = {
      id: crypto.randomUUID(),
      content,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString()
    };
    
    setDevices(prev => prev.map(device => {
      if (device.id === deviceId) {
        return {
          ...device,
          remarks: [...device.remarks, newRemark],
          updatedAt: new Date().toISOString()
        };
      }
      return device;
    }));
    
    // Insert remark into device_remarks table
    try {
      const { error } = await supabase.from('device_remarks').insert({
        id: newRemark.id,
        device_id: deviceId,
        content: content,
        created_by: currentUser.id,
        created_at: newRemark.createdAt
      });
      if (error) {
        console.error('Failed to insert remark into database:', error);
        return false;
      }
    } catch (err) {
      console.error('Error inserting remark into database:', err);
      return false;
    }
    // Play sound when remark is sent
    try {
      await SoundManager.playRemarkSound();
    } catch (error) {
      console.warn('Could not play remark sound:', error);
    }
    
    return true;
  };

  const getDeviceById = async (id: string) => {
    // First try to get from local state
    const localDevice = devices.find(device => device.id === id);
    
    // If found in local state, return it
    if (localDevice) {
      return localDevice;
    }
    
    // If not found in local state, fetch from database
    try {
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
          warranty_start,
          warranty_end,
          warranty_status,
          repair_count,
          last_return_date,
          customers (id, name, phone, email),
          remarks:device_remarks(*),
          transitions:device_transitions(*),
          ratings:device_ratings(*)
        `)
        .eq('id', id)
        .single();
        
      if (error) {
        console.error('Error fetching device from database:', error);
        return null;
      }
      
      if (data) {
        // Transform the data to match Device interface
        const transformedDevice = {
          ...data,
          serialNumber: data.serial_number,
          issueDescription: data.issue_description,
          customerId: data.customer_id,
          assignedTo: data.assigned_to,
          expectedReturnDate: data.expected_return_date,
          customerName: Array.isArray(data.customers) && data.customers.length > 0 ? data.customers[0]?.name || '' : '',
          phoneNumber: Array.isArray(data.customers) && data.customers.length > 0 ? data.customers[0]?.phone || '' : '',
          remarks: (data.remarks || []).map((remark: any) => ({
            id: remark.id,
            content: remark.content,
            createdBy: remark.created_by,
            createdAt: remark.created_at
          })),
          transitions: (data.transitions || []).map((transition: any) => ({
            id: transition.id,
            fromStatus: transition.from_status,
            toStatus: transition.to_status,
            performedBy: transition.performed_by,
            timestamp: transition.created_at,
            signature: transition.signature || ''
          })),
          ratings: (data.ratings || []).map((rating: any) => ({
            id: rating.id,
            deviceId: rating.device_id,
            technicianId: rating.technician_id,
            score: rating.score,
            comment: rating.comment,
            createdAt: rating.created_at
          })),
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
        
        return transformedDevice;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching device from database:', error);
      return null;
    }
  };

  const getDevicesByStatus = (status: DeviceStatus) => {
    return devices.filter(device => device.status === status);
  };

  const getDevicesByTechnician = (technicianId: string) => {
    // For technicians, all devices are already filtered to be assigned to them
    if (currentUser?.role === 'technician' && currentUser.id === technicianId) {
      return devices;
    }
    // For other roles, filter by assigned technician
    return devices.filter(device => device.assignedTo === technicianId);
  };

  const addRating = async (deviceId: string, technicianId: string, score: number, comment: string) => {
    if (!currentUser) return false;
    const newRating: Rating = {
      id: `rating-${Date.now()}`,
      deviceId,
      technicianId,
      score,
      comment,
      createdAt: new Date().toISOString()
    };
    const dbRating = await addDeviceRating(newRating);
    if (!dbRating) return false;
    // Optionally, you could update local device state with the new rating if you store ratings in device
    return true;
  };

  const getTechnicianRating = () => {
    return 0; // Not implemented
  };

  // Add device queries/filters by expectedReturnDate
  const getDevicesDueToday = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    return devices.filter(device => device.expectedReturnDate === todayStr);
  };

  const getOverdueDevices = () => {
    const now = new Date();
    return devices.filter(device => {
      // Don't show overdue for completed devices
      if (device.status === 'done' || device.status === 'failed') return false;
      
      if (!device.expectedReturnDate) return false;
      const due = new Date(device.expectedReturnDate);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Check if device is due today (same day)
      const isDueToday = due.getTime() === today.getTime();
      
      if (isDueToday) {
        // For same-day devices, check if it's been 24 hours since device was received
        const deviceCreated = new Date(device.createdAt);
        const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000)); // 24 hours ago
        return deviceCreated < twentyFourHoursAgo;
      } else {
        // For other days, calculate hours based on expected return date
        const deviceCreated = new Date(device.createdAt);
        const hoursUntilDue = Math.ceil((due.getTime() - deviceCreated.getTime()) / (60 * 60 * 1000));
        
        // Calculate overdue hours: if due in 2 days (48 hours), make it overdue after 44 hours
        const overdueHours = Math.max(hoursUntilDue - 4, 24); // Subtract 4 hours, minimum 24 hours
        
        const overdueTime = new Date(deviceCreated.getTime() + (overdueHours * 60 * 60 * 1000));
        return now > overdueTime;
      }
    });
  };

  // New function to get overdue status for any device
  const getDeviceOverdueStatus = (device: Device) => {
    if (device.status === 'done' || device.status === 'failed') {
      return { isOverdue: false, overdueTime: null, status: 'completed' };
    }
    
    if (!device.expectedReturnDate) {
      return { isOverdue: false, overdueTime: null, status: 'no-due-date' };
    }
    
    const now = new Date();
    const due = new Date(device.expectedReturnDate);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Check if device is due today (same day)
    const isDueToday = due.getTime() === today.getTime();
    
    if (isDueToday) {
      // For same-day devices, check if it's been 24 hours since device was received
      const deviceCreated = new Date(device.createdAt);
      const twentyFourHoursAgo = new Date(now.getTime() - (24 * 60 * 60 * 1000)); // 24 hours ago
      const isOverdue = deviceCreated < twentyFourHoursAgo;
      
      if (isOverdue) {
        const overdueMs = now.getTime() - twentyFourHoursAgo.getTime();
        const overdueHours = Math.floor(overdueMs / (1000 * 60 * 60));
        return { 
          isOverdue: true, 
          overdueTime: `${overdueHours}h overdue`, 
          status: 'overdue' 
        };
      } else {
        return { isOverdue: false, overdueTime: null, status: 'due-today' };
      }
    } else {
      // For other days, calculate hours based on expected return date
      const deviceCreated = new Date(device.createdAt);
      const hoursUntilDue = Math.ceil((due.getTime() - deviceCreated.getTime()) / (60 * 60 * 1000));
      
      // Calculate overdue hours: if due in 2 days (48 hours), make it overdue after 44 hours
      const overdueHours = Math.max(hoursUntilDue - 4, 24); // Subtract 4 hours, minimum 24 hours
      
      const overdueTime = new Date(deviceCreated.getTime() + (overdueHours * 60 * 60 * 1000));
      const isOverdue = now > overdueTime;
      
      if (isOverdue) {
        const overdueMs = now.getTime() - overdueTime.getTime();
        const overdueDays = Math.floor(overdueMs / (1000 * 60 * 60 * 24));
        const overdueHoursRemaining = Math.floor((overdueMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        let overdueTimeString = '';
        if (overdueDays > 0) {
          overdueTimeString = `${overdueDays}d ${overdueHoursRemaining}h overdue`;
        } else {
          overdueTimeString = `${overdueHoursRemaining}h overdue`;
        }
        
        return { 
          isOverdue: true, 
          overdueTime: overdueTimeString, 
          status: 'overdue' 
        };
      } else {
        // Calculate time remaining
        const timeRemaining = due.getTime() - now.getTime();
        const daysRemaining = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
        const hoursRemaining = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        let timeRemainingString = '';
        if (daysRemaining > 0) {
          timeRemainingString = `${daysRemaining}d ${hoursRemaining}h remaining`;
        } else if (hoursRemaining > 0) {
          timeRemainingString = `${hoursRemaining}h remaining`;
        } else {
          timeRemainingString = 'Due soon';
        }
        
        return { 
          isOverdue: false, 
          overdueTime: timeRemainingString, 
          status: 'on-time' 
        };
      }
    }
  };

  return (
    <DevicesContext.Provider value={{
      devices,
      loading,
      addDevice,
      updateDeviceStatus,
      assignToTechnician,
      addRemark,
      getDeviceById,
      getDevicesByStatus,
      getDevicesByTechnician,
      addRating,
      getTechnicianRating,
      deleteDevice,
      getDevicesDueToday, // newly added
      getOverdueDevices,   // newly added
      getDeviceOverdueStatus // newly added
    }}>
      {children}
    </DevicesContext.Provider>
  );
});

// Add default export for better HMR support
export default DevicesProvider;