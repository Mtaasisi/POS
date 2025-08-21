import { supabase } from './supabaseClient';
import { cacheSetAll, cacheGetAll } from './offlineCache';
import { Customer } from '../types';

// Configuration constants to prevent resource exhaustion
const BATCH_SIZE = 50; // Maximum customers per batch
const REQUEST_DELAY = 100; // Delay between batches in milliseconds
const MAX_CONCURRENT_REQUESTS = 10; // Maximum concurrent requests

// Function to normalize color tag values
function normalizeColorTag(colorTag: string): 'new' | 'vip' | 'complainer' | 'purchased' {
  if (!colorTag) return 'new';
  
  const normalized = colorTag.trim().toLowerCase();
  
  // Map common variations to valid values
  const colorMap: { [key: string]: 'new' | 'vip' | 'complainer' | 'purchased' } = {
    'normal': 'new',
    'vip': 'vip',
    'complainer': 'complainer',
    'purchased': 'purchased',
    'not normal': 'new', // Map "not normal" to "new"
    'new': 'new',
    'regular': 'new',
    'standard': 'new',
    'basic': 'new',
    'premium': 'vip',
    'important': 'vip',
    'priority': 'vip',
    'problem': 'complainer',
    'issue': 'complainer',
    'buyer': 'purchased',
    'customer': 'purchased',
    'buying': 'purchased'
  };
  
  return colorMap[normalized] || 'new';
}

// Utility for formatting currency with abbreviated notation for large numbers
export function formatCurrency(amount: number) {
  if (amount >= 1000000) {
    // For millions
    const millions = amount / 1000000;
    if (millions >= 10) {
      // For 10M+, show as whole number
      return `Tsh ${Math.floor(millions)}M`;
    } else {
      // For 1M-9.9M, show with one decimal place (no trailing .0)
      const formatted = millions.toFixed(1);
      return `Tsh ${formatted.replace(/\.0$/, '')}M`;
    }
  } else if (amount >= 1000) {
    // For thousands
    const thousands = amount / 1000;
    if (thousands >= 10) {
      // For 10K+, show as whole number
      return `Tsh ${Math.floor(thousands)}K`;
    } else {
      // For 1K-9.9K, show with one decimal place (no trailing .0)
      const formatted = thousands.toFixed(1);
      return `Tsh ${formatted.replace(/\.0$/, '')}K`;
    }
  } else {
    // For numbers less than 1000, use regular formatting without trailing zeros
    const formatted = Number(amount).toLocaleString('en-TZ', { 
      minimumFractionDigits: 0,
      maximumFractionDigits: 2 
    });
    return 'Tsh ' + formatted.replace(/\.00$/, '').replace(/\.0$/, '');
  }
}

export async function fetchAllCustomers() {
  if (navigator.onLine) {
    try {
      console.log('🔍 Fetching customers from database...');
      
      // First, let's get a simple count to see how many customers exist
      const { count, error: countError } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('❌ Error counting customers:', countError);
        throw countError;
      }
      
      console.log(`📊 Total customers in database: ${count}`);
      
      // Use pagination to fetch customers in batches to avoid overwhelming the browser
      const pageSize = BATCH_SIZE; // Use configured batch size
      const totalPages = Math.ceil((count || 0) / pageSize);
      let allCustomers = [];
      
      console.log(`📄 Fetching ${totalPages} pages of customers with batch size ${pageSize}...`);
      
      // Fetch customers page by page with controlled concurrency
      for (let page = 1; page <= totalPages; page++) {
        console.log(`📄 Fetching page ${page}/${totalPages}...`);
        
        try {
          const customersPage = await fetchCustomersPaginated(page, pageSize);
          allCustomers = [...allCustomers, ...customersPage];
          
          // Add a delay between pages to prevent overwhelming the connection pool
          if (page < totalPages) {
            await new Promise(resolve => setTimeout(resolve, REQUEST_DELAY));
          }
        } catch (error) {
          console.error(`❌ Error fetching page ${page}:`, error);
          // Continue with other pages even if one fails
        }
      }
      
      console.log(`✅ Successfully fetched ${allCustomers.length} customers total`);
      
      // Cache the results
      if (allCustomers.length > 0) {
        customerCache.set('all', {
          data: allCustomers,
          timestamp: Date.now()
        });
        console.log('💾 Cached customer data');
      }
      
      return allCustomers;
      
    } catch (error) {
      console.error('❌ Error in fetchAllCustomers:', error);
      
      // Try to return cached data if available
      const cachedData = customerCache.get('all');
      if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
        console.log('🔄 Returning cached customer data due to error');
        return cachedData.data;
      }
      
      throw error;
    }
  } else {
    console.log('📱 Offline mode - returning cached data');
    const cachedData = customerCache.get('all');
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      return cachedData.data;
    }
    return [];
  }
}

export async function fetchAllCustomersSimple() {
  if (navigator.onLine) {
    try {
      console.log('🔍 Fetching customers (simple query)...');
      
      // Simple query without complex joins
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('id, name, email, phone, gender, city, joined_date, loyalty_level, color_tag, referred_by, total_spent, points, last_visit, is_active, whatsapp, birth_month, birth_day, referral_source, total_returns, profile_image, created_at, updated_at')
        .limit(1000);
      
      if (customersError) {
        console.error('❌ Error fetching customers (simple):', customersError);
        throw customersError;
      }
      
      console.log(`✅ Fetched ${customers.length} customers (simple query)`);
      
      // Note: loyalty_customers table doesn't exist in the database schema
      // We'll use the points field from the customers table instead
      console.log('ℹ️ Using points from customers table (loyalty_customers table not available)');
      
      // Create a map of loyalty data by customer_id (using customer data)
      const loyaltyMap = new Map();
      (customers || []).forEach((customer: any) => {
        loyaltyMap.set(customer.id, {
          customer_id: customer.id,
          points: customer.points || 0,
          tier: customer.loyalty_level || 'bronze',
          join_date: customer.joined_date,
          last_visit: customer.last_visit,
          total_spent: customer.total_spent || 0,
          rewards_redeemed: 0 // Default value since we don't have this data
        });
      });
      
      // Transform the data to match our frontend types
      const customersWithData = customers.map(customer => {
        // Get loyalty data for this customer
        const loyaltyInfo = loyaltyMap.get(customer.id);
        
        // Combine customer data with loyalty data
        const baseCustomer = fromDbCustomer(customer);
        
        return {
          ...baseCustomer,
          // Override points with loyalty data if available
          points: loyaltyInfo?.points || baseCustomer.points || 0,
          // Add loyalty-specific fields
          loyaltyTier: loyaltyInfo?.tier || 'bronze',
          loyaltyJoinDate: loyaltyInfo?.join_date ? new Date(loyaltyInfo.join_date) : baseCustomer.joinedDate,
          loyaltyLastVisit: loyaltyInfo?.last_visit ? new Date(loyaltyInfo.last_visit) : baseCustomer.lastVisit,
          loyaltyRewardsRedeemed: loyaltyInfo?.rewards_redeemed || 0,
          loyaltyTotalSpent: loyaltyInfo?.total_spent || baseCustomer.totalSpent || 0,
          isLoyaltyMember: !!loyaltyInfo,
          notes: [],
          payments: [],
          promoHistory: [],
          devices: []
        };
      });

      return customersWithData;
    } catch (error) {
      console.error('❌ Error fetching customers (simple):', error);
      throw error;
    }
  } else {
    return await cacheGetAll('customers');
  }
}

