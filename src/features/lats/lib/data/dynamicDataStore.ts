import { create } from 'zustand';

// Types for dynamic data
export interface SaleTransaction {
  id: string;
  customerId: string;
  customerName: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  total: number;
  paymentMethod: string;
  date: string;
  cashier: string;
  status: 'completed' | 'pending' | 'failed';
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  points: number;
  tier: 'Bronze' | 'Silver' | 'Gold' | 'VIP';
  totalSpent: number;
  orders: number;
  lastPurchase: string;
  status: 'active' | 'inactive';
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  brand: string;
  price: number;
  cost: number;
  currentStock: number;
  minStock: number;
  maxStock: number;
  status: 'active' | 'inactive';
  featured: boolean;
}

export interface Payment {
  id: string;
  transactionId: string;
  customerName: string;
  amount: number;
  method: string;
  reference: string;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  cashier: string;
  fees: number;
  netAmount: number;
}

// Initial demo data
const initialData = {
  sales: [
    {
      id: '1',
      customerId: '1',
      customerName: 'Mike Johnson',
      items: [
        { productId: '1', productName: 'iPhone 14 Pro', quantity: 1, price: 159999, total: 159999 }
      ],
      total: 159999,
      paymentMethod: 'M-Pesa',
      date: '2024-01-15T10:30:00',
      cashier: 'John Cashier',
      status: 'completed' as const
    },
    {
      id: '2',
      customerId: '2',
      customerName: 'David Brown',
      items: [
        { productId: '3', productName: 'MacBook Pro 14"', quantity: 1, price: 299999, total: 299999 }
      ],
      total: 299999,
      paymentMethod: 'Card',
      date: '2024-01-15T14:15:00',
      cashier: 'Jane Cashier',
      status: 'completed' as const
    },
    {
      id: '3',
      customerId: '3',
      customerName: 'John Doe',
      items: [
        { productId: '2', productName: 'Samsung Galaxy S23', quantity: 1, price: 129999, total: 129999 }
      ],
      total: 129999,
      paymentMethod: 'Cash',
      date: '2024-01-15T16:45:00',
      cashier: 'John Cashier',
      status: 'completed' as const
    }
  ],
  customers: [
    {
      id: '1',
      name: 'Mike Johnson',
      phone: '+254722345678',
      email: 'mike.johnson@email.com',
      points: 2100,
      tier: 'VIP' as const,
      totalSpent: 780000,
      orders: 12,
      lastPurchase: '2024-01-15',
      status: 'active' as const
    },
    {
      id: '2',
      name: 'David Brown',
      phone: '+254744567890',
      email: 'david.brown@email.com',
      points: 3200,
      tier: 'VIP' as const,
      totalSpent: 1200000,
      orders: 18,
      lastPurchase: '2024-01-14',
      status: 'active' as const
    },
    {
      id: '3',
      name: 'John Doe',
      phone: '+254700123456',
      email: 'john.doe@email.com',
      points: 1250,
      tier: 'Gold' as const,
      totalSpent: 450000,
      orders: 8,
      lastPurchase: '2024-01-13',
      status: 'active' as const
    }
  ],
  products: [
    {
      id: '1',
      name: 'iPhone 14 Pro',
      sku: 'IPH14P-128',
      category: 'Smartphones',
      brand: 'Apple',
      price: 159999,
      cost: 120000,
      currentStock: 5,
      minStock: 10,
      maxStock: 50,
      status: 'active' as const,
      featured: true
    },
    {
      id: '2',
      name: 'Samsung Galaxy S23',
      sku: 'SAMS23-256',
      category: 'Smartphones',
      brand: 'Samsung',
      price: 129999,
      cost: 95000,
      currentStock: 12,
      minStock: 8,
      maxStock: 40,
      status: 'active' as const,
      featured: false
    },
    {
      id: '3',
      name: 'MacBook Pro 14"',
      sku: 'MBP14-512',
      category: 'Laptops',
      brand: 'Apple',
      price: 299999,
      cost: 250000,
      currentStock: 3,
      minStock: 5,
      maxStock: 20,
      status: 'active' as const,
      featured: true
    },
    {
      id: '4',
      name: 'AirPods Pro',
      sku: 'AIRPODS-PRO',
      category: 'Accessories',
      brand: 'Apple',
      price: 45999,
      cost: 35000,
      currentStock: 25,
      minStock: 15,
      maxStock: 100,
      status: 'active' as const,
      featured: true
    },
    {
      id: '5',
      name: 'Dell XPS 13',
      sku: 'DELLXPS13-512',
      category: 'Laptops',
      brand: 'Dell',
      price: 189999,
      cost: 150000,
      currentStock: 8,
      minStock: 5,
      maxStock: 25,
      status: 'active' as const,
      featured: false
    },
    {
      id: '6',
      name: 'Samsung Galaxy Watch',
      sku: 'SAMSGW-44',
      category: 'Wearables',
      brand: 'Samsung',
      price: 35999,
      cost: 28000,
      currentStock: 15,
      minStock: 10,
      maxStock: 50,
      status: 'active' as const,
      featured: false
    }
  ],
  payments: [
    {
      id: '1',
      transactionId: 'TXN-001234',
      customerName: 'Mike Johnson',
      amount: 159999,
      method: 'M-Pesa',
      reference: 'MPESA-123456789',
      status: 'completed' as const,
      date: '2024-01-15T10:30:00',
      cashier: 'John Cashier',
      fees: 0,
      netAmount: 159999
    },
    {
      id: '2',
      transactionId: 'TXN-001235',
      customerName: 'David Brown',
      amount: 299999,
      method: 'Card',
      reference: 'CARD-987654321',
      status: 'completed' as const,
      date: '2024-01-15T14:15:00',
      cashier: 'Jane Cashier',
      fees: 6000,
      netAmount: 293999
    },
    {
      id: '3',
      transactionId: 'TXN-001236',
      customerName: 'John Doe',
      amount: 129999,
      method: 'Cash',
      reference: 'CASH-001',
      status: 'completed' as const,
      date: '2024-01-15T16:45:00',
      cashier: 'John Cashier',
      fees: 0,
      netAmount: 129999
    }
  ]
};

