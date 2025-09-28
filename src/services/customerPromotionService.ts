import { supabase } from '../lib/supabaseClient';

export interface CustomerPromotionTarget {
  id: string;
  phone: string;
  name: string;
  totalSpent: number;
  messageCount: number;
  loyaltyScore: number;
  engagementScore: number;
  lastActivity: string;
  serviceTypes: string[];
  paymentMethods: string[];
  locations: string[];
  languages: string[];
  promotionEligibility: {
    highValue: boolean;
    frequentBuyer: boolean;
    inactive: boolean;
    newCustomer: boolean;
    hasComplaints: boolean;
    loyal: boolean;
  };
}

export interface PromotionCampaign {
  id: string;
  name: string;
  targetCategory: string;
  message: string;
  discount: number;
  status: 'draft' | 'scheduled' | 'sent' | 'completed';
  targetCount: number;
  sentCount: number;
  responseCount: number;
  createdAt: string;
  scheduledFor?: string;
}

class CustomerPromotionService {
  // Load promotion analysis data
  async loadPromotionData(): Promise<any> {
    try {
      // In a real implementation, this would be stored in your database
      // For now, we'll fetch from the generated JSON file
      const response = await fetch('/customer-analysis-2025-09-24.json');
      if (!response.ok) {
        throw new Error('Failed to load promotion data');
      }
      return await response.json();
    } catch (error) {
      console.error('Error loading promotion data:', error);
      throw error;
    }
  }

  // Get customers by category
  async getCustomersByCategory(category: string): Promise<CustomerPromotionTarget[]> {
    try {
      const data = await this.loadPromotionData();
      const categoryData = data.promotionTargets[category];
      
      if (!categoryData) {
        return [];
      }

      return categoryData.customers.map((customer: any) => ({
        id: customer.id,
        phone: customer.phone,
        name: customer.name,
        totalSpent: customer.totalSpent || 0,
        messageCount: customer.messageCount || 0,
        loyaltyScore: customer.loyaltyScore || 0,
        engagementScore: customer.engagementScore || 0,
        lastActivity: customer.lastActivity || new Date().toISOString(),
        serviceTypes: customer.serviceTypes || [],
        paymentMethods: customer.paymentMethods || [],
        locations: customer.locations || [],
        languages: customer.languages || [],
        promotionEligibility: customer.promotionEligibility || {}
      }));
    } catch (error) {
      console.error('Error getting customers by category:', error);
      return [];
    }
  }

  // Create a promotion campaign
  async createPromotionCampaign(campaign: Omit<PromotionCampaign, 'id' | 'createdAt' | 'sentCount' | 'responseCount'>): Promise<PromotionCampaign> {
    try {
      const newCampaign: PromotionCampaign = {
        ...campaign,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        sentCount: 0,
        responseCount: 0
      };

      // Store in database
      const { data, error } = await supabase
        .from('promotion_campaigns')
        .insert([newCampaign])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating promotion campaign:', error);
      throw error;
    }
  }

  // Send promotion to customers
  async sendPromotionToCustomers(campaignId: string, customerIds: string[]): Promise<{ success: number; failed: number }> {
    try {
      let success = 0;
      let failed = 0;

      // Get campaign details
      const { data: campaign, error: campaignError } = await supabase
        .from('promotion_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaignError || !campaign) {
        throw new Error('Campaign not found');
      }

      // Get customer details
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .in('id', customerIds);

      if (customersError) {
        throw customersError;
      }

      // Send messages to each customer
      for (const customer of customers || []) {
        try {
          // Log the communication
          const { error: commError } = await supabase
            .from('customer_communications')
            .insert({
              customer_id: customer.id,
              type: 'promotion',
              message: campaign.message,
              status: 'sent',
              phone_number: customer.phone,
              sent_at: new Date().toISOString(),
              campaign_id: campaignId
            });

          if (commError) {
            console.error('Error logging communication:', commError);
            failed++;
          } else {
            success++;
          }

          // In a real implementation, you would integrate with SMS/WhatsApp services here
          // For now, we'll just log the communication
          console.log(`Promotion sent to ${customer.name} (${customer.phone}): ${campaign.message}`);

        } catch (error) {
          console.error(`Error sending to customer ${customer.id}:`, error);
          failed++;
        }
      }

      // Update campaign status
      await supabase
        .from('promotion_campaigns')
        .update({
          sentCount: success,
          status: success > 0 ? 'sent' : 'failed'
        })
        .eq('id', campaignId);

      return { success, failed };
    } catch (error) {
      console.error('Error sending promotion:', error);
      throw error;
    }
  }

  // Get promotion campaigns
  async getPromotionCampaigns(): Promise<PromotionCampaign[]> {
    try {
      const { data, error } = await supabase
        .from('promotion_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting promotion campaigns:', error);
      return [];
    }
  }

  // Get customer promotion history
  async getCustomerPromotionHistory(customerId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('customer_communications')
        .select(`
          *,
          promotion_campaigns (
            name,
            discount,
            status
          )
        `)
        .eq('customer_id', customerId)
        .eq('type', 'promotion')
        .order('sent_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error getting customer promotion history:', error);
      return [];
    }
  }

  // Analyze promotion performance
  async analyzePromotionPerformance(campaignId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('customer_communications')
        .select('*')
        .eq('campaign_id', campaignId);

      if (error) {
        throw error;
      }

      const totalSent = data?.length || 0;
      const responses = data?.filter(comm => comm.status === 'responded').length || 0;
      const responseRate = totalSent > 0 ? (responses / totalSent) * 100 : 0;

      return {
        campaignId,
        totalSent,
        responses,
        responseRate: Math.round(responseRate * 100) / 100,
        communications: data || []
      };
    } catch (error) {
      console.error('Error analyzing promotion performance:', error);
      throw error;
    }
  }

  // Get promotion recommendations
  async getPromotionRecommendations(): Promise<any> {
    try {
      const data = await this.loadPromotionData();
      return data.promotionTargets;
    } catch (error) {
      console.error('Error getting promotion recommendations:', error);
      return {};
    }
  }

  // Create promotion templates
  getPromotionTemplates() {
    return {
      highValue: {
        title: 'VIP Exclusive Offer',
        message: 'Dear {name}, as our valued VIP customer, enjoy an exclusive 20% discount on all premium services. Valid until {date}.',
        discount: 20
      },
      inactive: {
        title: 'We Miss You!',
        message: 'Hi {name}, we miss you! Come back and enjoy 30% off your next purchase. This offer expires in 7 days.',
        discount: 30
      },
      newCustomer: {
        title: 'Welcome Offer',
        message: 'Welcome {name}! Get 15% off your first purchase with us. Show this message to redeem.',
        discount: 15
      },
      complaint: {
        title: 'Service Recovery',
        message: 'Dear {name}, we apologize for any inconvenience. Please accept this 25% discount as our way of making it right.',
        discount: 25
      },
      loyal: {
        title: 'Loyalty Reward',
        message: 'Thank you {name} for your loyalty! Enjoy this special 20% discount and exclusive access to new products.',
        discount: 20
      }
    };
  }
}

export const customerPromotionService = new CustomerPromotionService();
