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

// Initial empty data
const initialData = {
  sales: [],
  customers: [],
  products: [],
  payments: []
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
    cashier: 'POS User',
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
    cashier: 'POS User',
    fees: 0,
    netAmount: total
  };

  // Add sale and payment
  store.addSale(sale);
  store.addPayment(payment);
};

// Note: Test data initialization removed - use real database data instead

// Export types for use in components
export type { SaleTransaction, Customer, Product, Payment };
