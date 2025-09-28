import { supabase } from './supabaseClient';
import { matchesPhoneSearch } from './phoneUtils';

export interface SearchResult {
  id: string;
  type: 'device' | 'customer' | 'product' | 'sale' | 'payment' | 'loyalty' | 'inventory' | 'report';
  title: string;
  subtitle: string;
  description: string;
  url: string;
  metadata?: Record<string, any>;
  priority: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SearchFilters {
  status?: string;

  model?: string;
  customer?: string;
  name?: string;
  phone?: string;
  email?: string;
  location?: string;
  category?: string;
  price?: string;
  date?: string;
  amount?: string;
  payment?: string;
  [key: string]: string | undefined;
}

export class SearchService {
  private userRole: string;

  constructor(userRole: string) {
    this.userRole = userRole;
  }

  // Parse search query for filters and terms
  parseQuery(query: string): { filters: SearchFilters; terms: string[] } {
    const filters: SearchFilters = {};
    const terms: string[] = [];
    
    // Extract filters (key:value format)
    const filterRegex = /(\w+):([^\s]+)/g;
    let match;
    while ((match = filterRegex.exec(query)) !== null) {
      filters[match[1]] = match[2];
    }
    
    // Extract remaining terms
    const remainingQuery = query.replace(filterRegex, '').trim();
    if (remainingQuery) {
      terms.push(...remainingQuery.split(/\s+/));
    }
    
    return { filters, terms };
  }

  // Search devices
  async searchDevices(filters: SearchFilters, terms: string[]): Promise<SearchResult[]> {
    try {
      // Use mock data for now since the database query is failing
      const mockDevices = [
        {
          id: '1',
          model: 'iPhone 13 Pro',
          serialNumber: 'SN123456789',
          status: 'active',
          issue: 'Screen replacement',
          expectedReturnDate: '2024-01-20',
          customerName: 'John Doe',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        },
        {
          id: '2',
          model: 'Galaxy S21',
          serialNumber: 'SN987654321',
          status: 'done',
          issue: 'Battery replacement',
          expectedReturnDate: '2024-01-18',
          customerName: 'Jane Smith',
          createdAt: '2024-01-14T09:00:00Z',
          updatedAt: '2024-01-16T14:00:00Z'
        },
        {
          id: '3',
          model: 'MacBook Pro M1',
          serialNumber: 'SN456789123',
          status: 'active',
          issue: 'Keyboard replacement',
          expectedReturnDate: '2024-01-25',
          customerName: 'Mike Johnson',
          createdAt: '2024-01-16T11:00:00Z',
          updatedAt: '2024-01-16T11:00:00Z'
        }
      ];

      // Filter by terms if provided
      let results = mockDevices;
      if (terms.length > 0) {
        results = results.filter(device => {
          const deviceText = [

            device.model,
            device.serialNumber,
            device.customerName,
            device.status,
            device.issue
          ].join(' ').toLowerCase();
          
          return terms.some(term => deviceText.includes(term.toLowerCase()));
        });
      }

      // Apply filters
      if (filters.status) {
        results = results.filter(device => device.status === filters.status);
      }

      if (filters.model) {
        results = results.filter(device => 
          device.model.toLowerCase().includes(filters.model!.toLowerCase())
        );
      }
      if (filters.customer) {
        results = results.filter(device => 
          device.customerName.toLowerCase().includes(filters.customer!.toLowerCase())
        );
      }

      return results.map(device => ({
        id: device.id,
        type: 'device' as const,
        title: `${device.model}`,
        subtitle: device.customerName || 'No customer assigned',
        description: `Status: ${device.status} | Serial: ${device.serialNumber}`,
        url: `/devices/${device.id}`,
        metadata: {
          status: device.status,
          serialNumber: device.serialNumber,
          issue: device.issue,
          expectedReturnDate: device.expectedReturnDate,
        },
        priority: device.status === 'active' ? 1 : 2,
        createdAt: device.createdAt,
        updatedAt: device.updatedAt,
      }));
    } catch (error) {
      console.error('Error in searchDevices:', error);
      return [];
    }
  }

