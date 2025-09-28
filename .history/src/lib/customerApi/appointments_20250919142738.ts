import { supabase } from '../supabaseClient';
import { trackCustomerActivity, reactivateCustomer } from '../customerStatusService';

export interface Appointment {
  id: string;
  customer_id: string;
  service_type: string;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  technician_id?: string;
  notes?: string;
  duration_minutes: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  updated_at: string;
  // Joined fields
  customer_name?: string;
  customer_phone?: string;
  technician_name?: string;
}

export interface CreateAppointmentData {
  customer_id: string;
  service_type: string;
  appointment_date: string;
  appointment_time: string;
  notes?: string;
  duration_minutes?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  technician_id?: string;
}

export interface UpdateAppointmentData {
  service_type?: string;
  appointment_date?: string;
  appointment_time?: string;
  status?: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  duration_minutes?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  technician_id?: string;
}

// Fetch all appointments with customer and technician details
export async function fetchAllAppointments() {
  try {
    console.log('📅 Fetching all appointments...');
    
    // Try different field name combinations to handle schema variations
    let { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });
    
    if (error) {
      console.warn('⚠️ appointment_date field failed, trying scheduled_date:', error);
      
      // Try with scheduled_date field (newer schema)
      const { data: altData, error: altError } = await supabase
        .from('appointments')
        .select('*')
        .order('scheduled_date', { ascending: true });
      
      if (altError) {
        console.error('❌ Error fetching appointments:', altError);
        throw altError;
      }
      
      data = altData;
    }
    
    const appointments = data?.map(appointment => {
      // Handle different schema field names
      const appointmentDate = appointment.appointment_date || appointment.scheduled_date;
      const appointmentTime = appointment.appointment_time || '00:00:00';
      const serviceType = appointment.service_type || appointment.appointment_type || 'Unknown Service';
      
      // Get customer info from joined data or stored fields
      const customerName = appointment.customers?.name || appointment.customer_name || 'Unknown Customer';
      const customerPhone = appointment.customers?.phone || appointment.customer_phone || 'No Phone';
      const technicianName = appointment.auth_users?.name || appointment.technician_name || 'No Technician';
      
      // Normalize the data structure
      return {
        id: appointment.id,
        customer_id: appointment.customer_id,
        customer_name: customerName,
        customer_phone: customerPhone,
        service_type: serviceType,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        status: appointment.status,
        notes: appointment.notes,
        priority: appointment.priority,
        technician_name: technicianName,
        duration_minutes: appointment.duration_minutes || appointment.estimated_duration || 60,
        created_at: appointment.created_at,
        updated_at: appointment.updated_at,
        // Keep original data for compatibility
        ...appointment
      };
    }) || [];
    
    console.log(`✅ Fetched ${appointments.length} appointments`);
    return appointments;
  } catch (error) {
    console.error('❌ Error fetching appointments:', error);
    throw error;
  }
}

// Fetch appointments for a specific customer
export async function fetchCustomerAppointments(customerId: string) {
  try {
    console.log(`📅 Fetching appointments for customer: ${customerId}`);
    
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('customer_id', customerId)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });
    
    if (error) {
      console.error('❌ Error fetching customer appointments:', error);
      throw error;
    }
    
    const appointments = data?.map(appointment => ({
      ...appointment,
      technician_name: appointment.technician_name || 'No Technician'
    })) || [];
    
    console.log(`✅ Fetched ${appointments.length} appointments for customer`);
    return appointments;
  } catch (error) {
    console.error('❌ Error fetching customer appointments:', error);
    throw error;
  }
}

