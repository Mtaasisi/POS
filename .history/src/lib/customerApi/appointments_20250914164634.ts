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
    
    // Fetch appointments without joins to avoid foreign key issues
    console.log('📅 Fetching appointments without joins...');
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true });
    
    if (error) {
      console.error('❌ Error fetching appointments:', error);
      throw error;
    }
    
    const appointments = data?.map(appointment => ({
      ...appointment,
      customer_name: 'Unknown Customer',
      customer_phone: 'No Phone',
      technician_name: 'No Technician'
    })) || [];
    
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
      technician_name: 'No Technician'
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
    
    // First, check if customer is inactive and reactivate them
    try {
      const { data: customer, error: fetchError } = await supabase
        .from('customers')
        .select('is_active, name')
        .eq('id', appointmentData.customer_id)
        .single();

      if (!fetchError && customer && !customer.is_active) {
        console.log(`🔄 Customer ${customer.name} is inactive, reactivating...`);
        await reactivateCustomer(appointmentData.customer_id);
        console.log(`✅ Customer ${customer.name} reactivated automatically`);
      }
    } catch (reactivationError) {
      console.warn('⚠️ Failed to check/reactivate customer status:', reactivationError);
      // Continue with appointment creation even if reactivation fails
    }
    
    // Create the appointment
    const { data, error } = await supabase
      .from('appointments')
      .insert([{
        ...appointmentData,
        status: 'pending',
        duration_minutes: appointmentData.duration_minutes || 60,
        priority: appointmentData.priority || 'medium'
      }])
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
    
    const { data, error } = await supabase
      .from('appointments')
      .select('status, appointment_date');
    
    if (error) {
      console.error('❌ Error fetching appointment stats:', error);
      throw error;
    }
    
    const today = new Date().toISOString().split('T')[0];
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const endOfWeek = new Date();
    endOfWeek.setDate(endOfWeek.getDate() + (6 - endOfWeek.getDay()));
    
    const stats = {
      total: data?.length || 0,
      pending: data?.filter(a => a.status === 'pending').length || 0,
      confirmed: data?.filter(a => a.status === 'confirmed').length || 0,
      completed: data?.filter(a => a.status === 'completed').length || 0,
      cancelled: data?.filter(a => a.status === 'cancelled').length || 0,
      today: data?.filter(a => a.appointment_date === today).length || 0,
      thisWeek: data?.filter(a => {
        const appointmentDate = new Date(a.appointment_date);
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
