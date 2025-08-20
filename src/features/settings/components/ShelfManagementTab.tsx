import React, { useState, useEffect } from 'react';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import GlassInput from '../../shared/components/ui/GlassInput';
import GlassSelect from '../../shared/components/ui/GlassSelect';
import GlassBadge from '../../shared/components/ui/GlassBadge';
import { Modal } from '../../shared/components/ui/Modal';
import { 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  Package, 
  Settings, 
  Eye, 
  Edit, 
  Trash2,
  Thermometer,
  Ladder,
  Wifi,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { 
  StoreShelf, 
  CreateStoreShelfData, 
  UpdateStoreShelfData, 
  StoreShelfFilters, 
  StoreShelfStats,
  SHELF_TYPES,
  SHELF_SECTIONS,
  SHELF_ZONES
} from '../types/storeShelf';
import { storeShelfApi } from '../utils/storeShelfApi';
import { StoreLocation } from '../types/storeLocation';

interface ShelfManagementTabProps {
  storeLocation: StoreLocation;
  onShelfUpdate?: () => void;
}

export const ShelfManagementTab: React.FC<ShelfManagementTabProps> = ({
  storeLocation,
  onShelfUpdate
}) => {
  const [shelves, setShelves] = useState<StoreShelf[]>([]);
  const [stats, setStats] = useState<StoreShelfStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<StoreShelfFilters>({});
  
  // Modal states
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedShelf, setSelectedShelf] = useState<StoreShelf | null>(null);
  const [formData, setFormData] = useState<CreateStoreShelfData>({
    store_location_id: storeLocation.id,
    name: '',
    code: '',
    description: '',
    shelf_type: 'standard',
    section: '',
    zone: 'front',
    max_capacity: undefined,
    priority_order: 0,
    is_active: true,
    is_accessible: true,
    requires_ladder: false,
    is_refrigerated: false
  });

  // Load shelves
  const loadShelves = async () => {
    try {
      setLoading(true);
      const [shelvesData, statsData] = await Promise.all([
        storeShelfApi.getAll({ 
          store_location_id: storeLocation.id,
          ...filters,
          search: searchTerm || undefined
        }),
        storeShelfApi.getStats(storeLocation.id)
      ]);
      setShelves(shelvesData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading shelves:', error);
      toast.error('Failed to load shelves');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShelves();
  }, [storeLocation.id, filters, searchTerm]);

  // Handle form submission
  const handleSubmit = async (data: CreateStoreShelfData | UpdateStoreShelfData) => {
    try {
      if (isEditing && selectedShelf) {
        await storeShelfApi.update(selectedShelf.id, data as UpdateStoreShelfData);
        toast.success('Shelf updated successfully');
      } else {
        await storeShelfApi.create(data as CreateStoreShelfData);
        toast.success('Shelf created successfully');
      }
      
      setIsCreating(false);
      setIsEditing(false);
      setSelectedShelf(null);
      resetForm();
      loadShelves();
      onShelfUpdate?.();
    } catch (error) {
      console.error('Error saving shelf:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save shelf');
    }
  };

  // Handle delete
  const handleDelete = async (shelf: StoreShelf) => {
    try {
      await storeShelfApi.delete(shelf.id);
      toast.success('Shelf deleted successfully');
      setIsDeleting(false);
      setSelectedShelf(null);
      loadShelves();
      onShelfUpdate?.();
    } catch (error) {
      console.error('Error deleting shelf:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete shelf');
    }
  };

  // Handle toggle active
  const handleToggleActive = async (shelf: StoreShelf) => {
    try {
      await storeShelfApi.toggleActive(shelf.id);
      toast.success(`Shelf ${shelf.is_active ? 'deactivated' : 'activated'} successfully`);
      loadShelves();
      onShelfUpdate?.();
    } catch (error) {
      console.error('Error toggling shelf status:', error);
      toast.error('Failed to update shelf status');
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      store_location_id: storeLocation.id,
      name: '',
      code: '',
      description: '',
      shelf_type: 'standard',
      section: '',
      zone: 'front',
      max_capacity: undefined,
      priority_order: 0,
      is_active: true,
      is_accessible: true,
      requires_ladder: false,
      is_refrigerated: false
    });
  };

  // Open edit modal
  const openEditModal = (shelf: StoreShelf) => {
    setSelectedShelf(shelf);
    setFormData({
      store_location_id: storeLocation.id,
      name: shelf.name,
      code: shelf.code,
      description: shelf.description || '',
      shelf_type: shelf.shelf_type,
      section: shelf.section || '',
      zone: shelf.zone || 'front',
      aisle: shelf.aisle,
      row_number: shelf.row_number,
      column_number: shelf.column_number,
      width_cm: shelf.width_cm,
      height_cm: shelf.height_cm,
      depth_cm: shelf.depth_cm,
      max_weight_kg: shelf.max_weight_kg,
      max_capacity: shelf.max_capacity,
      floor_level: shelf.floor_level,
      coordinates: shelf.coordinates,
      is_active: shelf.is_active,
      is_accessible: shelf.is_accessible,
      requires_ladder: shelf.requires_ladder,
      is_refrigerated: shelf.is_refrigerated,
      temperature_range: shelf.temperature_range,
      priority_order: shelf.priority_order,
      color_code: shelf.color_code,
      barcode: shelf.barcode,
      notes: shelf.notes,
      images: shelf.images
    });
    setIsEditing(true);
  };

  // Open view modal
  const openViewModal = (shelf: StoreShelf) => {
    setSelectedShelf(shelf);
    setIsViewing(true);
  };

  // Open delete modal
  const openDeleteModal = (shelf: StoreShelf) => {
    setSelectedShelf(shelf);
    setIsDeleting(true);
  };

  // Get shelf type label
  const getShelfTypeLabel = (type: string) => {
    return SHELF_TYPES.find(t => t.value === type)?.label || type;
  };

  // Get section label
  const getSectionLabel = (section: string) => {
    return SHELF_SECTIONS.find(s => s.value === section)?.label || section;
  };

  // Get zone label
  const getZoneLabel = (zone: string) => {
    return SHELF_ZONES.find(z => z.value === zone)?.label || zone;
  };

  // Get capacity percentage
  const getCapacityPercentage = (shelf: StoreShelf) => {
    if (!shelf.max_capacity) return 0;
    return Math.round((shelf.current_capacity / shelf.max_capacity) * 100);
  };

  // Get capacity color
  const getCapacityColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Shelf Management</h2>
          <p className="text-gray-600">Manage shelves for {storeLocation.name}</p>
        </div>
        <GlassButton onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Shelf
        </GlassButton>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <GlassCard className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Shelves</p>
                <p className="text-2xl font-bold">{stats.total_shelves}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Active Shelves</p>
                <p className="text-2xl font-bold">{stats.active_shelves}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Settings className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Utilization</p>
                <p className="text-2xl font-bold">{stats.utilization_rate.toFixed(1)}%</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <MapPin className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Available Space</p>
                <p className="text-2xl font-bold">{stats.available_capacity}</p>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Search and Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <GlassInput
                placeholder="Search shelves by name, code, section..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <GlassButton
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </GlassButton>
            
            <GlassButton
              variant="outline"
              onClick={() => {
                setFilters({});
                setSearchTerm('');
              }}
            >
              Clear
            </GlassButton>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Shelf Type</label>
              <GlassSelect
                value={filters.shelf_type || ''}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  shelf_type: e.target.value || undefined 
                }))}
              >
                <option value="">All Types</option>
                {SHELF_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </GlassSelect>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Section</label>
              <GlassSelect
                value={filters.section || ''}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  section: e.target.value || undefined 
                }))}
              >
                <option value="">All Sections</option>
                {SHELF_SECTIONS.map(section => (
                  <option key={section.value} value={section.value}>{section.label}</option>
                ))}
              </GlassSelect>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Zone</label>
              <GlassSelect
                value={filters.zone || ''}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  zone: e.target.value || undefined 
                }))}
              >
                <option value="">All Zones</option>
                {SHELF_ZONES.map(zone => (
                  <option key={zone.value} value={zone.value}>{zone.label}</option>
                ))}
              </GlassSelect>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Shelves Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {shelves.map((shelf) => (
          <GlassCard key={shelf.id} className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{shelf.name}</h3>
                <p className="text-sm text-gray-600">{shelf.code}</p>
              </div>
              <div className="flex items-center gap-1">
                <GlassButton
                  size="sm"
                  variant="ghost"
                  onClick={() => openViewModal(shelf)}
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </GlassButton>
                <GlassButton
                  size="sm"
                  variant="ghost"
                  onClick={() => openEditModal(shelf)}
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </GlassButton>
                <GlassButton
                  size="sm"
                  variant="ghost"
                  onClick={() => openDeleteModal(shelf)}
                  title="Delete"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </GlassButton>
              </div>
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2">
                <GlassBadge variant="outline" className="text-xs">
                  {getShelfTypeLabel(shelf.shelf_type)}
                </GlassBadge>
                {shelf.section && (
                  <GlassBadge variant="outline" className="text-xs">
                    {getSectionLabel(shelf.section)}
                  </GlassBadge>
                )}
                {shelf.zone && (
                  <GlassBadge variant="outline" className="text-xs">
                    {getZoneLabel(shelf.zone)}
                  </GlassBadge>
                )}
              </div>

              {shelf.description && (
                <p className="text-sm text-gray-600">{shelf.description}</p>
              )}

              <div className="flex items-center justify-between text-sm">
                <span>Capacity: {shelf.current_capacity}/{shelf.max_capacity || '∞'}</span>
                {shelf.max_capacity && (
                  <span className={getCapacityColor(getCapacityPercentage(shelf))}>
                    {getCapacityPercentage(shelf)}%
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                {shelf.is_refrigerated && <Thermometer className="w-4 h-4" />}
                {shelf.requires_ladder && <Ladder className="w-4 h-4" />}
                {!shelf.is_accessible && <XCircle className="w-4 h-4" />}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t">
              <div className="flex gap-2">
                <GlassButton
                  size="sm"
                  variant="outline"
                  onClick={() => handleToggleActive(shelf)}
                >
                  {shelf.is_active ? 'Deactivate' : 'Activate'}
                </GlassButton>
              </div>
              
              <div className="flex items-center gap-1">
                {shelf.is_active ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm text-gray-600">
                  {shelf.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {shelves.length === 0 && (
        <GlassCard className="p-12 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No shelves found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || Object.keys(filters).length > 0 
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first shelf'
            }
          </p>
          {!searchTerm && Object.keys(filters).length === 0 && (
            <GlassButton onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Shelf
            </GlassButton>
          )}
        </GlassCard>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isCreating || isEditing}
        onClose={() => {
          setIsCreating(false);
          setIsEditing(false);
          setSelectedShelf(null);
          resetForm();
        }}
        title={isEditing ? 'Edit Shelf' : 'Create New Shelf'}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name *</label>
              <GlassInput
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Shelf name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Code *</label>
              <GlassInput
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                placeholder="SHELF001"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <GlassInput
              value={formData.description || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Shelf description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Shelf Type</label>
              <GlassSelect
                value={formData.shelf_type}
                onChange={(e) => setFormData(prev => ({ ...prev, shelf_type: e.target.value as any }))}
              >
                {SHELF_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </GlassSelect>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Section</label>
              <GlassSelect
                value={formData.section || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
              >
                <option value="">Select Section</option>
                {SHELF_SECTIONS.map(section => (
                  <option key={section.value} value={section.value}>{section.label}</option>
                ))}
              </GlassSelect>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Zone</label>
              <GlassSelect
                value={formData.zone || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, zone: e.target.value as any }))}
              >
                {SHELF_ZONES.map(zone => (
                  <option key={zone.value} value={zone.value}>{zone.label}</option>
                ))}
              </GlassSelect>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Max Capacity</label>
              <GlassInput
                type="number"
                value={formData.max_capacity || ''}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  max_capacity: e.target.value ? Number(e.target.value) : undefined 
                }))}
                placeholder="Maximum capacity"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Priority Order</label>
              <GlassInput
                type="number"
                value={formData.priority_order}
                onChange={(e) => setFormData(prev => ({ ...prev, priority_order: Number(e.target.value) }))}
                placeholder="Display priority"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <GlassButton
              variant="outline"
              onClick={() => {
                setIsCreating(false);
                setIsEditing(false);
                setSelectedShelf(null);
                resetForm();
              }}
            >
              Cancel
            </GlassButton>
            <GlassButton
              onClick={() => handleSubmit(formData)}
            >
              {isEditing ? 'Update Shelf' : 'Create Shelf'}
            </GlassButton>
          </div>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewing}
        onClose={() => {
          setIsViewing(false);
          setSelectedShelf(null);
        }}
        title="Shelf Details"
      >
        {selectedShelf && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Name:</span> {selectedShelf.name}
              </div>
              <div>
                <span className="font-medium">Code:</span> {selectedShelf.code}
              </div>
              <div>
                <span className="font-medium">Type:</span> {getShelfTypeLabel(selectedShelf.shelf_type)}
              </div>
              <div>
                <span className="font-medium">Section:</span> {selectedShelf.section ? getSectionLabel(selectedShelf.section) : 'N/A'}
              </div>
              <div>
                <span className="font-medium">Zone:</span> {selectedShelf.zone ? getZoneLabel(selectedShelf.zone) : 'N/A'}
              </div>
              <div>
                <span className="font-medium">Capacity:</span> {selectedShelf.current_capacity}/{selectedShelf.max_capacity || '∞'}
              </div>
              <div>
                <span className="font-medium">Status:</span> 
                <GlassBadge className="ml-2" variant={selectedShelf.is_active ? 'default' : 'secondary'}>
                  {selectedShelf.is_active ? 'Active' : 'Inactive'}
                </GlassBadge>
              </div>
              <div>
                <span className="font-medium">Accessible:</span> 
                <GlassBadge className="ml-2" variant={selectedShelf.is_accessible ? 'default' : 'secondary'}>
                  {selectedShelf.is_accessible ? 'Yes' : 'No'}
                </GlassBadge>
              </div>
            </div>
            
            {selectedShelf.description && (
              <div>
                <span className="font-medium">Description:</span> {selectedShelf.description}
              </div>
            )}
            
            <div className="flex justify-end">
              <GlassButton
                variant="outline"
                onClick={() => {
                  setIsViewing(false);
                  setSelectedShelf(null);
                }}
              >
                Close
              </GlassButton>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleting}
        onClose={() => {
          setIsDeleting(false);
          setSelectedShelf(null);
        }}
        title="Delete Shelf"
      >
        {selectedShelf && (
          <div className="space-y-4">
            <p>Are you sure you want to delete the shelf "{selectedShelf.name}"?</p>
            <p className="text-sm text-gray-600">
              This action cannot be undone. If the shelf contains products, you'll need to move them first.
            </p>
            
            <div className="flex justify-end gap-3">
              <GlassButton
                variant="outline"
                onClick={() => {
                  setIsDeleting(false);
                  setSelectedShelf(null);
                }}
              >
                Cancel
              </GlassButton>
              <GlassButton
                variant="destructive"
                onClick={() => handleDelete(selectedShelf)}
              >
                Delete Shelf
              </GlassButton>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