export async function fetchCustomersPaginated(page: number = 1, pageSize: number = 50) {
  if (navigator.onLine) {
    try {
      console.log(`🔍 Fetching customers page ${page} with ${pageSize} per page...`);
      
      // Calculate offset
      const offset = (page - 1) * pageSize;
      
      // Fetch customers with pagination and all related data
      const { data: customers, error: customersError, count } = await supabase
        .from('customers')
        .select(`
          id, name, email, phone, gender, city, joined_date, loyalty_level, color_tag, referred_by, total_spent, points, last_visit, is_active, whatsapp, birth_month, birth_day, referral_source, initial_notes, total_returns, profile_image, created_at, updated_at,
          customer_notes(*),
          customer_payments(
            *,
            devices(brand, model)
          ),
          promo_messages(*),
          devices(*)
        `, { count: 'exact' })
        .range(offset, offset + pageSize - 1)
        .order('created_at', { ascending: false });
      
      if (customersError) {
        console.error('❌ Error fetching customers (paginated):', customersError);
        throw customersError;
      }
      
      console.log(`✅ Fetched ${customers.length} customers for page ${page}`);
      
      // Note: loyalty_customers table doesn't exist in the database schema
      // We'll use the points field from the customers table instead
      console.log('ℹ️ Using points from customers table (loyalty_customers table not available)');
      
      // Transform customers with all related data
      const customersWithData = await Promise.all((customers || []).map(async (customer: any) => {
        // Get loyalty info for this customer
        const loyaltyInfo = {
          customer_id: customer.id,
          points: customer.points || 0,
          tier: customer.loyalty_level || 'bronze',
          join_date: customer.joined_date,
          last_visit: customer.last_visit,
          total_spent: customer.total_spent || 0,
          rewards_redeemed: 0 // Default value since we don't have this data
        };

        // Transform related data
        const transformedNotes = (customer.customer_notes || []).map((note: any) => ({
          id: note.id,
          content: note.content,
          createdBy: note.created_by,
          createdAt: note.created_at
        }));

        const transformedPayments = (customer.customer_payments || []).map((payment: any) => ({
          id: payment.id,
          amount: payment.amount,
          method: payment.method,
          deviceId: payment.device_id,
          deviceName: payment.devices 
            ? `${payment.devices.brand || ''} ${payment.devices.model || ''}`.trim() 
            : undefined,
          date: payment.payment_date,
          type: payment.payment_type,
          status: payment.status,
          createdBy: payment.created_by,
          createdAt: payment.created_at,
          source: 'device_payment'
        }));

        // Transform promo history
        const transformedPromoHistory = (customer.promo_messages || []).map((promo: any) => ({
          id: promo.id,
          message: promo.message,
          sentAt: promo.sent_at,
          status: promo.status,
          type: promo.type
        }));

        const transformedDevices = (customer.devices || []).map((device: any) => ({
          id: device.id,
          brand: device.brand,
          model: device.model,
          serialNumber: device.serial_number,
          issueDescription: device.issue_description,
          status: device.status,
          assignedTo: device.assigned_to,
          expectedReturnDate: device.expected_return_date,
          createdAt: device.created_at,
          updatedAt: device.updated_at,
          unlockCode: device.unlock_code,
          repairCost: device.repair_cost,
          depositAmount: device.deposit_amount,
          diagnosisRequired: device.diagnosis_required,
          deviceNotes: device.device_notes,
          deviceCost: device.device_cost,
          estimatedHours: device.estimated_hours,
          deviceCondition: device.device_condition
        }));
        
        // Combine customer data with loyalty data
        const baseCustomer = fromDbCustomer(customer);
        
        return {
          ...baseCustomer,
          // Override points with loyalty data if available
          points: loyaltyInfo?.points || baseCustomer.points || 0,
          // Add loyalty-specific fields
          loyaltyTier: loyaltyInfo?.tier || 'bronze',
          loyaltyJoinDate: loyaltyInfo?.join_date ? new Date(loyaltyInfo.join_date) : baseCustomer.joinedDate,
          loyaltyLastVisit: loyaltyInfo?.last_visit ? new Date(loyaltyInfo.last_visit) : baseCustomer.lastVisit,
          loyaltyRewardsRedeemed: loyaltyInfo?.rewards_redeemed || 0,
          loyaltyTotalSpent: loyaltyInfo?.total_spent || baseCustomer.totalSpent || 0,
          isLoyaltyMember: !!loyaltyInfo,
          notes: transformedNotes,
          payments: transformedPayments, // Only device payments for now, POS sales will be added separately
          promoHistory: transformedPromoHistory,
          devices: transformedDevices
        };
      }));

      // Batch fetch POS sales for all customers in this page
      const customerIds = customers.map(c => c.id);
      let allPosSales = [];
      
      if (customerIds.length > 0) {
        try {
          console.log(`🔍 Batch fetching POS sales for ${customerIds.length} customers...`);
          const { data: posData, error: posError } = await supabase
            .from('lats_sales')
            .select(`
              *,
              lats_sale_items(*)
            `)
            .in('customer_id', customerIds)
            .order('created_at', { ascending: false });
          
          if (posError) {
            console.warn('⚠️ Batch POS sales query failed:', posError);
          } else {
            allPosSales = posData || [];
            console.log(`✅ Batch fetched ${allPosSales.length} POS sales`);
          }
        } catch (error) {
          console.warn('⚠️ Batch POS sales query failed:', error);
        }
      }

      // Group POS sales by customer and add to customer data
      const posSalesByCustomer = new Map();
      allPosSales.forEach(sale => {
        if (!posSalesByCustomer.has(sale.customer_id)) {
          posSalesByCustomer.set(sale.customer_id, []);
        }
        posSalesByCustomer.get(sale.customer_id).push(sale);
      });

      // Add POS sales to each customer's payments
      const customersWithAllData = customersWithData.map(customer => {
        const customerPosSales = posSalesByCustomer.get(customer.id) || [];
        
        const posPayments = customerPosSales.map((sale: any) => ({
          id: sale.id,
          amount: sale.total_amount,
          method: sale.payment_method,
          deviceId: null,
          deviceName: undefined,
          date: sale.created_at,
          type: 'payment',
          status: sale.status === 'completed' ? 'completed' : 
                  sale.status === 'pending' ? 'pending' : 'failed',
          createdBy: sale.created_by,
          createdAt: sale.created_at,
          source: 'pos_sale',
          orderId: sale.id,
          orderStatus: sale.status,
          totalAmount: sale.total_amount,
          discountAmount: 0, // Not available in new schema
          taxAmount: 0, // Not available in new schema
          shippingCost: 0, // Not available in new schema
          amountPaid: sale.total_amount, // Assuming full payment for completed sales
          balanceDue: 0, // Not available in new schema
          customerType: 'retail', // Default value
          deliveryMethod: 'pickup', // Default value
          deliveryAddress: '', // Not available in new schema
          deliveryCity: '', // Not available in new schema
          deliveryNotes: '', // Not available in new schema
          orderItems: sale.lats_sale_items || []
        }));

        return {
          ...customer,
          payments: [...customer.payments, ...posPayments]
        };
      });

      return {
        customers: customersWithAllData,
        totalCount: count || 0,
        currentPage: page,
        totalPages: Math.ceil((count || 0) / pageSize),
        hasNextPage: page * pageSize < (count || 0),
        hasPreviousPage: page > 1
      };
    } catch (error) {
      console.error('❌ Error fetching customers (paginated):', error);
      throw error;
    }
  } else {
    // For offline mode, return cached data with pagination info
    const allCustomers = await cacheGetAll('customers');
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedCustomers = allCustomers.slice(startIndex, endIndex);
    
    return {
      customers: paginatedCustomers,
      totalCount: allCustomers.length,
      currentPage: page,
      totalPages: Math.ceil(allCustomers.length / pageSize),
      hasNextPage: endIndex < allCustomers.length,
      hasPreviousPage: page > 1
    };
  }
}

