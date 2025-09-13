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
      {}
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
