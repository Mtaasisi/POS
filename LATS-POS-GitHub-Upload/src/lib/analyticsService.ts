import { supabase } from './supabaseClient';

export interface DeviceStats {
  total: number;
  in_repair: number;
  completed: number;
  pending: number;
  overdue: number;
  new_this_month: number;
  new_this_week: number;
  new_today: number;
}

export interface RevenueStats {
  total: number;
  this_month: number;
  last_month: number;
  this_week: number;
  today: number;
  growth_percentage: number;
}

export interface CustomerStats {
  total: number;
  new_this_month: number;
  active: number;
  returning: number;
  avg_devices: number;
  avg_spent: number;
}

export interface TechnicianStats {
  top_technicians: Array<{
    id: string;
    name: string;
    completed_devices: number;
    avg_repair_time: number;
    total_revenue: number;
  }>;
  performance_summary: {
    total_technicians: number;
    avg_completion_rate: number;
    avg_repair_time: number;
  };
}

export interface TrendsData {
  monthly: Array<{
    month: string;
    devices: number;
    revenue: number;
    customers: number;
  }>;
  daily: Array<{
    day: string;
    devices: number;
    revenue: number;
    customers: number;
  }>;
  device_types: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  status_distribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
}



export interface ComprehensiveAnalytics {
  device_stats: DeviceStats;
  revenue_stats: RevenueStats;
  customer_stats: CustomerStats;
  technician_stats: TechnicianStats;
  trends: TrendsData;
}

