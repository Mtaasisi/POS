// Enhanced SMS Service with AI Integration
import { supabase } from '../lib/supabaseClient';
import geminiService from './geminiService';

export interface SMSLog {
  id: string;
  recipient_phone: string;
  message_content: string;
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  error_message?: string;
  sent_at?: string;
  sent_by?: string;
  created_at: string;
  ai_enhanced?: boolean;
  personalization_data?: any;
}

export interface SMSTemplate {
  id: string;
  title: string;
  content: string;
  variables: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  ai_optimized?: boolean;
}

export interface BulkSMSRequest {
  recipients: string[];
  message: string;
  template_id?: string;
  variables?: Record<string, string>;
  ai_enhanced?: boolean;
  personalization_data?: any;
  scheduled_for?: Date;
  created_by?: string;
}

export interface AISMSAnalysis {
  message_quality: number; // 0-1
  suggested_improvements: string[];
  personalization_suggestions: string[];
  optimal_send_time?: string;
  customer_segment_insights?: string;
}

class SMSService {
  private apiKey: string | null = null;
  private apiUrl: string | null = null;

  constructor() {
    this.initializeService();
  }

  private async initializeService() {
    // Load SMS configuration from settings
    try {
      // Fix the query to use proper Supabase syntax
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .or('key.eq.sms_provider_api_key,key.eq.sms_api_url');

      if (error) {
        console.warn('SMS service configuration query failed:', error);
        return;
      }

      if (data && Array.isArray(data)) {
        data.forEach(setting => {
          if (setting.key === 'sms_provider_api_key') {
            this.apiKey = setting.value || null;
          } else if (setting.key === 'sms_api_url') {
            this.apiUrl = setting.value || null;
          }
        });
      }
    } catch (error) {
      console.warn('SMS service configuration not found:', error);
    }
  }

