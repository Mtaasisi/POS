// Mock data provider for development when Supabase is unavailable
export const mockDataProvider = {
  // Mock categories for inventory
  categories: [
    { id: '1', name: 'Phone Parts', description: 'Mobile phone components', color: '#3B82F6', is_active: true },
    { id: '2', name: 'Laptop Parts', description: 'Laptop components', color: '#10B981', is_active: true },
    { id: '3', name: 'Accessories', description: 'Device accessories', color: '#8B5CF6', is_active: true },
    { id: '4', name: 'Screens', description: 'Device screens and displays', color: '#F59E0B', is_active: true },
    { id: '5', name: 'Batteries', description: 'Device batteries', color: '#EF4444', is_active: true }
  ],

  // Mock suppliers for inventory
  suppliers: [
    { 
      id: '1', 
      name: 'TechParts Tanzania', 
      contact_person: 'John Doe', 
      email: 'john@techparts.co.tz', 
      phone: '+255712345678', 
      address: 'Dar es Salaam', 
      city: 'Dar es Salaam', 
      country: 'Tanzania', 
      payment_terms: 'Net 30', 
      lead_time_days: 7, 
      is_active: true 
    },
    { 
      id: '2', 
      name: 'Mobile Solutions Ltd', 
      contact_person: 'Jane Smith', 
      email: 'jane@mobile.co.tz', 
      phone: '+255723456789', 
      address: 'Arusha', 
      city: 'Arusha', 
      country: 'Tanzania', 
      payment_terms: 'Net 15', 
      lead_time_days: 5, 
      is_active: true 
    },
    { 
      id: '3', 
      name: 'Global Electronics', 
      contact_person: 'Mike Johnson', 
      email: 'mike@global.co.tz', 
      phone: '+255734567890', 
      address: 'Mwanza', 
      city: 'Mwanza', 
      country: 'Tanzania', 
      payment_terms: 'COD', 
      lead_time_days: 3, 
      is_active: true 
    }
  ],

  // Mock products for inventory
  products: [
    {
      id: '1',
      name: 'iPhone 14 Screen',
      description: 'Original iPhone 14 replacement screen',
      brand: 'Apple',
      model: 'iPhone 14',
      category_id: '4',
      supplier_id: '1',
      cost_price: 150000,
      selling_price: 250000,
      quantity_in_stock: 5,
      weight_kg: 0.2,
      dimensions_cm: '15x8x0.1',
      is_active: true,
      created_at: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      name: 'Samsung Galaxy Battery',
      description: 'Replacement battery for Samsung Galaxy series',
      brand: 'Samsung',
      model: 'Galaxy S23',
      category_id: '5',
      supplier_id: '2',
      cost_price: 45000,
      selling_price: 75000,
      quantity_in_stock: 12,
      weight_kg: 0.05,
      dimensions_cm: '7x4x0.3',
      is_active: true,
      created_at: '2024-01-16T14:30:00Z'
    }
  ],

  // Mock customers
  customers: [
    {
      id: '6157eab7-1454-49fe-86e9-8656c7eed7f2',
      name: 'John Smith',
      email: 'john@example.com',
      phone: '+255712345678',
      points: 150,
      created_at: '2024-01-01T00:00:00Z',
      isRead: false
    },
    {
      id: '72bf7844-ee4c-4ed9-85d5-0f1d2e76780f',
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '+255723456789',
      points: 75,
      created_at: '2024-01-02T00:00:00Z',
      isRead: true
    }
  ],

  // Mock devices
  devices: [
    {
      id: '1',
      customer_id: '6157eab7-1454-49fe-86e9-8656c7eed7f2',
      brand: 'Apple',
      model: 'iPhone 14',
      problem: 'Broken screen',
      status: 'in_progress',
      created_at: '2024-01-15T10:00:00Z',
      expectedReturnDate: '2024-01-20T00:00:00Z'
    }
  ],

  // Mock settings
  settings: [
    { key: 'company_name', value: 'LATS CHANCE Repair Shop' },
    { key: 'currency', value: 'TZS' },
    { key: 'timezone', value: 'Africa/Dar_es_Salaam' }
  ],

  // Mock auth users
  auth_users: [
    {
      id: '1',
      email: 'admin@latschance.co.tz',
      name: 'Admin User',
      role: 'admin'
    },
    {
      id: '2',
      email: 'customer@latschance.co.tz',
      name: 'Customer Care',
      role: 'customer-care'
    }
  ]
};

// Helper function to simulate API delays
export const simulateApiDelay = (ms: number = 500) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Mock API functions that return the mock data
export const mockApi = {
  async getCategories() {
    await simulateApiDelay();
    return mockDataProvider.categories;
  },

  async getSuppliers() {
    await simulateApiDelay();
    return mockDataProvider.suppliers;
  },

  async getProducts() {
    await simulateApiDelay();
    return mockDataProvider.products;
  },

  async getCustomers() {
    await simulateApiDelay();
    return mockDataProvider.customers;
  },

  async getDevices() {
    await simulateApiDelay();
    return mockDataProvider.devices;
  },

  async getSettings() {
    await simulateApiDelay();
    return mockDataProvider.settings;
  },

  async getAuthUsers() {
    await simulateApiDelay();
    return mockDataProvider.auth_users;
  }
}; 