export const analyticsService = {
  // Get comprehensive analytics using individual optimized views
  async getComprehensiveAnalytics(): Promise<ComprehensiveAnalytics | null> {
    try {
      // Fetch all analytics data from individual views
      const [deviceStats, revenueStats, customerStats, topTechnicians, monthlyTrends, dailyTrends, deviceTypes, statusDistribution, returnStats] = await Promise.all([
        this.getDeviceStatistics(),
        this.getRevenueAnalytics(),
        this.getCustomerAnalytics(),
        this.getTopTechnicians(10),
        this.getMonthlyTrends(),
        this.getDailyTrends(),
        this.getDeviceTypeDistribution(),
        this.getStatusDistribution(),
        this.getReturnAnalytics()
      ]);

      // If customer stats failed, try the direct method
      let finalCustomerStats = customerStats;
      if (!customerStats) {
        console.log('Customer analytics view failed, trying direct method...');
        finalCustomerStats = await this.getCustomerStatsDirect();
      }

      if (!deviceStats || !revenueStats || !finalCustomerStats) {
        console.error('Failed to fetch required analytics data');
        return null;
      }

      return {
        device_stats: deviceStats,
        revenue_stats: revenueStats,
        customer_stats: finalCustomerStats,
        technician_stats: {
          top_technicians: topTechnicians.map(tech => ({
            id: tech.id,
            name: tech.name,
            completed_devices: tech.completed_devices,
            avg_repair_time: tech.avg_repair_time_days || 0,
            total_revenue: tech.total_revenue_generated
          })),
          performance_summary: {
            total_technicians: topTechnicians.length,
            avg_completion_rate: topTechnicians.length > 0 ? 
              topTechnicians.reduce((sum, tech) => sum + (tech.completed_devices / Math.max(tech.total_assigned, 1)), 0) / topTechnicians.length : 0,
            avg_repair_time: topTechnicians.length > 0 ? 
              topTechnicians.reduce((sum, tech) => sum + (tech.avg_repair_time_days || 0), 0) / topTechnicians.length : 0
          }
        },
        trends: {
          monthly: monthlyTrends.map(item => ({
            month: new Date(item.month).toISOString(),
            devices: item.devices_count,
            revenue: item.revenue,
            customers: item.unique_customers
          })),
          daily: dailyTrends.map(item => ({
            day: new Date(item.day).toISOString(),
            devices: item.devices_count,
            revenue: item.revenue,
            customers: item.unique_customers
          })),
          device_types: deviceTypes,
          status_distribution: statusDistribution
        },
        return_stats: returnStats || {
          pending: 0,
          escalated: 0,
          completedToday: 0,
          avgResolutionTime: '0h',
          totalReturns: 0,
          returnRate: 0,
          topReturnReasons: []
        }
      };
    } catch (error) {
      console.error('Error in getComprehensiveAnalytics:', error);
      return null;
    }
  },

  // Get analytics for specific time period (simplified)
  async getAnalyticsForPeriod(daysBack: number) {
    try {
      const since = new Date();
      since.setDate(since.getDate() - daysBack);
      
      const { data: devices, error } = await supabase
        .from('devices')
        .select('created_at, repair_cost, customer_id')
        .gte('created_at', since.toISOString());
      
      if (error) {
        console.error('Error fetching period analytics:', error);
        return null;
      }
      
      const periodStats = {
        devices: devices?.length || 0,
        revenue: devices?.reduce((sum, d) => sum + (typeof d.repair_cost === 'number' ? d.repair_cost : 0), 0) || 0,
        customers: new Set(devices?.map(d => d.customer_id).filter(Boolean)).size,
        avg_repair_time: 0
      };

      const periodTrends = devices?.reduce((acc, device) => {
        const date = new Date(typeof device.created_at === 'string' ? device.created_at : new Date()).toDateString();
        if (!acc[date]) {
          acc[date] = { devices: 0, revenue: 0 };
        }
        acc[date].devices++;
        acc[date].revenue += typeof device.repair_cost === 'number' ? device.repair_cost : 0;
        return acc;
      }, {} as Record<string, { devices: number; revenue: number }>) || {};

      return {
        period_stats: periodStats,
        period_trends: Object.entries(periodTrends).map(([date, data]) => ({
          date,
          devices: data.devices,
          revenue: data.revenue
        }))
      };
    } catch (error) {
      console.error('Error in getAnalyticsForPeriod:', error);
      return null;
    }
  },

  // Get device statistics from direct query
  async getDeviceStatistics(): Promise<DeviceStats | null> {
    try {
      // Use direct query instead of view
      const { data: devices, error } = await supabase
        .from('devices')
        .select('*');
      
      if (error) {
        console.error('Error fetching devices for statistics:', error);
        return null;
      }
      
      if (!devices || devices.length === 0) {
        return {
          total: 0,
          in_repair: 0,
          completed: 0,
          pending: 0,
          overdue: 0,
          new_this_month: 0,
          new_this_week: 0,
          new_today: 0
        };
      }

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const total = devices.length;
      
      // Use correct status values from database schema
      const in_repair = devices.filter(d => d.status === 'in-repair').length;
      const completed = devices.filter(d => d.status === 'done').length;
      const pending = devices.filter(d => d.status === 'assigned').length;
      
      const overdue = devices.filter(d => {
        if (!d.created_at) return false;
        const createdDate = new Date(d.created_at);
        const daysDiff = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff > 7; // Consider overdue after 7 days
      }).length;
      
      const new_this_month = devices.filter(d => 
        d.created_at && new Date(d.created_at) >= startOfMonth
      ).length;
      const new_this_week = devices.filter(d => 
        d.created_at && new Date(d.created_at) >= startOfWeek
      ).length;
      const new_today = devices.filter(d => 
        d.created_at && new Date(d.created_at) >= startOfDay
      ).length;

      console.log('📊 Device statistics:', {
        total,
        in_repair,
        completed,
        pending,
        overdue,
        new_this_month,
        new_this_week,
        new_today
      });

      return {
        total,
        in_repair,
        completed,
        pending,
        overdue,
        new_this_month,
        new_this_week,
        new_today
      };
    } catch (error) {
      console.error('Error in getDeviceStatistics:', error);
      return null;
    }
  },

  // Get revenue analytics from direct query
  async getRevenueAnalytics(): Promise<RevenueStats | null> {
    try {
      // Use direct query instead of view - use device_cost instead of parts_cost
      const { data: devices, error } = await supabase
        .from('devices')
        .select('repair_cost, device_cost, created_at');
      
      if (error) {
        console.error('Error fetching devices for revenue analytics:', error);
        return null;
      }
      
      if (!devices || devices.length === 0) {
        return {
          total: 0,
          this_month: 0,
          last_month: 0,
          this_week: 0,
          today: 0,
          growth_percentage: 0
        };
      }

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      let total = 0;
      let this_month = 0;
      let last_month = 0;
      let this_week = 0;
      let today = 0;

      devices.forEach(device => {
        // Use device_cost instead of parts_cost
        const revenue = (device.repair_cost || 0) + (device.device_cost || 0);
        total += revenue;

        if (device.created_at) {
          const createdDate = new Date(device.created_at);
          
          if (createdDate >= startOfMonth) {
            this_month += revenue;
          }
          
          if (createdDate >= startOfLastMonth && createdDate <= endOfLastMonth) {
            last_month += revenue;
          }
          
          if (createdDate >= startOfWeek) {
            this_week += revenue;
          }
          
          if (createdDate >= startOfDay) {
            today += revenue;
          }
        }
      });

      const growth_percentage = last_month > 0 ? ((this_month - last_month) / last_month) * 100 : 0;

      return {
        total,
        this_month,
        last_month,
        this_week,
        today,
        growth_percentage
      };
    } catch (error) {
      console.error('Error in getRevenueAnalytics:', error);
      return null;
    }
  },

  // Get customer analytics from direct query
  async getCustomerAnalytics(): Promise<CustomerStats | null> {
    try {
      // Use direct query instead of view
      const { data: customers, error } = await supabase
        .from('customers')
        .select('*');
      
      if (error) {
        console.error('Error fetching customers for analytics:', error);
        return null;
      }
      
      if (!customers || customers.length === 0) {
        return {
          total: 0,
          new_this_month: 0,
          active: 0,
          returning: 0,
          avg_devices: 0,
          avg_spent: 0
        };
      }

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      const total = customers.length;
      const new_this_month = customers.filter(c => 
        c.created_at && new Date(c.created_at) >= startOfMonth
      ).length;
      const active = customers.filter(c => c.is_active).length;
      const returning = customers.filter(c => 
        c.last_visit && new Date(c.last_visit) >= ninetyDaysAgo
      ).length;
      
      const totalSpent = customers.reduce((sum, c) => sum + (c.total_spent || 0), 0);
      const avg_spent = total > 0 ? totalSpent / total : 0;

      // Get average devices per customer
      const { data: devices, error: devicesError } = await supabase
        .from('devices')
        .select('customer_id');
      
      if (!devicesError && devices) {
        const customerDeviceCounts = devices.reduce((acc: any, device) => {
          acc[device.customer_id] = (acc[device.customer_id] || 0) + 1;
          return acc;
        }, {});
        
        const totalDevices = Object.values(customerDeviceCounts).reduce((sum: any, count: any) => sum + count, 0);
        const avg_devices = total > 0 ? totalDevices / total : 0;
        
        return {
          total,
          new_this_month,
          active,
          returning,
          avg_devices,
          avg_spent
        };
      }

      return {
        total,
        new_this_month,
        active,
        returning,
        avg_devices: 0,
        avg_spent
      };
    } catch (error) {
      console.error('Error in getCustomerAnalytics:', error);
      return null;
    }
  },

  // Fallback function to get customer statistics directly from customers table
  async getCustomerStatsDirect(): Promise<CustomerStats | null> {
    try {
      // Get current date info
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfMonthISO = startOfMonth.toISOString();
      
      // Fetch all customers
      const { data: customers, error } = await supabase
        .from('customers')
        .select('id, created_at, last_visit, is_active, total_spent, points');
      
      if (error) {
        console.error('Error fetching customers for stats:', error);
        return null;
      }

      if (!customers || customers.length === 0) {
        return {
          total: 0,
          new_this_month: 0,
          active: 0,
          returning: 0,
          avg_devices: 0,
          avg_spent: 0
        };
      }

      // Calculate statistics
      const total = customers.length;
      const newThisMonth = customers.filter(c => 
        c.created_at && new Date(c.created_at) >= startOfMonth
      ).length;
      const active = customers.filter(c => c.is_active).length;
      const returning = customers.filter(c => 
        c.last_visit && new Date(c.last_visit) >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      ).length;
      
      const totalSpent = customers.reduce((sum, c) => sum + (c.total_spent || 0), 0);
      const avgSpent = total > 0 ? totalSpent / total : 0;

      return {
        total,
        new_this_month: newThisMonth,
        active,
        returning,
        avg_devices: 0, // Would need to join with devices table
        avg_spent: avgSpent
      };
    } catch (error) {
      console.error('Error in getCustomerStatsDirect:', error);
      return null;
    }
  },

  // Get technician performance from view
  async getTechnicianPerformance(): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('technician_performance_view')
        .select('*')
        .order('completed_devices', { ascending: false });
      
      if (error) {
        console.error('Error fetching technician performance:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getTechnicianPerformance:', error);
      return [];
    }
  },

  // Get top customers from view
  async getTopCustomers(limit: number = 10): Promise<any[]> {
    try {
      // Use direct query instead of view
      const { data: customers, error } = await supabase
        .from('customers')
        .select('id, name, email, total_spent, last_visit');
      
      if (error) {
        console.error('Error fetching customers for top customers:', error);
        return [];
      }
      
      if (!customers || customers.length === 0) {
        return [];
      }

      // Get device counts for each customer
      const { data: devices, error: devicesError } = await supabase
        .from('devices')
        .select('customer_id');
      
      if (devicesError) {
        console.error('Error fetching devices for customer stats:', devicesError);
        return [];
      }

      // Count devices per customer
      const customerDeviceCounts = devices.reduce((acc: any, device) => {
        acc[device.customer_id] = (acc[device.customer_id] || 0) + 1;
        return acc;
      }, {});

      // Add device counts to customers and sort by total spent
      const customersWithStats = customers.map(customer => ({
        id: customer.id,
        name: customer.name || customer.email || `Customer ${customer.id}`,
        total_devices: customerDeviceCounts[customer.id] || 0,
        total_spent: customer.total_spent || 0,
        last_visit: customer.last_visit
      }));

      return customersWithStats
        .sort((a, b) => b.total_spent - a.total_spent)
        .slice(0, limit);
    } catch (error) {
      console.error('Error in getTopCustomers:', error);
      return [];
    }
  },

  // Get top technicians from view
  async getTopTechnicians(limit: number = 10): Promise<any[]> {
    try {
      // Use direct query instead of view - use assigned_to instead of assigned_technician_id
      const { data: devices, error } = await supabase
        .from('devices')
        .select('assigned_to, status, created_at, updated_at, repair_cost, device_cost');
      
      if (error) {
        console.error('Error fetching devices for technician stats:', error);
        return [];
      }
      
      if (!devices || devices.length === 0) {
        return [];
      }

      // Group devices by technician (assigned_to field)
      const technicianStats = devices.reduce((acc: any, device) => {
        const techId = device.assigned_to;
        if (!techId) return acc;
        
        if (!acc[techId]) {
          acc[techId] = {
            id: techId,
            name: `Technician ${techId}`,
            completed_devices: 0,
            total_assigned: 0,
            avg_repair_time_days: 0,
            total_revenue_generated: 0
          };
        }
        
        acc[techId].total_assigned++;
        
        if (device.status === 'done') {
          acc[techId].completed_devices++;
        }
        
        // Use device_cost instead of parts_cost
        const revenue = (device.repair_cost || 0) + (device.device_cost || 0);
        acc[techId].total_revenue_generated += revenue;
        
        return acc;
      }, {});

      // Calculate average repair time and convert to array
      const technicians = Object.values(technicianStats).map((tech: any) => {
        const avgTime = tech.total_assigned > 0 ? 
          tech.total_assigned * 2 : 0; // Default 2 days average
        return {
          ...tech,
          avg_repair_time_days: avgTime
        };
      });

      // Sort by completed devices and return top limit
      return technicians
        .sort((a: any, b: any) => b.completed_devices - a.completed_devices)
        .slice(0, limit);
    } catch (error) {
      console.error('Error in getTopTechnicians:', error);
      return [];
    }
  },

  async getDeviceTypeDistribution(): Promise<any[]> {
    try {
      // Use direct query instead of view
      const { data: devices, error } = await supabase
        .from('devices')
        .select('brand, model');
      
      if (error) {
        console.error('Error fetching devices for type distribution:', error);
        return [];
      }
      
      if (!devices || devices.length === 0) {
        return [];
      }

      // Group by brand
      const brandCounts = devices.reduce((acc: any, device) => {
        const brand = device.brand || 'Unknown';
        acc[brand] = (acc[brand] || 0) + 1;
        return acc;
      }, {});

      const total = devices.length;
      
      return Object.entries(brandCounts).map(([brand, count]) => ({
        type: brand,
        count: count as number,
        percentage: total > 0 ? ((count as number) / total) * 100 : 0
      }));
    } catch (error) {
      console.error('Error in getDeviceTypeDistribution:', error);
      return [];
    }
  },

  async getStatusDistribution(): Promise<any[]> {
    try {
      // Use direct query instead of view
      const { data: devices, error } = await supabase
        .from('devices')
        .select('status');
      
      if (error) {
        console.error('Error fetching devices for status distribution:', error);
        return [];
      }
      
      if (!devices || devices.length === 0) {
        return [];
      }

      // Group by status
      const statusCounts = devices.reduce((acc: any, device) => {
        const status = device.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      const total = devices.length;
      
      return Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count: count as number,
        percentage: total > 0 ? ((count as number) / total) * 100 : 0
      }));
    } catch (error) {
      console.error('Error in getStatusDistribution:', error);
      return [];
    }
  },

  async getMonthlyTrends(): Promise<any[]> {
    try {
      // Use direct query instead of view - use device_cost instead of parts_cost
      const { data: devices, error } = await supabase
        .from('devices')
        .select('created_at, repair_cost, device_cost');
      
      if (error) {
        console.error('Error fetching devices for monthly trends:', error);
        return [];
      }
      
      if (!devices || devices.length === 0) {
        return [];
      }

      // Group by month
      const monthlyData = devices.reduce((acc: any, device) => {
        if (!device.created_at) return acc;
        
        const date = new Date(device.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!acc[monthKey]) {
          acc[monthKey] = {
            month: monthKey,
            devices_count: 0,
            revenue: 0,
            unique_customers: 0
          };
        }
        
        acc[monthKey].devices_count++;
        // Use device_cost instead of parts_cost
        acc[monthKey].revenue += (device.repair_cost || 0) + (device.device_cost || 0);
        
        return acc;
      }, {});

      return Object.values(monthlyData);
    } catch (error) {
      console.error('Error in getMonthlyTrends:', error);
      return [];
    }
  },

  async getDailyTrends(): Promise<any[]> {
    try {
      // Use direct query instead of view - use device_cost instead of parts_cost
      const { data: devices, error } = await supabase
        .from('devices')
        .select('created_at, repair_cost, device_cost');
      
      if (error) {
        console.error('Error fetching devices for daily trends:', error);
        return [];
      }
      
      if (!devices || devices.length === 0) {
        return [];
      }

      // Get last 30 days
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      // Group by day
      const dailyData = devices.reduce((acc: any, device) => {
        if (!device.created_at) return acc;
        
        const date = new Date(device.created_at);
        if (date < thirtyDaysAgo) return acc;
        
        const dayKey = date.toISOString().split('T')[0];
        
        if (!acc[dayKey]) {
          acc[dayKey] = {
            day: dayKey,
            devices_count: 0,
            revenue: 0,
            unique_customers: 0
          };
        }
        
        acc[dayKey].devices_count++;
        // Use device_cost instead of parts_cost
        acc[dayKey].revenue += (device.repair_cost || 0) + (device.device_cost || 0);
        
        return acc;
      }, {});

      return Object.values(dailyData);
    } catch (error) {
      console.error('Error in getDailyTrends:', error);
      return [];
    }
  },

  // Add return analytics method
  async getReturnAnalytics(): Promise<ReturnStats | null> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get return statistics
      const { data: returns, error } = await supabase
        .from('returns')
        .select('*');
      
      if (error) throw error;
      
      if (!returns) return null;
      
      const pending = returns.filter(r => r.status === 'pending' || r.status === 'under-return-review').length;
      const escalated = returns.filter(r => r.escalation_required || r.status === 'escalated').length;
      const completedToday = returns.filter(r => {
        const completedAt = new Date(r.updated_at);
        return r.status === 'completed' && completedAt >= today;
      }).length;
      
      // Calculate average resolution time
      const completedReturns = returns.filter(r => r.status === 'completed' && r.created_at && r.updated_at);
      let avgResolutionTime = '0h';
      if (completedReturns.length > 0) {
        const totalHours = completedReturns.reduce((sum, r) => {
          const created = new Date(r.created_at);
          const updated = new Date(r.updated_at);
          const diffHours = (updated.getTime() - created.getTime()) / (1000 * 60 * 60);
          return sum + diffHours;
        }, 0);
        avgResolutionTime = `${Math.round(totalHours / completedReturns.length)}h`;
      }
      
      // Get top return reasons
      const reasonCounts: { [key: string]: number } = {};
      returns.forEach(r => {
        if (r.reason) {
          reasonCounts[r.reason] = (reasonCounts[r.reason] || 0) + 1;
        }
      });
      
      const topReturnReasons = Object.entries(reasonCounts)
        .map(([reason, count]) => ({
          reason,
          count,
          percentage: Math.round((count / returns.length) * 100)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      return {
        pending,
        escalated,
        completedToday,
        avgResolutionTime,
        totalReturns: returns.length,
        returnRate: returns.length > 0 ? Math.round((returns.length / 100) * 100) : 0, // Placeholder calculation
        topReturnReasons
      };
    } catch (error) {
      console.error('Error fetching return analytics:', error);
      return null;
    }
  },

  // Refresh analytics summary (admin function)
  async refreshAnalyticsSummary(): Promise<boolean> {
    try {
      // For now, just return true since we're using a regular view
      // The view will automatically update when underlying data changes
      return true;
    } catch (error) {
      console.error('Error in refreshAnalyticsSummary:', error);
      return false;
    }
  },

  // Get analytics summary from view
  async getAnalyticsSummary(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('analytics_summary_view')
        .select('*')
        .single();
      
      if (error) {
        console.error('Error fetching analytics summary:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getAnalyticsSummary:', error);
      return null;
    }
  }
}; 

