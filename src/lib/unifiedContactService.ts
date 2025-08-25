import { supabase } from './supabaseClient';
import { formatTanzaniaPhoneNumber } from './phoneUtils';

export interface ContactMethod {
  type: 'sms' | 'phone_call';
  number: string;
  available: boolean;
  preferred: boolean;
}

export interface UnifiedContact {
  id: string;
  name: string;
  phone: string;
  contactMethods: ContactMethod[];
  preferredMethod: 'sms' | 'phone_call';
  lastContacted?: Date;
  contactHistory: ContactHistory[];
}

export interface ContactHistory {
  id: string;
  method: 'sms' | 'phone_call';
  type: 'message' | 'call';
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'answered' | 'missed';
  timestamp: Date;
  content?: string;
  duration?: number; // for calls
}

export interface ContactPreferences {
  customerId: string;
  preferredMethod: 'sms' | 'phone_call';
  smsEnabled: boolean;
  phoneCallEnabled: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string; // HH:MM format
  };
  language: 'en' | 'sw';
}

export class UnifiedContactService {
  private static instance: UnifiedContactService;

  private constructor() {
  }

  static getInstance(): UnifiedContactService {
    if (!UnifiedContactService.instance) {
      UnifiedContactService.instance = new UnifiedContactService();
    }
    return UnifiedContactService.instance;
  }

  /**
   * Get unified contact information for a customer
   */
  async getUnifiedContact(customerId: string): Promise<UnifiedContact | null> {
    try {
      const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();

      if (error || !customer) {
        throw error || new Error('Customer not found');
      }

      // Get contact preferences
      const preferences = await this.getContactPreferences(customerId);
      
      // Get contact history
      const history = await this.getContactHistory(customerId);

      // Determine available contact methods
      const contactMethods = this.determineContactMethods(customer, preferences);

      return {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        contactMethods,
        preferredMethod: preferences?.preferredMethod || 'sms',
        lastContacted: history.length > 0 ? new Date(history[0].timestamp) : undefined,
        contactHistory: history
      };
    } catch (error) {
      console.error('Error getting unified contact:', error);
      throw error;
    }
  }

  /**
   * Determine available contact methods for a customer
   */
  private determineContactMethods(customer: any, preferences?: ContactPreferences): ContactMethod[] {
    const methods: ContactMethod[] = [];
    const preferredMethod = preferences?.preferredMethod || 'sms';

    // SMS method (using phone number)
    if (customer.phone && preferences?.smsEnabled !== false) {
      methods.push({
        type: 'sms',
        number: formatTanzaniaPhoneNumber(customer.phone),
        available: true,
        preferred: preferredMethod === 'sms'
      });
    }

    // Phone call method
    if (customer.phone && preferences?.phoneCallEnabled !== false) {
      methods.push({
        type: 'phone_call',
        number: formatTanzaniaPhoneNumber(customer.phone),
        available: true,
        preferred: preferredMethod === 'phone_call'
      });
    }

    return methods;
  }

  /**
   * Send message using the best available method
   */
  async sendMessage(customerId: string, message: string, preferredMethod?: 'sms' | 'phone_call'): Promise<ContactHistory> {
    try {
      const contact = await this.getUnifiedContact(customerId);
      if (!contact) {
        throw new Error('Contact not found');
      }

      const method = preferredMethod || contact.preferredMethod;
      const contactMethod = contact.contactMethods.find(m => m.type === method);

      if (!contactMethod) {
        throw new Error(`Contact method ${method} not available for this customer`);
      }

      let result: ContactHistory;

      switch (method) {
        case 'sms':
          result = await this.sendSMSMessage(contactMethod.number, message, customerId);
          break;
        case 'phone_call':
          result = await this.initiatePhoneCall(contactMethod.number, customerId);
          break;
        default:
          throw new Error(`Unsupported contact method: ${method}`);
      }

      // Update contact history
      await this.addContactHistory(result);

      return result;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }



  /**
   * Send SMS message (placeholder for SMS service integration)
   */
  private async sendSMSMessage(phoneNumber: string, message: string, customerId: string): Promise<ContactHistory> {
    // TODO: Integrate with SMS service
    console.log(`SMS to ${phoneNumber}: ${message}`);
    
    return {
      id: `sms_${Date.now()}`,
      method: 'sms',
      type: 'message',
      status: 'sent',
      timestamp: new Date(),
      content: message
    };
  }

  /**
   * Initiate phone call (placeholder for call service integration)
   */
  private async initiatePhoneCall(phoneNumber: string, customerId: string): Promise<ContactHistory> {
    // TODO: Integrate with phone call service
    console.log(`Calling ${phoneNumber}`);
    
    return {
      id: `call_${Date.now()}`,
      method: 'phone_call',
      type: 'call',
      status: 'sent',
      timestamp: new Date(),
      duration: 0
    };
  }

  /**
   * Get contact preferences for a customer
   */
  async getContactPreferences(customerId: string): Promise<ContactPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('contact_preferences')
        .select('*')
        .eq('customer_id', customerId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return data || this.getDefaultPreferences(customerId);
    } catch (error) {
      console.error('Error getting contact preferences:', error);
      return this.getDefaultPreferences(customerId);
    }
  }

  /**
   * Update contact preferences
   */
  async updateContactPreferences(preferences: ContactPreferences): Promise<void> {
    try {
      const { error } = await supabase
        .from('contact_preferences')
        .upsert(preferences, { onConflict: 'customer_id' });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating contact preferences:', error);
      throw error;
    }
  }

  /**
   * Get default contact preferences
   */
  private getDefaultPreferences(customerId: string): ContactPreferences {
    return {
      customerId,
      preferredMethod: 'sms',
      smsEnabled: true,
      phoneCallEnabled: true,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      },
      language: 'en'
    };
  }

  /**
   * Get contact history for a customer
   */
  async getContactHistory(customerId: string, limit: number = 50): Promise<ContactHistory[]> {
    try {
      const { data, error } = await supabase
        .from('contact_history')
        .select('*')
        .eq('customer_id', customerId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        method: item.method,
        type: item.type,
        status: item.status,
        timestamp: new Date(item.timestamp),
        content: item.content,
        duration: item.duration
      }));
    } catch (error) {
      console.error('Error getting contact history:', error);
      return [];
    }
  }

  /**
   * Add contact history entry
   */
  private async addContactHistory(history: ContactHistory): Promise<void> {
    try {
      const { error } = await supabase
        .from('contact_history')
        .insert({
          id: history.id,
          customer_id: history.id, // This should be customerId, fix in implementation
          method: history.method,
          type: history.type,
          status: history.status,
          timestamp: history.timestamp.toISOString(),
          content: history.content,
          duration: history.duration
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error adding contact history:', error);
    }
  }





  /**
   * Get best contact method for a customer
   */
  async getBestContactMethod(customerId: string): Promise<ContactMethod | null> {
    try {
      const contact = await this.getUnifiedContact(customerId);
      if (!contact) return null;

      // Return the preferred method if available
      const preferred = contact.contactMethods.find(m => m.preferred);
      if (preferred) return preferred;

      // Fallback to first available method
      return contact.contactMethods[0] || null;
    } catch (error) {
      console.error('Error getting best contact method:', error);
      return null;
    }
  }
}
