import { supabase } from '../lib/supabaseClient';

export interface EmailData {
  to: string;
  subject: string;
  content: string;
  customerId?: string;
  campaignId?: string;
  templateId?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  variables: string[];
  category: string;
  isActive: boolean;
}

export interface EmailCampaign {
  id: string;
  name: string;
  templateId: string;
  templateName: string;
  targetAudience: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
  scheduledDate?: string;
  sentCount: number;
  totalCount: number;
}

class EmailService {
  private apiKey: string | null = null;

  constructor() {
    // Initialize with your email service API key
    this.apiKey = import.meta.env.VITE_EMAIL_API_KEY || null;
  }

  // Render template with variables
  renderTemplate(template: EmailTemplate, variables: Record<string, string>): { subject: string; content: string } {
    let subject = template.subject;
    let content = template.content;

    // Replace variables in subject and content
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'gi');
      subject = subject.replace(regex, value);
      content = content.replace(regex, value);
    });

    return { subject, content };
  }

  // Send single email
  async sendEmail(emailData: EmailData): Promise<{ success: boolean; error?: string }> {
    try {
      // Log email to database
      try {
      const { error: logError } = await supabase
        .from('email_logs')
        .insert({
          to_email: emailData.to,
          subject: emailData.subject,
          content: emailData.content,
          customer_id: emailData.customerId,
          campaign_id: emailData.campaignId,
          template_id: emailData.templateId,
          status: 'sent',
          sent_at: new Date().toISOString()
        });

      if (logError) {
        console.warn('Failed to log email:', logError);
        }
      } catch (logErr) {
        console.warn('Email logging failed (table may not exist):', logErr);
      }

      // Here you would integrate with your actual email service
      // For now, we'll simulate sending
      await this.simulateEmailSending(emailData);

      return { success: true };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: String(error) };
    }
  }

  // Send campaign emails
  async sendCampaign(campaignId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get campaign details
      const { data: campaign, error: campaignError } = await supabase
        .from('email_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaignError || !campaign) {
        throw new Error('Campaign not found');
      }

      // Get template
      const { data: template, error: templateError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', campaign.templateId)
        .single();

      if (templateError || !template) {
        throw new Error('Template not found');
      }

      // Get target customers based on audience
      const customers = await this.getTargetCustomers(campaign.targetAudience);

      // Update campaign status
      await supabase
        .from('email_campaigns')
        .update({ 
          status: 'sending',
          totalCount: customers.length 
        })
        .eq('id', campaignId);

      // Send emails to each customer
      let sentCount = 0;
      for (const customer of customers) {
        try {
          const variables = this.getCustomerVariables(customer);
          const { subject, content } = this.renderTemplate(template, variables);

          const emailData: EmailData = {
            to: customer.email,
            subject,
            content,
            customerId: customer.id,
            campaignId,
            templateId: template.id
          };

          const result = await this.sendEmail(emailData);
          if (result.success) {
            sentCount++;
          }
        } catch (error) {
          console.error(`Failed to send email to ${customer.email}:`, error);
        }
      }

      // Update campaign with results
      await supabase
        .from('email_campaigns')
        .update({ 
          status: 'sent',
          sentCount 
        })
        .eq('id', campaignId);

      return { success: true };
    } catch (error) {
      console.error('Error sending campaign:', error);
      
      // Update campaign status to failed
      await supabase
        .from('email_campaigns')
        .update({ status: 'failed' })
        .eq('id', campaignId);

      return { success: false, error: String(error) };
    }
  }

  // Get target customers based on audience type
  private async getTargetCustomers(audience: string): Promise<any[]> {
    let query = supabase.from('customers').select('*');

    switch (audience) {
      case 'vip':
        query = query.eq('color_tag', 'vip');
        break;
      case 'inactive':
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 90);
        query = query.lt('last_visit', cutoffDate.toISOString());
        break;
      case 'active':
        const activeCutoff = new Date();
        activeCutoff.setDate(activeCutoff.getDate() - 30);
        query = query.gte('last_visit', activeCutoff.toISOString());
        break;
      case 'all':
      default:
        // No additional filters
        break;
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // Get customer variables for template rendering
  private getCustomerVariables(customer: any): Record<string, string> {
    return {
      name: customer.name,
      firstName: customer.name.split(' ')[0],
      email: customer.email,
      phone: customer.phone,
      city: customer.city,
      loyaltyLevel: customer.loyalty_level,
      points: customer.points?.toString() || '0',
      totalSpent: customer.total_spent?.toString() || '0',
      joinedDate: new Date(customer.joined_date).toLocaleDateString(),
      lastVisit: new Date(customer.last_visit).toLocaleDateString()
    };
  }

  // Simulate email sending (replace with actual email service)
  private async simulateEmailSending(emailData: EmailData): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log('Email sent:', {
          to: emailData.to,
          subject: emailData.subject,
          content: emailData.content.substring(0, 100) + '...'
        });
        resolve();
      }, 1000); // Simulate 1 second delay
    });
  }

  // Get email templates
  async getTemplates(): Promise<EmailTemplate[]> {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get email campaigns
  async getCampaigns(): Promise<EmailCampaign[]> {
    const { data, error } = await supabase
      .from('email_campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get email history
  async getEmailHistory(customerId?: string): Promise<any[]> {
    let query = supabase.from('email_logs').select('*').order('sent_at', { ascending: false });
    
    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // Create email template
  async createTemplate(template: Omit<EmailTemplate, 'id'>): Promise<EmailTemplate> {
    const newTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('email_templates')
      .insert([newTemplate])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Create email campaign
  async createCampaign(campaign: Omit<EmailCampaign, 'id' | 'sentCount' | 'totalCount'>): Promise<EmailCampaign> {
    const newCampaign = {
      ...campaign,
      id: `campaign-${Date.now()}`,
      sentCount: 0,
      totalCount: 0,
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('email_campaigns')
      .insert([newCampaign])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export const emailService = new EmailService(); 