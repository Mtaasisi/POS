import React, { useState, useEffect } from 'react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import SearchBar from '../../../shared/components/ui/SearchBar';
import { 
  Crown, Plus, Edit, Trash2, Search, Building, 
  CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useBrands } from '../../../../hooks/useBrands';
import { useCategories } from '../../../../hooks/useCategories';
import BrandForm from '../inventory/BrandForm';

interface Brand {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  category?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface BrandFormData {
  name: string;
  description?: string;
  logo_url?: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  category?: string;
  is_active?: boolean;
}

const BrandsTab: React.FC = () => {
  const { brands, loading, refreshBrands, createBrand, updateBrand, deleteBrand } = useBrands();
  const { categories: categoryData } = useCategories({ activeOnly: true });
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);


  // Prepare categories for the select dropdown
  const categories = [
    { value: 'all', label: 'All Categories' },
    ...categoryData.map(cat => ({ value: cat.name, label: cat.name }))
  ];



  // Filter brands based on search and category
  useEffect(() => {
    let filtered = brands || [];
    
    if (searchQuery) {
      filtered = filtered.filter(brand => 
        brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        brand.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(brand => brand.category === selectedCategory);
    }
    
    setFilteredBrands(filtered);
  }, [brands, searchQuery, selectedCategory]);

  const handleAddBrand = () => {
    setEditingBrand(null);
    setShowBrandForm(true);
  };

  const handleEditBrand = (brand: Brand) => {
    setEditingBrand(brand);
    setShowBrandForm(true);
  };

  const handleDeleteBrand = async (brandId: string) => {
    if (!confirm('Are you sure you want to delete this brand?')) {
      return;
    }

    try {
      const success = await deleteBrand(brandId);
      if (success) {
        refreshBrands();
      }
    } catch (error) {
      toast.error('Failed to delete brand');
    }
  };

  const handleSubmitBrand = async (brandData: BrandFormData) => {
    setIsSubmitting(true);

    try {
      if (editingBrand) {
        const updatedBrand = await updateBrand(editingBrand.id, {
          name: brandData.name,
          description: brandData.description || '',
          logo_url: brandData.logo_url || '',
          website: brandData.website || '',
          contact_email: brandData.contact_email || '',
          contact_phone: brandData.contact_phone || '',
          category: brandData.category || ''
        });
        if (updatedBrand) {
          setShowBrandForm(false);
          refreshBrands();
          toast.success('Brand updated successfully');
        }
      } else {
        const newBrand = await createBrand({
          name: brandData.name,
          description: brandData.description || '',
          logo_url: brandData.logo_url || '',
          website: brandData.website || '',
          contact_email: brandData.contact_email || '',
          contact_phone: brandData.contact_phone || '',
          category: brandData.category || '',
          is_active: brandData.is_active ?? true
        });
        if (newBrand) {
          setShowBrandForm(false);
          refreshBrands();
          toast.success('Brand created successfully');
        }
      }
    } catch (error) {
      toast.error(editingBrand ? 'Failed to update brand' : 'Failed to create brand');
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Crown className="w-6 h-6 text-blue-600" />
            Brand Management
          </h2>
          <p className="text-gray-600 mt-1">
            Manage product brands and manufacturers ({filteredBrands.length} brands)
          </p>
        </div>
        <GlassButton
          onClick={handleAddBrand}
          icon={<Plus size={18} />}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white"
        >
          Add Brand
        </GlassButton>
      </div>

      {/* Filters */}
      <GlassCard className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              placeholder="Search brands..."
              value={searchQuery}
              onChange={setSearchQuery}
              icon={<Search size={18} />}
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </GlassCard>

      {/* Brands List */}
      <GlassCard className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="text-center py-8">
            <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No brands found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first brand'
              }
            </p>
            {!searchQuery && selectedCategory === 'all' && (
              <GlassButton
                onClick={handleAddBrand}
                icon={<Plus size={18} />}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white"
              >
                Add First Brand
              </GlassButton>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBrands.map((brand) => (
              <div
                key={brand.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-blue-600" />
                    <h3 className="font-medium text-gray-900">{brand.name}</h3>
                    {brand.is_active ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditBrand(brand)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit brand"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteBrand(brand.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete brand"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                {brand.description && (
                  <p className="text-sm text-gray-600 mb-2">{brand.description}</p>
                )}
                
                <div className="space-y-1 text-xs text-gray-500">
                  {brand.category && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Category:</span>
                      <span className="bg-gray-100 px-2 py-1 rounded">{brand.category}</span>
                    </div>
                  )}
                  {brand.website && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Website:</span>
                      <a href={brand.website} target="_blank" rel="noopener noreferrer" 
                         className="text-blue-600 hover:underline">
                        {brand.website}
                      </a>
                    </div>
                  )}
                  {brand.contact_email && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Email:</span>
                      <span>{brand.contact_email}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Brand Form Modal */}
      {showBrandForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <BrandForm
              brand={editingBrand || undefined}
              onSubmit={handleSubmitBrand}
              onCancel={() => setShowBrandForm(false)}
              loading={isSubmitting}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandsTab;
