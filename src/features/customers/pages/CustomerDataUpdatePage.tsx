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
  initial_notes?: string;
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
        .order('name');

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
          initial_notes: customerData.initial_notes,
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
      'ID', 'Name', 'Email', 'Phone', 'Gender', 'City', 'WhatsApp', 
      'Referral Source', 'Birth Month', 'Birth Day', 'Total Returns',
      'Initial Notes', 'Location Description', 'National ID', 'Points',
      'Total Spent', 'Loyalty Level', 'Color Tag', 'Customer Tag',
      'Notes', 'Is Active', 'Joined Date', 'Last Visit'
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
        `"${(customer.initial_notes || '').replace(/"/g, '""')}"`,
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

        {/* Action Buttons */}
        <GlassCard className="mb-6 p-6">
          <div className="flex flex-wrap gap-4 items-center">
            <GlassButton
              onClick={loadCustomers}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {loading ? 'Loading...' : 'Load Customers'}
            </GlassButton>

            <GlassButton
              onClick={() => fileInputRef.current?.click()}
              className="bg-green-500 hover:bg-green-600"
            >
              Import CSV
            </GlassButton>

            <GlassButton
              onClick={exportToCSV}
              disabled={customers.length === 0}
              className="bg-purple-500 hover:bg-purple-600"
            >
              Export CSV
            </GlassButton>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileImport}
              className="hidden"
            />
          </div>
        </GlassCard>

        {/* Filters */}
        <GlassCard className="mb-6 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                placeholder="Search by name, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Tag
              </label>
              <select
                value={filterTag}
                onChange={(e) => setFilterTag(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Tags</option>
                <option value="vip">VIP</option>
                <option value="regular">Regular</option>
                <option value="new">New</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Name</option>
                <option value="points">Points</option>
                <option value="total_spent">Total Spent</option>
              </select>
            </div>

            <div className="flex items-end">
              <span className="text-sm text-gray-600">
                {filteredCustomers.length} customers
              </span>
            </div>
          </div>
        </GlassCard>

        {/* Customer List */}
        <div className="grid gap-4">
          {filteredCustomers.map((customer) => (
            <GlassCard key={customer.id} className="p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800">
                        {customer.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {customer.email} • {customer.phone}
                      </p>
                      {customer.whatsapp && (
                        <p className="text-sm text-green-600">
                          WhatsApp: {customer.whatsapp}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      {customer.birth_month && (
                        <span className="px-2 py-1 bg-pink-100 text-pink-800 text-xs rounded-full">
                          🎂 {customer.birth_month} {customer.birth_day}
                        </span>
                      )}
                      {customer.referral_source && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          📱 {customer.referral_source}
                        </span>
                      )}
                      {customer.points && customer.points > 100 && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          ⭐ {customer.points} pts
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <GlassButton
                  onClick={() => {
                    setSelectedCustomer(customer);
                    setShowEditModal(true);
                  }}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  Edit
                </GlassButton>
              </div>
            </GlassCard>
          ))}
        </div>

        {filteredCustomers.length === 0 && (
          <GlassCard className="p-8 text-center">
            <p className="text-gray-500">
              {customers.length === 0 ? 'No customers loaded. Click "Load Customers" to start.' : 'No customers match your filters.'}
            </p>
          </GlassCard>
        )}
      </div>

      {/* Edit Modal */}
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
            WhatsApp
          </label>
          <input
            type="tel"
            value={formData.whatsapp || ''}
            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gender
          </label>
          <select
            value={formData.gender || ''}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Birth Month
          </label>
          <select
            value={formData.birth_month || ''}
            onChange={(e) => setFormData({ ...formData, birth_month: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Month</option>
            {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Birth Day
          </label>
          <select
            value={formData.birth_day || ''}
            onChange={(e) => setFormData({ ...formData, birth_day: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Day</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
              <option key={day} value={day.toString()}>{day}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Referral Source
          </label>
          <input
            type="text"
            value={formData.referral_source || ''}
            onChange={(e) => setFormData({ ...formData, referral_source: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Instagram, Friend, Walk-in..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Points
          </label>
          <input
            type="number"
            value={formData.points || 0}
            onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Total Spent
          </label>
          <input
            type="number"
            value={formData.total_spent || 0}
            onChange={(e) => setFormData({ ...formData, total_spent: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Total Returns
          </label>
          <input
            type="number"
            value={formData.total_returns || 0}
            onChange={(e) => setFormData({ ...formData, total_returns: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          value={formData.notes || ''}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Initial Notes
        </label>
        <textarea
          value={formData.initial_notes || ''}
          onChange={(e) => setFormData({ ...formData, initial_notes: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-4 pt-4">
        <GlassButton
          type="submit"
          className="bg-blue-500 hover:bg-blue-600"
        >
          Save Changes
        </GlassButton>
        <GlassButton
          type="button"
          onClick={onCancel}
          className="bg-gray-500 hover:bg-gray-600"
        >
          Cancel
        </GlassButton>
      </div>
    </form>
  );
};

export default CustomerDataUpdatePage; 