// Create a new appointment
export async function createAppointment(appointmentData: CreateAppointmentData): Promise<Appointment> {
  try {
    console.log('📅 Creating new appointment...');
    
    // First, fetch customer details and check if customer is inactive
    let customerName = '';
    let customerPhone = '';
    
    try {
      const { data: customer, error: fetchError } = await supabase
        .from('customers')
        .select('is_active, name, phone')
        .eq('id', appointmentData.customer_id)
        .single();

      if (fetchError) {
        console.error('❌ Error fetching customer details:', fetchError);
        throw new Error(`Failed to fetch customer details: ${fetchError.message}`);
      }

      if (!customer) {
        throw new Error('Customer not found');
      }

      customerName = customer.name;
      customerPhone = customer.phone;

      if (!customer.is_active) {
        console.log(`🔄 Customer ${customer.name} is inactive, reactivating...`);
        await reactivateCustomer(appointmentData.customer_id);
        console.log(`✅ Customer ${customer.name} reactivated automatically`);
      }
    } catch (reactivationError) {
      console.error('❌ Failed to fetch customer details:', reactivationError);
      throw reactivationError;
    }
    
    // Get technician name if technician_id is provided
    let technicianName = '';
    if (appointmentData.technician_id) {
      try {
        const { data: technician } = await supabase
          .from('auth_users')
          .select('name')
          .eq('id', appointmentData.technician_id)
          .single();
        technicianName = technician?.name || '';
      } catch (techError) {
        console.warn('⚠️ Could not fetch technician name:', techError);
      }
    }
    
    // Create the appointment with all required fields
    // Handle different schema field names
    const appointmentPayload: any = {
      customer_id: appointmentData.customer_id,
      notes: appointmentData.notes,
      priority: appointmentData.priority || 'medium',
      status: 'scheduled'
    };
    
    // Handle service type field name variations
    appointmentPayload.service_type = appointmentData.service_type;
    
    // Handle date field name variations
    appointmentPayload.appointment_date = appointmentData.appointment_date;
    appointmentPayload.appointment_time = appointmentData.appointment_time;
    
    // Handle duration field name variations
    appointmentPayload.duration_minutes = appointmentData.duration_minutes || 60;
    
    // Add customer name and phone if the table supports these fields
    if (customerName) {
      appointmentPayload.customer_name = customerName;
    }
    if (customerPhone) {
      appointmentPayload.customer_phone = customerPhone;
    }
    if (appointmentData.technician_id) {
      appointmentPayload.technician_id = appointmentData.technician_id;
    }
    if (technicianName) {
      appointmentPayload.technician_name = technicianName;
    }
    
    const { data, error } = await supabase
      .from('appointments')
      .insert([appointmentPayload])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error creating appointment:', error);
      throw error;
    }
    
    // Track customer activity for the appointment scheduling
    try {
      await trackCustomerActivity(appointmentData.customer_id, 'appointment_scheduled');
      console.log('📊 Appointment scheduling activity tracked successfully');
    } catch (activityError) {
      console.warn('⚠️ Failed to track appointment activity:', activityError);
      // Don't fail the appointment creation if activity tracking fails
    }
    
    console.log('✅ Appointment created successfully');
    return data;
  } catch (error) {
    console.error('❌ Error creating appointment:', error);
    throw error;
  }
}

// Update an appointment
export async function updateAppointment(appointmentId: string, updates: UpdateAppointmentData): Promise<Appointment> {
  try {
    console.log(`📅 Updating appointment: ${appointmentId}`);
    
    const { data, error } = await supabase
      .from('appointments')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', appointmentId)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error updating appointment:', error);
      throw error;
    }
    
    // Track customer activity for appointment updates
    try {
      await trackCustomerActivity(data.customer_id, 'appointment_updated');
      console.log('📊 Appointment update activity tracked successfully');
    } catch (activityError) {
      console.warn('⚠️ Failed to track appointment update activity:', activityError);
      // Don't fail the update if activity tracking fails
    }
    
    console.log('✅ Appointment updated successfully');
    return data;
  } catch (error) {
    console.error('❌ Error updating appointment:', error);
    throw error;
  }
}

// Delete an appointment
export async function deleteAppointment(appointmentId: string): Promise<boolean> {
  try {
    console.log(`📅 Deleting appointment: ${appointmentId}`);
    
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointmentId);
    
    if (error) {
      console.error('❌ Error deleting appointment:', error);
      throw error;
    }
    
    console.log('✅ Appointment deleted successfully');
    return true;
  } catch (error) {
    console.error('❌ Error deleting appointment:', error);
    throw error;
  }
}

