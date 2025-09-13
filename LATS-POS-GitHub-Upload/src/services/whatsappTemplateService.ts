import { supabase } from '../lib/supabaseClient';

export interface WhatsAppTemplate {
  id: string;
  name: string;
  category: string;
  template: string;
  variables: string[];
  language: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemplateVariable {
  name: string;
  description: string;
  example: string;
  required: boolean;
}

export interface CreateTemplateData {
  name: string;
  category: string;
  template: string;
  variables?: string[];
  language?: string;
  is_active?: boolean;
}

export interface UpdateTemplateData {
  name?: string;
  category?: string;
  template?: string;
  variables?: string[];
  language?: string;
  is_active?: boolean;
}

export interface TemplateCategory {
  value: string;
  label: string;
  description: string;
  icon: string;
}

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    value: 'greeting',
    label: 'Greeting',
    description: 'Welcome and introduction messages',
    icon: '👋'
  },
  {
    value: 'pos',
    label: 'POS/Orders',
    description: 'Order confirmations and updates',
    icon: '🛒'
  },
  {
    value: 'customer',
    label: 'Customer Service',
    description: 'Customer support and service messages',
    icon: '🎧'
  },
  {
    value: 'support',
    label: 'Technical Support',
    description: 'Technical support and troubleshooting',
    icon: '🔧'
  },
  {
    value: 'marketing',
    label: 'Marketing',
    description: 'Promotional and marketing messages',
    icon: '📢'
  },
  {
    value: 'appointment',
    label: 'Appointments',
    description: 'Appointment scheduling and reminders',
    icon: '📅'
  },
  {
    value: 'reminder',
    label: 'Reminders',
    description: 'General reminder messages',
    icon: '⏰'
  },
  {
    value: 'promotional',
    label: 'Promotional',
    description: 'Special offers and promotions',
    icon: '🎁'
  },
  {
    value: 'emergency',
    label: 'Emergency',
    description: 'Urgent and emergency notifications',
    icon: '🚨'
  },
  {
    value: 'general',
    label: 'General',
    description: 'General purpose messages',
    icon: '💬'
  }
];

export const TEMPLATE_VARIABLES: TemplateVariable[] = [
  { name: 'customerName', description: 'Customer\'s full name', example: 'John Doe', required: false },
  { name: 'customerId', description: 'Customer\'s unique ID', example: 'CUST123', required: false },
  { name: 'orderId', description: 'Order number', example: 'ORD456', required: false },
  { name: 'orderTotal', description: 'Order total amount', example: '$150.00', required: false },
  { name: 'orderItems', description: 'List of ordered items', example: 'iPhone 15, AirPods', required: false },
  { name: 'orderStatus', description: 'Current order status', example: 'Confirmed', required: false },
  { name: 'deliveryDate', description: 'Expected delivery date', example: '2024-01-30', required: false },
  { name: 'appointmentDate', description: 'Appointment date', example: '2024-01-30', required: false },
  { name: 'appointmentTime', description: 'Appointment time', example: '2:00 PM', required: false },
  { name: 'location', description: 'Store or service location', example: 'Main Branch', required: false },
  { name: 'phoneNumber', description: 'Contact phone number', example: '+1234567890', required: false },
  { name: 'companyName', description: 'Your company name', example: 'LATS CHANCE', required: false },
  { name: 'date', description: 'Current date', example: '2024-01-25', required: false },
  { name: 'time', description: 'Current time', example: '2:30 PM', required: false },
  { name: 'discountAmount', description: 'Discount amount', example: '20%', required: false },
  { name: 'promoCode', description: 'Promotional code', example: 'SAVE20', required: false },
  { name: 'trackingNumber', description: 'Delivery tracking number', example: 'TRK123456', required: false },
  { name: 'supportTicket', description: 'Support ticket number', example: 'TKT789', required: false },
  { name: 'serviceName', description: 'Service or product name', example: 'iPhone Repair', required: false },
  { name: 'price', description: 'Price amount', example: '$299.99', required: false }
];