export async function fetchCustomerById(customerId: string) {
  if (navigator.onLine) {
    try {
      console.log('🔍 Fetching customer by ID:', customerId);
      
      // Fetch single customer with all related data
      let { data: customers, error: customersError } = await supabase
        .from('customers')
        .select(`
          id, name, email, phone, gender, city, joined_date, loyalty_level, color_tag, referred_by, total_spent, points, last_visit, is_active, whatsapp, birth_month, birth_day, referral_source, initial_notes, total_returns, profile_image, created_at, updated_at,
          customer_notes(*),
          customer_payments(
            *,
            devices(brand, model)
          ),
          promo_messages(*),
          devices(*)
        `)
        .eq('id', customerId)
        .single();
      
      console.log('📊 Database response:', { customers, customersError });
      
      if (customersError) {
        console.error('❌ Database error:', customersError);
        // Try a simpler query as fallback
        console.log('🔄 Trying simpler query as fallback...');
        const { data: simpleCustomer, error: simpleError } = await supabase
          .from('customers')
          .select('*')
          .eq('id', customerId)
          .single();
        
        if (simpleError) {
          console.error('❌ Simple query also failed:', simpleError);
          throw customersError; // Throw original error
        }
        
        if (!simpleCustomer) {
          console.error('❌ No customer data returned for ID:', customerId);
          throw new Error('Customer not found');
        }
        
        console.log('✅ Simple query succeeded, using basic customer data');
        customers = simpleCustomer;
      }
      if (!customers) {
        console.error('❌ No customer data returned for ID:', customerId);
        throw new Error('Customer not found');
      }
      
      // Note: loyalty_customers table doesn't exist in the database schema
      // We'll use the points field from the customers table instead
      console.log('ℹ️ Using points from customers table (loyalty_customers table not available)');
      
      // Create loyalty data from customer data
      const loyaltyData = {
        customer_id: customers.id,
        points: customers.points || 0,
        tier: customers.loyalty_level || 'bronze',
        join_date: customers.joined_date,
        last_visit: customers.last_visit,
        total_spent: customers.total_spent || 0,
        rewards_redeemed: 0 // Default value since we don't have this data
      };
      
      // Transform the data to match our frontend types
      const transformedNotes = (customers.customer_notes || []).map((note: any) => ({
        id: note.id,
        content: note.content,
        createdBy: note.created_by,
        createdAt: note.created_at
      }));

      const transformedPayments = (customers.customer_payments || []).map((payment: any) => ({
        id: payment.id,
        amount: payment.amount,
        method: payment.method,
        deviceId: payment.device_id,
        deviceName: payment.devices 
          ? `${payment.devices.brand || ''} ${payment.devices.model || ''}`.trim() 
          : undefined,
        date: payment.payment_date,
        type: payment.payment_type,
        status: payment.status,
        createdBy: payment.created_by,
        createdAt: payment.created_at,
        source: 'device_payment'
      }));

      // Note: pos_sales table doesn't exist in the database schema
      // We'll use an empty array for POS sales
      console.log('ℹ️ POS sales not available (pos_sales table not available)');
      const posSales: any[] = [];
      
      const transformedPOSSales = (posSales || []).map((sale: any) => ({
        id: sale.id,
        amount: sale.total_amount,
        method: sale.payment_method,
        deviceId: null,
        deviceName: undefined,
        date: sale.created_at,
        type: 'payment',
        status: sale.status === 'completed' ? 'completed' : 
                sale.status === 'pending' ? 'pending' : 'failed',
        createdBy: sale.created_by,
        createdAt: sale.created_at,
        source: 'pos_sale',
        orderId: sale.id,
        orderStatus: sale.status,
        totalAmount: sale.total_amount,
        discountAmount: 0, // Not available in new schema
        taxAmount: 0, // Not available in new schema
        shippingCost: 0, // Not available in new schema
        amountPaid: sale.total_amount, // Assuming full payment for completed sales
        balanceDue: 0, // Not available in new schema
        customerType: 'retail', // Default value
        deliveryMethod: 'pickup', // Default value
        deliveryAddress: '', // Not available in new schema
        deliveryCity: '', // Not available in new schema
        deliveryNotes: '', // Not available in new schema
        // Enhanced POS sales fields (handle missing data gracefully)
        orderItems: sale.lats_sale_items?.map((item: any) => ({
          id: item.id,
          orderId: item.order_id,
          productId: item.product_id,
          variantId: item.variant_id,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          unitCost: item.unit_cost,
          itemTotal: item.item_total,
          isExternalProduct: item.is_external_product,
          externalProductDetails: item.external_product_details,
          product: item.product ? {
            name: item.product.name,
            brand: item.product.brand,
            model: item.product.model,
            description: item.product.description,
            images: item.product.images
          } : undefined,
          variant: item.variant ? {
            variantName: item.variant.variant_name,
            sku: item.variant.sku,
            attributes: item.variant.attributes
          } : undefined
        })) || [],
        installmentPayments: sale.installment_payments?.map((payment: any) => ({
          id: payment.id,
          orderId: payment.order_id,
          paymentDate: payment.payment_date,
          amount: payment.amount,
          paymentMethod: payment.method,
          notes: payment.notes,
          createdBy: payment.created_by
        })) || [],
        createdByUser: sale.created_by_user ? {
          name: sale.created_by_user.name,
          email: sale.created_by_user.email
        } : undefined,
        orderDate: sale.created_at,
        updatedAt: sale.updated_at,
        notes: sale.notes
      }));

      const transformedPromoHistory = (customers.promo_messages || []).map((promo: any) => ({
        id: promo.id,
        title: promo.title,
        content: promo.content,
        sentVia: promo.sent_via,
        sentAt: promo.sent_at,
        status: promo.status
      }));

      const transformedDevices = (customers.devices || []).map((device: any) => ({
        id: device.id,
        customerId: device.customer_id,
        brand: device.brand,
        model: device.model,
        serialNumber: device.serial_number,
        issueDescription: device.issue_description,
        status: device.status,
        assignedTo: device.assigned_to,
        estimatedHours: device.estimated_hours,
        expectedReturnDate: device.expected_return_date,
        warrantyStart: device.warranty_start,
        warrantyEnd: device.warranty_end,
        warrantyStatus: device.warranty_status,
        repairCount: device.repair_count,
        lastReturnDate: device.last_return_date,
        createdAt: device.created_at,
        updatedAt: device.updated_at
      }));

      // Combine customer data with loyalty data
      const baseCustomer = fromDbCustomer(customers);
      
      // Return customer with all related data
      return {
        ...baseCustomer,
        // Override points with loyalty data if available
        points: loyaltyData?.points || baseCustomer.points || 0,
        // Add loyalty-specific fields
        loyaltyTier: loyaltyData?.tier || 'bronze',
        loyaltyJoinDate: loyaltyData?.join_date ? new Date(loyaltyData.join_date) : baseCustomer.joinedDate,
        loyaltyLastVisit: loyaltyData?.last_visit ? new Date(loyaltyData.last_visit) : baseCustomer.lastVisit,
        loyaltyRewardsRedeemed: loyaltyData?.rewards_redeemed || 0,
        loyaltyTotalSpent: loyaltyData?.total_spent || baseCustomer.totalSpent || 0,
        isLoyaltyMember: !!loyaltyData,
        notes: transformedNotes,
        payments: [...transformedPayments, ...transformedPOSSales],
        promoHistory: transformedPromoHistory,
        devices: transformedDevices
      };
    } catch (error) {
      console.error('Error fetching customer:', error);
      throw error;
    }
  } else {
    // Fallback to cached data
    const cachedData = await cacheGetAll('customers');
    return cachedData.find(customer => customer.id === customerId);
  }
}