import { supabase } from './supabaseClient';

export interface AnalyticsEvent {
  id?: string;
  event_type: string;
  event_data: Record<string, any>;
  user_id?: string;
  session_id?: string;
  timestamp?: string;
  page_url?: string;
  user_agent?: string;
}

export interface SettingsAnalytics {
  mostUsedSettings: Array<{ key: string; usage_count: number }>;
  userBehavior: {
    totalSessions: number;
    averageSessionDuration: number;
    mostActiveUsers: Array<{ user_id: string; activity_count: number }>;
  };
  performanceMetrics: {
    averageResponseTime: number;
    errorRate: number;
    uptime: number;
  };
  trends: {
    dailyActiveUsers: Array<{ date: string; count: number }>;
    settingsChanges: Array<{ date: string; changes: number }>;
  };
}

export interface UserBehavior {
  userId: string;
  sessionId: string;
  pageViews: Array<{
    page: string;
    timestamp: string;
    duration: number;
  }>;
  actions: Array<{
    action: string;
    timestamp: string;
    details: Record<string, any>;
  }>;
  settings: Record<string, any>;
}

/**
 * Track an analytics event
 */
export const trackEvent = async (event: AnalyticsEvent): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const analyticsEvent = {
      ...event,
      user_id: event.user_id || user?.id,
      session_id: event.session_id || generateSessionId(),
      timestamp: event.timestamp || new Date().toISOString(),
      page_url: event.page_url || window.location.href,
      user_agent: event.user_agent || navigator.userAgent
    };

    const { error } = await supabase
      .from('analytics_events')
      .insert(analyticsEvent);

    if (error) {
      console.error('Error tracking analytics event:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error tracking analytics event:', error);
    return false;
  }
};

