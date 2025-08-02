import { supabase } from '../lib/supabaseClient';
import { SMS_TEMPLATES } from '../data/defaultEmailTemplates';
import { cleanPhoneForSMS } from '../lib/phoneUtils';

export interface SMSTemplate {
  id: string;
  title: string;
  content: string;
  module: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SMSLog {
  id: string;
  phone_number: string;
  message: string;
  status: 'sent'; // Only 'sent' appears to be allowed by the check constraint
  error_message?: string;
  sent_at?: string;
  sent_by?: string;
  created_at: string;
}

export interface MobishastraResponse {
  success: boolean;
  message_id?: string;
  error?: string;
  cost?: number;
}

export class SMSService {
  private readonly API_BASE_URL = 'https://mshastra.com/sendurl.aspx';
  private readonly USER = 'Inauzwa';
  private readonly PASSWORD = '@Masika10';
  private readonly SENDER_ID = 'INAUZWA';

  /**
   * Clean phone number to format: 255XXXXXXXXX
   */
  private cleanPhoneNumber(phone: string): string {
    return cleanPhoneForSMS(phone);
  }

  /**
   * Send SMS via Mobishastra API
   */
  private async sendViaMobishastra(phone: string, message: string): Promise<MobishastraResponse> {
    try {
      const cleanedPhone = this.cleanPhoneNumber(phone);
      console.log('Original phone:', phone, 'Cleaned phone:', cleanedPhone);
      
      const params = new URLSearchParams({
        user: this.USER,
        pwd: this.PASSWORD,
        senderid: this.SENDER_ID,
        mobileno: cleanedPhone,
        msgtext: message,
        priority: 'high',
        countrycode: '255'
      });

      const response = await fetch(`${this.API_BASE_URL}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      console.log('Sending SMS to:', phone);
      console.log('Mobishastra API Response:', responseText);

      // Parse the response (Mobishastra returns simple text responses)
      const responseTextLower = responseText.toLowerCase();
      if (responseTextLower.includes('success') || responseTextLower.includes('sent') || responseTextLower.includes('successful')) {
        // Extract message ID if available
        const messageIdMatch = responseText.match(/ID[:\s]*([A-Za-z0-9-]+)/i);
        const messageId = messageIdMatch ? messageIdMatch[1] : undefined;
        
        return {
          success: true,
          message_id: messageId,
          cost: 0.01 // Default cost per SMS
        };
      } else {
        return {
          success: false,
          error: responseText || 'Unknown error from Mobishastra API'
        };
      }
    } catch (error) {
      console.error('Error sending SMS via Mobishastra:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Send SMS and log to database
   */
  async sendSMS(
    phone: string, 
    message: string, 
    customerId?: string, 
    templateId?: string
  ): Promise<{ success: boolean; logId?: string; error?: string }> {
    try {
      // Insert with only existing fields
      const insertData: any = {
        phone_number: phone,
        message: message,
        status: 'sent' // Use 'sent' as default since 'pending' might not be allowed by constraint
      };

      // First, create a log entry with pending status
      const { data: logEntry, error: logError } = await supabase
        .from('sms_logs')
        .insert(insertData)
        .select()
        .single();

      if (logError) {
        console.error('Error creating SMS log entry:', logError);
        return { success: false, error: 'Failed to create log entry' };
      }

      // Send SMS via Mobishastra
      const apiResponse = await this.sendViaMobishastra(phone, message);

      // Update log entry with result
      const updateData = {
        status: apiResponse.success ? 'sent' : 'failed' as const,
        sent_at: apiResponse.success ? new Date().toISOString() : null,
        error_message: apiResponse.error || null,
        cost: apiResponse.cost || null
      };

      const { error: updateError } = await supabase
        .from('sms_logs')
        .update(updateData)
        .eq('id', logEntry.id);

      if (updateError) {
        console.error('Error updating SMS log:', updateError);
      }

      return {
        success: apiResponse.success,
        logId: logEntry.id,
        error: apiResponse.error
      };
    } catch (error) {
      console.error('Error in sendSMS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Send SMS using template with variables
   */
  async sendTemplateSMS(
    phone: string,
    templateId: string,
    variables: Record<string, string>,
    customerId?: string
  ): Promise<{ success: boolean; logId?: string; error?: string }> {
    try {
      // Get template
      const { data: template, error: templateError } = await supabase
        .from('communication_templates')
        .select('*')
        .eq('id', templateId)
        .eq('is_active', true)
        .single();

      if (templateError || !template) {
        return { success: false, error: 'Template not found or inactive' };
      }

      // Replace variables in template
      let message = template.content;
      Object.entries(variables).forEach(([key, value]) => {
        message = message.replace(new RegExp(`{${key}}`, 'g'), String(value));
      });

      // Send SMS
      return await this.sendSMS(phone, message, customerId, templateId);
    } catch (error) {
      console.error('Error in sendTemplateSMS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get SMS logs with filters
   */
  async getSMSLogs(filters?: {
    status?: string;
    customerId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<SMSLog[]> {
    try {
      let query = supabase
        .from('sms_logs')
        .select('*');

      // Try to order by created_at, but fallback to id if column doesn't exist
      try {
        query = query.order('created_at', { ascending: false });
      } catch {
        // If created_at doesn't exist, order by id instead
        query = query.order('id', { ascending: false });
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      // Note: customer_id column doesn't exist in sms_logs table
      // if (filters?.customerId) {
      //   query = query.eq('customer_id', filters.customerId);
      // }

      if (filters?.startDate) {
        try {
          query = query.gte('created_at', filters.startDate);
        } catch {
          // Skip date filtering if created_at doesn't exist
        }
      }

      if (filters?.endDate) {
        try {
          query = query.lte('created_at', filters.endDate);
        } catch {
          // Skip date filtering if created_at doesn't exist
        }
      }

      if (filters?.search) {
        query = query.or(`recipient_phone.ilike.%${filters.search}%,message_content.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching SMS logs:', error);
        return [];
      }

      return (data as SMSLog[]) || [];
    } catch (error) {
      console.error('Error in getSMSLogs:', error);
      return [];
    }
  }

