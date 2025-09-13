import React, { useState, useEffect } from 'react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import SearchBar from '../../../shared/components/ui/SearchBar';
import { 
  MapPin, Plus, Edit, Trash2, Search, Store, 
  CheckCircle, XCircle, Phone, Mail, Clock, Users
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface StoreLocation {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  country: string;
  phone?: string;
  email?: string;
  manager?: string;
  opening_hours?: string;
  is_active: boolean;
  is_main_branch: boolean;
  created_at: string;
  updated_at: string;
}

interface StoreLocationFormData {
  name: string;
  description: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  manager: string;
  opening_hours: string;
  is_main_branch: boolean;
}

const StoreLocationsTab: React.FC = () => {
  const [storeLocations, setStoreLocations] = useState<StoreLocation[]>([]);
  const [filteredLocations, setFilteredLocations] = useState<StoreLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<StoreLocation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<StoreLocationFormData>({
    name: '',
    description: '',
    address: '',
    city: '',
    country: '',
    phone: '',
    email: '',
    manager: '',
    opening_hours: '',
    is_main_branch: false
  });

  const countries = [
    { value: 'Kenya', label: 'Kenya' },
    { value: 'Tanzania', label: 'Tanzania' },
    { value: 'Uganda', label: 'Uganda' },
    { value: 'Other', label: 'Other' }
  ];

  const cities = [
    { value: 'Nairobi', label: 'Nairobi' },
    { value: 'Mombasa', label: 'Mombasa' },
    { value: 'Kisumu', label: 'Kisumu' },
    { value: 'Other', label: 'Other' }
  ];

  // Load store locations (mock data for now)
  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setStoreLocations([
        {
          id: '1',
          name: 'Main Branch - Nairobi',
          description: 'Primary store location in Nairobi CBD',
          address: '123 Kimathi Street',
          city: 'Nairobi',
          country: 'Kenya',
          phone: '+254700123456',
          email: 'nairobi@store.com',
          manager: 'Jane Smith',
          opening_hours: 'Mon-Fri: 8AM-6PM, Sat: 9AM-4PM',
          is_active: true,
          is_main_branch: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter locations based on search
  useEffect(() => {
    let filtered = storeLocations;
    
    if (searchQuery) {
      filtered = filtered.filter(location => 
        location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.city.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredLocations(filtered);
  }, [storeLocations, searchQuery]);

  const handleAddLocation = () => {
    setEditingLocation(null);
    setFormData({
      name: '',
      description: '',
      address: '',
      city: '',
      country: '',
      phone: '',
      email: '',
      manager: '',
      opening_hours: '',
      is_main_branch: false
    });
    setShowLocationForm(true);
  };

  const handleEditLocation = (location: StoreLocation) => {
    setEditingLocation(location);
    setFormData({
      name: location.name,
      description: location.description || '',
      address: location.address,
      city: location.city,
      country: location.country,
      phone: location.phone || '',
      email: location.email || '',
      manager: location.manager || '',
      opening_hours: location.opening_hours || '',
      is_main_branch: location.is_main_branch
    });
    setShowLocationForm(true);
  };

  const handleDeleteLocation = async (locationId: string) => {
    if (!confirm('Are you sure you want to delete this store location?')) {
      return;
    }

    try {
      setStoreLocations(prev => prev.filter(l => l.id !== locationId));
      toast.success('Store location deleted successfully');
    } catch (error) {
      toast.error('Failed to delete store location');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingLocation) {
        setStoreLocations(prev => prev.map(l => 
          l.id === editingLocation.id 
            ? { ...l, ...formData }
            : l
        ));
        toast.success('Store location updated successfully');
      } else {
        const newLocation: StoreLocation = {
          id: Date.now().toString(),
          ...formData,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setStoreLocations(prev => [...prev, newLocation]);
        toast.success('Store location created successfully');
      }
      
      setShowLocationForm(false);
    } catch (error) {
      toast.error(editingLocation ? 'Failed to update store location' : 'Failed to create store location');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof StoreLocationFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-6 h-6 text-orange-600" />
            Store Locations
          </h2>
          <p className="text-gray-600 mt-1">
            Manage store locations and branches ({filteredLocations.length} locations)
          </p>
        </div>
        <GlassButton
          onClick={handleAddLocation}
          icon={<Plus size={18} />}
          className="bg-gradient-to-r from-orange-500 to-orange-600 text-white"
        >
          Add Location
        </GlassButton>
      </div>

      {/* Filters */}
      <GlassCard className="p-4">
        <SearchBar
          placeholder="Search store locations..."
          value={searchQuery}
          onChange={setSearchQuery}
          icon={<Search size={18} />}
        />
      </GlassCard>

      {/* Store Locations List */}
      <GlassCard className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
          </div>
        ) : filteredLocations.length === 0 ? (
          <div className="text-center py-8">
            <Store className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No store locations found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery 
                ? 'Try adjusting your search'
                : 'Get started by adding your first store location'
              }
            </p>
            {!searchQuery && (
              <GlassButton
                onClick={handleAddLocation}
                icon={<Plus size={18} />}
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white"
              >
                Add First Location
              </GlassButton>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLocations.map((location) => (
              <div
                key={location.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-orange-600" />
                    <h3 className="font-medium text-gray-900">{location.name}</h3>
                    {location.is_active ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    {location.is_main_branch && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        Main
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditLocation(location)}
                      className="p-1 text-gray-400 hover:text-orange-600 transition-colors"
                      title="Edit location"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteLocation(location.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete location"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                {location.description && (
                  <p className="text-sm text-gray-600 mb-2">{location.description}</p>
                )}
                
                <div className="space-y-1 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{location.address}, {location.city}, {location.country}</span>
                  </div>
                  {location.manager && (
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span className="font-medium">Manager:</span>
                      <span>{location.manager}</span>
                    </div>
                  )}
                  {location.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      <a href={`tel:${location.phone}`} className="text-blue-600 hover:underline">
                        {location.phone}
                      </a>
                    </div>
                  )}
                  {location.email && (
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      <a href={`mailto:${location.email}`} className="text-blue-600 hover:underline">
                        {location.email}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Store Location Form Modal */}
      {showLocationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingLocation ? 'Edit Store Location' : 'Add New Store Location'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <select
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select city</option>
                      {cities.map(city => (
                        <option key={city.value} value={city.value}>
                          {city.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country *
                    </label>
                    <select
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select country</option>
                      {countries.map(country => (
                        <option key={country.value} value={country.value}>
                          {country.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_main_branch"
                    checked={formData.is_main_branch}
                    onChange={(e) => handleInputChange('is_main_branch', e.target.checked)}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="is_main_branch" className="text-sm font-medium text-gray-700">
                    Main Branch
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <GlassButton
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white"
                  >
                    {isSubmitting ? 'Saving...' : (editingLocation ? 'Update Location' : 'Add Location')}
                  </GlassButton>
                  <GlassButton
                    type="button"
                    onClick={() => setShowLocationForm(false)}
                    variant="secondary"
                    className="flex-1"
                  >
                    Cancel
                  </GlassButton>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreLocationsTab;