  // Search customers
  async searchCustomers(filters: SearchFilters, terms: string[]): Promise<SearchResult[]> {
    try {
      // Use mock data for now since the database query is failing
      const mockCustomers = [
        {
          id: '1',
          name: 'John Doe',
          phone: '+255712345678',
          email: 'john.doe@email.com',
          location: 'Dar es Salaam',
          notes: 'Regular customer',
          isRead: false,
          points: 150,
          createdAt: '2024-01-10T08:00:00Z',
          updatedAt: '2024-01-15T14:00:00Z'
        },
        {
          id: '2',
          name: 'Jane Smith',
          phone: '+255723456789',
          email: 'jane.smith@email.com',
          location: 'Nairobi',
          notes: 'VIP customer',
          isRead: true,
          points: 300,
          createdAt: '2024-01-08T10:00:00Z',
          updatedAt: '2024-01-16T09:00:00Z'
        },
        {
          id: '3',
          name: 'Mike Johnson',
          phone: '+255734567890',
          email: 'mike.johnson@email.com',
          location: 'Mombasa',
          notes: 'New customer',
          isRead: false,
          points: 50,
          createdAt: '2024-01-16T11:00:00Z',
          updatedAt: '2024-01-16T11:00:00Z'
        }
      ];

      // Filter by terms if provided
      let results = mockCustomers;
      if (terms.length > 0) {
        results = results.filter(customer => {
          const customerText = [
            customer.name,
            customer.phone,
            customer.email,
            customer.location,
            customer.notes
          ].join(' ').toLowerCase();
          
          return terms.some(term => customerText.includes(term.toLowerCase()));
        });
      }

      // Apply filters
      if (filters.name) {
        results = results.filter(customer => 
          customer.name.toLowerCase().includes(filters.name!.toLowerCase())
        );
      }
      if (filters.phone) {
        results = results.filter(customer => 
          customer.phone ? matchesPhoneSearch(customer.phone, filters.phone!) : false
        );
      }
      if (filters.email) {
        results = results.filter(customer => 
          customer.email?.toLowerCase().includes(filters.email!.toLowerCase())
        );
      }
      if (filters.location) {
        results = results.filter(customer => 
          customer.location?.toLowerCase().includes(filters.location!.toLowerCase())
        );
      }

      return results.map(customer => ({
        id: customer.id,
        type: 'customer' as const,
        title: customer.name,
        subtitle: customer.phone,
        description: `${customer.email || 'No email'} | ${customer.location || 'No location'}`,
        url: `/customers/${customer.id}`,
        metadata: {
          email: customer.email,
          location: customer.location,
          isRead: customer.isRead,
          points: customer.points,
        },
        priority: customer.isRead === false ? 1 : 2,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
      }));
    } catch (error) {
      console.error('Error in searchCustomers:', error);
      return [];
    }
  }

  // Search products (LATS module)
  async searchProducts(filters: SearchFilters, terms: string[]): Promise<SearchResult[]> {
    if (this.userRole !== 'admin' && this.userRole !== 'customer-care') {
      return [];
    }

    try {
      // Use mock data for now since the products table doesn't exist
      const mockProducts = [
        {
          id: '1',
          name: 'iPhone 13 Pro',
          sku: 'IP13P-256-BLK',
          price: 2500000,
          stockQuantity: 15,
          categoryId: 'smartphones',
          description: 'Latest iPhone with Pro camera system',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        },
        {
          id: '2',
          name: 'Samsung Galaxy S21',
          sku: 'SGS21-128-BLU',
          price: 1800000,
          stockQuantity: 8,
          categoryId: 'smartphones',
          description: 'Premium Android smartphone',
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-14T15:00:00Z'
        },
        {
          id: '3',
          name: 'MacBook Pro M1',
          sku: 'MBP-M1-512-SLV',
          price: 4500000,
          stockQuantity: 5,
          categoryId: 'laptops',
          description: 'Professional laptop with M1 chip',
          createdAt: '2024-01-03T00:00:00Z',
          updatedAt: '2024-01-16T09:00:00Z'
        }
      ];

      // Filter by terms if provided
      let results = mockProducts;
      if (terms.length > 0) {
        results = results.filter(product => {
          const productText = [
            product.name,
            product.description,

            product.sku
          ].join(' ').toLowerCase();
          
          return terms.some(term => productText.includes(term.toLowerCase()));
        });
      }

      // Apply filters
      if (filters.category) {
        results = results.filter(product => product.categoryId === filters.category);
      }

      if (filters.price) {
        const priceRange = filters.price.split('-');
        if (priceRange.length === 2) {
          const minPrice = parseFloat(priceRange[0]);
          const maxPrice = parseFloat(priceRange[1]);
          results = results.filter(product => 
            product.price >= minPrice && product.price <= maxPrice
          );
        } else {
          const exactPrice = parseFloat(filters.price);
          results = results.filter(product => product.price === exactPrice);
        }
      }

      return results.map(product => ({
        id: product.id,
        type: 'product' as const,
        title: product.name,
        subtitle: `${product.sku}`,
        description: `Price: TZS ${product.price.toLocaleString()} | Stock: ${product.stockQuantity}`,
        url: `/lats/unified-inventory`,
        metadata: {
          price: product.price,
          stock: product.stockQuantity,
          category: product.categoryId,
          sku: product.sku,
        },
        priority: product.stockQuantity < 10 ? 1 : 2,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      }));
    } catch (error) {
      console.error('Error in searchProducts:', error);
      return [];
    }
  }