class WhatsAppTemplateService {
  /**
   * Get all message templates
   */
  async getTemplates(filters?: {
    category?: string;
    is_active?: boolean;
    search?: string;
  }): Promise<WhatsAppTemplate[]> {
    try {
      let query = supabase
        .from('whatsapp_message_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,template.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw new Error(`Failed to fetch templates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get template by ID
   */
  async getTemplateById(id: string): Promise<WhatsAppTemplate | null> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_message_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching template:', error);
      throw new Error(`Failed to fetch template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create new template
   */
  async createTemplate(templateData: CreateTemplateData): Promise<WhatsAppTemplate> {
    try {
      const { data, error } = await supabase
        .from('whatsapp_message_templates')
        .insert({
          name: templateData.name,
          category: templateData.category,
          template: templateData.template,
          variables: templateData.variables || [],
          language: templateData.language || 'en',
          is_active: templateData.is_active !== undefined ? templateData.is_active : true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating template:', error);
      throw new Error(`Failed to create template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update template
   */
  async updateTemplate(id: string, templateData: UpdateTemplateData): Promise<WhatsAppTemplate> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (templateData.name !== undefined) updateData.name = templateData.name;
      if (templateData.category !== undefined) updateData.category = templateData.category;
      if (templateData.template !== undefined) updateData.template = templateData.template;
      if (templateData.variables !== undefined) updateData.variables = templateData.variables;
      if (templateData.language !== undefined) updateData.language = templateData.language;
      if (templateData.is_active !== undefined) updateData.is_active = templateData.is_active;

      const { data, error } = await supabase
        .from('whatsapp_message_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating template:', error);
      throw new Error(`Failed to update template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('whatsapp_message_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting template:', error);
      throw new Error(`Failed to delete template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Toggle template active status
   */
  async toggleTemplateStatus(id: string): Promise<WhatsAppTemplate> {
    try {
      // First get current status
      const currentTemplate = await this.getTemplateById(id);
      if (!currentTemplate) {
        throw new Error('Template not found');
      }

      const { data, error } = await supabase
        .from('whatsapp_message_templates')
        .update({
          is_active: !currentTemplate.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error toggling template status:', error);
      throw new Error(`Failed to toggle template status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Duplicate template
   */
  async duplicateTemplate(id: string, newName?: string): Promise<WhatsAppTemplate> {
    try {
      const originalTemplate = await this.getTemplateById(id);
      if (!originalTemplate) {
        throw new Error('Template not found');
      }

      const templateName = newName || `${originalTemplate.name} (Copy)`;

      const { data, error } = await supabase
        .from('whatsapp_message_templates')
        .insert({
          name: templateName,
          category: originalTemplate.category,
          template: originalTemplate.template,
          variables: originalTemplate.variables,
          language: originalTemplate.language,
          is_active: false // Duplicated templates start as inactive
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error duplicating template:', error);
      throw new Error(`Failed to duplicate template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get template statistics
   */
  async getTemplateStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byCategory: Record<string, number>;
  }> {
    try {
      const templates = await this.getTemplates();
      
      const stats = {
        total: templates.length,
        active: templates.filter(t => t.is_active).length,
        inactive: templates.filter(t => !t.is_active).length,
        byCategory: {} as Record<string, number>
      };

      // Count by category
      templates.forEach(template => {
        stats.byCategory[template.category] = (stats.byCategory[template.category] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting template stats:', error);
      throw new Error(`Failed to get template stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process template with variables
   */
  processTemplate(template: string, variables: Record<string, string>): string {
    let processedTemplate = template;

    // Replace variables in template
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processedTemplate = processedTemplate.replace(regex, value || '');
    });

    // Replace common variables with current values
    const now = new Date();
    processedTemplate = processedTemplate
      .replace(/\{\{date\}\}/g, now.toLocaleDateString())
      .replace(/\{\{time\}\}/g, now.toLocaleTimeString())
      .replace(/\{\{companyName\}\}/g, 'LATS CHANCE');

    return processedTemplate;
  }

  /**
   * Extract variables from template
   */
  extractVariables(template: string): string[] {
    const variableRegex = /\{\{(\w+)\}\}/g;
    const variables: string[] = [];
    let match;

    while ((match = variableRegex.exec(template)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    return variables;
  }

  /**
   * Validate template
   */
  validateTemplate(template: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for empty template
    if (!template.trim()) {
      errors.push('Template content cannot be empty');
    }

    // Check for unmatched braces
    const openBraces = (template.match(/\{\{/g) || []).length;
    const closeBraces = (template.match(/\}\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      errors.push('Unmatched template variables (missing or extra braces)');
    }

    // Check for empty variables
    const emptyVariables = template.match(/\{\{\s*\}\}/g);
    if (emptyVariables) {
      errors.push('Template contains empty variables');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const whatsappTemplateService = new WhatsAppTemplateService();
export default whatsappTemplateService;
