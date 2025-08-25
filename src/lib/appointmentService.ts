import { supabase } from './supabaseClient';
import { toast } from 'react-hot-toast';

export interface Appointment {
  id: string;
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  service_type: string;
  service_description?: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes: number;
  technician_id?: string;
  technician_name?: string;
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  location_id?: string;
  location_name?: string;
  notes?: string;
  whatsapp_reminder_sent: boolean;
  sms_reminder_sent: boolean;
  email_reminder_sent: boolean;
  reminder_sent_at?: string;
  confirmed_at?: string;
  started_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAppointmentData {
  customer_id?: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  service_type: string;
  service_description?: string;
  appointment_date: string;
  appointment_time: string;
  duration_minutes?: number;
  technician_id?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  location_id?: string;
  notes?: string;
}

export interface UpdateAppointmentData {
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  service_type?: string;
  service_description?: string;
  appointment_date?: string;
  appointment_time?: string;
  duration_minutes?: number;
  technician_id?: string;
  status?: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  location_id?: string;
  notes?: string;
}

class AppointmentService {
  // Get all appointments with optional filters
  async getAppointments(filters?: {
    status?: string;
    date?: string;
    technician_id?: string;
    customer_id?: string;
    priority?: string;
  }): Promise<Appointment[]> {
    try {
      let query = supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true });

      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters?.date) {
        query = query.eq('appointment_date', filters.date);
      }

      if (filters?.technician_id) {
        query = query.eq('technician_id', filters.technician_id);
      }

      if (filters?.customer_id) {
        query = query.eq('customer_id', filters.customer_id);
      }