export async function searchCustomers(query: string, page: number = 1, pageSize: number = 50) {
  if (navigator.onLine) {
    try {
      console.log(`🔍 Searching customers with query: "${query}" (page ${page})`);
      
      // Calculate offset
      const offset = (page - 1) * pageSize;
      
      // Build search query
      let supabaseQuery = supabase
        .from('customers')
        .select(`
          id, name, email, phone, gender, city, joined_date, loyalty_level, color_tag, referred_by, total_spent, points, last_visit, is_active, whatsapp, birth_month, birth_day, referral_source, initial_notes, total_returns, profile_image, created_at, updated_at,
          customer_notes(*),
          customer_payments(
            *,
            devices(brand, model)
          ),
          promo_messages(*),
          devices(*)
        `, { count: 'exact' });
      
      // Apply search filters
      if (query.trim()) {
        const searchQuery = query.trim();
        supabaseQuery = supabaseQuery.or(
          `name.ilike.%${searchQuery}%,` +
          `email.ilike.%${searchQuery}%,` +
          `phone.ilike.%${searchQuery}%,` +
          `city.ilike.%${searchQuery}%,` +
          `loyalty_level.ilike.%${searchQuery}%,` +
          `color_tag.ilike.%${searchQuery}%,` +
          `referral_source.ilike.%${searchQuery}%,` +
          `initial_notes.ilike.%${searchQuery}%`
        );
      }
      
      // Apply pagination and ordering
      const { data: customers, error: customersError, count } = await supabaseQuery
        .range(offset, offset + pageSize - 1)
        .order('created_at', { ascending: false });
      
      if (customersError) {
        console.error('❌ Error searching customers:', customersError);
        throw customersError;
      }
      
      console.log(`✅ Found ${customers.length} customers matching "${query}"`);
      
      // Transform customers with all related data (same as fetchCustomersPaginated)
      const customersWithData = await Promise.all((customers || []).map(async (customer: any) => {
        // Get loyalty info for this customer
        const loyaltyInfo = {
          customer_id: customer.id,
          points: customer.points || 0,
          tier: customer.loyalty_level || 'bronze',
          join_date: customer.joined_date,
          last_visit: customer.last_visit,
          total_spent: customer.total_spent || 0,
          rewards_redeemed: 0 // Default value since we don't have this data
        };

        // Transform related data
        const transformedNotes = (customer.customer_notes || []).map((note: any) => ({
          id: note.id,
          content: note.content,
          createdBy: note.created_by,
          createdAt: note.created_at
        }));

        const transformedPayments = (customer.customer_payments || []).map((payment: any) => ({
          id: payment.id,
          amount: payment.amount,
          method: payment.method,
          deviceId: payment.device_id,
          deviceName: payment.devices 
            ? `${payment.devices.brand || ''} ${payment.devices.model || ''}`.trim() 
            : undefined,
          date: payment.payment_date,
          type: payment.payment_type,
          status: payment.status,
          createdBy: payment.created_by,
          createdAt: payment.created_at,
          source: 'device_payment'
        }));

        // Transform promo history
        const transformedPromoHistory = (customer.promo_messages || []).map((promo: any) => ({
          id: promo.id,
          message: promo.message,
          sentAt: promo.sent_at,
          status: promo.status,
          type: promo.type
        }));

        const transformedDevices = (customer.devices || []).map((device: any) => ({
          id: device.id,
          brand: device.brand,
          model: device.model,
          serialNumber: device.serial_number,
          issueDescription: device.issue_description,
          status: device.status,
          assignedTo: device.assigned_to,
          expectedReturnDate: device.expected_return_date,
          createdAt: device.created_at,
          updatedAt: device.updated_at,
          unlockCode: device.unlock_code,
          repairCost: device.repair_cost,
          depositAmount: device.deposit_amount,
          diagnosisRequired: device.diagnosis_required,
          deviceNotes: device.device_notes,
          deviceCost: device.device_cost,
          estimatedHours: device.estimated_hours,
          deviceCondition: device.device_condition
        }));
        
        // Combine customer data with loyalty data
        const baseCustomer = fromDbCustomer(customer);
        
        return {
          ...baseCustomer,
          // Override points with loyalty data if available
          points: loyaltyInfo?.points || baseCustomer.points || 0,
          // Add loyalty-specific fields
          loyaltyTier: loyaltyInfo?.tier || 'bronze',
          loyaltyJoinDate: loyaltyInfo?.join_date ? new Date(loyaltyInfo.join_date) : baseCustomer.joinedDate,
          loyaltyLastVisit: loyaltyInfo?.last_visit ? new Date(loyaltyInfo.last_visit) : baseCustomer.lastVisit,
          loyaltyRewardsRedeemed: loyaltyInfo?.rewards_redeemed || 0,
          loyaltyTotalSpent: loyaltyInfo?.total_spent || baseCustomer.totalSpent || 0,
          isLoyaltyMember: !!loyaltyInfo,
          notes: transformedNotes,
          payments: transformedPayments, // Only device payments for now, POS sales will be added separately
          promoHistory: transformedPromoHistory,
          devices: transformedDevices
        };
      }));

      // Batch fetch POS sales for all customers in this search result
      const customerIds = customers.map(c => c.id);
      let allPosSales = [];
      
      if (customerIds.length > 0) {
        try {
          console.log(`🔍 Batch fetching POS sales for ${customerIds.length} customers in search results...`);
          const { data: posData, error: posError } = await supabase
            .from('lats_sales')
            .select(`
              *,
              lats_sale_items(*)
            `)
            .in('customer_id', customerIds)
            .order('created_at', { ascending: false });
          
          if (posError) {
            console.warn('⚠️ Batch POS sales query failed:', posError);
          } else {
            allPosSales = posData || [];
            console.log(`✅ Batch fetched ${allPosSales.length} POS sales for search results`);
          }
        } catch (error) {
          console.warn('⚠️ Batch POS sales query failed:', error);
        }
      }

      // Group POS sales by customer and add to customer data
      const posSalesByCustomer = new Map();
      allPosSales.forEach(sale => {
        if (!posSalesByCustomer.has(sale.customer_id)) {
          posSalesByCustomer.set(sale.customer_id, []);
        }
        posSalesByCustomer.get(sale.customer_id).push(sale);
      });

      // Add POS sales to each customer's payments
      const customersWithAllData = customersWithData.map(customer => {
        const customerPosSales = posSalesByCustomer.get(customer.id) || [];
        
        const posPayments = customerPosSales.map((sale: any) => ({
          id: sale.id,
          amount: sale.total_amount,
          method: sale.payment_method,
          deviceId: null,
          deviceName: undefined,
          date: sale.created_at,
          type: 'payment',
          status: sale.status === 'completed' ? 'completed' : 
                  sale.status === 'pending' ? 'pending' : 'failed',
          createdBy: sale.created_by,
          createdAt: sale.created_at,
          source: 'pos_sale',
          orderId: sale.id,
          orderStatus: sale.status,
          totalAmount: sale.total_amount,
          discountAmount: 0, // Not available in new schema
          taxAmount: 0, // Not available in new schema
          shippingCost: 0, // Not available in new schema
          amountPaid: sale.total_amount, // Assuming full payment for completed sales
          balanceDue: 0, // Not available in new schema
          customerType: 'retail', // Default value
          deliveryMethod: 'pickup', // Default value
          deliveryAddress: '', // Not available in new schema
          deliveryCity: '', // Not available in new schema
          deliveryNotes: '', // Not available in new schema
          orderItems: sale.lats_sale_items || []
        }));

        return {
          ...customer,
          payments: [...customer.payments, ...posPayments]
        };
      });

      return {
        customers: customersWithAllData,
        totalCount: count || 0,
        currentPage: page,
        totalPages: Math.ceil((count || 0) / pageSize),
        hasNextPage: page * pageSize < (count || 0),
        hasPreviousPage: page > 1,
        searchQuery: query
      };
    } catch (error) {
      console.error('❌ Error searching customers:', error);
      throw error;
    }
  } else {
    // For offline mode, return cached data with search filtering
    const allCustomers = await cacheGetAll('customers');
    const filteredCustomers = query.trim() 
      ? allCustomers.filter(customer => {
          const searchQuery = query.toLowerCase().trim();
          const searchableFields = [
            customer.name,
            customer.phone,
            customer.city,
            customer.email,
            customer.loyaltyLevel,
            customer.colorTag
          ].filter(Boolean);
          
          return searchableFields.some(field => 
            field.toLowerCase().includes(searchQuery)
          );
        })
      : allCustomers;
    
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);
    
    return {
      customers: paginatedCustomers,
      totalCount: filteredCustomers.length,
      currentPage: page,
      totalPages: Math.ceil(filteredCustomers.length / pageSize),
      hasNextPage: endIndex < filteredCustomers.length,
      hasPreviousPage: page > 1,
      searchQuery: query
    };
  }
}

// Search cache for frequently used queries
const searchCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCacheKey(query: string, page: number, pageSize: number): string {
  return `${query.toLowerCase().trim()}_${page}_${pageSize}`;
}

function isCacheValid(timestamp: number): boolean {
  return Date.now() - timestamp < CACHE_DURATION;
}

