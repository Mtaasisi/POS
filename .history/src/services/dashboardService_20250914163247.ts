import { supabase } from '../lib/supabaseClient';
import { NotificationService } from '../features/notifications/utils/notificationService';

export interface DashboardStats {
  // Core metrics
  totalDevices: number;
  activeCustomers: number;
  pendingRepairs: number;
  completedToday: number;
  revenue: number;
  
  // Notifications
  unreadNotifications: number;
  urgentNotifications: number;
  
  // Employees & Attendance
  totalEmployees: number;
  presentToday: number;
  onLeaveToday: number;
  attendanceRate: number;
  
  // Appointments
  todayAppointments: number;
  upcomingAppointments: number;
  appointmentCompletionRate: number;
  
  // Services
  activeServices: number;
  popularServices: string[];
  serviceCompletionRate: number;
  
  // Inventory
  lowStockItems: number;
  totalProducts: number;
  inventoryValue: number;
  criticalStockAlerts: number;
  
  // Financial
  todayRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  outstandingPayments: number;
  paymentSuccessRate: number;
  
  // Analytics
  revenueGrowth: number;
  customerGrowth: number;
  averageOrderValue: number;
  
  // System health
  systemStatus: 'healthy' | 'warning' | 'critical';
  backupStatus: 'current' | 'outdated' | 'failed';
  databasePerformance: 'good' | 'slow' | 'critical';
}