      if (filters?.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching appointments:', error);
        toast.error('Failed to load appointments');
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAppointments:', error);
      toast.error('Failed to load appointments');
      return [];
    }
  }

  // Get appointment by ID
  async getAppointmentById(id: string): Promise<Appointment | null> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching appointment:', error);
        toast.error('Failed to load appointment');
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getAppointmentById:', error);
      toast.error('Failed to load appointment');
      return null;
    }
  }

  // Create new appointment
  async createAppointment(appointmentData: CreateAppointmentData): Promise<Appointment | null> {
    try {
      // Get technician name if technician_id is provided
      let technician_name = undefined;
      if (appointmentData.technician_id) {
        const { data: technician } = await supabase
          .from('employees')
          .select('name')
          .eq('id', appointmentData.technician_id)
          .single();
        technician_name = technician?.name;
      }

      // Get location name if location_id is provided
      let location_name = undefined;
      if (appointmentData.location_id) {
        const { data: location } = await supabase
          .from('lats_store_locations')
          .select('name')
          .eq('id', appointmentData.location_id)
          .single();
        location_name = location?.name;
      }

      const { data, error } = await supabase
        .from('appointments')
        .insert({
          ...appointmentData,
          technician_name,
          location_name,
          status: 'scheduled',
          priority: appointmentData.priority || 'medium',
          duration_minutes: appointmentData.duration_minutes || 60,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating appointment:', error);
        toast.error('Failed to create appointment');
        return null;
      }

      toast.success('Appointment created successfully');
      return data;
    } catch (error) {
      console.error('Error in createAppointment:', error);
      toast.error('Failed to create appointment');
      return null;
    }
  }

  // Update appointment
  async updateAppointment(id: string, updateData: UpdateAppointmentData): Promise<Appointment | null> {
    try {
      // Get technician name if technician_id is provided
      let technician_name = undefined;
      if (updateData.technician_id) {
        const { data: technician } = await supabase
          .from('employees')
          .select('name')
          .eq('id', updateData.technician_id)
          .single();
        technician_name = technician?.name;
      }

      // Get location name if location_id is provided
      let location_name = undefined;
      if (updateData.location_id) {
        const { data: location } = await supabase
          .from('lats_store_locations')
          .select('name')
          .eq('id', updateData.location_id)
          .single();
        location_name = location?.name;
      }

      const { data, error } = await supabase
        .from('appointments')
        .update({
          ...updateData,
          technician_name,
          location_name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating appointment:', error);
        toast.error('Failed to update appointment');
        return null;
      }

      toast.success('Appointment updated successfully');
      return data;
    } catch (error) {
      console.error('Error in updateAppointment:', error);
      toast.error('Failed to update appointment');
      return null;
    }
  }

  // Delete appointment
  async deleteAppointment(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting appointment:', error);
        toast.error('Failed to delete appointment');
        return false;
      }

      toast.success('Appointment deleted successfully');
      return true;
    } catch (error) {
      console.error('Error in deleteAppointment:', error);
      toast.error('Failed to delete appointment');
      return false;
    }
  }

  // Update appointment status
  async updateAppointmentStatus(id: string, status: Appointment['status']): Promise<boolean> {
    try {
      const updateData: any = { status };
      
      // Add timestamp based on status
      switch (status) {
        case 'confirmed':
          updateData.confirmed_at = new Date().toISOString();
          break;
        case 'in-progress':
          updateData.started_at = new Date().toISOString();
          break;
        case 'completed':
          updateData.completed_at = new Date().toISOString();
          break;
        case 'cancelled':
          updateData.cancelled_at = new Date().toISOString();
          break;
      }

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', id);

      if (error) {
        console.error('Error updating appointment status:', error);
        toast.error('Failed to update appointment status');
        return false;
      }

      toast.success(`Appointment ${status} successfully`);
      return true;
    } catch (error) {
      console.error('Error in updateAppointmentStatus:', error);
      toast.error('Failed to update appointment status');
      return false;
    }
  }

  // Get appointment statistics
  async getAppointmentStats(): Promise<{
    total: number;
    today: number;
    pending: number;
    completed: number;
    cancelled: number;
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('appointments')
        .select('status, appointment_date');

      if (error) {
        console.error('Error fetching appointment stats:', error);
        return { total: 0, today: 0, pending: 0, completed: 0, cancelled: 0 };
      }

      const appointments = data || [];
      
      return {
        total: appointments.length,
        today: appointments.filter(a => a.appointment_date === today).length,
        pending: appointments.filter(a => a.status === 'scheduled').length,
        completed: appointments.filter(a => a.status === 'completed').length,
        cancelled: appointments.filter(a => a.status === 'cancelled').length,
      };
    } catch (error) {
      console.error('Error in getAppointmentStats:', error);
      return { total: 0, today: 0, pending: 0, completed: 0, cancelled: 0 };
    }
  }

  // Get available time slots for a date
  async getAvailableTimeSlots(date: string, duration: number = 60): Promise<string[]> {
    try {
      // Get all appointments for the date
      const { data: appointments } = await supabase
        .from('appointments')
        .select('appointment_time, duration_minutes')
        .eq('appointment_date', date)
        .not('status', 'in', ['cancelled', 'no-show']);

      // Generate time slots from 8 AM to 6 PM
      const timeSlots: string[] = [];
      const startHour = 8;
      const endHour = 18;
      
      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          timeSlots.push(time);
        }
      }

      // Filter out occupied slots
      const occupiedSlots = appointments || [];
      const availableSlots = timeSlots.filter(slot => {
        return !occupiedSlots.some(appointment => {
          const appointmentStart = appointment.appointment_time;
          const appointmentEnd = this.addMinutes(appointmentStart, appointment.duration_minutes || 60);
          const slotEnd = this.addMinutes(slot, duration);
          
          return this.timeOverlaps(slot, slotEnd, appointmentStart, appointmentEnd);
        });
      });

      return availableSlots;
    } catch (error) {
      console.error('Error in getAvailableTimeSlots:', error);
      return [];
    }
  }

  // Helper methods
  private addMinutes(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  }

  private timeOverlaps(start1: string, end1: string, start2: string, end2: string): boolean {
    return start1 < end2 && start2 < end1;
  }
}

export const appointmentService = new AppointmentService();