export async function searchCustomersFast(query: string, page: number = 1, pageSize: number = 50) {
  if (navigator.onLine) {
    try {
      // Check cache first
      const cacheKey = getCacheKey(query, page, pageSize);
      const cached = searchCache.get(cacheKey);
      
      if (cached && isCacheValid(cached.timestamp)) {
        console.log(`⚡ Cache hit for query: "${query}" (page ${page})`);
        return cached.data;
      }
      
      console.log(`⚡ Fast searching customers with query: "${query}" (page ${page})`);
      
      // Calculate offset
      const offset = (page - 1) * pageSize;
      
      // Build optimized search query - only fetch essential fields for search results
      let supabaseQuery = supabase
        .from('customers')
        .select(`
          id, name, email, phone, gender, city, joined_date, loyalty_level, color_tag, 
          total_spent, points, last_visit, is_active, whatsapp, referral_source
        `, { count: 'exact' });
      
      // Apply search filters with optimized query
      if (query.trim()) {
        const searchQuery = query.trim();
        
        // Use more efficient search strategy
        if (searchQuery.length >= 3) {
          // For longer queries, search in most common fields first
          supabaseQuery = supabaseQuery.or(
            `name.ilike.%${searchQuery}%,` +
            `phone.ilike.%${searchQuery}%,` +
            `email.ilike.%${searchQuery}%,` +
            `city.ilike.%${searchQuery}%`
          );
        } else {
          // For short queries, include all fields but limit results
          supabaseQuery = supabaseQuery.or(
            `name.ilike.%${searchQuery}%,` +
            `phone.ilike.%${searchQuery}%,` +
            `email.ilike.%${searchQuery}%,` +
            `city.ilike.%${searchQuery}%,` +
            `loyalty_level.ilike.%${searchQuery}%,` +
            `color_tag.ilike.%${searchQuery}%`
          );
        }
      }
      
      // Apply pagination and ordering
      const { data: customers, error: customersError, count } = await supabaseQuery
        .range(offset, offset + pageSize - 1)
        .order('name', { ascending: true }); // Order by name for better UX
      
      if (customersError) {
        console.error('❌ Error fast searching customers:', customersError);
        throw customersError;
      }
      
      console.log(`⚡ Found ${customers.length} customers matching "${query}" in fast search`);
      
      // Transform customers with minimal data processing
      const customersWithData = (customers || []).map((customer: any) => {
        // Combine customer data with loyalty data
        const baseCustomer = fromDbCustomer(customer);
        
        return {
          ...baseCustomer,
          // Override points with loyalty data if available
          points: customer.points || baseCustomer.points || 0,
          // Add loyalty-specific fields
          loyaltyTier: customer.loyalty_level || 'bronze',
          loyaltyJoinDate: customer.joined_date ? new Date(customer.joined_date) : baseCustomer.joinedDate,
          loyaltyLastVisit: customer.last_visit ? new Date(customer.last_visit) : baseCustomer.lastVisit,
          loyaltyRewardsRedeemed: 0, // Default value
          loyaltyTotalSpent: customer.total_spent || baseCustomer.totalSpent || 0,
          isLoyaltyMember: !!customer.points,
          // Initialize empty arrays for related data (will be loaded on demand)
          notes: [],
          payments: [],
          promoHistory: [],
          devices: []
        };
      });

      const result = {
        customers: customersWithData,
        totalCount: count || 0,
        currentPage: page,
        totalPages: Math.ceil((count || 0) / pageSize),
        hasNextPage: page * pageSize < (count || 0),
        hasPreviousPage: page > 1,
        searchQuery: query
      };

      // Cache the result
      searchCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });

      // Clean up old cache entries (keep only last 50 entries)
      if (searchCache.size > 50) {
        const entries = Array.from(searchCache.entries());
        entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
        const toDelete = entries.slice(50);
        toDelete.forEach(([key]) => searchCache.delete(key));
      }

      return result;
    } catch (error) {
      console.error('❌ Error fast searching customers:', error);
      throw error;
    }
  } else {
    // For offline mode, return cached data with search filtering
    const allCustomers = await cacheGetAll('customers');
    const filteredCustomers = query.trim() 
      ? allCustomers.filter(customer => {
          const searchQuery = query.toLowerCase().trim();
          const searchableFields = [
            customer.name,
            customer.phone,
            customer.city,
            customer.email,
            customer.loyaltyLevel,
            customer.colorTag
          ].filter(Boolean);
          
          return searchableFields.some(field => 
            field.toLowerCase().includes(searchQuery)
          );
        })
      : allCustomers;
    
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);
    
    return {
      customers: paginatedCustomers,
      totalCount: filteredCustomers.length,
      currentPage: page,
      totalPages: Math.ceil(filteredCustomers.length / pageSize),
      hasNextPage: endIndex < filteredCustomers.length,
      hasPreviousPage: page > 1,
      searchQuery: query
    };
  }
}

// Function to clear search cache
export function clearSearchCache() {
  searchCache.clear();
  console.log('🧹 Search cache cleared');
}

// Function to get cache stats
export function getSearchCacheStats() {
  const entries = Array.from(searchCache.entries());
  const validEntries = entries.filter(([_, value]) => isCacheValid(value.timestamp));
  const expiredEntries = entries.length - validEntries.length;
  
  return {
    totalEntries: entries.length,
    validEntries: validEntries.length,
    expiredEntries: expiredEntries.length,
    cacheSize: searchCache.size
  };
}

// Add a function to load detailed customer data on demand
export async function loadCustomerDetails(customerId: string) {
  try {
    console.log(`🔍 Loading detailed data for customer: ${customerId}`);
    
    const { data: customer, error } = await supabase
      .from('customers')
      .select(`
        id, name, email, phone, gender, city, joined_date, loyalty_level, color_tag, referred_by, total_spent, points, last_visit, is_active, whatsapp, birth_month, birth_day, referral_source, initial_notes, total_returns, profile_image, created_at, updated_at,
        customer_notes(*),
        customer_payments(
          *,
          devices(brand, model)
        ),
        promo_messages(*),
        devices(*)
      `)
      .eq('id', customerId)
      .single();
    
    if (error) {
      console.error('❌ Error loading customer details:', error);
      throw error;
    }
    
    // Transform customer with all related data
    const loyaltyInfo = {
      customer_id: customer.id,
      points: customer.points || 0,
      tier: customer.loyalty_level || 'bronze',
      join_date: customer.joined_date,
      last_visit: customer.last_visit,
      total_spent: customer.total_spent || 0,
      rewards_redeemed: 0
    };

    const transformedNotes = (customer.customer_notes || []).map((note: any) => ({
      id: note.id,
      content: note.content,
      createdBy: note.created_by,
      createdAt: note.created_at
    }));

    const transformedPayments = (customer.customer_payments || []).map((payment: any) => ({
      id: payment.id,
      amount: payment.amount,
      method: payment.method,
      deviceId: payment.device_id,
      deviceName: payment.devices 
        ? `${payment.devices.brand || ''} ${payment.devices.model || ''}`.trim() 
        : undefined,
      date: payment.payment_date,
      type: payment.payment_type,
      status: payment.status,
      createdBy: payment.created_by,
      createdAt: payment.created_at,
      source: 'device_payment'
    }));

    // Add POS sales as payments
    let customerPosSales = [];
    try {
      const { data: posData } = await supabase
        .from('lats_sales')
        .select(`
          *,
          lats_sale_items(*)
        `)
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });
      customerPosSales = posData || [];
    } catch (error) {
      console.warn('⚠️ POS sales query failed for customer:', error);
    }

    const posPayments = customerPosSales.map((sale: any) => ({
      id: sale.id,
      amount: sale.total_amount,
      method: sale.payment_method,
      deviceId: null,
      deviceName: undefined,
      date: sale.created_at,
      type: 'payment',
      status: sale.status === 'completed' ? 'completed' : 
              sale.status === 'pending' ? 'pending' : 'failed',
      createdBy: sale.created_by,
      createdAt: sale.created_at,
      source: 'pos_sale',
      orderId: sale.id,
      orderStatus: sale.status,
      totalAmount: sale.total_amount,
      discountAmount: 0,
      taxAmount: 0,
      shippingCost: 0,
      amountPaid: sale.total_amount,
      balanceDue: 0,
      customerType: 'retail',
      deliveryMethod: 'pickup',
      deliveryAddress: '',
      deliveryCity: '',
      deliveryNotes: '',
      orderItems: sale.lats_sale_items || []
    }));

    const allPayments = [...transformedPayments, ...posPayments];

    const transformedPromoHistory = (customer.promo_messages || []).map((promo: any) => ({
      id: promo.id,
      message: promo.message,
      sentAt: promo.sent_at,
      status: promo.status,
      type: promo.type
    }));

    const transformedDevices = (customer.devices || []).map((device: any) => ({
      id: device.id,
      brand: device.brand,
      model: device.model,
      serialNumber: device.serial_number,
      issueDescription: device.issue_description,
      status: device.status,
      assignedTo: device.assigned_to,
      expectedReturnDate: device.expected_return_date,
      createdAt: device.created_at,
      updatedAt: device.updated_at,
      unlockCode: device.unlock_code,
      repairCost: device.repair_cost,
      depositAmount: device.deposit_amount,
      diagnosisRequired: device.diagnosis_required,
      deviceNotes: device.device_notes,
      deviceCost: device.device_cost,
      estimatedHours: device.estimated_hours,
      deviceCondition: device.device_condition
    }));
    
    const baseCustomer = fromDbCustomer(customer);
    
    return {
      ...baseCustomer,
      points: loyaltyInfo?.points || baseCustomer.points || 0,
      loyaltyTier: loyaltyInfo?.tier || 'bronze',
      loyaltyJoinDate: loyaltyInfo?.join_date ? new Date(loyaltyInfo.join_date) : baseCustomer.joinedDate,
      loyaltyLastVisit: loyaltyInfo?.last_visit ? new Date(loyaltyInfo.last_visit) : baseCustomer.lastVisit,
      loyaltyRewardsRedeemed: loyaltyInfo?.rewards_redeemed || 0,
      loyaltyTotalSpent: loyaltyInfo?.total_spent || baseCustomer.totalSpent || 0,
      isLoyaltyMember: !!loyaltyInfo,
      notes: transformedNotes,
      payments: allPayments,
      promoHistory: transformedPromoHistory,
      devices: transformedDevices
    };
  } catch (error) {
    console.error('❌ Error loading customer details:', error);
    throw error;
  }
}