interface DynamicDataStore {
  // Data
  sales: SaleTransaction[];
  customers: Customer[];
  products: Product[];
  payments: Payment[];
  
  // Actions
  addSale: (sale: SaleTransaction) => void;
  addCustomer: (customer: Customer) => void;
  updateProduct: (productId: string, updates: Partial<Product>) => void;
  addPayment: (payment: Payment) => void;
  updateCustomerPoints: (customerId: string, points: number) => void;
  updateProductStock: (productId: string, quantity: number) => void;
  
  // Computed values
  getTotalRevenue: () => number;
  getTotalSales: () => number;
  getTotalCustomers: () => number;
  getTotalProducts: () => number;
  getLowStockProducts: () => Product[];
  getTopCustomers: () => Customer[];
  getTopProducts: () => Product[];
  getDailySales: (days: number) => Array<{ date: string; sales: number; transactions: number }>;
  getPaymentMethods: () => Array<{ method: string; count: number; total: number }>;
}

export const useDynamicDataStore = create<DynamicDataStore>((set, get) => ({
  // Initial data
  ...initialData,

  // Actions
  addSale: (sale) => {
    set((state) => {
      const newSales = [...state.sales, sale];
      
      // Update customer data
      const updatedCustomers = state.customers.map(customer => {
        if (customer.id === sale.customerId) {
          const pointsEarned = Math.floor(sale.total / 1000); // 1 point per 1000 KES
          return {
            ...customer,
            totalSpent: customer.totalSpent + sale.total,
            orders: customer.orders + 1,
            points: customer.points + pointsEarned,
            lastPurchase: sale.date.split('T')[0]
          };
        }
        return customer;
      });

      // Update product stock
      const updatedProducts = state.products.map(product => {
        const soldItem = sale.items.find(item => item.productId === product.id);
        if (soldItem) {
          return {
            ...product,
            currentStock: Math.max(0, product.currentStock - soldItem.quantity)
          };
        }
        return product;
      });

      return {
        sales: newSales,
        customers: updatedCustomers,
        products: updatedProducts
      };
    });
  },

  addCustomer: (customer) => {
    set((state) => ({
      customers: [...state.customers, customer]
    }));
  },

  updateProduct: (productId, updates) => {
    set((state) => ({
      products: state.products.map(product =>
        product.id === productId ? { ...product, ...updates } : product
      )
    }));
  },

  addPayment: (payment) => {
    set((state) => ({
      payments: [...state.payments, payment]
    }));
  },

  updateCustomerPoints: (customerId, points) => {
    set((state) => ({
      customers: state.customers.map(customer =>
        customer.id === customerId ? { ...customer, points } : customer
      )
    }));
  },

  updateProductStock: (productId, quantity) => {
    set((state) => ({
      products: state.products.map(product =>
        product.id === productId 
          ? { ...product, currentStock: Math.max(0, product.currentStock + quantity) }
          : product
      )
    }));
  },

  // Computed values
  getTotalRevenue: () => {
    const { sales } = get();
    return sales.reduce((total, sale) => total + sale.total, 0);
  },

  getTotalSales: () => {
    const { sales } = get();
    return sales.length;
  },

  getTotalCustomers: () => {
    const { customers } = get();
    return customers.length;
  },

  getTotalProducts: () => {
    const { products } = get();
    return products.length;
  },

  getLowStockProducts: () => {
    const { products } = get();
    return products.filter(product => product.currentStock <= product.minStock);
  },

  getTopCustomers: () => {
    const { customers } = get();
    return customers
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);
  },

  getTopProducts: () => {
    const { products } = get();
    return products
      .sort((a, b) => (b.price * b.currentStock) - (a.price * a.currentStock))
      .slice(0, 5);
  },

  getDailySales: (days = 7) => {
    const { sales } = get();
    const today = new Date();
    const dailyData: { [key: string]: { sales: number; transactions: number } } = {};

    // Initialize last 7 days
    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyData[dateStr] = { sales: 0, transactions: 0 };
    }

    // Aggregate sales data
    sales.forEach(sale => {
      const saleDate = sale.date.split('T')[0];
      if (dailyData[saleDate]) {
        dailyData[saleDate].sales += sale.total;
        dailyData[saleDate].transactions += 1;
      }
    });

    return Object.entries(dailyData)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },

  getPaymentMethods: () => {
    const { payments } = get();
    const methodMap = new Map<string, { count: number; total: number }>();

    payments.forEach(payment => {
      const existing = methodMap.get(payment.method) || { count: 0, total: 0 };
      methodMap.set(payment.method, {
        count: existing.count + 1,
        total: existing.total + payment.amount
      });
    });

    return Array.from(methodMap.entries()).map(([method, data]) => ({
      method,
      ...data
    }));
  }
}));

