import React, { useState, useEffect } from 'react';
import GlassButton from '../../shared/components/ui/GlassButton';
import GlassInput from '../../shared/components/ui/GlassInput';
import GlassSelect from '../../shared/components/ui/GlassSelect';
import Modal from '../../shared/components/ui/Modal';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassBadge from '../../shared/components/ui/GlassBadge';
import { 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  Building, 
  Users, 
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { StoreLocationForm } from '../components/StoreLocationForm';
import { StoreLocationCard } from '../components/StoreLocationCard';
import { storeLocationApi } from '../utils/storeLocationApi';
import { 
  StoreLocation, 
  CreateStoreLocationData, 
  UpdateStoreLocationData,
  StoreLocationFilters,
  StoreLocationStats 
} from '../types/storeLocation';

export const StoreLocationManagementPage: React.FC = () => {
  const [locations, setLocations] = useState<StoreLocation[]>([]);
  const [stats, setStats] = useState<StoreLocationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingLocation, setEditingLocation] = useState<StoreLocation | null>(null);
  const [viewingLocation, setViewingLocation] = useState<StoreLocation | null>(null);
  const [deletingLocation, setDeletingLocation] = useState<StoreLocation | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);

  // Filters
  const [filters, setFilters] = useState<StoreLocationFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadLocations();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [locationsData, statsData, citiesData, regionsData] = await Promise.all([
        storeLocationApi.getAll(),
        storeLocationApi.getStats(),
        storeLocationApi.getCities(),
        storeLocationApi.getRegions()
      ]);
      
      setLocations(locationsData);
      setStats(statsData);
      setCities(citiesData);
      setRegions(regionsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLocations = async () => {
    try {
      const data = await storeLocationApi.getAll(filters);
      setLocations(data);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

  const handleCreate = async (data: CreateStoreLocationData) => {
    try {
      setFormLoading(true);
      await storeLocationApi.create(data);
      setIsCreating(false);
      await loadData();
    } catch (error) {
      console.error('Error creating location:', error);
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdate = async (data: UpdateStoreLocationData) => {
    try {
      setFormLoading(true);
      await storeLocationApi.update(data.id, data);
      setEditingLocation(null);
      await loadData();
    } catch (error) {
      console.error('Error updating location:', error);
      throw error;
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (location: StoreLocation) => {
    try {
      await storeLocationApi.delete(location.id);
      setDeletingLocation(null);
      await loadData();
    } catch (error) {
      console.error('Error deleting location:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete location');
    }
  };

  const handleToggleActive = async (location: StoreLocation) => {
    try {
      await storeLocationApi.toggleActive(location.id);
      await loadData();
    } catch (error) {
      console.error('Error toggling active status:', error);
    }
  };

  const handleSetMainBranch = async (location: StoreLocation) => {
    try {
      await storeLocationApi.setMainBranch(location.id);
      await loadData();
    } catch (error) {
      console.error('Error setting main branch:', error);
    }
  };

  const handleSearch = () => {
    setFilters(prev => ({
      ...prev,
      search: searchTerm.trim() || undefined
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  const filteredLocations = locations.filter(location => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        location.name.toLowerCase().includes(search) ||
        location.code.toLowerCase().includes(search) ||
        location.city.toLowerCase().includes(search) ||
        location.address.toLowerCase().includes(search)
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading store locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Store Location Management</h1>
          <p className="text-gray-600 mt-1">Manage your store locations and branches</p>
        </div>
        <GlassButton onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Location
        </GlassButton>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <GlassCard className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Locations</p>
                <p className="text-2xl font-bold">{stats.total_locations}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Active Locations</p>
                <p className="text-2xl font-bold">{stats.active_locations}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Users className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Staff</p>
                <p className="text-2xl font-bold">{stats.total_staff}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Monthly Target</p>
                <p className="text-2xl font-bold">
                  {(stats.total_monthly_target / 1000000).toFixed(1)}M TZS
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Search and Filters */}
      <GlassCard className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <GlassInput
                placeholder="Search locations by name, code, city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
          </div>
          
          <GlassButton
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </GlassButton>
          
          <GlassButton
            variant="outline"
            onClick={handleSearch}
          >
            Search
          </GlassButton>
          
          <GlassButton
            variant="outline"
            onClick={clearFilters}
          >
            Clear
          </GlassButton>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <GlassSelect
                value={filters.city || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value || undefined }))}
              >
                <option value="">All Cities</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </GlassSelect>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Region</label>
              <GlassSelect
                value={filters.region || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value || undefined }))}
              >
                <option value="">All Regions</option>
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </GlassSelect>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <GlassSelect
                value={filters.is_active?.toString() || ''}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  is_active: e.target.value === '' ? undefined : e.target.value === 'true' 
                }))}
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </GlassSelect>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredLocations.map((location) => (
          <StoreLocationCard
            key={location.id}
            location={location}
            onEdit={setEditingLocation}
            onDelete={setDeletingLocation}
            onView={setViewingLocation}
            onToggleActive={handleToggleActive}
            onSetMainBranch={handleSetMainBranch}
          />
        ))}
      </div>

      {filteredLocations.length === 0 && (
        <GlassCard className="p-12 text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
          <p className="text-gray-600 mb-4">
            {locations.length === 0 
              ? "You haven't added any store locations yet."
              : "No locations match your current filters."
            }
          </p>
          {locations.length === 0 && (
            <GlassButton onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Location
            </GlassButton>
          )}
        </GlassCard>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreating || !!editingLocation}
        onClose={() => {
          setIsCreating(false);
          setEditingLocation(null);
        }}
        title={editingLocation ? 'Edit Store Location' : 'Add New Store Location'}
        size="4xl"
      >
        <StoreLocationForm
          location={editingLocation || undefined}
          onSubmit={editingLocation ? handleUpdate : handleCreate}
          onCancel={() => {
            setIsCreating(false);
            setEditingLocation(null);
          }}
          isLoading={formLoading}
        />
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={!!viewingLocation}
        onClose={() => setViewingLocation(null)}
        title="Location Details"
        size="2xl"
      >
        {viewingLocation && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Basic Information</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Name:</span> {viewingLocation.name}</div>
                  <div><span className="font-medium">Code:</span> {viewingLocation.code}</div>
                  <div><span className="font-medium">Description:</span> {viewingLocation.description || 'N/A'}</div>
                  <div><span className="font-medium">Status:</span> 
                    <GlassBadge className="ml-2" variant={viewingLocation.is_active ? 'default' : 'secondary'}>
                      {viewingLocation.is_active ? 'Active' : 'Inactive'}
                    </GlassBadge>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Location</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Address:</span> {viewingLocation.address}</div>
                  <div><span className="font-medium">City:</span> {viewingLocation.city}</div>
                  <div><span className="font-medium">Region:</span> {viewingLocation.region || 'N/A'}</div>
                  <div><span className="font-medium">Country:</span> {viewingLocation.country}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Contact Information</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Phone:</span> {viewingLocation.phone || 'N/A'}</div>
                  <div><span className="font-medium">Email:</span> {viewingLocation.email || 'N/A'}</div>
                  <div><span className="font-medium">WhatsApp:</span> {viewingLocation.whatsapp || 'N/A'}</div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Manager</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Name:</span> {viewingLocation.manager_name || 'N/A'}</div>
                  <div><span className="font-medium">Phone:</span> {viewingLocation.manager_phone || 'N/A'}</div>
                  <div><span className="font-medium">Email:</span> {viewingLocation.manager_email || 'N/A'}</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Operating Hours</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                {Object.entries(viewingLocation.opening_hours).map(([day, hours]) => (
                  <div key={day} className="border rounded p-2">
                    <div className="font-medium capitalize">{day}</div>
                    <div>{hours.open} - {hours.close}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Features</h3>
                <div className="space-y-1 text-sm">
                  <div>Repair Service: {viewingLocation.has_repair_service ? 'Yes' : 'No'}</div>
                  <div>Sales Service: {viewingLocation.has_sales_service ? 'Yes' : 'No'}</div>
                  <div>Delivery Service: {viewingLocation.has_delivery_service ? 'Yes' : 'No'}</div>
                  <div>Parking: {viewingLocation.has_parking ? 'Yes' : 'No'}</div>
                  <div>WiFi: {viewingLocation.has_wifi ? 'Yes' : 'No'}</div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Capacity & Financial</h3>
                <div className="space-y-2 text-sm">
                  <div><span className="font-medium">Staff Count:</span> {viewingLocation.current_staff_count}</div>
                  <div><span className="font-medium">Store Size:</span> {viewingLocation.store_size_sqm ? `${viewingLocation.store_size_sqm} sqm` : 'N/A'}</div>
                  <div><span className="font-medium">Monthly Rent:</span> {viewingLocation.monthly_rent ? `${viewingLocation.monthly_rent.toLocaleString()} TZS` : 'N/A'}</div>
                  <div><span className="font-medium">Monthly Target:</span> {viewingLocation.monthly_target ? `${viewingLocation.monthly_target.toLocaleString()} TZS` : 'N/A'}</div>
                </div>
              </div>
            </div>

            {viewingLocation.notes && (
              <div>
                <h3 className="font-semibold mb-2">Notes</h3>
                <p className="text-sm text-gray-600">{viewingLocation.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingLocation}
        onClose={() => setDeletingLocation(null)}
        title="Delete Location"
        size="md"
      >
        {deletingLocation && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <div>
                <p className="font-medium">Are you sure you want to delete this location?</p>
                <p className="text-sm text-gray-600 mt-1">
                  This action cannot be undone. All data associated with this location will be permanently removed.
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="font-medium">{deletingLocation.name}</p>
              <p className="text-sm text-gray-600">{deletingLocation.address}, {deletingLocation.city}</p>
            </div>

            <div className="flex justify-end gap-3">
              <GlassButton
                variant="outline"
                onClick={() => setDeletingLocation(null)}
              >
                Cancel
              </GlassButton>
              <GlassButton
                variant="destructive"
                onClick={() => handleDelete(deletingLocation)}
              >
                Delete Location
              </GlassButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