function toDbCustomer(customer: any) {
  return {
    id: customer.id,
    name: customer.name,
    email: customer.email,
    phone: customer.phone,
    gender: customer.gender,
    city: customer.city,
    location_description: customer.locationDescription || null,
    national_id: customer.nationalId || null,
    joined_date: customer.joinedDate,
    loyalty_level: customer.loyaltyLevel,
    color_tag: normalizeColorTag(customer.colorTag),
    referred_by: customer.referredBy,
    referrals: customer.referrals,
    total_spent: customer.totalSpent || 0,
    points: customer.points || 0,
    last_visit: customer.lastVisit,
    is_active: customer.isActive,

    referral_source: customer.referralSource,
    birth_month: customer.birthMonth,
    birth_day: customer.birthDay,
    initial_notes: customer.initialNotes,
    // Add missing required fields with defaults
    total_returns: customer.total_returns || 0,
    profile_image: customer.profile_image || null,
    created_by: customer.created_by || null,
    created_at: customer.created_at || new Date().toISOString(),
    updated_at: customer.updated_at || new Date().toISOString(),
  };
}

function fromDbCustomer(db: any) {
  return {
    id: db.id,
    name: db.name,
    email: db.email,
    phone: db.phone,
    gender: db.gender,
    city: db.city,
    locationDescription: db.location_description,
    nationalId: db.national_id,
    joinedDate: db.joined_date,
    loyaltyLevel: db.loyalty_level,
    colorTag: db.color_tag || 'new',
    referredBy: db.referred_by,
    referrals: db.referrals || [],
    totalSpent: db.total_spent || 0,
    points: db.points || 0,
    lastVisit: db.last_visit,
    isActive: db.is_active,

    referralSource: db.referral_source,
    birthMonth: db.birth_month,
    birthDay: db.birth_day,
    initialNotes: db.initial_notes,
    // Initialize empty arrays for related data
    notes: [],
    promoHistory: [],
    payments: [],
    devices: [],
    created_at: db.created_at,
    updated_at: db.updated_at,
  };
}