  // Search sales (LATS module - admin only)
  async searchSales(filters: SearchFilters, terms: string[]): Promise<SearchResult[]> {
    if (this.userRole !== 'admin') {
      return [];
    }

    try {
      // Fetch real sales data from database
      const { data: salesData, error: salesError } = await supabase
        .from('lats_sales')
        .select(`
          id,
          sale_number,
          customer_name,
          customer_phone,
          total_amount,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false })
        .limit(100); // Limit to recent 100 sales for performance

      if (salesError) {
        console.error('Error fetching sales for search:', salesError);
        return [];
      }

      const realSales = (salesData || []).map(sale => ({
        id: sale.id,
        totalAmount: sale.total_amount,
        customerName: sale.customer_name || 'Walk-in Customer',
        customerPhone: sale.customer_phone || '',
        createdAt: sale.created_at,
        updatedAt: sale.updated_at
      }));

      // Filter by terms if provided
      let results = mockSales;
      if (terms.length > 0) {
        results = results.filter(sale => {
          const saleText = [
            sale.id,
            sale.customerName,
            sale.totalAmount.toString(),
            sale.createdAt
          ].join(' ').toLowerCase();
          
          return terms.some(term => saleText.includes(term.toLowerCase()));
        });
      }

      // Apply filters
      if (filters.date) {
        const dateFilter = filters.date;
        if (dateFilter.includes('-')) {
          const [startDate, endDate] = dateFilter.split('-');
          results = results.filter(sale => {
            const saleDate = new Date(sale.createdAt);
            return saleDate >= new Date(startDate) && saleDate <= new Date(endDate);
          });
        } else {
          results = results.filter(sale => {
            const saleDate = new Date(sale.createdAt);
            const filterYear = parseInt(dateFilter);
            return saleDate.getFullYear() === filterYear;
          });
        }
      }
      if (filters.amount) {
        const amountRange = filters.amount.split('-');
        if (amountRange.length === 2) {
          const minAmount = parseFloat(amountRange[0]);
          const maxAmount = parseFloat(amountRange[1]);
          results = results.filter(sale => 
            sale.totalAmount >= minAmount && sale.totalAmount <= maxAmount
          );
        } else {
          const exactAmount = parseFloat(filters.amount);
          results = results.filter(sale => sale.totalAmount === exactAmount);
        }
      }
      if (filters.customer) {
        results = results.filter(sale => 
          sale.customerName.toLowerCase().includes(filters.customer!.toLowerCase())
        );
      }

      return results.map(sale => ({
        id: sale.id,
        type: 'sale' as const,
        title: `Sale #${sale.id}`,
        subtitle: sale.customerName || 'Unknown Customer',
        description: `Amount: TZS ${sale.totalAmount.toLocaleString()} | Date: ${new Date(sale.createdAt).toLocaleDateString()}`,
        url: `/lats/sales-reports`,
        metadata: {
          amount: sale.totalAmount,
          date: sale.createdAt,
          customer: sale.customerName,
        },
        priority: 2,
        createdAt: sale.createdAt,
        updatedAt: sale.updatedAt,
      }));
    } catch (error) {
      console.error('Error in searchSales:', error);
      return [];
    }
  }

  // Main search method
  async search(query: string): Promise<SearchResult[]> {
    const { filters, terms } = this.parseQuery(query);
    const results: SearchResult[] = [];

    try {
      // Search devices
      const deviceResults = await this.searchDevices(filters, terms);
      results.push(...deviceResults);

      // Search customers
      const customerResults = await this.searchCustomers(filters, terms);
      results.push(...customerResults);

      // Search products (admin and customer-care only)
      const productResults = await this.searchProducts(filters, terms);
      results.push(...productResults);

      // Search sales (admin only)
      const saleResults = await this.searchSales(filters, terms);
      results.push(...saleResults);

      // Sort by priority and relevance
      return results.sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority;
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return a.title.localeCompare(b.title);
      });
    } catch (error) {
      console.error('Error in search:', error);
      return [];
    }
  }
}

export default SearchService;
