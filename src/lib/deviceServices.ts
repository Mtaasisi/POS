import { supabase } from './supabaseClient';
import { Database } from './database.types';
import { toCamelCase, toSnakeCase } from './utils';

// Add request throttling utility
class RequestThrottler {
  private static instance: RequestThrottler;
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private maxConcurrent = 2; // Limit concurrent requests
  private delayBetweenRequests = 500; // 500ms between requests

  static getInstance(): RequestThrottler {
    if (!RequestThrottler.instance) {
      RequestThrottler.instance = new RequestThrottler();
    }
    return RequestThrottler.instance;
  }

  async execute<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          // Add delay between requests
          await new Promise(resolve => setTimeout(resolve, this.delayBetweenRequests));
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, this.maxConcurrent);
      await Promise.all(batch.map(request => request()));
    }
    
    this.processing = false;
  }
}

// Device type with related data
type Device = Database['public']['Tables']['devices']['Row'] & {
  device_checklists: Database['public']['Tables']['device_checklists']['Row'] | null;
  device_remarks: Database['public']['Tables']['device_remarks']['Row'][];
  device_transitions: Database['public']['Tables']['device_transitions']['Row'][];
  device_ratings: Database['public']['Tables']['device_ratings']['Row'][];
  customers: Database['public']['Tables']['customers']['Row'] | null;
};

// List of allowed fields for device insert (from Database['public']['Tables']['devices']['Insert'])
const allowedDeviceFields = [
  'id',
  'customer_id',
  'brand',
  'model',
  'serial_number',
  'issue_description',
  'status',
  'assigned_to',
  'estimated_hours',
  'expected_return_date',
  'warranty_start',
  'warranty_end',
  'warranty_status',
  'repair_count',
  'last_return_date',
  'created_at',
  'updated_at',
];

function sanitizeDevicePayload(payload: any) {
  const sanitized: any = {};
  for (const key of allowedDeviceFields) {
    if (payload[key] !== undefined) {
      sanitized[key] = payload[key];
    }
  }
  return sanitized;
}