  /**
   * Get communication templates
   */
  async getTemplates(module?: string): Promise<SMSTemplate[]> {
    try {
      let query = supabase
        .from('communication_templates')
        .select('*')
        .eq('is_active', true)
        .order('title', { ascending: true });

      if (module) {
        query = query.eq('module', module);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching templates:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getTemplates:', error);
      return [];
    }
  }

  /**
   * Resend failed SMS
   */
  async resendSMS(logId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the original SMS log
      const { data: logEntry, error: fetchError } = await supabase
        .from('sms_logs')
        .select('*')
        .eq('id', logId)
        .single();

      if (fetchError || !logEntry) {
        return { success: false, error: 'SMS log not found' };
      }

      // Send SMS again
      const result = await this.sendSMS(
        logEntry.phone_number,
        logEntry.message
      );

      return result;
    } catch (error) {
      console.error('Error in resendSMS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get SMS statistics
   */
  async getSMSStats(): Promise<{
    total: number;
    sent: number;
    failed: number;
    pending: number;
    delivered: number;
    totalCost: number;
  }> {
    try {
      const { data, error } = await supabase
        .from('sms_logs')
        .select('status, cost');

      if (error) {
        console.error('Error fetching SMS stats:', error);
        return {
          total: 0,
          sent: 0,
          failed: 0,
          pending: 0,
          delivered: 0,
          totalCost: 0
        };
      }

      const stats = {
        total: data.length,
        sent: data.filter(log => log.status === 'sent').length,
        failed: data.filter(log => log.status === 'failed').length,
        pending: data.filter(log => log.status === 'pending').length,
        delivered: data.filter(log => log.status === 'delivered').length,
        totalCost: data.reduce((sum, log) => sum + (log.cost || 0), 0)
      };

      return stats;
    } catch (error) {
      console.error('Error in getSMSStats:', error);
      return {
        total: 0,
        sent: 0,
        failed: 0,
        pending: 0,
        delivered: 0,
        totalCost: 0
      };
    }
  }

  /**
   * Send SMS to multiple numbers (comma-separated)
   */
  async sendBulkSMS(phones: string[], message: string, scheduledDate?: string): Promise<MobishastraResponse[]> {
    const cleanedPhones = phones.map(phone => this.cleanPhoneNumber(phone));
    const params = new URLSearchParams({
      user: this.USER,
      pwd: this.PASSWORD,
      senderid: this.SENDER_ID,
      mobileno: cleanedPhones.join(','),
      msgtext: message,
      priority: 'high',
      countrycode: '255',
    });
    if (scheduledDate) {
      params.append('scheduledDate', scheduledDate);
    }
    const response = await fetch(`https://mshastra.com/sendurlcomma.aspx?${params.toString()}`);
    const responseText = await response.text();
    // Parse and return array of responses (one per number)
    return cleanedPhones.map(phone => ({
      success: responseText.includes('success') || responseText.includes('sent'),
      message_id: undefined,
      error: responseText.includes('success') ? undefined : responseText,
      cost: responseText.includes('success') ? 0.01 : undefined
    }));
  }

  /**
   * Send SMS using Mobishastra JSON API
   */
  async sendSMSJson(phone: string, message: string): Promise<MobishastraResponse> {
    const payload = [{
      user: this.USER,
      pwd: this.PASSWORD,
      number: this.cleanPhoneNumber(phone),
      msg: message,
      sender: this.SENDER_ID,
      language: 'English',
    }];
    const response = await fetch('https://valuesms.ae/sendsms_api_json.aspx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const responseText = await response.text();
    return {
      success: responseText.includes('success') || responseText.includes('sent'),
      message_id: undefined,
      error: responseText.includes('success') ? undefined : responseText,
    };
  }

  /**
   * Send SMS using Mobishastra XML API
   */
  async sendSMSXml(phone: string, message: string): Promise<MobishastraResponse> {
    const xml = `<request><user>${this.USER}</user><pwd>${this.PASSWORD}</pwd><message><number>${this.cleanPhoneNumber(phone)}</number><msg>${message}</msg><sender>${this.SENDER_ID}</sender><language>ENGLISH</language></message></request>`;
    const response = await fetch('https://mshastra.com/sendsms_api_xml.aspx', {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml' },
      body: xml,
    });
    const responseText = await response.text();
    return {
      success: responseText.includes('success') || responseText.includes('sent'),
      message_id: undefined,
      error: responseText.includes('success') ? undefined : responseText,
    };
  }

  /**
   * Check Mobishastra SMS balance
   */
  async checkBalance(): Promise<{ success: boolean; balance?: string; error?: string }> {
    const params = new URLSearchParams({
      user: this.USER,
      pwd: this.PASSWORD,
    });
    const response = await fetch(`https://mshastra.com/balance.aspx?${params.toString()}`);
    const responseText = await response.text();
    if (response.ok && !isNaN(Number(responseText.trim()))) {
      return { success: true, balance: responseText.trim() };
    } else {
      return { success: false, error: responseText };
    }
  }

  /**
   * Poll Mobishastra for delivery status of a message (using message_id or external_id if available)
   * Note: Mobishastra must support a status API for this to work. Placeholder implementation.
   */
  async checkDeliveryStatus(messageId: string): Promise<{ success: boolean; status?: string; error?: string }> {
    // Replace with actual Mobishastra status API if available
    // Example endpoint: https://mshastra.com/status_api.aspx?user=...&pwd=...&msgid=...
    // This is a placeholder and will always return unknown
    return { success: false, status: 'unknown', error: 'Mobishastra status API not implemented' };
  }

  /**
   * Scheduled balance check. If balance is below threshold, trigger alert callback.
   * This should be called from a scheduled job (e.g., CRON or serverless schedule)
   */
  async scheduledBalanceCheck(threshold: number, alertCallback: (balance: number) => void): Promise<void> {
    const result = await this.checkBalance();
    if (result.success && result.balance) {
      const balance = parseFloat(result.balance);
      if (!isNaN(balance) && balance < threshold) {
        alertCallback(balance);
      }
    }
  }

  /**
   * Get analytics summary for SMS logs (total sent, failed, delivered, pending, cost)
   */
  async getAnalyticsSummary(): Promise<{
    total: number;
    sent: number;
    failed: number;
    pending: number;
    delivered: number;
    totalCost: number;
  }> {
    return this.getSMSStats();
  }

  /**
   * Log an SMS to the sms_logs table
   */
  async logSMS(log: {
    phone_number: string;
    message: string;
    status: 'sent';
    error_message?: string | null;
    sent_at?: string | null;
  }): Promise<any> {
    return supabase.from('sms_logs').insert(log);
  }

  /**
   * Log a manual SMS to the sms_logs table
   */
  async logManualSMS({ deviceId, customerId, sentBy, message }: { 
    deviceId: string, 
    customerId: string, 
    sentBy: string, 
    message: string 
  }): Promise<any> {
    return supabase.from('sms_logs').insert({
      phone_number: '', // Will be filled from customer data
      message: message,
      status: 'sent',
      sent_by: sentBy,
      sent_at: new Date().toISOString()
    });
  }

  /**
   * Send device received SMS notification in Swahili
   */
  async sendDeviceReceivedSMS(
    phone: string, 
    customerName: string, 
    deviceBrand: string, 
    deviceModel: string, 
    ticketNumber: string, 
    issueDescription: string,
    customerId?: string
  ): Promise<{ success: boolean; logId?: string; error?: string }> {
    const template = SMS_TEMPLATES.find(t => t.name === 'deviceReceived');
    if (!template) {
      return { success: false, error: 'Device received template not found' };
    }

    const currentDate = new Date().toLocaleDateString('sw-TZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Combine brand and model for the SMS
    const fullModelName = `${deviceBrand} ${deviceModel}`.trim();

    let message = template.message
      .replace(/\[Jina la Mteja\]/g, customerName)
      .replace(/\[Model ya Kifaa\]/g, fullModelName)
      .replace(/\[Namba ya Tiketi\]/g, ticketNumber)
      .replace(/\[Tarehe\]/g, currentDate)
      .replace(/\[Maelezo mafupi\]/g, issueDescription);

    return this.sendSMS(phone, message, customerId);
  }

  /**
   * Send device ready SMS notification in Swahili
   */
  async sendDeviceReadySMS(
    phone: string, 
    customerName: string, 
    deviceBrand: string, 
    deviceModel: string, 
    ticketNumber: string,
    customerId?: string
  ): Promise<{ success: boolean; logId?: string; error?: string }> {
    const template = SMS_TEMPLATES.find(t => t.name === 'deviceReady');
    if (!template) {
      return { success: false, error: 'Device ready template not found' };
    }

    const currentDate = new Date().toLocaleDateString('sw-TZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Combine brand and model for the SMS
    const fullModelName = `${deviceBrand} ${deviceModel}`.trim();

    let message = template.message
      .replace(/\[Jina la Mteja\]/g, customerName)
      .replace(/\[Model ya Kifaa\]/g, fullModelName)
      .replace(/\[Namba ya Tiketi\]/g, ticketNumber)
      .replace(/\[Tarehe\]/g, currentDate);

    return this.sendSMS(phone, message, customerId);
  }

  /**
   * Send sales return received SMS notification
   */
  async sendReturnReceivedSMS(
    phone: string, 
    customerName: string, 
    deviceBrand: string, 
    deviceModel: string, 
    returnId: string, 
    reason: string,
    customerId?: string
  ): Promise<{ success: boolean; logId?: string; error?: string }> {
    const template = SMS_TEMPLATES.find(t => t.name === 'returnReceived');
    if (!template) {
      return { success: false, error: 'Sales return received template not found' };
    }

    const currentDate = new Date().toLocaleDateString('sw-TZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Combine brand and model for the SMS
    const fullModelName = `${deviceBrand} ${deviceModel}`.trim();

    let message = template.message
      .replace(/\[Jina la Mteja\]/g, customerName)
      .replace(/\[Model ya Kifaa\]/g, fullModelName)
      .replace(/\[Namba ya Return\]/g, returnId)
      .replace(/\[Tarehe\]/g, currentDate)
      .replace(/\[Sababu ya Kurudi\]/g, reason);

    return this.sendSMS(phone, message, customerId);
  }

  /**
   * Send return status update SMS notification
   */
  async sendReturnStatusUpdateSMS(
    phone: string, 
    customerName: string, 
    deviceBrand: string, 
    deviceModel: string, 
    returnId: string, 
    status: string,
    customerId?: string
  ): Promise<{ success: boolean; logId?: string; error?: string }> {
    const template = SMS_TEMPLATES.find(t => t.name === 'returnStatusUpdate');
    if (!template) {
      return { success: false, error: 'Return status update template not found' };
    }

    const currentDate = new Date().toLocaleDateString('sw-TZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Combine brand and model for the SMS
    const fullModelName = `${deviceBrand} ${deviceModel}`.trim();

    let message = template.message
      .replace(/\[Jina la Mteja\]/g, customerName)
      .replace(/\[Model ya Kifaa\]/g, fullModelName)
      .replace(/\[Namba ya Return\]/g, returnId)
      .replace(/\[Tarehe\]/g, currentDate)
      .replace(/\[Hali ya Return\]/g, status);

    return this.sendSMS(phone, message, customerId);
  }

  /**
   * Send return resolved SMS notification
   */
  async sendReturnResolvedSMS(
    phone: string, 
    customerName: string, 
    deviceBrand: string, 
    deviceModel: string, 
    returnId: string, 
    resolution: string,
    customerId?: string
  ): Promise<{ success: boolean; logId?: string; error?: string }> {
    const template = SMS_TEMPLATES.find(t => t.name === 'returnResolved');
    if (!template) {
      return { success: false, error: 'Return resolved template not found' };
    }

    const currentDate = new Date().toLocaleDateString('sw-TZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Combine brand and model for the SMS
    const fullModelName = `${deviceBrand} ${deviceModel}`.trim();

    let message = template.message
      .replace(/\[Jina la Mteja\]/g, customerName)
      .replace(/\[Model ya Kifaa\]/g, fullModelName)
      .replace(/\[Namba ya Return\]/g, returnId)
      .replace(/\[Tarehe\]/g, currentDate)
      .replace(/\[Uamuzi\]/g, resolution);

    return this.sendSMS(phone, message, customerId);
  }
}

export const smsService = new SMSService();

/**
 * Log a manual SMS to the sms_logs table
 */
export async function logManualSMS({ deviceId, customerId, sentBy, message }: { 
  deviceId: string, 
  customerId: string, 
  sentBy: string, 
  message: string 
}): Promise<any> {
  return supabase.from('sms_logs').insert({
    phone_number: '', // Will be filled from customer data
    message: message,
    status: 'sent',
    sent_by: sentBy,
    sent_at: new Date().toISOString()
  });
} 