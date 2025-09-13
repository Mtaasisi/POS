import { supabase } from './supabaseClient';
import { emailService } from '../services/emailService';
import { smsService } from '../services/smsService';

export interface ReminderConfig {
  handoverReminderHours: number;
  checkIntervalMinutes: number;
}

const DEFAULT_CONFIG: ReminderConfig = {
  handoverReminderHours: 24,
  checkIntervalMinutes: 30
};

export class ReminderService {
  private config: ReminderConfig;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(config: Partial<ReminderConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  start() {
    if (this.intervalId) {
      this.stop();
    }
    
    this.intervalId = setInterval(() => {
      this.checkOverdueHandovers();
    }, this.config.checkIntervalMinutes * 60 * 1000);
    
    // Run immediately on start
    this.checkOverdueHandovers();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async checkOverdueHandovers() {
    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - this.config.handoverReminderHours);

      const { data: overdueDevices, error } = await supabase
        .from('devices')
        .select(`
          id,
          serial_number,
          brand,
          model,
          status,
          updated_at,
          customer_id,
          customers (
            name,
            phone,
            email
          )
        `)
        .eq('status', 'repair-complete')
        .lt('updated_at', cutoffTime.toISOString());

      if (error) {
        console.error('Error checking overdue handovers:', error);
        return;
      }

      if (overdueDevices && overdueDevices.length > 0) {
        await this.sendHandoverReminders(overdueDevices);
      }
    } catch (error) {
      console.error('Error in checkOverdueHandovers:', error);
    }
  }

  private async sendHandoverReminders(devices: any[]) {
    try {
      // Get customer care emails
      const customerCareEmails = await this.getCustomerCareEmails();
      
      if (customerCareEmails.length === 0) {
        console.warn('No customer care emails found for handover reminders');
        return;
      }

      const deviceList = devices.map(device => 
        `${device.brand} ${device.model} (${device.serial_number}) - Customer: ${device.customers?.name || 'Unknown'}`
      ).join('\n');

      const emailContent = `
        <h2>Overdue Device Handovers</h2>
        <p>The following devices have been marked as "repair-complete" for more than ${this.config.handoverReminderHours} hours and require customer handover:</p>
        <ul>
          ${devices.map(device => 
            `<li><strong>${device.brand} ${device.model}</strong> (${device.serial_number})<br>
             Customer: ${device.customers?.name || 'Unknown'}<br>
             Status since: ${new Date(device.updated_at).toLocaleString()}</li>`
          ).join('')}
        </ul>
        <p>Please contact customers to arrange pickup or delivery.</p>
      `;

      // Send email to customer care
      await emailService.sendEmail({
        to: customerCareEmails.join(','),
        subject: `Overdue Device Handovers - ${devices.length} devices`,
        content: emailContent
      });

      console.log(`Sent handover reminders for ${devices.length} devices`);
    } catch (error) {
      console.error('Error sending handover reminders:', error);
    }
  }

  private async getCustomerCareEmails(): Promise<string[]> {
    try {
      const { data: users, error } = await supabase
        .from('auth_users')
        .select('email')
        .eq('role', 'customer-care');

      if (error) {
        console.error('Error fetching customer care emails:', error);
        return [];
      }

      return users?.map(user => user.email) || [];
    } catch (error) {
      console.error('Error getting customer care emails:', error);
      return [];
    }
  }

  // Manual check method for testing
  async manualCheck() {
    await this.checkOverdueHandovers();
  }
}

// Export singleton instance
export const reminderService = new ReminderService(); 