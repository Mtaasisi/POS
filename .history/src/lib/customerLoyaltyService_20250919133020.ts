import { supabase } from './supabaseClient';

export interface LoyaltyCustomer {
  id: string;
  name: string;
  phone: string;
  email: string;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalSpent: number;
  joinDate: string;
  lastPurchase: string;
  orders: number;
  status: 'active' | 'inactive';
  loyaltyLevel: string;
  lastVisit: string;
  isActive: boolean;
  customerId: string;
}

export interface LoyaltyTier {
  name: string;
  minPoints: number;
  maxPoints: number;
  discount: number;
  benefits: string[];
}

export interface LoyaltyReward {
  id: string;
  name: string;
  pointsRequired: number;
  description: string;
  active: boolean;
  type: string;
}

export interface PointTransaction {
  customerId: string;
  type: 'earned' | 'spent' | 'adjusted' | 'redeemed' | 'expired' | 'purchase' | 'manual';
  amount: number;
  reason: string;
  timestamp: Date;
  orderId?: string;
  deviceId?: string;
  createdBy?: string;
}

export interface LoyaltyMetrics {
  totalCustomers: number;
  totalPoints: number;
  vipCustomers: number;
  activeCustomers: number;
  totalSpent: number;
  averagePoints: number;
}

class CustomerLoyaltyService {
  // Fetch loyalty customers with pagination
  async fetchLoyaltyCustomersPaginated(
    page: number = 1,
    pageSize: number = 50,
    searchQuery?: string,
    tierFilter?: string,
    statusFilter?: string
  ): Promise<{
    customers: LoyaltyCustomer[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  }> {
    try {
      console.log(`🔍 Fetching loyalty customers page ${page} with ${pageSize} per page...`);
      
      // First, get the total count for pagination
      let countQuery = supabase
        .from('customers')
        .select('id', { count: 'exact', head: true });

      // Apply filters to count query
      if (tierFilter && tierFilter !== 'all') {
        countQuery = countQuery.eq('loyalty_level', tierFilter);
      }

      if (statusFilter && statusFilter !== 'all') {
        countQuery = countQuery.eq('is_active', statusFilter === 'active');
      }

      const { count: totalCustomerCount, error: countError } = await countQuery;

      if (countError) {
        console.error('Error getting customer count:', countError);
        return {
          customers: [],
          totalCount: 0,
          currentPage: page,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false
        };
      }

      console.log(`📊 Total customers matching filters: ${totalCustomerCount}`);

      // Calculate pagination
      const offset = (page - 1) * pageSize;
      const totalPages = Math.ceil((totalCustomerCount || 0) / pageSize);

      // Fetch customers for current page
      let query = supabase
        .from('customers')
        .select(`
          *,
          customer_payments(*),
          devices(*)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      // Apply filters
      if (tierFilter && tierFilter !== 'all') {
        query = query.eq('loyalty_level', tierFilter);
      }

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('is_active', statusFilter === 'active');
      }

      const { data: customers, error } = await query;

      if (error) {
        console.error('Error fetching loyalty customers:', error);
        return {
          customers: [],
          totalCount: 0,
          currentPage: page,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false
        };
      }

      console.log(`📊 Fetched ${customers?.length || 0} customers for page ${page}`);

      if (!customers || customers.length === 0) {
        return {
          customers: [],
          totalCount: totalCustomerCount || 0,
          currentPage: page,
          totalPages,
          hasNextPage: false,
          hasPreviousPage: page > 1
        };
      }

      // Transform customer data
      const loyaltyCustomers = customers.map((customer: any) => {
        // Calculate orders count from payments and devices
        const paymentOrders = customer.customer_payments?.length || 0;
        const deviceOrders = customer.devices?.length || 0;
        const totalOrders = paymentOrders + deviceOrders;

        // Get last purchase date
        const lastPayment = customer.customer_payments?.[0]?.payment_date;
        const lastDevice = customer.devices?.[0]?.created_at;
        const lastPurchase = lastPayment && lastDevice 
          ? new Date(lastPayment) > new Date(lastDevice) ? lastPayment : lastDevice
          : lastPayment || lastDevice || customer.last_visit;

        return {
          id: customer.id,
          name: customer.name || 'Unknown Customer',
          phone: customer.phone || '',
          email: customer.email || '',
          points: customer.points || 0,
          tier: this.mapLoyaltyLevel(customer.loyalty_level),
          totalSpent: customer.total_spent || 0,
          joinDate: customer.joined_date || customer.created_at,
          lastPurchase: lastPurchase || customer.last_visit || customer.created_at,
          orders: totalOrders,
          status: customer.is_active ? 'active' : 'inactive',
          loyaltyLevel: customer.loyalty_level || 'bronze',
          lastVisit: customer.last_visit || customer.created_at,
          isActive: customer.is_active || false,
          customerId: customer.id
        };
      });

      // Apply search filter
      let filteredCustomers = loyaltyCustomers;
      if (searchQuery) {
        filteredCustomers = loyaltyCustomers.filter(customer => 
          customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customer.phone.includes(searchQuery) ||
          customer.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
        console.log(`🔍 Found ${filteredCustomers.length} customers matching search query: "${searchQuery}"`);
      }

      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      console.log(`✅ Returning ${filteredCustomers.length} loyalty customers for page ${page} of ${totalPages}`);

      return {
        customers: filteredCustomers,
        totalCount: totalCustomerCount || 0,
        currentPage: page,
        totalPages,
        hasNextPage,
        hasPreviousPage
      };
    } catch (error) {
      console.error('Error fetching loyalty customers with pagination:', error);
      return {
        customers: [],
        totalCount: 0,
        currentPage: page,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false
      };
    }
  }

  // Fetch all loyalty customers with their data (keeping for backward compatibility)
  async fetchLoyaltyCustomers(
    searchQuery?: string,
    tierFilter?: string,
    statusFilter?: string
  ): Promise<LoyaltyCustomer[]> {
    try {
      console.log('🔍 Fetching all loyalty customers...');
      
      // First, get the total count to know how many customers we need to fetch
      const { count: totalCustomerCount, error: countError } = await supabase
        .from('customers')
        .select('id', { count: 'exact', head: true });

      if (countError) {
        console.error('Error getting customer count:', countError);
        return [];
      }

      console.log(`📊 Total customers in database: ${totalCustomerCount}`);

      // Fetch all customers in batches if needed
      const allCustomers = [];
      const batchSize = 1000; // Supabase default limit
      const totalBatches = Math.ceil((totalCustomerCount || 0) / batchSize);

      for (let batch = 0; batch < totalBatches; batch++) {
        const from = batch * batchSize;
        const to = Math.min(from + batchSize - 1, (totalCustomerCount || 0) - 1);

        console.log(`📦 Fetching batch ${batch + 1}/${totalBatches} (customers ${from + 1}-${to + 1})`);

        let query = supabase
          .from('customers')
          .select(`
            id, name, email, phone, gender, city, birth_month, birth_day, total_returns, profile_image, created_at, updated_at, whatsapp, notes, is_active, loyalty_level, color_tag, referred_by, total_spent, points, last_visit, created_by, referral_source, referrals, customer_tag,
            customer_payments(*),
            devices(*)
          `)
          .order('created_at', { ascending: false })
          .range(from, to);

        // Apply filters
        if (tierFilter && tierFilter !== 'all') {
          query = query.eq('loyalty_level', tierFilter);
        }

        if (statusFilter && statusFilter !== 'all') {
          query = query.eq('is_active', statusFilter === 'active');
        }

        const { data: batchCustomers, error: batchError } = await query;

        if (batchError) {
          console.error(`Error fetching batch ${batch + 1}:`, batchError);
          continue;
        }

        if (batchCustomers) {
          allCustomers.push(...batchCustomers);
        }
      }

      console.log(`📊 Fetched ${allCustomers.length} customers for loyalty program`);

      if (allCustomers.length === 0) return [];

      // Transform customer data
      const loyaltyCustomers = allCustomers.map((customer: any) => {
        // Calculate orders count from payments and devices
        const paymentOrders = customer.customer_payments?.length || 0;
        const deviceOrders = customer.devices?.length || 0;
        const totalOrders = paymentOrders + deviceOrders;

        // Get last purchase date
        const lastPayment = customer.customer_payments?.[0]?.payment_date;
        const lastDevice = customer.devices?.[0]?.created_at;
        const lastPurchase = lastPayment && lastDevice 
          ? new Date(lastPayment) > new Date(lastDevice) ? lastPayment : lastDevice
          : lastPayment || lastDevice || customer.last_visit;

        return {
          id: customer.id,
          name: customer.name || 'Unknown Customer',
          phone: customer.phone || '',
          email: customer.email || '',
          points: customer.points || 0,
          tier: this.mapLoyaltyLevel(customer.loyalty_level),
          totalSpent: customer.total_spent || 0,
          joinDate: customer.joined_date || customer.created_at,
          lastPurchase: lastPurchase || customer.last_visit || customer.created_at,
          orders: totalOrders,
          status: customer.is_active ? 'active' : 'inactive',
          loyaltyLevel: customer.loyalty_level || 'bronze',
          lastVisit: customer.last_visit || customer.created_at,
          isActive: customer.is_active || false,
          customerId: customer.id
        };
      });

      // Apply search filter
      if (searchQuery) {
        const filtered = loyaltyCustomers.filter(customer => 
          customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customer.phone.includes(searchQuery) ||
          customer.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
        console.log(`🔍 Found ${filtered.length} customers matching search query: "${searchQuery}"`);
        return filtered;
      }

      console.log(`✅ Returning ${loyaltyCustomers.length} loyalty customers`);
      return loyaltyCustomers;
    } catch (error) {
      console.error('Error fetching loyalty customers:', error);
      return [];
    }
  }

  // Calculate loyalty metrics
  async calculateLoyaltyMetrics(): Promise<LoyaltyMetrics> {
    try {
      // Get total count from database directly
      const { count: totalCustomerCount, error: countError } = await supabase
        .from('customers')
        .select('id', { count: 'exact', head: true });

      if (countError) {
        console.error('Error getting customer count:', countError);
        return {
          totalCustomers: 0,
          totalPoints: 0,
          vipCustomers: 0,
          activeCustomers: 0,
          totalSpent: 0,
          averagePoints: 0
        };
      }

      // Get all customers for metrics calculation
      const { data: allCustomers, error: customersError } = await supabase
        .from('customers')
        .select('points, loyalty_level, is_active, total_spent')
        .limit(2000); // Ensure we get all customers

      if (customersError) {
        console.error('Error fetching customers for metrics:', customersError);
        return {
          totalCustomers: totalCustomerCount || 0,
          totalPoints: 0,
          vipCustomers: 0,
          activeCustomers: 0,
          totalSpent: 0,
          averagePoints: 0
        };
      }

      // Calculate total revenue from ALL customers (not just loyalty members)
      const { data: allSales, error: salesError } = await supabase
        .from('lats_sales')
        .select('total_amount, status')
        .eq('status', 'completed'); // Only count completed sales

      if (salesError) {
        console.error('Error fetching sales for total revenue calculation:', salesError);
      }

      // Debug: Log sales data to see what we're getting
      console.log('🔍 Sales data for revenue calculation:', {
        salesCount: allSales?.length || 0,
        salesData: allSales?.slice(0, 5), // Show first 5 sales for debugging
        salesError: salesError
      });

      const totalCustomers = totalCustomerCount || 0;
      const totalPoints = (allCustomers || []).reduce((sum, customer) => sum + (customer.points || 0), 0);
      const vipCustomers = (allCustomers || []).filter(c => c.loyalty_level === 'platinum').length;
      const activeCustomers = (allCustomers || []).filter(c => c.is_active).length;
      
      // Calculate total revenue from all completed sales
      const totalSpent = (allSales || []).reduce((sum, sale) => sum + (sale.total_amount || 0), 0);

      console.log(`📊 Calculated metrics: ${totalCustomers} total customers, ${totalPoints} total points, ${vipCustomers} VIP customers, ${activeCustomers} active customers, ${totalSpent} total revenue`);

      return {
        totalCustomers,
        totalPoints,
        vipCustomers,
        activeCustomers,
        totalSpent,
        averagePoints: totalCustomers > 0 ? Math.round(totalPoints / totalCustomers) : 0
      };
    } catch (error) {
      console.error('Error calculating loyalty metrics:', error);
      return {
        totalCustomers: 0,
        totalPoints: 0,
        vipCustomers: 0,
        activeCustomers: 0,
        totalSpent: 0,
        averagePoints: 0
      };
    }
  }

  // Get loyalty tiers configuration
  getLoyaltyTiers(): LoyaltyTier[] {
    return [
      { 
        name: 'Bronze', 
        minPoints: 0, 
        maxPoints: 999, 
        discount: 0, 
        benefits: ['Basic rewards', 'Email updates'] 
      },
      { 
        name: 'Silver', 
        minPoints: 1000, 
        maxPoints: 1999, 
        discount: 2, 
        benefits: ['2% discount', 'Priority support', 'Free delivery on orders over 50,000 TZS'] 
      },
      { 
        name: 'Gold', 
        minPoints: 2000, 
        maxPoints: 4999, 
        discount: 3, 
        benefits: ['3% discount', 'Free delivery', 'Birthday rewards', 'Exclusive offers'] 
      },
      { 
        name: 'Platinum', 
        minPoints: 5000, 
        maxPoints: 999999, 
        discount: 5, 
        benefits: ['5% discount', 'Exclusive offers', 'Personal account manager', 'VIP events'] 
      }
    ];
  }

  // Get available rewards
  getAvailableRewards(): LoyaltyReward[] {
    return [
      { 
        id: '1', 
        name: 'Free Delivery', 
        points: 500, 
        description: 'Free delivery on next order', 
        active: true 
      },
      { 
        id: '2', 
        name: '10% Off Next Purchase', 
        points: 1000, 
        description: '10% discount on next purchase', 
        active: true 
      },
      { 
        id: '3', 
        name: 'Free Product', 
        points: 2000, 
        description: 'Free product up to TZS 10,000', 
        active: true 
      },
      { 
        id: '4', 
        name: 'VIP Event Access', 
        points: 5000, 
        description: 'Access to exclusive VIP events', 
        active: true 
      }
    ];
  }

  // Fetch point transaction history
  async fetchPointHistory(customerId?: string): Promise<PointTransaction[]> {
    try {
      let query = supabase
        .from('points_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (customerId) {
        query = query.eq('customer_id', customerId);
      }

      const { data: transactions, error } = await query;

      if (error) {
        console.error('Error fetching point history:', error);
        return [];
      }

      if (!transactions) return [];

      return transactions.map((transaction: any) => ({
        customerId: transaction.customer_id,
        type: transaction.transaction_type,
        points: transaction.points_change,
        reason: transaction.reason,
        date: transaction.created_at,
        orderId: transaction.metadata?.order_id,
        deviceId: transaction.device_id,
        createdBy: transaction.created_by
      }));
    } catch (error) {
      console.error('Error fetching point history:', error);
      return [];
    }
  }

  // Update customer points
  async updateCustomerPoints(
    customerId: string,
    pointsChange: number,
    reason: string,
    transactionType: 'earned' | 'spent' | 'adjusted' | 'redeemed' | 'expired' = 'adjusted',
    deviceId?: string
  ): Promise<boolean> {
    try {
      // Get current customer points
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('points')
        .eq('id', customerId)
        .single();

      if (customerError) {
        console.error('Error fetching customer points:', customerError);
        return false;
      }

      const currentPoints = customer?.points || 0;
      const newPoints = Math.max(0, currentPoints + pointsChange); // Ensure points don't go negative

      // Update customer points
      const { error: updateError } = await supabase
        .from('customers')
        .update({ points: newPoints })
        .eq('id', customerId);

      if (updateError) {
        console.error('Error updating customer points:', updateError);
        return false;
      }

      // Add point transaction record
      const { error: transactionError } = await supabase
        .from('points_transactions')
        .insert({
          customer_id: customerId,
          points_change: pointsChange,
          transaction_type: transactionType,
          reason: reason,
          device_id: deviceId,
          created_by: 'system', // You might want to pass the actual user ID
          metadata: { order_id: null }
        });

      if (transactionError) {
        console.error('Error creating point transaction:', transactionError);
        // Points were updated but transaction wasn't recorded
        return true; // Still consider it successful
      }

      return true;
    } catch (error) {
      console.error('Error updating customer points:', error);
      return false;
    }
  }

  // Update customer loyalty tier based on points
  async updateCustomerTier(customerId: string): Promise<boolean> {
    try {
      const { data: customer, error } = await supabase
        .from('customers')
        .select('points, loyalty_level')
        .eq('id', customerId)
        .single();

      if (error) {
        console.error('Error fetching customer for tier update:', error);
        return false;
      }

      const points = customer?.points || 0;
      const currentTier = customer?.loyalty_level || 'bronze';
      const newTier = this.calculateTierFromPoints(points);

      if (newTier !== currentTier) {
        const { error: updateError } = await supabase
          .from('customers')
          .update({ loyalty_level: newTier })
          .eq('id', customerId);

        if (updateError) {
          console.error('Error updating customer tier:', updateError);
          return false;
        }

        // Add transaction record for tier change
        await this.updateCustomerPoints(
          customerId,
          0,
          `Tier upgraded from ${currentTier} to ${newTier}`,
          'adjusted'
        );
      }

      return true;
    } catch (error) {
      console.error('Error updating customer tier:', error);
      return false;
    }
  }

  // Helper methods
  private mapLoyaltyLevel(level: string): 'bronze' | 'silver' | 'gold' | 'platinum' {
    switch (level?.toLowerCase()) {
      case 'platinum':
        return 'platinum';
      case 'gold':
        return 'gold';
      case 'silver':
        return 'silver';
      case 'bronze':
      default:
        return 'bronze';
    }
  }

  private calculateTierFromPoints(points: number): string {
    if (points >= 5000) return 'platinum';
    if (points >= 2000) return 'gold';
    if (points >= 1000) return 'silver';
    return 'bronze';
  }

  // Additional methods for the modal
  async getCustomers(): Promise<LoyaltyCustomer[]> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .limit(100);

      if (error) {
        console.error('Error fetching customers:', error);
        return [];
      }

      return data?.map(customer => ({
        id: customer.id,
        name: customer.name || 'Unknown',
        phone: customer.phone || '',
        email: customer.email || '',
        points: customer.points || 0,
        tier: this.mapLoyaltyLevel(customer.loyalty_level),
        totalSpent: customer.total_spent || 0,
        joinDate: customer.created_at || '',
        lastPurchase: customer.last_purchase || '',
        orders: customer.orders || 0,
        status: customer.is_active ? 'active' : 'inactive',
        loyaltyLevel: customer.loyalty_level || 'bronze',
        lastVisit: customer.last_visit || '',
        isActive: customer.is_active || false,
        customerId: customer.id
      })) || [];
    } catch (error) {
      console.error('Error in getCustomers:', error);
      return [];
    }
  }

  async getMetrics(): Promise<LoyaltyMetrics> {
    try {
      const { data: customers, error } = await supabase
        .from('customers')
        .select('points, total_spent, is_active, loyalty_level');

      if (error) {
        console.error('Error fetching metrics:', error);
        return {
          totalCustomers: 0,
          totalPoints: 0,
          vipCustomers: 0,
          activeCustomers: 0,
          totalSpent: 0,
          averagePoints: 0
        };
      }

      const totalCustomers = customers?.length || 0;
      const totalPoints = customers?.reduce((sum, c) => sum + (c.points || 0), 0) || 0;
      const vipCustomers = customers?.filter(c => c.loyalty_level === 'platinum' || c.loyalty_level === 'gold').length || 0;
      const activeCustomers = customers?.filter(c => c.is_active).length || 0;
      const totalSpent = customers?.reduce((sum, c) => sum + (c.total_spent || 0), 0) || 0;
      const averagePoints = totalCustomers > 0 ? totalPoints / totalCustomers : 0;

      return {
        totalCustomers,
        totalPoints,
        vipCustomers,
        activeCustomers,
        totalSpent,
        averagePoints
      };
    } catch (error) {
      console.error('Error in getMetrics:', error);
      return {
        totalCustomers: 0,
        totalPoints: 0,
        vipCustomers: 0,
        activeCustomers: 0,
        totalSpent: 0,
        averagePoints: 0
      };
    }
  }

  async getTiers(): Promise<LoyaltyTier[]> {
    return [
      { name: 'Bronze', minPoints: 0, maxPoints: 999, discount: 5, benefits: ['Basic rewards'] },
      { name: 'Silver', minPoints: 1000, maxPoints: 1999, discount: 10, benefits: ['Enhanced rewards', 'Priority support'] },
      { name: 'Gold', minPoints: 2000, maxPoints: 4999, discount: 15, benefits: ['Premium rewards', 'Exclusive offers'] },
      { name: 'Platinum', minPoints: 5000, maxPoints: 999999, discount: 20, benefits: ['VIP rewards', 'Personal concierge'] }
    ];
  }

  async getRewards(): Promise<LoyaltyReward[]> {
    return [
      { id: '1', name: '10% Discount', pointsRequired: 100, description: 'Get 10% off your next purchase', active: true, type: 'discount' },
      { id: '2', name: 'Free Shipping', pointsRequired: 200, description: 'Free shipping on your next order', active: true, type: 'discount' },
      { id: '3', name: 'Free Product', pointsRequired: 500, description: 'Get a free product of your choice', active: true, type: 'free_item' },
      { id: '4', name: 'VIP Treatment', pointsRequired: 1000, description: 'Exclusive VIP treatment and priority service', active: true, type: 'cashback' }
    ];
  }

  async getPointHistory(customerId: string): Promise<PointTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching point history:', error);
        return [];
      }

      return data?.map(transaction => ({
        customerId: transaction.customer_id,
        type: transaction.transaction_type as any,
        amount: transaction.points_change,
        reason: transaction.reason,
        timestamp: new Date(transaction.created_at),
        orderId: transaction.metadata?.order_id,
        deviceId: transaction.device_id,
        createdBy: transaction.created_by
      })) || [];
    } catch (error) {
      console.error('Error in getPointHistory:', error);
      return [];
    }
  }

  async addPoints(customerId: string, points: number, reason: string): Promise<boolean> {
    return this.updateCustomerPoints(customerId, points, reason, 'adjusted');
  }

  async redeemReward(customerId: string, rewardId: string): Promise<boolean> {
    try {
      const rewards = await this.getRewards();
      const reward = rewards.find(r => r.id === rewardId);
      
      if (!reward) {
        console.error('Reward not found:', rewardId);
        return false;
      }

      return this.updateCustomerPoints(customerId, -reward.pointsRequired, `Redeemed: ${reward.name}`, 'redeemed');
    } catch (error) {
      console.error('Error redeeming reward:', error);
      return false;
    }
  }

  async getRedemptionHistory(customerId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('customer_id', customerId)
        .eq('transaction_type', 'redeemed')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching redemption history:', error);
        return [];
      }

      return data?.map(transaction => ({
        rewardName: transaction.reason,
        pointsUsed: Math.abs(transaction.points_change),
        redeemedAt: transaction.created_at
      })) || [];
    } catch (error) {
      console.error('Error in getRedemptionHistory:', error);
      return [];
    }
  }
}

export const customerLoyaltyService = new CustomerLoyaltyService();