// Enhanced Device System Services with better error handling
export const deviceServices = {
  // Get all devices with related data
  async getAllDevices() {
    try {
      console.log('🔍 deviceServices.getAllDevices() called');
      const { data: devices, error } = await supabase
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
          estimated_hours,
          expected_return_date,
          created_at,
          updated_at,
          customers(*),
          device_checklists(*),
          device_remarks(*),
          device_transitions(*),
          device_ratings(*)
        `)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('❌ Database error:', error);
        throw new Error(`Failed to fetch devices: ${error.message}`);
      }
      console.log('📱 Database query successful, devices found:', devices?.length || 0);
      return devices?.map(toCamelCase) || [];
    } catch (error) {
      console.error('❌ Network error in getAllDevices:', error);
      throw new Error('Network error: Unable to connect to database');
    }
  },

  // Get device by ID with related data
  async getDeviceById(id: string) {
    try {
      const { data: device, error } = await supabase
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
          estimated_hours,
          expected_return_date,
          created_at,
          updated_at,
          customers(*),
          device_checklists(*),
          device_remarks(*),
          device_transitions(*),
          device_ratings(*)
        `)
        .eq('id', id)
        .single();
      if (error) {
        throw new Error(`Failed to fetch device: ${error.message}`);
      }
      return toCamelCase(device);
    } catch (error) {
      throw new Error('Network error: Unable to connect to database');
    }
  },

  // Create new device
  async createDevice(deviceData: Database['public']['Tables']['devices']['Insert']) {
    try {
      // Only keep allowed fields
      const sanitizedData = sanitizeDevicePayload(deviceData);
      const snakeCaseData = toSnakeCase(sanitizedData);
      // Remove id if present (let DB generate it)
      const { id, ...finalInsertData } = snakeCaseData;
      // Ensure required 'status' field is present
      if (!finalInsertData.status) {
        finalInsertData.status = 'received';
      }
      console.log('Inserting sanitized device:', finalInsertData);
      const { data, error } = await supabase
        .from('devices')
        .insert(finalInsertData)
        .select('*')
        .single();
      if (error) {
        throw new Error(`Failed to create device: ${error.message}`);
      }
      return toCamelCase(data);
    } catch (error) {
      throw new Error('Network error: Unable to connect to database');
    }
  },

  // Update device
  async updateDevice(id: string, updates: Database['public']['Tables']['devices']['Update']) {
    console.log('[deviceServices.updateDevice] Called with:', { id, updates });
    
    const snakeCaseUpdates = Object.fromEntries(
      Object.entries(updates).map(([key, value]) => [toSnakeCase(key), value])
    );
    
    console.log('[deviceServices.updateDevice] Snake case updates:', snakeCaseUpdates);
    
    // Update device directly (removed SQL function call since it doesn't exist)
    const { data, error } = await supabase
      .from('devices')
      .update(snakeCaseUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('[deviceServices.updateDevice] ❌ Update failed:', error);
      console.error('[deviceServices.updateDevice] Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }
    
    console.log('[deviceServices.updateDevice] ✅ Update successful:', data);
    // Notification: Device status change
    if (updates.status) {
      await supabase.from('device_notifications').insert({
        device_id: id,
        type: 'info',
        title: 'Device Status Updated',
        message: `Device status changed to ${updates.status}`,
        sent_at: new Date().toISOString(),
        is_read: false
      });
    }
    return data;
  },

  // Delete device
  async deleteDevice(id: string) {
    try {
      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Failed to delete device: ${error.message}`);
      }
      return true;
    } catch (error) {
      throw new Error('Network error: Unable to connect to database');
    }
  },

  // Add device checklist
  async addDeviceChecklist(checklistData: Database['public']['Tables']['device_checklists']['Insert']) {
    try {
      const { data, error } = await supabase
        .from('device_checklists')
        .insert(checklistData)
        .select()
        .single();

      if (error) {
        console.error('Error adding device checklist:', error);
        throw new Error(`Failed to add device checklist: ${error.message}`);
      }
      return data;
    } catch (error) {
      console.error('Network error adding device checklist:', error);
      throw new Error('Network error: Unable to connect to database');
    }
  },

  // Update device checklist
  async updateDeviceChecklist(id: string, updates: Database['public']['Tables']['device_checklists']['Update']) {
    try {
      const { data, error } = await supabase
        .from('device_checklists')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating device checklist:', error);
        throw new Error(`Failed to update device checklist: ${error.message}`);
      }
      return data;
    } catch (error) {
      console.error('Network error updating device checklist:', error);
      throw new Error('Network error: Unable to connect to database');
    }
  },

  // Add device remark
  async addDeviceRemark(remarkData: Database['public']['Tables']['device_remarks']['Insert']) {
    try {
      const { data, error } = await supabase
        .from('device_remarks')
        .insert(remarkData)
        .select()
        .single();
      if (error) {
        console.error('Error adding device remark:', error);
        throw new Error(`Failed to add device remark: ${error.message}`);
      }
      // Notification: New device remark/message
      await supabase.from('device_notifications').insert({
        device_id: remarkData.device_id,
        type: 'info',
        title: 'New Device Remark',
        message: `A new remark/message was added to device ${remarkData.device_id}.`,
        sent_at: new Date().toISOString(),
        is_read: false
      });
      return data;
    } catch (error) {
      console.error('Network error adding device remark:', error);
      throw new Error('Network error: Unable to connect to database');
    }
  },

  // Add device transition
  async addDeviceTransition(transitionData: Database['public']['Tables']['device_transitions']['Insert']) {
    try {
      const { data, error } = await supabase
        .from('device_transitions')
        .insert(transitionData)
        .select()
        .single();
      if (error) {
        console.error('Error adding device transition:', error);
        throw new Error(`Failed to add device transition: ${error.message}`);
      }
      // Notification: Device workflow step/transition
      await supabase.from('device_notifications').insert({
        device_id: transitionData.device_id,
        type: 'info',
        title: 'Device Status Updated',
        message: `Device ${transitionData.device_id} status changed from ${transitionData.from_status} to ${transitionData.to_status}.`,
        sent_at: new Date().toISOString(),
        is_read: false
      });
      return data;
    } catch (error) {
      console.error('Network error adding device transition:', error);
      throw new Error('Network error: Unable to connect to database');
    }
  },

  // Add device rating
  async addDeviceRating(ratingData: Database['public']['Tables']['device_ratings']['Insert']) {
    try {
      const { data, error } = await supabase
        .from('device_ratings')
        .insert(ratingData)
        .select()
        .single();

      if (error) {
        console.error('Error adding device rating:', error);
        throw new Error(`Failed to add device rating: ${error.message}`);
      }
      return data;
    } catch (error) {
      console.error('Network error adding device rating:', error);
      throw new Error('Network error: Unable to connect to database');
    }
  },

  // Search devices
  async searchDevices(query: string) {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select(`
          *,
          diagnosis_required,
          customers(*)
        `)
        .or(`brand.ilike.%${query}%,model.ilike.%${query}%,serial_number.ilike.%${query}%,id.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching devices:', error);
        throw new Error(`Failed to search devices: ${error.message}`);
      }
      return toCamelCase(data || []);
    } catch (error) {
      console.error('Network error searching devices:', error);
      throw new Error('Network error: Unable to connect to database');
    }
  },

  // Filter devices by status
  async filterDevicesByStatus(status: string) {
    try {
      const { data, error } = await supabase
        .from('devices')
        .select(`
          *,
          device_checklists(*),
          device_remarks(*),
          device_transitions(*),
          device_ratings(*),
          customers(*)
        `)
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error filtering devices by status:', error);
        throw new Error(`Failed to filter devices: ${error.message}`);
      }
      return toCamelCase(data || []);
    } catch (error) {
      console.error('Network error filtering devices by status:', error);
      throw new Error('Network error: Unable to connect to database');
    }
  },

  // Get devices by technician
  async getDevicesByTechnician(technicianId: string) {
    try {
      console.log('🔧 Fetching devices for technician:', technicianId);
      const { data, error } = await supabase
        .from('devices')
        .select(`
          *,
          device_checklists(*),
          device_remarks(*),
          device_transitions(*),
          device_ratings(*),
          customers(*)
        `)
        .eq('assigned_to', technicianId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching devices by technician:', error);
        throw new Error(`Failed to fetch devices: ${error.message}`);
      }
      
      console.log('✅ Devices fetched for technician:', data?.length || 0);
      return toCamelCase(data || []);
    } catch (error) {
      console.error('❌ Network error fetching devices by technician:', error);
      throw new Error('Network error: Unable to connect to database');
    }
  },

  // Get devices by customer
  async getDevicesByCustomer(customerId: string) {
    try {
      const throttler = RequestThrottler.getInstance();
      
      const result = await throttler.execute(async () => {
        const { data, error } = await supabase
          .from('devices')
          .select(`
            *,
            device_checklists(*),
            device_remarks(*),
            device_transitions(*),
            device_ratings(*),
            customers(*)
          `)
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching devices by customer:', error);
          throw new Error(`Failed to fetch devices: ${error.message}`);
        }
        return toCamelCase(data || []);
      });
      
      return result;
    } catch (error) {
      console.error('Network error fetching devices by customer:', error);
      throw new Error('Network error: Unable to connect to database');
    }
  },

  // Get payment records for a specific device
  async getDevicePaymentRecords(deviceId: string) {
    try {
      const { data, error } = await supabase
        .from('customer_payments')
        .select(`
          *,
          devices(brand, model),
          customers(name, phone, email)
        `)
        .eq('device_id', deviceId)
        .order('payment_date', { ascending: false });

      if (error) {
        console.error('Error fetching device payment records:', error);
        throw new Error(`Failed to fetch payment records: ${error.message}`);
      }
      
      // Transform the data to include device and customer names
      const transformedData = (data || []).map((payment: any) => ({
        ...payment,
        device_name: payment.devices 
          ? `${payment.devices.brand || ''} ${payment.devices.model || ''}`.trim() 
          : undefined,
        customer_name: payment.customers?.name || undefined
      }));
      
      return toCamelCase(transformedData);
    } catch (error) {
      console.error('Network error fetching device payment records:', error);
      throw new Error('Network error: Unable to connect to database');
    }
  },

  // Get customer payment records
  async getCustomerPaymentRecords(customerId: string) {
    try {
      const { data, error } = await supabase
        .from('customer_payments')
        .select(`
          *,
          devices(brand, model)
        `)
        .eq('customer_id', customerId)
        .order('payment_date', { ascending: false });

      if (error) {
        console.error('Error fetching customer payment records:', error);
        throw new Error(`Failed to fetch customer payment records: ${error.message}`);
      }
      
      // Transform the data to include device names
      const transformedData = (data || []).map((payment: any) => ({
        ...payment,
        device_name: payment.devices 
          ? `${payment.devices.brand || ''} ${payment.devices.model || ''}`.trim() 
          : undefined
      }));
      
      return toCamelCase(transformedData);
    } catch (error) {
      console.error('Network error fetching customer payment records:', error);
      throw new Error('Network error: Unable to connect to database');
    }
  },

  // Add a new payment record
  async addPaymentRecord(paymentData: {
    customer_id: string;
    amount: number;
    method: 'cash' | 'card' | 'transfer';
    device_id?: string;
    payment_type: 'payment' | 'deposit' | 'refund';
    status?: 'completed' | 'pending' | 'failed';
    created_by?: string;
  }) {
    try {
      // Validate customer ID
      if (!paymentData.customer_id) {
        throw new Error('Customer ID is required for payment record');
      }

      const { data, error } = await supabase
        .from('customer_payments')
        .insert([paymentData])
        .select()
        .single();
      if (error) {
        console.error('Error adding payment record:', error);
        throw new Error(`Failed to add payment record: ${error.message}`);
      }
      // Notification: Payment event
      await supabase.from('device_notifications').insert({
        device_id: paymentData.device_id,
        type: paymentData.status === 'failed' ? 'error' : 'info',
        title: paymentData.status === 'failed' ? 'Payment Failed' : 'Payment Received',
        message: paymentData.status === 'failed'
          ? `A payment for device ${paymentData.device_id} failed.`
          : `Payment received for device ${paymentData.device_id}.`,
        sent_at: new Date().toISOString(),
        is_read: false
      });
      return toCamelCase(data);
    } catch (error) {
      console.error('Network error adding payment record:', error);
      throw new Error('Network error: Unable to connect to database');
    }
  },

  // Get device statistics
  async getDeviceStatistics() {
    try {
      const { data: totalDevices, error: totalError } = await supabase
        .from('devices')
        .select('id', { count: 'exact' });

      const { data: inRepair, error: repairError } = await supabase
        .from('devices')
        .select('id', { count: 'exact' })
        .in('status', ['received', 'in_progress']);

      const { data: readyForPickup, error: pickupError } = await supabase
        .from('devices')
        .select('id', { count: 'exact' })
        .eq('status', 'completed');

      const { data: completed, error: completedError } = await supabase
        .from('devices')
        .select('id', { count: 'exact' })
        .eq('status', 'completed');

      if (totalError || repairError || pickupError || completedError) {
        console.error('Error fetching device statistics:', { totalError, repairError, pickupError, completedError });
        throw new Error('Failed to fetch device statistics');
      }

      return {
        totalDevices: totalDevices?.length || 0,
        inRepair: inRepair?.length || 0,
        readyForPickup: readyForPickup?.length || 0,
        completed: completed?.length || 0,
      };
    } catch (error) {
      console.error('Network error fetching device statistics:', error);
      throw new Error('Network error: Unable to connect to database');
    }
  },

  // Get technician rating
  async getTechnicianRating(technicianId: string) {
    try {
      const { data, error } = await supabase
        .from('device_ratings')
        .select('score')
        .eq('technician_id', technicianId);

      if (error) {
        console.error('Error getting technician rating:', error);
        throw new Error(`Failed to get technician rating: ${error.message}`);
      }

      if (!data || data.length === 0) {
        return 0;
      }

      // Fix: ensure rating is typed
      const totalScore = data.reduce((sum, rating) => sum + (rating as { score: number }).score, 0);
      return totalScore / data.length;
    } catch (error) {
      console.error('Network error getting technician rating:', error);
      throw new Error('Network error: Unable to connect to database');
    }
  },

  // Update device return date
  async updateDeviceReturnDate(deviceId: string, newDate: string) {
    try {
      const { data, error } = await supabase
        .from('devices')
        .update({ 
          expected_return_date: newDate,
          updated_at: new Date().toISOString() 
        })
        .eq('id', deviceId)
        .select()
        .single();

      if (error) {
        console.error('Error updating device return date:', error);
        throw new Error(`Failed to update device return date: ${error.message}`);
      }
      return toCamelCase(data);
    } catch (error) {
      console.error('Network error updating device return date:', error);
      throw new Error('Network error: Unable to connect to database');
    }
  },

  // Send customer notification
  async sendCustomerNotification(deviceId: string, message: string) {
    try {
      // Debug logging removed for production
      
      const { error } = await supabase
        .from('device_notifications')
        .insert({
          device_id: deviceId,
          message,
          sent_at: new Date().toISOString(),
          is_read: false
        });
      
      if (error) throw error;
      
      return true;
    } catch (error) {
      console.error('Error sending customer notification:', error);
      return false;
    }
  },

  // Assign technician to device
  async assignTechnicianToDevice(deviceId: string, technicianId: string) {
    try {
      const { data, error } = await supabase
        .from('devices')
        .update({ 
          assigned_to: technicianId,
          updated_at: new Date().toISOString() 
        })
        .eq('id', deviceId)
        .select(`
          *,
          device_checklists(*),
          device_remarks(*),
          device_transitions(*),
          device_ratings(*),
          customers(*)
        `)
        .single();
      if (error) {
        console.error('Error assigning technician to device:', error);
        throw new Error(`Failed to assign technician: ${error.message}`);
      }
      // Notification: Technician assigned
      await supabase.from('device_notifications').insert({
        device_id: deviceId,
        type: 'info',
        title: 'Technician Assigned',
        message: `A technician has been assigned to device ${deviceId}.`,
        sent_at: new Date().toISOString(),
        is_read: false
      });
      return toCamelCase(data);
    } catch (error) {
      console.error('Network error assigning technician to device:', error);
      throw new Error('Network error: Unable to assign technician');
    }
  },

  // Save receipt to database
  async saveReceipt(receiptData: {
    deviceId: string;
    customerId: string;
    paymentId: string;
    technicianId: string;
    deviceBrand: string;
    deviceModel: string;
    deviceSerialNumber?: string;
    deviceIssue: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    paymentMethod: 'cash' | 'card' | 'transfer';
    paymentReference?: string;
    paymentAmount: number;
    totalCost: number;
    depositAmount: number;
    remainingBalance: number;
    repairCost: number;
    laborCost: number;
    partsCost: number;
    deviceStatus: string;
    generatedBy: string;
    receiptContent: any;
  }) {
    try {
      const { data, error } = await supabase
        .from('receipts')
        .insert({
          receipt_number: `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
          device_id: receiptData.deviceId,
          customer_id: receiptData.customerId,
          payment_id: receiptData.paymentId,
          technician_id: receiptData.technicianId,
          device_brand: receiptData.deviceBrand,
          device_model: receiptData.deviceModel,
          device_serial_number: receiptData.deviceSerialNumber,
          device_issue: receiptData.deviceIssue,
          customer_name: receiptData.customerName,
          customer_phone: receiptData.customerPhone,
          customer_email: receiptData.customerEmail,
          payment_method: receiptData.paymentMethod,
          payment_reference: receiptData.paymentReference,
          payment_amount: receiptData.paymentAmount,
          total_cost: receiptData.totalCost,
          deposit_amount: receiptData.depositAmount,
          remaining_balance: receiptData.remainingBalance,
          repair_cost: receiptData.repairCost,
          labor_cost: receiptData.laborCost,
          parts_cost: receiptData.partsCost,
          device_status: receiptData.deviceStatus,
          generated_by: receiptData.generatedBy,
          receipt_content: receiptData.receiptContent
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving receipt:', error);
        throw new Error(`Failed to save receipt: ${error.message}`);
      }
      return toCamelCase(data);
    } catch (error) {
      console.error('Network error saving receipt:', error);
      throw new Error('Network error: Unable to connect to database');
    }
  },

  // Get receipt by ID
  async getReceipt(receiptId: string) {
    try {
      const { data, error } = await supabase
        .from('receipts')
        .select(`
          *,
          devices(*),
          customers(*),
          customer_payments(*),
          auth_users!receipts_technician_id_fkey(*),
          auth_users!receipts_generated_by_fkey(*)
        `)
        .eq('id', receiptId)
        .single();

      if (error) {
        console.error('Error fetching receipt:', error);
        throw new Error(`Failed to fetch receipt: ${error.message}`);
      }
      return toCamelCase(data);
    } catch (error) {
      console.error('Network error fetching receipt:', error);
      throw new Error('Network error: Unable to connect to database');
    }
  },

  // Get receipts for a device
  async getDeviceReceipts(deviceId: string) {
    try {
      const { data, error } = await supabase
        .from('receipts')
        .select(`
          *,
          customers(*),
          customer_payments(*),
          auth_users!receipts_technician_id_fkey(*)
        `)
        .eq('device_id', deviceId)
        .order('receipt_date', { ascending: false });

      if (error) {
        console.error('Error fetching device receipts:', error);
        throw new Error(`Failed to fetch device receipts: ${error.message}`);
      }
      return toCamelCase(data || []);
    } catch (error) {
      console.error('Network error fetching device receipts:', error);
      throw new Error('Network error: Unable to connect to database');
    }
  },

  // Get receipts for a customer
  async getCustomerReceipts(customerId: string) {
    try {
      const { data, error } = await supabase
        .from('receipts')
        .select(`
          *,
          devices(*),
          customer_payments(*),
          auth_users!receipts_technician_id_fkey(*)
        `)
        .eq('customer_id', customerId)
        .order('receipt_date', { ascending: false });

      if (error) {
        console.error('Error fetching customer receipts:', error);
        throw new Error(`Failed to fetch customer receipts: ${error.message}`);
      }
      return toCamelCase(data || []);
    } catch (error) {
      console.error('Network error fetching customer receipts:', error);
      throw new Error('Network error: Unable to connect to database');
    }
  },

  // Mark receipt as printed
  async markReceiptPrinted(receiptId: string) {
    try {
      const { data, error } = await supabase
        .from('receipts')
        .update({ is_printed: true })
        .eq('id', receiptId)
        .select()
        .single();

      if (error) {
        console.error('Error marking receipt as printed:', error);
        throw new Error(`Failed to mark receipt as printed: ${error.message}`);
      }
      return toCamelCase(data);
    } catch (error) {
      console.error('Network error marking receipt as printed:', error);
      throw new Error('Network error: Unable to connect to database');
    }
  },

  // Mark receipt as sent to customer
  async markReceiptSent(receiptId: string, sentVia: string) {
    try {
      const { data, error } = await supabase
        .from('receipts')
        .update({ 
          is_sent_to_customer: true,
          sent_via: sentVia,
          sent_at: new Date().toISOString()
        })
        .eq('id', receiptId)
        .select()
        .single();

      if (error) {
        console.error('Error marking receipt as sent:', error);
        throw new Error(`Failed to mark receipt as sent: ${error.message}`);
      }
      return toCamelCase(data);
    } catch (error) {
      console.error('Network error marking receipt as sent:', error);
      throw new Error('Network error: Unable to connect to database');
    }
  }
};

// Real-time subscriptions with better error handling and fallback
export const deviceSubscriptions = {
  // Subscribe to all devices
  subscribeToDevices(callback: (payload: any) => void) {
    try {
      const subscription = supabase
        .channel('devices')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, callback)
        .subscribe((status) => {
          // Debug logging removed for production
          if (status === 'CHANNEL_ERROR') {
            // Debug logging removed for production
          }
        });

      return subscription;
    } catch (error) {
      // Debug logging removed for production
      return null;
    }
  },

  // Subscribe to device checklists
  subscribeToDeviceChecklists(callback: (payload: any) => void) {
    try {
      const subscription = supabase
        .channel('device_checklists')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'device_checklists' }, callback)
        .subscribe((status) => {
          // Debug logging removed for production
          if (status === 'CHANNEL_ERROR') {
            // Debug logging removed for production
          }
        });

      return subscription;
    } catch (error) {
      // Debug logging removed for production
      return null;
    }
  },

  // Subscribe to device remarks
  subscribeToDeviceRemarks(callback: (payload: any) => void) {
    try {
      const subscription = supabase
        .channel('device_remarks')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'device_remarks' }, callback)
        .subscribe((status) => {
          // Debug logging removed for production
          if (status === 'CHANNEL_ERROR') {
            // Debug logging removed for production
          }
        });

      return subscription;
    } catch (error) {
      // Debug logging removed for production
      return null;
    }
  },

  // Subscribe to device transitions
  subscribeToDeviceTransitions(callback: (payload: any) => void) {
    try {
      const subscription = supabase
        .channel('device_transitions')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'device_transitions' }, callback)
        .subscribe((status) => {
          // Debug logging removed for production
          if (status === 'CHANNEL_ERROR') {
            // Debug logging removed for production
          }
        });

      return subscription;
    } catch (error) {
      // Debug logging removed for production
      return null;
    }
  },

  // Subscribe to specific device
  subscribeToDevice(deviceId: string, callback: (payload: any) => void) {
    try {
      const subscription = supabase
        .channel(`device_${deviceId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'devices', filter: `id=eq.${deviceId}` }, callback)
        .subscribe((status) => {
          // Debug logging removed for production
          if (status === 'CHANNEL_ERROR') {
            // Debug logging removed for production
          }
        });

      return subscription;
    } catch (error) {
      // Debug logging removed for production
      return null;
    }
  },

  // Subscribe to device notifications (system-wide)
  subscribeToDeviceNotifications(callback: (payload: any) => void) {
    try {
      const subscription = supabase
        .channel('device_notifications')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'device_notifications' }, callback)
        .subscribe((status) => {
          // Debug logging removed for production
        });
      return subscription;
    } catch (error) {
      return null;
    }
  }
};