  /**
   * Send SMS with AI enhancement
   */
  async sendSMS(phone: string, message: string, options?: { ai_enhanced?: boolean }): Promise<{ success: boolean; error?: string; log_id?: string }> {
    try {
      // AI enhancement if requested
      let enhancedMessage = message;
      let ai_enhanced = false;
      let personalization_data = null;

      if (options?.ai_enhanced) {
        const aiResult = await this.enhanceMessageWithAI(message, phone);
        if (aiResult.success) {
          enhancedMessage = aiResult.enhanced_message;
          ai_enhanced = true;
          personalization_data = aiResult.personalization_data;
        }
      }

      // Send the SMS
      const result = await this.sendSMSToProvider(phone, enhancedMessage);
      
      // Log the SMS
      const logData = {
        recipient_phone: phone,
        message_content: enhancedMessage,
        status: result.success ? 'sent' : 'failed',
        error_message: result.error,
        sent_at: new Date().toISOString(),
        ai_enhanced,
        personalization_data
      };

      const { data: log } = await supabase
        .from('sms_logs')
        .insert(logData)
        .select()
        .single();

      return {
        success: result.success,
        error: result.error,
        log_id: log?.id
      };
    } catch (error) {
      console.error('SMS send error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send bulk SMS with AI personalization
   */
  async sendBulkSMS(request: BulkSMSRequest): Promise<{ success: boolean; sent: number; failed: number; errors: string[] }> {
    const results = {
      success: true,
      sent: 0,
      failed: 0,
      errors: [] as string[]
    };

    try {
      // AI analysis of the bulk campaign
      if (request.ai_enhanced) {
        const analysis = await this.analyzeBulkCampaign(request);
        console.log('AI Campaign Analysis:', analysis);
      }

      // Process each recipient
      for (const recipient of request.recipients) {
        try {
          let personalizedMessage = request.message;

          // Apply personalization if data is provided
          if (request.personalization_data && request.personalization_data[recipient]) {
            const customerData = request.personalization_data[recipient];
            personalizedMessage = this.personalizeMessage(request.message, customerData);
          }

          // Send SMS
          const result = await this.sendSMS(recipient, personalizedMessage, {
            ai_enhanced: request.ai_enhanced
          });

          if (result.success) {
            results.sent++;
          } else {
            results.failed++;
            results.errors.push(`${recipient}: ${result.error}`);
          }

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          results.failed++;
          results.errors.push(`${recipient}: ${error.message}`);
        }
      }

      return results;
    } catch (error) {
      console.error('Bulk SMS error:', error);
      return {
        success: false,
        sent: results.sent,
        failed: results.failed,
        errors: [...results.errors, error.message]
      };
    }
  }

  /**
   * Enhance message with AI
   */
  private async enhanceMessageWithAI(message: string, phone?: string): Promise<{
    success: boolean;
    enhanced_message: string;
    personalization_data?: any;
  }> {
    try {
      // Get customer data if phone is provided
      let customerData = null;
      if (phone) {
        const { data: customer } = await supabase
          .from('customers')
          .select('*')
          .eq('phone', phone)
          .single();
        customerData = customer;
      }

      const prompt = `Enhance this SMS message for a device repair and sales business:

Original Message: "${message}"
${customerData ? `Customer Data: ${JSON.stringify(customerData, null, 2)}` : ''}

Requirements:
- Keep the core message intact
- Improve clarity and professionalism
- Add personalization if customer data is available
- Ensure it's under 160 characters
- Make it more engaging and actionable
- Use appropriate tone (friendly but professional)

Return only the enhanced message, no explanations.`;

      const response = await geminiService.chat([{ role: 'user', content: prompt }]);
      
      if (response.success && response.data) {
        return {
          success: true,
          enhanced_message: response.data.trim(),
          personalization_data: customerData
        };
      }
    } catch (error) {
      console.error('AI enhancement error:', error);
    }

    return {
      success: false,
      enhanced_message: message
    };
  }

  /**
   * Analyze bulk SMS campaign with AI
   */
  private async analyzeBulkCampaign(request: BulkSMSRequest): Promise<AISMSAnalysis> {
    try {
      const prompt = `Analyze this bulk SMS campaign for a device repair and sales business:

Message: "${request.message}"
Recipients: ${request.recipients.length} customers
${request.personalization_data ? `Personalization: Enabled` : 'Personalization: Disabled'}

Please analyze and provide:
1. Message quality score (0-1)
2. Suggested improvements
3. Personalization suggestions
4. Optimal send time recommendations
5. Customer segment insights

Respond in JSON format:
{
  "message_quality": 0.8,
  "suggested_improvements": ["Add call-to-action", "Include business name"],
  "personalization_suggestions": ["Use customer name", "Reference loyalty level"],
  "optimal_send_time": "10:00 AM - 2:00 PM",
  "customer_segment_insights": "This message targets..."
}`;

      const response = await geminiService.chat([{ role: 'user', content: prompt }]);
      
      if (response.success && response.data) {
        try {
          return JSON.parse(response.data);
        } catch (parseError) {
          console.error('Failed to parse AI analysis:', parseError);
        }
      }
    } catch (error) {
      console.error('AI campaign analysis error:', error);
    }

    return {
      message_quality: 0.5,
      suggested_improvements: [],
      personalization_suggestions: []
    };
  }

  /**
   * Personalize message with customer data
   */
  private personalizeMessage(message: string, customerData: any): string {
    let personalized = message;
    
    // Replace placeholders with customer data
    if (customerData.name) {
      personalized = personalized.replace(/{name}/g, customerData.name);
    }
    if (customerData.loyaltyLevel) {
      personalized = personalized.replace(/{loyaltyLevel}/g, customerData.loyaltyLevel);
    }
    if (customerData.totalSpent) {
      personalized = personalized.replace(/{totalSpent}/g, customerData.totalSpent.toString());
    }
    if (customerData.points) {
      personalized = personalized.replace(/{points}/g, customerData.points.toString());
    }
    
    return personalized;
  }

  /**
   * Send SMS to provider
   */
  private async sendSMSToProvider(phone: string, message: string): Promise<{ success: boolean; error?: string }> {
    if (!this.apiKey || !this.apiUrl) {
      return { success: false, error: 'SMS provider not configured' };
    }

    try {
      // This is a placeholder - replace with your actual SMS provider API
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          phone,
          message,
          sender_id: 'LATS CHANCE'
        })
      });

      if (response.ok) {
        return { success: true };
      } else {
        const error = await response.text();
        return { success: false, error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get SMS logs with AI enhancement info
   */
  async getSMSLogs(filters?: { search?: string; ai_enhanced?: boolean }): Promise<SMSLog[]> {
    try {
      let query = supabase
        .from('sms_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.search) {
        query = query.or(`recipient_phone.ilike.%${filters.search}%,message_content.ilike.%${filters.search}%`);
      }

      if (filters?.ai_enhanced !== undefined) {
        query = query.eq('ai_enhanced', filters.ai_enhanced);
      }

      const { data } = await query;
      return data || [];
    } catch (error) {
      console.error('Error fetching SMS logs:', error);
      return [];
    }
  }

  /**
   * Get SMS templates
   */
  async getTemplates(): Promise<SMSTemplate[]> {
    try {
      const { data } = await supabase
        .from('communication_templates')
        .select('*')
        .eq('template_type', 'sms')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      return data || [];
    } catch (error) {
      console.error('Error fetching templates:', error);
      return [];
    }
  }

  /**
   * Get SMS statistics
   */
  async getSMSStats(): Promise<{ total: number; sent: number; failed: number; pending: number; delivered: number; totalCost: number }> {
    try {
      const { data } = await supabase
        .from('sms_logs')
        .select('status, created_at');

      if (!data) return { total: 0, sent: 0, failed: 0, pending: 0, delivered: 0, totalCost: 0 };

      const stats = {
        total: data.length,
        sent: data.filter(log => log.status === 'sent').length,
        failed: data.filter(log => log.status === 'failed').length,
        pending: data.filter(log => log.status === 'pending').length,
        delivered: data.filter(log => log.status === 'delivered').length,
        totalCost: data.length * 15 // Assuming 15 TZS per SMS
      };

      return stats;
    } catch (error) {
      console.error('Error fetching SMS stats:', error);
      return { total: 0, sent: 0, failed: 0, pending: 0, delivered: 0, totalCost: 0 };
    }
  }

  /**
   * Resend failed SMS
   */
  async resendSMS(logId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get the original SMS log
      const { data: log } = await supabase
        .from('sms_logs')
        .select('*')
        .eq('id', logId)
        .single();

      if (!log) {
        return { success: false, error: 'SMS log not found' };
      }

      // Resend the SMS
      const result = await this.sendSMS(log.recipient_phone, log.message_content);

      // Update the log
      await supabase
        .from('sms_logs')
        .update({
          status: result.success ? 'sent' : 'failed',
          error_message: result.error,
          sent_at: new Date().toISOString()
        })
        .eq('id', logId);

      return result;
    } catch (error) {
      console.error('Resend SMS error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Schedule SMS
   */
  async scheduleSMS(request: BulkSMSRequest & { scheduledFor: Date }): Promise<{ success: boolean; error?: string }> {
    try {
      const { data } = await supabase
        .from('scheduled_sms')
        .insert({
          recipients: request.recipients,
          message: request.message,
          template_id: request.template_id,
          variables: request.variables,
          ai_enhanced: request.ai_enhanced,
          personalization_data: request.personalization_data,
          scheduled_for: request.scheduledFor.toISOString(),
          created_by: request.created_by,
          status: 'pending'
        });

      return { success: true };
    } catch (error) {
      console.error('Schedule SMS error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Log manual SMS message
   */
  async logManualSMS(data: {
    deviceId: string;
    customerId: string;
    sentBy: string;
    message: string;
  }): Promise<boolean> {
    try {
      // Get customer phone number for logging
      const { data: customer } = await supabase
        .from('customers')
        .select('phone')
        .eq('id', data.customerId)
        .single();

      const { error } = await supabase
        .from('sms_logs')
        .insert({
          phone_number: customer?.phone || '',
          message: data.message,
          status: 'sent',
          sent_by: data.sentBy,
          device_id: data.deviceId,
          sent_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error logging manual SMS:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error logging manual SMS:', error);
      return false;
    }
  }
}

// Create singleton instance
const smsService = new SMSService();

// Export the logManualSMS function
const logManualSMS = async (data: {
  deviceId: string;
  customerId: string;
  sentBy: string;
  message: string;
}): Promise<boolean> => {
  return smsService.logManualSMS(data);
};

export { smsService, logManualSMS }; 