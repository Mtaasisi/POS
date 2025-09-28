import React, { useState, useRef } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { Customer } from '../../../types';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import Modal from '../../../features/shared/components/ui/Modal';
import { toast } from 'react-hot-toast';

interface CustomerUpdateData {
  id: string;
  name: string;
  email: string;
  phone: string;
  gender: 'male' | 'female' | 'other';
  city: string;
  whatsapp?: string;
  referral_source?: string;
  birth_month?: string;
  birth_day?: string;
  total_returns?: number;
  location_description?: string;
  national_id?: string;
  points?: number;
  total_spent?: number;
  loyalty_level?: string;
  color_tag?: string;
  customer_tag?: string;
  notes?: string;
  is_active?: boolean;
}

const CustomerDataUpdatePage: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerUpdateData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerUpdateData | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'points' | 'total_spent'>('name');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load customers from database
  const loadCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name')
        .limit(50000); // Fetch up to 50,000 customers instead of default 1000

      if (error) throw error;
      setCustomers(data || []);
      toast.success(`Loaded ${data?.length || 0} customers`);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  // Handle CSV file import
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string;
        const lines = csv.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const importedCustomers: CustomerUpdateData[] = [];

        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            const customer: any = {};
            headers.forEach((header, index) => {
              customer[header.toLowerCase().replace(/\s+/g, '_')] = values[index] || '';
            });
            importedCustomers.push(customer);
          }
        }

        setCustomers(importedCustomers);
        toast.success(`Imported ${importedCustomers.length} customers from CSV`);
      } catch (error) {
        console.error('Error parsing CSV:', error);
        toast.error('Failed to parse CSV file');
      }
    };
    reader.readAsText(file);
  };

  // Update customer in database
  const updateCustomer = async (customerData: CustomerUpdateData) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          name: customerData.name,
          email: customerData.email,
          phone: customerData.phone,
          gender: customerData.gender,
          city: customerData.city,
          whatsapp: customerData.whatsapp,
          referral_source: customerData.referral_source,
          birth_month: customerData.birth_month,
          birth_day: customerData.birth_day,
          total_returns: customerData.total_returns,
          location_description: customerData.location_description,
          national_id: customerData.national_id,
          points: customerData.points,
          total_spent: customerData.total_spent,
          loyalty_level: customerData.loyalty_level,
          color_tag: customerData.color_tag,
          customer_tag: customerData.customer_tag,
          notes: customerData.notes,
          is_active: customerData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerData.id);

      if (error) throw error;
      
      // Update local state
      setCustomers(prev => prev.map(c => 
        c.id === customerData.id ? customerData : c
      ));
      
      setShowEditModal(false);
      setSelectedCustomer(null);
      toast.success('Customer updated successfully');
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Failed to update customer');
    }
  };

  // Export customers to CSV
  const exportToCSV = () => {
    const headers = [
      'ID', 'Name', 'Email', 'Phone', 'Gender', 'City', 'WhatsApp', 'Referral Source', 'Birth Month', 'Birth Day', 'Total Returns', 'Initial Notes', 'Location Description', 'National ID', 'Points', 'Total Spent', 'Loyalty Level', 'Color Tag', 'Customer Tag', 'Notes', 'Is Active'
    ];
    const csvContent = [
      headers.join(','),
      ...customers.map(customer => [
        customer.id,
        `"${(customer.name || '').replace(/"/g, '""')}"`,
        `"${(customer.email || '').replace(/"/g, '""')}"`,
        `"${(customer.phone || '').replace(/"/g, '""')}"`,
        `"${(customer.gender || '').replace(/"/g, '""')}"`,
        `"${(customer.city || '').replace(/"/g, '""')}"`,
        `"${(customer.whatsapp || '').replace(/"/g, '""')}"`,
        `"${(customer.referral_source || '').replace(/"/g, '""')}"`,
        `"${(customer.birth_month || '').replace(/"/g, '""')}"`,
        `"${(customer.birth_day || '').replace(/"/g, '""')}"`,
        customer.total_returns || 0,
        `"${(customer.location_description || '').replace(/"/g, '""')}"`,
        `"${(customer.national_id || '').replace(/"/g, '""')}"`,
        customer.points || 0,
        customer.total_spent || 0,
        `"${(customer.loyalty_level || '').replace(/"/g, '""')}"`,
        `"${(customer.color_tag || '').replace(/"/g, '""')}"`,
        `"${(customer.customer_tag || '').replace(/"/g, '""')}"`,
        `"${(customer.notes || '').replace(/"/g, '""')}"`,
        customer.is_active ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customer_data_updated_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  // Filter and sort customers
  const filteredCustomers = customers
    .filter(customer => 
      customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm) ||
      customer.whatsapp?.includes(searchTerm)
    )
    .filter(customer => 
      !filterTag || customer.customer_tag === filterTag
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'points':
          return (b.points || 0) - (a.points || 0);
        case 'total_spent':
          return (b.total_spent || 0) - (a.total_spent || 0);
        default:
          return (a.name || '').localeCompare(b.name || '');
      }
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Customer Data Update
          </h1>
          <p className="text-gray-600">
            Update customer information, import/export data, and manage customer records
          </p>
        </div>

        {/* Main Content */}
        <GlassCard className="mb-6">
          <div className="flex flex-wrap gap-4 mb-6">
            <GlassButton onClick={loadCustomers} disabled={loading}>
              {loading ? 'Loading...' : 'Load Customers'}
            </GlassButton>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileImport}
              className="hidden"
            />
            <GlassButton 
              onClick={() => fileInputRef.current?.click()}
              variant="secondary"
            >
              Import CSV
            </GlassButton>
            
            <GlassButton 
              onClick={exportToCSV}
              variant="secondary"
              disabled={customers.length === 0}
            >
              Export CSV
            </GlassButton>
          </div>

          {/* Search and Filter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Tags</option>
              <option value="vip">VIP</option>
              <option value="regular">Regular</option>
              <option value="new">New</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'points' | 'total_spent')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">Sort by Name</option>
              <option value="points">Sort by Points</option>
              <option value="total_spent">Sort by Total Spent</option>
            </select>
          </div>

          {/* Customer List */}
          <div className="space-y-4">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="bg-white p-4 rounded-lg border border-gray-200 hover:border-blue-300 cursor-pointer"
                onClick={() => {
                  setSelectedCustomer(customer);
                  setShowEditModal(true);
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900">{customer.name}</h3>
                    <p className="text-blue-600 font-medium">{customer.phone}</p>
                    <p className="text-sm text-gray-500">{customer.city}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Points: {customer.points || 0}</div>
                    <div className="text-sm text-gray-500">Spent: ${customer.total_spent || 0}</div>
                    {customer.customer_tag && (
                      <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        {customer.customer_tag}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No customers found. Click "Load Customers" to load data from the database.
            </div>
          )}
        </GlassCard>

        {selectedCustomer && (
        <Modal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedCustomer(null);
          }}
          title="Edit Customer"
        >
          <CustomerEditForm
            customer={selectedCustomer}
            onSave={updateCustomer}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedCustomer(null);
            }}
          />
        </Modal>
      )}
      </div>
    </div>
  );
};

// Customer Edit Form Component
interface CustomerEditFormProps {
  customer: CustomerUpdateData;
  onSave: (customer: CustomerUpdateData) => void;
  onCancel: () => void;
}

const CustomerEditForm: React.FC<CustomerEditFormProps> = ({ customer, onSave, onCancel }) => {
  const [formData, setFormData] = useState<CustomerUpdateData>(customer);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input
            type="tel"
            value={formData.phone || ''}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City
          </label>
          <input
            type="text"
            value={formData.city || ''}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
};

export default CustomerDataUpdatePage; 