export async function addCustomerToDb(customer: Omit<Customer, 'promoHistory' | 'payments' | 'devices'>) {
  // Give new customers 10 points for registration
  const initialPoints = (typeof customer.points === 'number' ? customer.points : 0) + 10;
  
  // Clean and validate the data before sending to database
  const dbCustomer = {
    id: customer.id,
    name: customer.name?.trim() || '',
    email: customer.email?.trim() || null,
    phone: customer.phone?.trim() || '',
    gender: customer.gender?.trim() || null,
    city: customer.city?.trim() || null,
    location_description: customer.locationDescription?.trim() || null,
    national_id: customer.nationalId?.trim() || null,
    joined_date: customer.joinedDate || new Date().toISOString(),
    loyalty_level: customer.loyaltyLevel || 'bronze',
    color_tag: normalizeColorTag(customer.colorTag || 'new'),
    referred_by: customer.referredBy?.trim() || null,
    total_spent: typeof customer.totalSpent === 'number' ? customer.totalSpent : 0,
    points: initialPoints,
    last_visit: customer.lastVisit || null,
    is_active: typeof customer.isActive === 'boolean' ? customer.isActive : true,

    birth_month: customer.birthMonth || null,
    birth_day: customer.birthDay || null,
    referral_source: customer.referralSource?.trim() || null,
    initial_notes: customer.initialNotes?.trim() || null,
    // Add missing required fields with defaults
    total_returns: 0,
    profile_image: null,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  
  // Remove any undefined values that might cause issues
  Object.keys(dbCustomer).forEach(key => {
    if (dbCustomer[key as keyof typeof dbCustomer] === undefined) {
      delete dbCustomer[key as keyof typeof dbCustomer];
    }
  });

  // Additional validation and cleanup
  // Ensure numeric fields are numbers
  if (typeof dbCustomer.total_spent !== 'number') {
    dbCustomer.total_spent = 0;
  }
  if (typeof dbCustomer.points !== 'number') {
    dbCustomer.points = initialPoints;
  }
  if (typeof dbCustomer.total_returns !== 'number') {
    dbCustomer.total_returns = 0;
  }

  // Ensure boolean fields are booleans
  if (typeof dbCustomer.is_active !== 'boolean') {
    dbCustomer.is_active = true;
  }

  // Ensure string fields are strings or null
  if (dbCustomer.name && typeof dbCustomer.name !== 'string') {
    dbCustomer.name = String(dbCustomer.name);
  }
  if (dbCustomer.phone && typeof dbCustomer.phone !== 'string') {
    dbCustomer.phone = String(dbCustomer.phone);
  }
  
  console.log('Sending customer data to database:', dbCustomer);
  
  try {
    const { error } = await supabase.from('customers').insert([dbCustomer]);
    if (error) {
      console.error('Database error:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      console.error('Data that failed to insert:', JSON.stringify(dbCustomer, null, 2));
      
      // Handle duplicate phone number error specifically
      if (error.code === '23505' && error.message.includes('customers_phone_unique')) {
        throw new Error('A customer with this phone number already exists. Please use a different phone number.');
      }
      
      throw error;
    }
  } catch (insertError) {
    console.error('Insert failed, trying with minimal required fields:', insertError);
    
    // Fallback: try with only essential fields
    const minimalCustomer = {
      id: customer.id,
      name: customer.name?.trim() || 'Unknown',
      phone: customer.phone?.trim() || '',
      email: null,
      gender: null,
      city: null,
      location_description: null,
      national_id: null,
      joined_date: new Date().toISOString(),
      loyalty_level: 'bronze',
      color_tag: 'new',
      referred_by: null,
      total_spent: 0,
      points: initialPoints,
      last_visit: null,
      is_active: true,
      whatsapp: null,
      referral_source: null,
      birth_month: null,
      birth_day: null,
      total_returns: 0,
      profile_image: null,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    
    console.log('Trying fallback insert with minimal data:', minimalCustomer);
    const { error: fallbackError } = await supabase.from('customers').insert([minimalCustomer]);
    if (fallbackError) {
      console.error('Fallback insert also failed:', fallbackError);
      console.error('Fallback error details:', {
        message: fallbackError.message,
        details: fallbackError.details,
        hint: fallbackError.hint,
        code: fallbackError.code
      });
      throw fallbackError;
    }
  }
  
  // Add note about initial points
  try {
    const { data: userData } = await supabase.auth.getUser();
    const currentUserId = userData?.user?.id;
    
    await supabase.from('customer_notes').insert({
      id: crypto.randomUUID(),
      content: `Added 10 initial loyalty points for new customer registration`,
      created_by: currentUserId || 'system',
      created_at: new Date().toISOString(),
      customer_id: dbCustomer.id
    });
  } catch (noteError) {
    console.warn('Could not add initial points note:', noteError);
  }
  
  return fromDbCustomer(dbCustomer);
}

export async function updateCustomerInDb(customerId: string, updates: Partial<Customer>) {
  console.log('🔧 Starting customer update for ID:', customerId);
  console.log('🔧 Received updates:', updates);
  
  // Only include fields that are actually being updated
  const dbUpdates: any = {};
  
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
  if (updates.city !== undefined) dbUpdates.city = updates.city;
  if (updates.joinedDate !== undefined) dbUpdates.joined_date = updates.joinedDate;
  if (updates.loyaltyLevel !== undefined) dbUpdates.loyalty_level = updates.loyaltyLevel;
  if (updates.colorTag !== undefined) dbUpdates.color_tag = normalizeColorTag(updates.colorTag);
  if (updates.referredBy !== undefined) dbUpdates.referred_by = updates.referredBy;
  if (updates.totalSpent !== undefined) dbUpdates.total_spent = updates.totalSpent;
  if (updates.points !== undefined) dbUpdates.points = updates.points;
  if (updates.lastVisit !== undefined) dbUpdates.last_visit = updates.lastVisit;
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
  if (updates.whatsapp !== undefined) dbUpdates.whatsapp = updates.whatsapp;
  if (updates.referralSource !== undefined) dbUpdates.referral_source = updates.referralSource;
  if (updates.birthMonth !== undefined) dbUpdates.birth_month = updates.birthMonth;
  if (updates.birthDay !== undefined) dbUpdates.birth_day = updates.birthDay;
  if (updates.initialNotes !== undefined) dbUpdates.initial_notes = updates.initialNotes;
  
  // Handle additional fields that might be passed from the import modal
  if ((updates as any).locationDescription !== undefined) dbUpdates.location_description = (updates as any).locationDescription;
  if ((updates as any).nationalId !== undefined) dbUpdates.national_id = (updates as any).nationalId;
  
  // Always update the updated_at timestamp
  dbUpdates.updated_at = new Date().toISOString();
  
  console.log('🔧 Final database updates:', dbUpdates);
  
  const { data, error } = await supabase
    .from('customers')
    .update(dbUpdates)
    .eq('id', customerId)
    .select();
  if (error) {
    console.error('❌ Error updating customer:', error);
    console.error('❌ Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    
    // Handle duplicate phone number error specifically
    if (error.code === '23505' && error.message.includes('customers_phone_unique')) {
      throw new Error('A customer with this phone number already exists. Please use a different phone number.');
    }
    
    throw error;
  }
  return data && data[0] ? fromDbCustomer(data[0]) : null;
}

export async function deleteCustomerFromDb(customerId: string) {
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', customerId);
  if (error) throw error;
  return true;
} 

// Add missing createCustomer export for backward compatibility
export const createCustomer = addCustomerToDb;

/**
 * Check in a customer (log visit, update last_visit, set active, award points)
 * Returns { success: boolean, message: string }
 */
export async function checkInCustomer(customerId: string, staffId: string): Promise<{ success: boolean; message: string }> {
  // Insert into customer_checkins
  const { error } = await supabase
    .from('customer_checkins')
    .insert({ customer_id: customerId, staff_id: staffId });
  if (error) {
    if (error.code === '23505') {
      // Unique violation: already checked in today
      return { success: false, message: 'Customer already checked in today.' };
    }
    return { success: false, message: error.message };
  }
  // Update customer last_visit and is_active
  await supabase
    .from('customers')
    .update({ last_visit: new Date().toISOString(), is_active: true })
    .eq('id', customerId);
  // Award 5 points to customer (safe increment)
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('points')
    .eq('id', customerId)
    .single();
  if (!customerError && customer && typeof customer.points === 'number') {
    await supabase
      .from('customers')
      .update({ points: customer.points + 5 })
      .eq('id', customerId);
    
    // Add note about check-in points
    try {
      await supabase.from('customer_notes').insert({
        id: crypto.randomUUID(),
        content: `Added 5 loyalty points for customer check-in`,
        created_by: staffId,
        created_at: new Date().toISOString(),
        customer_id: customerId
      });
    } catch (noteError) {
      console.warn('Could not add check-in points note:', noteError);
    }
  }
  // Award 20 points to staff (safe increment)
  const { data: staff, error: staffError } = await supabase
    .from('auth_users')
    .select('points')
    .eq('id', staffId)
    .single();
  if (!staffError && staff && typeof staff.points === 'number') {
    await supabase
      .from('auth_users')
      .update({ points: staff.points + 20 })
      .eq('id', staffId);
  }
  return { success: true, message: 'Check-in successful. 20 points awarded to staff, 5 points to customer.' };
} 

// Add a test function to check customer existence
export async function testCustomerAccess(customerId?: string) {
  try {
    console.log('🧪 Testing customer table access...');
    
    // First, test basic table access
    const { data: testData, error: testError } = await supabase
      .from('customers')
      .select('id, name')
      .limit(1);
    
    if (testError) {
      console.error('❌ Cannot access customers table:', testError);
      return { success: false, error: testError, message: 'Cannot access customers table' };
    }
    
    console.log('✅ Customers table is accessible');
    
    // If a specific customer ID is provided, test finding that customer
    if (customerId) {
      console.log('🔍 Testing access to specific customer:', customerId);
      
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id, name')
        .eq('id', customerId)
        .single();
      
      if (customerError) {
        console.error('❌ Cannot find specific customer:', customerError);
        return { success: false, error: customerError, message: `Cannot find customer with ID: ${customerId}` };
      }
      
      if (!customer) {
        console.error('❌ Customer not found in database');
        return { success: false, message: `Customer with ID ${customerId} not found in database` };
      }
      
      console.log('✅ Customer found:', customer);
      return { success: true, customer };
    }
    
    return { success: true, message: 'Customers table is accessible' };
  } catch (error) {
    console.error('❌ Test failed with exception:', error);
    return { success: false, error, message: 'Test failed with exception' };
  }
} 

// Background search system
interface SearchJob {
  id: string;
  query: string;
  page: number;
  pageSize: number;
  timestamp: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

class BackgroundSearchManager {
  private searchQueue: Map<string, SearchJob> = new Map();
  private isProcessing = false;
  private searchWorkers: Set<string> = new Set();
  private maxConcurrentSearches = 3;
  private searchCallbacks: Map<string, Set<(result: any) => void>> = new Map();

  // Add a search job to the queue
  addSearchJob(query: string, page: number = 1, pageSize: number = 50): string {
    const jobId = `${query}_${page}_${pageSize}_${Date.now()}`;
    
    const job: SearchJob = {
      id: jobId,
      query,
      page,
      pageSize,
      timestamp: Date.now(),
      status: 'pending'
    };

    this.searchQueue.set(jobId, job);
    console.log(`🔍 Added search job: ${jobId} (query: "${query}")`);
    
    // Start processing if not already running
    this.processQueue();
    
    return jobId;
  }

  // Subscribe to search results
  subscribeToSearch(jobId: string, callback: (result: any) => void): () => void {
    if (!this.searchCallbacks.has(jobId)) {
      this.searchCallbacks.set(jobId, new Set());
    }
    
    this.searchCallbacks.get(jobId)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.searchCallbacks.get(jobId);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.searchCallbacks.delete(jobId);
        }
      }
    };
  }

  // Process the search queue
  private async processQueue() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    while (this.searchQueue.size > 0 && this.searchWorkers.size < this.maxConcurrentSearches) {
      const pendingJobs = Array.from(this.searchQueue.values())
        .filter(job => job.status === 'pending')
        .sort((a, b) => a.timestamp - b.timestamp);

      if (pendingJobs.length === 0) break;

      const job = pendingJobs[0];
      this.processSearchJob(job);
    }
    
    this.isProcessing = false;
  }

  // Process a single search job
  private async processSearchJob(job: SearchJob) {
    this.searchWorkers.add(job.id);
    job.status = 'processing';
    
    console.log(`⚡ Processing search job: ${job.id} (query: "${job.query}")`);
    
    try {
      // Perform the actual search
      const result = await this.performSearch(job.query, job.page, job.pageSize);
      
      job.status = 'completed';
      job.result = result;
      
      console.log(`✅ Search job completed: ${job.id} (${result.customers.length} results)`);
      
      // Notify subscribers
      this.notifySubscribers(job.id, result);
      
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Unknown error';
      
      console.error(`❌ Search job failed: ${job.id}`, error);
      
      // Notify subscribers of error
      this.notifySubscribers(job.id, { error: job.error });
    } finally {
      this.searchWorkers.delete(job.id);
      
      // Clean up completed jobs after some time
      setTimeout(() => {
        this.searchQueue.delete(job.id);
      }, 60000); // Keep for 1 minute
      
      // Continue processing queue
      this.processQueue();
    }
  }

  // Perform the actual search operation
  private async performSearch(query: string, page: number, pageSize: number) {
    if (navigator.onLine) {
      // Calculate offset
      const offset = (page - 1) * pageSize;
      
      // Build optimized search query
      let supabaseQuery = supabase
        .from('customers')
        .select(`
          id, name, email, phone, gender, city, joined_date, loyalty_level, color_tag, 
          total_spent, points, last_visit, is_active, whatsapp, referral_source
        `, { count: 'exact' });
      
      // Apply search filters
      if (query.trim()) {
        const searchQuery = query.trim();
        
        if (searchQuery.length >= 3) {
          supabaseQuery = supabaseQuery.or(
            `name.ilike.%${searchQuery}%,` +
            `phone.ilike.%${searchQuery}%,` +
            `email.ilike.%${searchQuery}%,` +
            `city.ilike.%${searchQuery}%`
          );
        } else {
          supabaseQuery = supabaseQuery.or(
            `name.ilike.%${searchQuery}%,` +
            `phone.ilike.%${searchQuery}%,` +
            `email.ilike.%${searchQuery}%,` +
            `city.ilike.%${searchQuery}%,` +
            `loyalty_level.ilike.%${searchQuery}%,` +
            `color_tag.ilike.%${searchQuery}%`
          );
        }
      }
      
      // Apply pagination and ordering
      const { data: customers, error: customersError, count } = await supabaseQuery
        .range(offset, offset + pageSize - 1)
        .order('name', { ascending: true });
      
      if (customersError) {
        throw customersError;
      }
      
      // Transform customers with minimal data processing
      const customersWithData = (customers || []).map((customer: any) => {
        const baseCustomer = fromDbCustomer(customer);
        
        return {
          ...baseCustomer,
          points: customer.points || baseCustomer.points || 0,
          loyaltyTier: customer.loyalty_level || 'bronze',
          loyaltyJoinDate: customer.joined_date ? new Date(customer.joined_date) : baseCustomer.joinedDate,
          loyaltyLastVisit: customer.last_visit ? new Date(customer.last_visit) : baseCustomer.lastVisit,
          loyaltyRewardsRedeemed: 0,
          loyaltyTotalSpent: customer.total_spent || baseCustomer.totalSpent || 0,
          isLoyaltyMember: !!customer.points,
          notes: [],
          payments: [],
          promoHistory: [],
          devices: []
        };
      });

      return {
        customers: customersWithData,
        totalCount: count || 0,
        currentPage: page,
        totalPages: Math.ceil((count || 0) / pageSize),
        hasNextPage: page * pageSize < (count || 0),
        hasPreviousPage: page > 1,
        searchQuery: query
      };
    } else {
      // Offline mode
      const allCustomers = await cacheGetAll('customers');
      const filteredCustomers = query.trim() 
        ? allCustomers.filter(customer => {
            const searchQuery = query.toLowerCase().trim();
            const searchableFields = [
              customer.name,
              customer.phone,
              customer.city,
              customer.email,
              customer.loyaltyLevel,
              customer.colorTag
            ].filter(Boolean);
            
            return searchableFields.some(field => 
              field.toLowerCase().includes(searchQuery)
            );
          })
        : allCustomers;
      
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);
      
      return {
        customers: paginatedCustomers,
        totalCount: filteredCustomers.length,
        currentPage: page,
        totalPages: Math.ceil(filteredCustomers.length / pageSize),
        hasNextPage: endIndex < filteredCustomers.length,
        hasPreviousPage: page > 1,
        searchQuery: query
      };
    }
  }

  // Notify all subscribers of a job result
  private notifySubscribers(jobId: string, result: any) {
    const callbacks = this.searchCallbacks.get(jobId);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(result);
        } catch (error) {
          console.error('Error in search callback:', error);
        }
      });
    }
  }

  // Get job status
  getJobStatus(jobId: string): SearchJob | null {
    return this.searchQueue.get(jobId) || null;
  }

  // Cancel a search job
  cancelSearchJob(jobId: string): boolean {
    const job = this.searchQueue.get(jobId);
    if (job && job.status === 'pending') {
      this.searchQueue.delete(jobId);
      this.searchCallbacks.delete(jobId);
      console.log(`🚫 Cancelled search job: ${jobId}`);
      return true;
    }
    return false;
  }

  // Get queue statistics
  getQueueStats() {
    const jobs = Array.from(this.searchQueue.values());
    return {
      totalJobs: jobs.length,
      pendingJobs: jobs.filter(j => j.status === 'pending').length,
      processingJobs: jobs.filter(j => j.status === 'processing').length,
      completedJobs: jobs.filter(j => j.status === 'completed').length,
      failedJobs: jobs.filter(j => j.status === 'failed').length,
      activeWorkers: this.searchWorkers.size,
      maxWorkers: this.maxConcurrentSearches
    };
  }

  // Clear all jobs
  clearAllJobs() {
    this.searchQueue.clear();
    this.searchCallbacks.clear();
    this.searchWorkers.clear();
    console.log('🧹 Cleared all search jobs');
  }
}