/**
 * Track settings usage
 */
export const trackSettingsUsage = async (
  settingKey: string, 
  action: 'view' | 'edit' | 'save' | 'delete',
  details?: Record<string, any>
): Promise<boolean> => {
  return trackEvent({
    event_type: 'settings_usage',
    event_data: {
      setting_key: settingKey,
      action,
      details: details || {}
    }
  });
};

/**
 * Track user behavior
 */
export const trackUserBehavior = async (
  action: string,
  details?: Record<string, any>
): Promise<boolean> => {
  return trackEvent({
    event_type: 'user_behavior',
    event_data: {
      action,
      details: details || {}
    }
  });
};

/**
 * Track performance metrics
 */
export const trackPerformance = async (
  metric: string,
  value: number,
  details?: Record<string, any>
): Promise<boolean> => {
  return trackEvent({
    event_type: 'performance',
    event_data: {
      metric,
      value,
      details: details || {}
    }
  });
};

/**
 * Get settings analytics
 */
export const getSettingsAnalytics = async (): Promise<SettingsAnalytics> => {
  try {
    // Get most used settings
    const { data: settingsUsage } = await supabase
      .from('analytics_events')
      .select('event_data')
      .eq('event_type', 'settings_usage');

    const settingsCount: Record<string, number> = {};
    settingsUsage?.forEach(event => {
      const settingKey = event.event_data.setting_key;
      settingsCount[settingKey] = (settingsCount[settingKey] || 0) + 1;
    });

    const mostUsedSettings = Object.entries(settingsCount)
      .map(([key, count]) => ({ key, usage_count: count }))
      .sort((a, b) => b.usage_count - a.usage_count)
      .slice(0, 10);

    // Get user behavior
    const { data: userBehavior } = await supabase
      .from('analytics_events')
      .select('user_id, event_type, timestamp')
      .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const userActivity: Record<string, number> = {};
    userBehavior?.forEach(event => {
      userActivity[event.user_id] = (userActivity[event.user_id] || 0) + 1;
    });

    const mostActiveUsers = Object.entries(userActivity)
      .map(([user_id, count]) => ({ user_id, activity_count: count }))
      .sort((a, b) => b.activity_count - a.activity_count)
      .slice(0, 5);

    // Get performance metrics
    const { data: performanceEvents } = await supabase
      .from('analytics_events')
      .select('event_data')
      .eq('event_type', 'performance')
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const responseTimes = performanceEvents
      ?.filter(event => event.event_data.metric === 'response_time')
      .map(event => event.event_data.value) || [];

    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;

    // Get trends
    const { data: dailyEvents } = await supabase
      .from('analytics_events')
      .select('timestamp')
      .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const dailyCounts: Record<string, number> = {};
    dailyEvents?.forEach(event => {
      const date = event.timestamp.split('T')[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    const dailyActiveUsers = Object.entries(dailyCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      mostUsedSettings,
      userBehavior: {
        totalSessions: new Set(userBehavior?.map(e => e.user_id)).size,
        averageSessionDuration: 0, // Would need to calculate from session data
        mostActiveUsers
      },
      performanceMetrics: {
        averageResponseTime,
        errorRate: 0, // Would need to calculate from error events
        uptime: 99.9 // Mock value
      },
      trends: {
        dailyActiveUsers,
        settingsChanges: [] // Would need to calculate from settings events
      }
    };
  } catch (error) {
    console.error('Error getting settings analytics:', error);
    return {
      mostUsedSettings: [],
      userBehavior: {
        totalSessions: 0,
        averageSessionDuration: 0,
        mostActiveUsers: []
      },
      performanceMetrics: {
        averageResponseTime: 0,
        errorRate: 0,
        uptime: 0
      },
      trends: {
        dailyActiveUsers: [],
        settingsChanges: []
      }
    };
  }
};

/**
 * Generate session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Track page view
 */
export const trackPageView = async (page: string): Promise<boolean> => {
  return trackEvent({
    event_type: 'page_view',
    event_data: {
      page,
      referrer: document.referrer
    }
  });
};

/**
 * Track user session
 */
export const trackUserSession = async (): Promise<boolean> => {
  const sessionId = generateSessionId();
  
  return trackEvent({
    event_type: 'session_start',
    event_data: {
      session_id: sessionId,
      start_time: new Date().toISOString()
    },
    session_id: sessionId
  });
};

/**
 * Get user behavior insights
 */
export const getUserBehaviorInsights = async (userId?: string): Promise<UserBehavior | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const targetUserId = userId || user?.id;

    if (!targetUserId) return null;

    const { data: events } = await supabase
      .from('analytics_events')
      .select('*')
      .eq('user_id', targetUserId)
      .order('timestamp', { ascending: false })
      .limit(100);

    if (!events) return null;

    const pageViews = events
      .filter(e => e.event_type === 'page_view')
      .map(e => ({
        page: e.event_data.page,
        timestamp: e.timestamp,
        duration: 0 // Would need to calculate from session data
      }));

    const actions = events
      .filter(e => e.event_type !== 'page_view')
      .map(e => ({
        action: e.event_type,
        timestamp: e.timestamp,
        details: e.event_data
      }));

    return {
      userId: targetUserId,
      sessionId: events[0]?.session_id || '',
      pageViews,
      actions,
      settings: {} // Would need to get from settings table
    };
  } catch (error) {
    console.error('Error getting user behavior insights:', error);
    return null;
  }
}; 