// Get appointments statistics
export async function getAppointmentStats() {
  try {
    console.log('📊 Fetching appointment statistics...');
    
    // Try with appointment_date first, fallback to scheduled_date
    let { data, error } = await supabase
      .from('appointments')
      .select('status, appointment_date');
    
    if (error) {
      console.warn('⚠️ appointment_date field failed, trying scheduled_date:', error);
      const { data: altData, error: altError } = await supabase
        .from('appointments')
        .select('status, scheduled_date');
      
      if (altError) {
        console.error('❌ Error fetching appointment stats:', altError);
        throw altError;
      }
      
      data = altData?.map(item => ({
        ...item,
        appointment_date: item.scheduled_date
      }));
    }
    
    const today = new Date().toISOString().split('T')[0];
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date();
    endOfWeek.setDate(endOfWeek.getDate() + (6 - endOfWeek.getDay()));
    
    const stats = {
      total: data?.length || 0,
      pending: data?.filter(a => a.status === 'pending' || a.status === 'scheduled').length || 0,
      confirmed: data?.filter(a => a.status === 'confirmed').length || 0,
      completed: data?.filter(a => a.status === 'completed').length || 0,
      cancelled: data?.filter(a => a.status === 'cancelled').length || 0,
      today: data?.filter(a => {
        const appointmentDate = a.appointment_date || a.scheduled_date;
        return appointmentDate === today;
      }).length || 0,
      thisWeek: data?.filter(a => {
        const appointmentDate = new Date(a.appointment_date || a.scheduled_date);
        return appointmentDate >= startOfWeek && appointmentDate <= endOfWeek;
      }).length || 0
    };
    
    console.log('✅ Appointment statistics calculated');
    return stats;
  } catch (error) {
    console.error('❌ Error fetching appointment stats:', error);
    throw error;
  }
}

// Search appointments
export async function searchAppointments(query: string, filters?: {
  status?: string;
  date?: string;
  customer_id?: string;
}) {
  try {
    console.log(`🔍 Searching appointments: "${query}"`);
    
    let supabaseQuery = supabase
      .from('appointments')
      .select(`
        *,
        customers!inner(name, phone),
        auth_users!technician_id(name)
      `);
    
    // Add search conditions
    if (query) {
      supabaseQuery = supabaseQuery.or(`service_type.ilike.%${query}%,notes.ilike.%${query}%`);
    }
    
    // Add filters
    if (filters?.status && filters.status !== 'all') {
      supabaseQuery = supabaseQuery.eq('status', filters.status);
    }
    
    if (filters?.customer_id && filters.customer_id !== 'all') {
      supabaseQuery = supabaseQuery.eq('customer_id', filters.customer_id);
    }
    
    if (filters?.date && filters.date !== 'all') {
      const today = new Date().toISOString().split('T')[0];
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const endOfWeek = new Date();
      endOfWeek.setDate(endOfWeek.getDate() + (6 - endOfWeek.getDay()));
      
      switch (filters.date) {
        case 'today':
          supabaseQuery = supabaseQuery.eq('appointment_date', today);
          break;
        case 'this-week':
          supabaseQuery = supabaseQuery.gte('appointment_date', startOfWeek.toISOString().split('T')[0])
            .lte('appointment_date', endOfWeek.toISOString().split('T')[0]);
          break;
        case 'this-month':
          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          const endOfMonth = new Date();
          endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0);
          supabaseQuery = supabaseQuery.gte('appointment_date', startOfMonth.toISOString().split('T')[0])
            .lte('appointment_date', endOfMonth.toISOString().split('T')[0]);
          break;
      }
    }
    
    const { data, error } = await supabaseQuery
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });
    
    if (error) {
      console.error('❌ Error searching appointments:', error);
      throw error;
    }
    
    const appointments = data?.map(appointment => ({
      ...appointment,
      customer_name: appointment.customers?.name,
      customer_phone: appointment.customers?.phone,
      technician_name: appointment.auth_users?.name
    })) || [];
    
    console.log(`✅ Search completed: ${appointments.length} results`);
    return appointments;
  } catch (error) {
    console.error('❌ Error searching appointments:', error);
    throw error;
  }
}