// --- Notification Helper Utilities ---
export const notificationHelpers = {
  async notifyInventoryLow(itemName: string) {
    await supabase.from('device_notifications').insert({
      type: 'warning',
      title: 'Low Inventory',
      message: `${itemName} is low on stock.`,
      sent_at: new Date().toISOString(),
      is_read: false
    });
  },
  async notifyInventoryOut(itemName: string) {
    await supabase.from('device_notifications').insert({
      type: 'error',
      title: 'Out of Stock',
      message: `${itemName} is out of stock!`,
      sent_at: new Date().toISOString(),
      is_read: false
    });
  },
  async notifyInventoryNew(itemName: string) {
    await supabase.from('device_notifications').insert({
      type: 'info',
      title: 'New Inventory Item',
      message: `New item added: ${itemName}`,
      sent_at: new Date().toISOString(),
      is_read: false
    });
  },
  async notifyWarrantyExpiring(deviceSerial: string) {
    await supabase.from('device_notifications').insert({
      type: 'warning',
      title: 'Warranty Expiry Soon',
      message: `Warranty for device ${deviceSerial} expires soon.`,
      sent_at: new Date().toISOString(),
      is_read: false
    });
  },
  async notifyWarrantyExpired(deviceSerial: string) {
    await supabase.from('device_notifications').insert({
      type: 'error',
      title: 'Warranty Expired',
      message: `Warranty for device ${deviceSerial} has expired.`,
      sent_at: new Date().toISOString(),
      is_read: false
    });
  },
  async notifySystemError(errorMessage: string) {
    await supabase.from('device_notifications').insert({
      type: 'error',
      title: 'System Error',
      message: `A critical system error occurred: ${errorMessage}`,
      sent_at: new Date().toISOString(),
      is_read: false
    });
  },
  async notifySystemMaintenance(maintenanceDate: string) {
    await supabase.from('device_notifications').insert({
      type: 'info',
      title: 'System Maintenance',
      message: `System maintenance scheduled for ${maintenanceDate}.`,
      sent_at: new Date().toISOString(),
      is_read: false
    });
  }
}; 