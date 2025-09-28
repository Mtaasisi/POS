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

    // Fetch active customers count (using correct column name: is_active)
    const { count: activeCustomers, error: activeError } = await supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);

    if (activeError) {
      console.error('Error fetching active customers count:', activeError);
    }

    // Fetch today's birthdays (using correct column names: birth_month, birth_day)
    const today = new Date();
    const currentMonth = today.getMonth() + 1; // getMonth() returns 0-11
    const currentDay = today.getDate();

    const { data: birthdayCustomers, error: birthdayError } = await supabase
      .from('customers')
      .select('id, birth_month, birth_day')
      .not('birth_month', 'is', null)
      .not('birth_day', 'is', null);

    if (birthdayError) {
      console.error('Error fetching birthday customers:', birthdayError);
    }

    // Filter customers with today's birthday
    const todaysBirthdays = birthdayCustomers?.filter(customer => {
      if (!customer.birth_month || !customer.birth_day) return false;
      
      let customerMonth: number;
      let customerDay: number;
      
      // Handle different month formats
      if (typeof customer.birth_month === 'string') {
        if (customer.birth_month.trim() === '') return false;
        
        // Check if it's a numeric month (1-12)
        const numericMonth = parseInt(customer.birth_month);
        if (!isNaN(numericMonth) && numericMonth >= 1 && numericMonth <= 12) {
          customerMonth = numericMonth;
        } else {
          // Convert month name to number
          const monthNames = [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
          ];
          customerMonth = monthNames.indexOf(customer.birth_month.toLowerCase()) + 1;
        }
      } else {
        return false;
      }
      
      // Handle different day formats
      if (typeof customer.birth_day === 'string') {
        if (customer.birth_day.trim() === '') return false;
        
        // Extract day from formats like "14 00:00:00" or "14"
        const dayMatch = customer.birth_day.match(/^(\d+)/);
        if (dayMatch) {
          customerDay = parseInt(dayMatch[1]);
        } else {
          customerDay = parseInt(customer.birth_day);
        }
      } else {
        customerDay = parseInt(customer.birth_day);
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

    // Calculate total revenue from customers.total_spent (since payment tables don't exist)
    const { data: revenueData, error: revenueError } = await supabase
      .from('customers')
      .select('total_spent');

    if (revenueError) {
      console.error('Error fetching revenue data:', revenueError);
    }

    const totalRevenue = revenueData?.reduce((sum, customer) => sum + (customer.total_spent || 0), 0) || 0;

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