export interface RecentActivity {
  id: string;
  type: 'device' | 'customer' | 'payment' | 'appointment' | 'inventory' | 'employee';
  title: string;
  description: string;
  time: string;
  amount?: number;
  status?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface NotificationSummary {
  id: string;
  title: string;
  message: string;
  type: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  createdAt: string;
  category: string;
}

export interface EmployeeStatus {
  id: string;
  name: string;
  status: 'present' | 'absent' | 'late' | 'on-leave';
  checkInTime?: string;
  department: string;
}

export interface AppointmentSummary {
  id: string;
  customerName: string;
  serviceName: string;
  time: string;
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  technicianName?: string;
}

export interface InventoryAlert {
  id: string;
  productName: string;
  currentStock: number;
  minimumStock: number;
  category: string;
  alertLevel: 'low' | 'critical' | 'out-of-stock';
}

export interface FinancialSummary {
  totalRevenue: number;
  todayRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  outstandingAmount: number;
  completedPayments: number;
  pendingPayments: number;
  revenueGrowth: number;
  paymentMethods: Array<{
    method: string;
    amount: number;
    count: number;
  }>;
}

class DashboardService {
  // Fetch comprehensive dashboard statistics
  async getDashboardStats(userId: string): Promise<DashboardStats> {
    try {
      const [
        deviceStats,
        customerStats,
        notificationStats,
        employeeStats,
        appointmentStats,
        inventoryStats,
        financialStats,
        serviceStats
      ] = await Promise.all([
        this.getDeviceStats(),
        this.getCustomerStats(),
        this.getNotificationStats(userId),
        this.getEmployeeStats(),
        this.getAppointmentStats(),
        this.getInventoryStats(),
        this.getFinancialStats(),
        this.getServiceStats()
      ]);

      return {
        // Core metrics
        totalDevices: deviceStats.total || 0,
        activeCustomers: customerStats.active || 0,
        pendingRepairs: deviceStats.pending || 0,
        completedToday: deviceStats.completedToday || 0,
        revenue: financialStats.todayRevenue || 0,
        
        // Notifications
        unreadNotifications: notificationStats.unread || 0,
        urgentNotifications: notificationStats.urgent || 0,
        
        // Employees
        totalEmployees: employeeStats.total || 0,
        presentToday: employeeStats.present || 0,
        onLeaveToday: employeeStats.onLeave || 0,
        attendanceRate: employeeStats.attendanceRate || 0,
        
        // Appointments
        todayAppointments: appointmentStats.today || 0,
        upcomingAppointments: appointmentStats.upcoming || 0,
        appointmentCompletionRate: appointmentStats.completionRate || 0,
        
        // Services
        activeServices: serviceStats.active || 0,
        popularServices: serviceStats.popular || [],
        serviceCompletionRate: serviceStats.completionRate || 0,
        
        // Inventory
        lowStockItems: inventoryStats.lowStock || 0,
        totalProducts: inventoryStats.total || 0,
        inventoryValue: inventoryStats.value || 0,
        criticalStockAlerts: inventoryStats.critical || 0,
        
        // Financial
        todayRevenue: financialStats.todayRevenue || 0,
        weeklyRevenue: financialStats.weeklyRevenue || 0,
        monthlyRevenue: financialStats.monthlyRevenue || 0,
        outstandingPayments: financialStats.outstanding || 0,
        paymentSuccessRate: financialStats.successRate || 0,
        
        // Analytics
        revenueGrowth: financialStats.growth || 0,
        customerGrowth: customerStats.growth || 0,
        averageOrderValue: financialStats.avgOrderValue || 0,
        
        // System health
        systemStatus: 'healthy',
        backupStatus: 'current',
        databasePerformance: 'good'
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return this.getDefaultStats();
    }
  }

  // Get device statistics
  private async getDeviceStats() {
    try {
      const { data: devices, error } = await supabase
        .from('devices')
        .select('id, status, updated_at');

      if (error) throw error;

      const today = new Date().toDateString();
      const completedToday = devices?.filter(d => 
        d.status === 'completed' && 
        new Date(d.updated_at).toDateString() === today
      ).length || 0;

      return {
        total: devices?.length || 0,
        pending: devices?.filter(d => d.status === 'pending').length || 0,
        completedToday
      };
    } catch (error) {
      console.error('Error fetching device stats:', error);
      return { total: 0, pending: 0, completedToday: 0 };
    }
  }

  // Get customer statistics
  private async getCustomerStats() {
    try {
      const { data: customers, error } = await supabase
        .from('customers')
        .select('id, created_at');

      if (error) throw error;

      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const newCustomersThisMonth = customers?.filter(c => 
        new Date(c.created_at) > lastMonth
      ).length || 0;

      const totalCustomers = customers?.length || 0;
      const growth = totalCustomers > 0 ? (newCustomersThisMonth / totalCustomers) * 100 : 0;

      return {
        active: totalCustomers,
        growth: Math.round(growth)
      };
    } catch (error) {
      console.error('Error fetching customer stats:', error);
      return { active: 0, growth: 0 };
    }
  }

  // Get notification statistics
  private async getNotificationStats(userId: string) {
    try {
      // Notifications table doesn't exist yet, return default values for now
      // TODO: Implement when notifications table is created
      return {
        unread: 0,
        urgent: 0
      };
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      return { unread: 0, urgent: 0 };
    }
  }

  // Get employee statistics
  private async getEmployeeStats() {
    try {
      // Note: This would need to be implemented based on your employee attendance system
      // For now, returning mock data
      return {
        total: 8,
        present: 6,
        onLeave: 1,
        attendanceRate: 85
      };
    } catch (error) {
      console.error('Error fetching employee stats:', error);
      return { total: 0, present: 0, onLeave: 0, attendanceRate: 0 };
    }
  }

  // Get appointment statistics
  private async getAppointmentStats() {
    try {
      // Appointments table doesn't exist yet, return default values for now
      // TODO: Implement when appointments table is created
      return {
        today: 0,
        upcoming: 0,
        completionRate: 0
      };
    } catch (error) {
      console.error('Error fetching appointment stats:', error);
      return { today: 0, upcoming: 0, completionRate: 0 };
    }
  }

  // Get inventory statistics
  private async getInventoryStats() {
    try {
      const { data: products, error } = await supabase
        .from('lats_product_variants')
        .select('id, quantity, min_quantity, cost_price');

      if (error) throw error;

      const lowStock = products?.filter(p => p.quantity <= (p.min_quantity || 0)).length || 0;
      const critical = products?.filter(p => p.quantity === 0).length || 0;
      const totalValue = products?.reduce((sum, p) => sum + (p.quantity * (p.cost_price || 0)), 0) || 0;

      return {
        total: products?.length || 0,
        lowStock,
        critical,
        value: totalValue
      };
    } catch (error) {
      console.error('Error fetching inventory stats:', error);
      return { total: 0, lowStock: 0, critical: 0, value: 0 };
    }
  }

  // Get financial statistics (updated)
  private async getFinancialStats() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date();
      monthAgo.setDate(1); // Set to first day to avoid month overflow issues
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      const { data: payments, error } = await supabase
        .from('customer_payments')
        .select('amount, payment_date, status')
        .gte('payment_date', monthAgo.toISOString().split('T')[0]);

      if (error) throw error;

      const todayRevenue = payments?.filter(p => 
        p.payment_date?.startsWith(today) && p.status === 'completed'
      ).reduce((sum, p) => sum + p.amount, 0) || 0;

      const weeklyRevenue = payments?.filter(p => 
        new Date(p.payment_date) >= weekAgo && p.status === 'completed'
      ).reduce((sum, p) => sum + p.amount, 0) || 0;

      const monthlyRevenue = payments?.filter(p => 
        p.status === 'completed'
      ).reduce((sum, p) => sum + p.amount, 0) || 0;

      const outstanding = payments?.filter(p => 
        p.status === 'pending'
      ).reduce((sum, p) => sum + p.amount, 0) || 0;

      const completed = payments?.filter(p => p.status === 'completed').length || 0;
      const total = payments?.length || 0;
      const successRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      // Calculate growth (comparing to previous month)
      const lastMonthStart = new Date();
      lastMonthStart.setDate(1); // Set to first day to avoid month overflow issues
      lastMonthStart.setMonth(lastMonthStart.getMonth() - 2);
      const previousMonthRevenue = payments?.filter(p => 
        new Date(p.payment_date) >= lastMonthStart && 
        new Date(p.payment_date) < monthAgo && 
        p.status === 'completed'
      ).reduce((sum, p) => sum + p.amount, 0) || 0;

      const growth = previousMonthRevenue > 0 ? 
        Math.round(((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100) : 0;

      const avgOrderValue = completed > 0 ? Math.round(monthlyRevenue / completed) : 0;

      return {
        todayRevenue,
        weeklyRevenue,
        monthlyRevenue,
        outstanding,
        successRate,
        growth,
        avgOrderValue
      };
    } catch (error) {
      console.error('Error fetching financial stats:', error);
      return { 
        todayRevenue: 0, weeklyRevenue: 0, monthlyRevenue: 0, 
        outstanding: 0, successRate: 0, growth: 0, avgOrderValue: 0 
      };
    }
  }

  // Get service statistics
  private async getServiceStats() {
    try {
      // Note: This would need to be implemented based on your service management system
      return {
        active: 12,
        popular: ['Screen Repair', 'Battery Replacement', 'Data Recovery'],
        completionRate: 92
      };
    } catch (error) {
      console.error('Error fetching service stats:', error);
      return { active: 0, popular: [], completionRate: 0 };
    }
  }

  // Get recent notifications for dashboard
  async getRecentNotifications(userId: string, limit: number = 5): Promise<NotificationSummary[]> {
    try {
      // Notifications table doesn't exist yet, return empty array for now
      // TODO: Implement when notifications table is created
      return [];
    } catch (error) {
      console.error('Error fetching recent notifications:', error);
      return [];
    }
  }

  // Get employee status for today
  async getTodayEmployeeStatus(): Promise<EmployeeStatus[]> {
    try {
      // Mock data - would need to be implemented with actual employee attendance system
      return [
        {
          id: '1',
          name: 'John Technician',
          status: 'present',
          checkInTime: '08:30',
          department: 'Repair'
        },
        {
          id: '2',
          name: 'Sarah Manager',
          status: 'present',
          checkInTime: '08:15',
          department: 'Management'
        },
        {
          id: '3',
          name: 'Mike Assistant',
          status: 'late',
          checkInTime: '09:15',
          department: 'Customer Service'
        }
      ];
    } catch (error) {
      console.error('Error fetching employee status:', error);
      return [];
    }
  }

  // Get today's appointments
  async getTodayAppointments(limit: number = 5): Promise<AppointmentSummary[]> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_type,
          status,
          scheduled_date,
          priority,
          notes,
          customers!inner(name, phone),
          devices(name, model)
        `)
        .gte('scheduled_date', startOfDay.toISOString())
        .lt('scheduled_date', endOfDay.toISOString())
        .order('scheduled_date', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching appointments:', error);
        return [];
      }

      return appointments?.map(appointment => ({
        id: appointment.id,
        type: appointment.appointment_type,
        status: appointment.status,
        scheduledTime: appointment.scheduled_date,
        priority: appointment.priority,
        customerName: appointment.customers?.name || 'Unknown',
        customerPhone: appointment.customers?.phone || '',
        deviceName: appointment.devices?.name || 'No device',
        notes: appointment.notes || ''
      })) || [];

    } catch (error) {
      console.error('Error fetching today appointments:', error);
      return [];
    }
  }

  // Get inventory alerts
  async getInventoryAlerts(limit: number = 5): Promise<InventoryAlert[]> {
    try {
      const { data: products, error } = await supabase
        .from('lats_product_variants')
        .select(`
          id, quantity, min_quantity, name
        `)
        .lte('quantity', supabase.sql`min_quantity`)
        .order('quantity', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return products?.map(p => {
        const currentStock = p.quantity || 0;
        const minStock = p.min_quantity || 0;
        let alertLevel: 'low' | 'critical' | 'out-of-stock' = 'low';
        
        if (currentStock === 0) alertLevel = 'out-of-stock';
        else if (currentStock < minStock * 0.5) alertLevel = 'critical';
        
        return {
          id: p.id,
          productName: p.name || 'Unknown Product',
          currentStock,
          minimumStock: minStock,
          category: 'General', // Default category since we can't join with products table
          alertLevel
        };
      }) || [];
    } catch (error) {
      console.error('Error fetching inventory alerts:', error);
      return [];
    }
  }

  // Get recent activities across all systems
  async getRecentActivities(limit: number = 10): Promise<RecentActivity[]> {
    try {
      const [deviceActivities, paymentActivities, appointmentActivities] = await Promise.all([
        this.getDeviceActivities(3),
        this.getPaymentActivities(4),
        this.getAppointmentActivities(3)
      ]);

      const allActivities = [
        ...deviceActivities,
        ...paymentActivities,
        ...appointmentActivities
      ];

      // Sort by time and limit
      return allActivities
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      return [];
    }
  }

  // Get device activities
  private async getDeviceActivities(limit: number): Promise<RecentActivity[]> {
    try {
      const { data: devices, error } = await supabase
        .from('devices')
        .select(`
          id, 
          brand, 
          model, 
          status, 
          updated_at,
          customers(name)
        `)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return devices?.map(d => ({
        id: d.id,
        type: 'device' as const,
        title: `Device ${d.status}`,
        description: `${d.brand} ${d.model} - ${(d.customers as any)?.name || 'Unknown Customer'}`,
        time: d.updated_at,
        status: d.status
      })) || [];
    } catch (error) {
      return [];
    }
  }

  // Get payment activities
  private async getPaymentActivities(limit: number): Promise<RecentActivity[]> {
    try {
      const { data: payments, error } = await supabase
        .from('customer_payments')
        .select('id, amount, method, payment_date, customer_id')
        .eq('status', 'completed')
        .order('payment_date', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return payments?.map(p => ({
        id: p.id,
        type: 'payment' as const,
        title: 'Payment received',
        description: `${p.method} payment`,
        time: p.payment_date,
        amount: p.amount
      })) || [];
    } catch (error) {
      return [];
    }
  }

  // Get appointment activities
  private async getAppointmentActivities(limit: number): Promise<RecentActivity[]> {
    try {
      // Appointments table doesn't exist yet, return empty array for now
      // TODO: Implement when appointments table is created
      return [];
    } catch (error) {
      return [];
    }
  }

  // Get financial summary (updated)
  async getFinancialSummary(): Promise<FinancialSummary> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date();
      monthAgo.setDate(1); // Set to first day to avoid month overflow issues
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      const { data: payments, error } = await supabase
        .from('customer_payments')
        .select('amount, method, payment_date, status')
        .gte('payment_date', monthAgo.toISOString().split('T')[0]);

      if (error) throw error;

      const completedPayments = payments?.filter(p => p.status === 'completed') || [];
      const pendingPayments = payments?.filter(p => p.status === 'pending') || [];

      const todayRevenue = completedPayments.filter(p => 
        p.payment_date?.startsWith(today)
      ).reduce((sum, p) => sum + p.amount, 0);

      const weeklyRevenue = completedPayments.filter(p => 
        new Date(p.payment_date) >= weekAgo
      ).reduce((sum, p) => sum + p.amount, 0);

      const monthlyRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);

      const outstandingAmount = pendingPayments.reduce((sum, p) => sum + p.amount, 0);

      // Calculate payment methods summary
      const methodSummary = completedPayments.reduce((acc, p) => {
        const method = p.method || 'unknown';
        if (!acc[method]) {
          acc[method] = { amount: 0, count: 0 };
        }
        acc[method].amount += p.amount;
        acc[method].count += 1;
        return acc;
      }, {} as Record<string, { amount: number; count: number }>);

      const paymentMethods = Object.entries(methodSummary).map(([method, data]) => ({
        method,
        amount: data.amount,
        count: data.count
      }));

      // Calculate revenue growth
      const lastMonthStart = new Date();
      lastMonthStart.setDate(1); // Set to first day to avoid month overflow issues
      lastMonthStart.setMonth(lastMonthStart.getMonth() - 2);
      const previousMonthRevenue = completedPayments.filter(p => 
        new Date(p.payment_date) >= lastMonthStart && 
        new Date(p.payment_date) < monthAgo
      ).reduce((sum, p) => sum + p.amount, 0);

      const revenueGrowth = previousMonthRevenue > 0 ? 
        Math.round(((monthlyRevenue - previousMonthRevenue) / previousMonthRevenue) * 100) : 0;

      return {
        totalRevenue: monthlyRevenue,
        todayRevenue,
        weeklyRevenue,
        monthlyRevenue,
        outstandingAmount,
        completedPayments: completedPayments.length,
        pendingPayments: pendingPayments.length,
        revenueGrowth,
        paymentMethods
      };
    } catch (error) {
      console.error('Error fetching financial summary:', error);
      return {
        totalRevenue: 0,
        todayRevenue: 0,
        weeklyRevenue: 0,
        monthlyRevenue: 0,
        outstandingAmount: 0,
        completedPayments: 0,
        pendingPayments: 0,
        revenueGrowth: 0,
        paymentMethods: []
      };
    }
  }

  // Default stats for fallback
  private getDefaultStats(): DashboardStats {
    return {
      totalDevices: 0,
      activeCustomers: 0,
      pendingRepairs: 0,
      completedToday: 0,
      revenue: 0,
      unreadNotifications: 0,
      urgentNotifications: 0,
      totalEmployees: 0,
      presentToday: 0,
      onLeaveToday: 0,
      attendanceRate: 0,
      todayAppointments: 0,
      upcomingAppointments: 0,
      appointmentCompletionRate: 0,
      activeServices: 0,
      popularServices: [],
      serviceCompletionRate: 0,
      lowStockItems: 0,
      totalProducts: 0,
      inventoryValue: 0,
      criticalStockAlerts: 0,
      todayRevenue: 0,
      weeklyRevenue: 0,
      monthlyRevenue: 0,
      outstandingPayments: 0,
      paymentSuccessRate: 0,
      revenueGrowth: 0,
      customerGrowth: 0,
      averageOrderValue: 0,
      systemStatus: 'healthy',
      backupStatus: 'current',
      databasePerformance: 'good'
    };
  }
}

export const dashboardService = new DashboardService();
