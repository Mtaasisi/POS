import { supabase } from './supabaseClient';

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  todaysBirthdays: number;
  totalRevenue: number;
  totalDevices: number;
}

export const fetchCustomerStats = async (): Promise<CustomerStats> => {
  try {
    // Fetch total customers count
    const { count: totalCustomers, error: totalError } = await supabase
      .from('customers')
      .select('id', { count: 'exact', head: true });

    if (totalError) {
      console.error('Error fetching total customers count:', totalError);
    }

    // Fetch active customers count
    const { count: activeCustomers, error: activeError } = await supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('isActive', true);

    if (activeError) {
      console.error('Error fetching active customers count:', activeError);
    }

    // Fetch today's birthdays
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // getMonth() returns 0-11
    const currentDay = today.getDate();

    const { data: birthdayCustomers, error: birthdayError } = await supabase
      .from('customers')
      .select('id, birthMonth, birthDay')
      .not('birthMonth', 'is', null)
      .not('birthDay', 'is', null);

    if (birthdayError) {
      console.error('Error fetching birthday customers:', birthdayError);
    }

    // Filter customers with today's birthday
    const todaysBirthdays = birthdayCustomers?.filter(customer => {
      if (!customer.birthMonth || !customer.birthDay) return false;
      
      let customerMonth: number;
      let customerDay: number;
      
      // Handle different month formats
      if (typeof customer.birthMonth === 'string') {
        if (customer.birthMonth.trim() === '') return false;
        
        // Check if it's a numeric month (1-12)
        const numericMonth = parseInt(customer.birthMonth);
        if (!isNaN(numericMonth) && numericMonth >= 1 && numericMonth <= 12) {
          customerMonth = numericMonth;
        } else {
          // Convert month name to number
          const monthNames = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
          ];
          customerMonth = monthNames.indexOf(customer.birthMonth.toLowerCase()) + 1;
        }
      } else {
        return false;
      }
      
      // Handle different day formats
      if (typeof customer.birthDay === 'string') {
        if (customer.birthDay.trim() === '') return false;
        
        // Extract day from formats like "14 00:00:00" or "14"
        const dayMatch = customer.birthDay.match(/^(\d+)/);
        if (dayMatch) {
          customerDay = parseInt(dayMatch[1]);
        } else {
          customerDay = parseInt(customer.birthDay);
        }
      } else {
        customerDay = parseInt(customer.birthDay);
      }
      
      return customerMonth === currentMonth && customerDay === currentDay;
    }).length || 0;

    // Fetch total devices count
    const { count: totalDevices, error: devicesError } = await supabase
      .from('devices')
      .select('id', { count: 'exact', head: true });

    if (devicesError) {
      console.error('Error fetching total devices count:', devicesError);
    }

    // Fetch total revenue from customer_payments
    const { data: revenueData, error: revenueError } = await supabase
      .from('customer_payments')
      .select('amount')
      .eq('status', 'completed');

    if (revenueError) {
      console.error('Error fetching revenue data:', revenueError);
    }

    const totalRevenue = revenueData?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;

    return {
      totalCustomers: totalCustomers || 0,
      activeCustomers: activeCustomers || 0,
      todaysBirthdays,
      totalRevenue,
      totalDevices: totalDevices || 0
    };
  } catch (error) {
    console.error('Error fetching customer stats:', error);
    return {
      totalCustomers: 0,
      activeCustomers: 0,
      todaysBirthdays: 0,
      totalRevenue: 0,
      totalDevices: 0
    };
  }
};
