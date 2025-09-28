import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Tag, 
  MapPin, 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Image as ImageIcon,
  Eye,
  EyeOff
} from 'lucide-react';
import { RepairPart } from '../services/repairPartsApi';
import { getRepairPartImages } from '../services/repairPartsApi';
import { useAuth } from '../../../context/AuthContext';

interface SparePartDetailsCardProps {
  repairPart: RepairPart;
  showImages?: boolean;
  showVariants?: boolean;
  compact?: boolean;
}

const SparePartDetailsCard: React.FC<SparePartDetailsCardProps> = ({
  repairPart,
  showImages = true,
  showVariants = true,
  compact = false
}) => {
  const [images, setImages] = useState<any[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [showAllDetails, setShowAllDetails] = useState(!compact);
  const { currentUser } = useAuth();

  const sparePart = repairPart.spare_part;
  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (showImages && sparePart?.id) {
      loadImages();
    }
  }, [showImages, sparePart?.id]);

  const loadImages = async () => {
    if (!sparePart?.id) return;
    
    setLoadingImages(true);
    try {
      const result = await getRepairPartImages(sparePart.id);
      if (result.ok) {
        setImages(result.data);
      }
    } catch (error) {
      console.error('Error loading images:', error);
    } finally {
      setLoadingImages(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'needed': return 'text-orange-600 bg-orange-100';
      case 'ordered': return 'text-blue-600 bg-blue-100';
      case 'accepted': return 'text-purple-600 bg-purple-100';
      case 'received': return 'text-green-600 bg-green-100';
      case 'used': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getConditionColor = (condition?: string) => {
    switch (condition) {
      case 'new': return 'text-green-600 bg-green-100';
      case 'used': return 'text-yellow-600 bg-yellow-100';
      case 'refurbished': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStockStatus = () => {
    if (!sparePart) return { status: 'unknown', color: 'text-gray-600', icon: XCircle };
    
    if (sparePart.quantity === 0) {
      return { status: 'Out of Stock', color: 'text-red-600', icon: XCircle };
    } else if (sparePart.quantity <= sparePart.min_quantity) {
      return { status: 'Low Stock', color: 'text-orange-600', icon: AlertTriangle };
    } else {
      return { status: 'In Stock', color: 'text-green-600', icon: CheckCircle };
    }
  };

  const stockStatus = getStockStatus();
  const StockIcon = stockStatus.icon;

  if (!sparePart) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center text-gray-500">
          <Package className="h-5 w-5 mr-2" />
          <span>No spare part information available</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              {sparePart.name}
            </h3>
            <div className="flex items-center space-x-3 text-xs text-gray-600">
              <span className="flex items-center">
                <Tag className="h-3 w-3 mr-1" />
                {sparePart.part_number}
              </span>
              {sparePart.brand && (
                <span className="flex items-center">
                  <Package className="h-3 w-3 mr-1" />
                  {sparePart.brand}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(repairPart.status)}`}>
              {repairPart.status.replace('_', ' ').toUpperCase()}
            </span>
            <StockIcon className={`h-4 w-4 ${stockStatus.color}`} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-3">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Basic Information</h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Quantity Needed:</span>
                <span className="font-medium">{repairPart.quantity_needed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Quantity Used:</span>
                <span className="font-medium">{repairPart.quantity_used || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Available Stock:</span>
                <span className={`font-medium ${stockStatus.color}`}>
                  {sparePart.quantity}
                </span>
              </div>
              {isAdmin && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cost per Unit:</span>
                    <span className="font-medium">${sparePart.cost_price?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Cost:</span>
                    <span className="font-medium">${repairPart.total_cost?.toFixed(2) || '0.00'}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Part Details</h4>
            <div className="space-y-1.5 text-xs">
              {sparePart.category && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium">{sparePart.category.name}</span>
                </div>
              )}
              {sparePart.condition && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Condition:</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${getConditionColor(sparePart.condition)}`}>
                    {sparePart.condition}
                  </span>
                </div>
              )}
              {sparePart.location && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {sparePart.location}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Min Quantity:</span>
                <span className="font-medium">{sparePart.min_quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${sparePart.is_active ? 'text-green-600' : 'text-red-600'}`}>
                  {sparePart.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {sparePart.description && (
          <div className="mb-3">
            <h4 className="text-sm font-medium text-gray-900 mb-1.5">Description</h4>
            <p className="text-xs text-gray-600">{sparePart.description}</p>
          </div>
        )}

        {/* Supplier Information */}
        {sparePart.supplier && (
          <div className="mb-3">
            <h4 className="text-sm font-medium text-gray-900 mb-1.5">Supplier Information</h4>
            <div className="bg-gray-50 rounded-lg p-2">
              <div className="flex items-center mb-1.5">
                <User className="h-3 w-3 mr-1.5 text-gray-600" />
                <span className="font-medium text-sm">{sparePart.supplier.name}</span>
              </div>
              {sparePart.supplier.email && (
                <div className="flex items-center mb-1">
                  <Mail className="h-3 w-3 mr-1.5 text-gray-600" />
                  <span className="text-xs text-gray-600">{sparePart.supplier.email}</span>
                </div>
              )}
              {sparePart.supplier.phone && (
                <div className="flex items-center">
                  <Phone className="h-3 w-3 mr-1.5 text-gray-600" />
                  <span className="text-xs text-gray-600">{sparePart.supplier.phone}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {repairPart.notes && (
          <div className="mb-3">
            <h4 className="text-sm font-medium text-gray-900 mb-1.5">Notes</h4>
            <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2">{repairPart.notes}</p>
          </div>
        )}

        {/* Images */}
        {showImages && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <h4 className="text-sm font-medium text-gray-900">Images</h4>
              {loadingImages && (
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
              )}
            </div>
            {images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5">
                {images.slice(0, 4).map((image, index) => (
                  <div key={image.id || index} className="relative group">
                    <img
                      src={image.image_url || image.thumbnail_url}
                      alt={`${sparePart.name} - Image ${index + 1}`}
                      className="w-full h-16 object-cover rounded-lg border border-gray-200"
                    />
                    {image.is_primary && (
                      <div className="absolute top-0.5 left-0.5 bg-blue-600 text-white text-xs px-1 py-0.5 rounded">
                        Primary
                      </div>
                    )}
                  </div>
                ))}
                {images.length > 4 && (
                  <div className="flex items-center justify-center bg-gray-100 rounded-lg border border-gray-200 h-16">
                    <span className="text-xs text-gray-600">+{images.length - 4} more</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200 h-16">
                <div className="text-center">
                  <ImageIcon className="h-4 w-4 text-gray-400 mx-auto mb-1" />
                  <span className="text-xs text-gray-500">No images available</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Variants */}
        {showVariants && sparePart.variants && sparePart.variants.length > 0 && (
          <div className="mb-3">
            <h4 className="text-sm font-medium text-gray-900 mb-1.5">Variants</h4>
            <div className="space-y-1.5">
              {sparePart.variants.map((variant, index) => (
                <div key={variant.id || index} className="bg-gray-50 rounded-lg p-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-medium text-sm">{variant.name}</span>
                    <span className="text-xs text-gray-600">Qty: {variant.quantity}</span>
                  </div>
                  {variant.sku && (
                    <div className="text-xs text-gray-600 mb-1">SKU: {variant.sku}</div>
                  )}
                  <div className="flex justify-between text-xs">
                    <span>Price: ${variant.selling_price?.toFixed(2) || '0.00'}</span>
                    {isAdmin && (
                      <span>Cost: ${variant.cost_price?.toFixed(2) || '0.00'}</span>
                    )}
                  </div>
                  {variant.variant_attributes && Object.keys(variant.variant_attributes).length > 0 && (
                    <div className="mt-1.5">
                      <div className="text-xs text-gray-500 mb-1">Attributes:</div>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(variant.variant_attributes).map(([key, value]) => (
                          <span key={key} className="bg-white px-1.5 py-0.5 rounded text-xs border">
                            {key}: {String(value)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Additional Details Toggle */}
        {compact && (
          <div className="border-t border-gray-200 pt-4">
            <button
              onClick={() => setShowAllDetails(!showAllDetails)}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              {showAllDetails ? (
                <>
                  <EyeOff className="h-4 w-4 mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-1" />
                  Show More Details
                </>
              )}
            </button>
          </div>
        )}

        {/* Additional Details */}
        {showAllDetails && (
          <div className="border-t border-gray-200 pt-4 mt-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Additional Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-medium">
                    {new Date(sparePart.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">Updated:</span>
                  <span className="font-medium">
                    {new Date(sparePart.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">Repair Part ID:</span>
                  <span className="font-medium text-xs">{repairPart.id.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Spare Part ID:</span>
                  <span className="font-medium text-xs">{sparePart.id.slice(0, 8)}...</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SparePartDetailsCard;