// Helper function to simulate a sale (for testing)
export const simulateSale = (customerId: string, items: Array<{ productId: string; quantity: number }>) => {
  const store = useDynamicDataStore.getState();
  
  // Get customer and products
  const customer = store.customers.find(c => c.id === customerId);
  if (!customer) return;

  const saleItems = items.map(item => {
    const product = store.products.find(p => p.id === item.productId);
    if (!product) throw new Error(`Product ${item.productId} not found`);
    
    return {
      productId: item.productId,
      productName: product.name,
      quantity: item.quantity,
      price: product.price,
      total: product.price * item.quantity
    };
  });

  const total = saleItems.reduce((sum, item) => sum + item.total, 0);

  const sale: SaleTransaction = {
    id: `sale-${Date.now()}`,
    customerId,
    customerName: customer.name,
    items: saleItems,
    total,
    paymentMethod: 'M-Pesa',
    date: new Date().toISOString(),
    cashier: 'John Cashier',
    status: 'completed'
  };

  const payment: Payment = {
    id: `payment-${Date.now()}`,
    transactionId: `TXN-${Date.now()}`,
    customerName: customer.name,
    amount: total,
    method: 'M-Pesa',
    reference: `MPESA-${Date.now()}`,
    status: 'completed',
    date: new Date().toISOString(),
    cashier: 'John Cashier',
    fees: 0,
    netAmount: total
  };

  // Add sale and payment
  store.addSale(sale);
  store.addPayment(payment);
};

// Helper function to initialize test data with more comprehensive data
export const initializeTestData = () => {
  const store = useDynamicDataStore.getState();
  
  // Add some historical sales for better analytics
  const historicalSales: SaleTransaction[] = [
    {
      id: 'hist-1',
      customerId: '1',
      customerName: 'Mike Johnson',
      items: [{ productId: '4', productName: 'AirPods Pro', quantity: 1, price: 45999, total: 45999 }],
      total: 45999,
      paymentMethod: 'Card',
      date: '2024-01-14T09:30:00',
      cashier: 'Jane Cashier',
      status: 'completed'
    },
    {
      id: 'hist-2',
      customerId: '2',
      customerName: 'David Brown',
      items: [{ productId: '5', productName: 'Dell XPS 13', quantity: 1, price: 189999, total: 189999 }],
      total: 189999,
      paymentMethod: 'Bank Transfer',
      date: '2024-01-13T15:20:00',
      cashier: 'John Cashier',
      status: 'completed'
    },
    {
      id: 'hist-3',
      customerId: '3',
      customerName: 'John Doe',
      items: [{ productId: '6', productName: 'Samsung Galaxy Watch', quantity: 1, price: 35999, total: 35999 }],
      total: 35999,
      paymentMethod: 'Cash',
      date: '2024-01-12T11:45:00',
      cashier: 'Jane Cashier',
      status: 'completed'
    }
  ];

  // Add historical payments
  const historicalPayments: Payment[] = [
    {
      id: 'hist-pay-1',
      transactionId: 'TXN-HIST-001',
      customerName: 'Mike Johnson',
      amount: 45999,
      method: 'Card',
      reference: 'CARD-HIST-001',
      status: 'completed',
      date: '2024-01-14T09:30:00',
      cashier: 'Jane Cashier',
      fees: 920,
      netAmount: 45079
    },
    {
      id: 'hist-pay-2',
      transactionId: 'TXN-HIST-002',
      customerName: 'David Brown',
      amount: 189999,
      method: 'Bank Transfer',
      reference: 'BANK-HIST-001',
      status: 'completed',
      date: '2024-01-13T15:20:00',
      cashier: 'John Cashier',
      fees: 1000,
      netAmount: 188999
    },
    {
      id: 'hist-pay-3',
      transactionId: 'TXN-HIST-003',
      customerName: 'John Doe',
      amount: 35999,
      method: 'Cash',
      reference: 'CASH-HIST-001',
      status: 'completed',
      date: '2024-01-12T11:45:00',
      cashier: 'Jane Cashier',
      fees: 0,
      netAmount: 35999
    }
  ];

  // Add historical data to the store
  historicalSales.forEach(sale => store.addSale(sale));
  historicalPayments.forEach(payment => store.addPayment(payment));
};

// Export types for use in components
export type { SaleTransaction, Customer, Product, Payment };