// Global background search manager instance
const backgroundSearchManager = new BackgroundSearchManager();

// Background search function
export async function searchCustomersBackground(
  query: string, 
  page: number = 1, 
  pageSize: number = 50,
  onProgress?: (status: string) => void,
  onComplete?: (result: any) => void,
  onError?: (error: string) => void
): Promise<string> {
  
  // Check cache first for immediate results
  const cacheKey = getCacheKey(query, page, pageSize);
  const cached = searchCache.get(cacheKey);
  
  if (cached && isCacheValid(cached.timestamp)) {
    console.log(`⚡ Cache hit for background search: "${query}" (page ${page})`);
    onComplete?.(cached.data);
    return `cache_${cacheKey}`;
  }

  // Add job to background queue
  const jobId = backgroundSearchManager.addSearchJob(query, page, pageSize);
  
  // Subscribe to job updates
  const unsubscribe = backgroundSearchManager.subscribeToSearch(jobId, (result) => {
    if (result.error) {
      onError?.(result.error);
    } else {
      // Cache the result
      searchCache.set(cacheKey, {
        data: result,
        timestamp: Date.now()
      });
      
      onComplete?.(result);
    }
  });

  // Monitor job status
  const statusInterval = setInterval(() => {
    const job = backgroundSearchManager.getJobStatus(jobId);
    if (job) {
      onProgress?.(job.status);
      
      if (job.status === 'completed' || job.status === 'failed') {
        clearInterval(statusInterval);
        unsubscribe();
      }
    } else {
      clearInterval(statusInterval);
      unsubscribe();
    }
  }, 100);

  return jobId;
}

// Get background search manager instance
export function getBackgroundSearchManager() {
  return backgroundSearchManager;
} 

// Add a simple test function to debug the 400 error
export async function testCustomerQuery() {
  try {
    console.log('🔍 Testing basic customer query...');
    
    // First, try a very simple query
    const { data: simpleData, error: simpleError } = await supabase
      .from('customers')
      .select('id, name')
      .limit(1);
    
    if (simpleError) {
      console.error('❌ Simple query failed:', simpleError);
      return { success: false, error: simpleError, type: 'simple' };
    }
    
    console.log('✅ Simple query succeeded:', simpleData);
    
    // Now try with customer_notes
    const { data: notesData, error: notesError } = await supabase
      .from('customers')
      .select('id, name, customer_notes(*)')
      .limit(1);
    
    if (notesError) {
      console.error('❌ Notes query failed:', notesError);
      return { success: false, error: notesError, type: 'notes' };
    }
    
    console.log('✅ Notes query succeeded:', notesData);
    
    // Now try with customer_payments
    const { data: paymentsData, error: paymentsError } = await supabase
      .from('customers')
      .select('id, name, customer_payments(*)')
      .limit(1);
    
    if (paymentsError) {
      console.error('❌ Payments query failed:', paymentsError);
      return { success: false, error: paymentsError, type: 'payments' };
    }
    
    console.log('✅ Payments query succeeded:', paymentsData);
    
    // Now try with devices
    const { data: devicesData, error: devicesError } = await supabase
      .from('customers')
      .select('id, name, devices(*)')
      .limit(1);
    
    if (devicesError) {
      console.error('❌ Devices query failed:', devicesError);
      return { success: false, error: devicesError, type: 'devices' };
    }
    
    console.log('✅ Devices query succeeded:', devicesData);
    
    // Now try with promo_messages
    const { data: promoData, error: promoError } = await supabase
      .from('customers')
      .select('id, name, promo_messages(*)')
      .limit(1);
    
    if (promoError) {
      console.error('❌ Promo messages query failed:', promoError);
      return { success: false, error: promoError, type: 'promo' };
    }
    
    console.log('✅ Promo messages query succeeded:', promoData);
    
    return { success: true, type: 'all' };
    
  } catch (error) {
    console.error('❌ Test query failed:', error);
    return { success: false, error, type: 'exception' };
  }
}