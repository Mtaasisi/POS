import React, { useState } from 'react';
import { X, Package, MapPin, Calendar, DollarSign, AlertTriangle, Edit3 } from 'lucide-react';
import { toast } from 'sonner';
import InventoryManagementService from '@/features/lats/services/inventoryManagementService';

interface ItemDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    serial_number?: string;
    imei?: string;
    mac_address?: string;
    barcode?: string;
    status: string;
    location?: string;
    shelf?: string;
    bin?: string;
    purchase_date?: string;
    warranty_start?: string;
    warranty_end?: string;
    cost_price?: number;
    selling_price?: number;
    notes?: string;
    created_at: string;
    updated_at: string;
    product?: {
      name: string;
      sku: string;
    };
    variant?: {
      name: string;
      sku: string;
    };
  };
}

const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({
  isOpen,
  onClose,
  item
}) => {
  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'sold':
        return 'bg-blue-100 text-blue-800';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800';
      case 'damaged':
        return 'bg-red-100 text-red-800';
      case 'warranty':
        return 'bg-orange-100 text-orange-800';
      case 'returned':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isWarrantyExpiring = item.warranty_end && 
    new Date(item.warranty_end) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'Not set';
    return `TZS ${amount.toLocaleString()}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Item Details</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Product Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Product Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Product Name</div>
                  <div className="font-medium text-gray-900">{item.product?.name || 'Unknown'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Product SKU</div>
                  <div className="font-mono text-sm text-gray-900">{item.product?.sku || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Variant</div>
                  <div className="font-medium text-gray-900">{item.variant?.name || 'Default'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Variant SKU</div>
                  <div className="font-mono text-sm text-gray-900">{item.variant?.sku || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Serial Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Serial Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Serial Number</div>
                  <div className="font-mono text-sm text-gray-900">{item.serial_number || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">IMEI</div>
                  <div className="font-mono text-sm text-gray-900">{item.imei || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">MAC Address</div>
                  <div className="font-mono text-sm text-gray-900">{item.mac_address || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Barcode</div>
                  <div className="font-mono text-sm text-gray-900">{item.barcode || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Status & Location */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Status & Location
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Status</div>
                  <div className="mt-1">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Location</div>
                  <div className="font-medium text-gray-900">{item.location || 'Not assigned'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Shelf</div>
                  <div className="font-medium text-gray-900">{item.shelf || 'Not assigned'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Bin</div>
                  <div className="font-medium text-gray-900">{item.bin || 'Not assigned'}</div>
                </div>
              </div>
            </div>

            {/* Financial Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Financial Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Cost Price</div>
                  <div className="font-medium text-gray-900">{formatCurrency(item.cost_price)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Selling Price</div>
                  <div className="font-medium text-gray-900">{formatCurrency(item.selling_price)}</div>
                </div>
                {item.cost_price && item.selling_price && (
                  <div className="md:col-span-2">
                    <div className="text-sm text-gray-600">Profit Margin</div>
                    <div className="font-medium text-gray-900">
                      {formatCurrency(item.selling_price - item.cost_price)} 
                      <span className="text-sm text-gray-600 ml-2">
                        ({((item.selling_price - item.cost_price) / item.cost_price * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Warranty Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Warranty Information
                {isWarrantyExpiring && (
                  <AlertTriangle className="w-4 h-4 text-orange-500" title="Warranty expiring soon" />
                )}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Purchase Date</div>
                  <div className="font-medium text-gray-900">{formatDate(item.purchase_date)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Warranty Start</div>
                  <div className="font-medium text-gray-900">{formatDate(item.warranty_start)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Warranty End</div>
                  <div className="font-medium text-gray-900">{formatDate(item.warranty_end)}</div>
                </div>
              </div>
              {isWarrantyExpiring && (
                <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="text-sm text-orange-800 font-medium">
                    ⚠️ Warranty expires on {formatDate(item.warranty_end)}
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            {item.notes && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Notes</h3>
                <div className="text-sm text-gray-700 whitespace-pre-wrap">{item.notes}</div>
              </div>
            )}

            {/* Timestamps */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">Timestamps</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Created</div>
                  <div className="text-sm text-gray-900">
                    {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Last Updated</div>
                  <div className="text-sm text-gray-900">
                    {new Date(item.updated_at).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailsModal;
