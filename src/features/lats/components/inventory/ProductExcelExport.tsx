import React, { useState } from 'react';
import { Download, FileSpreadsheet, Loader2, CheckCircle, AlertCircle, Info } from 'lucide-react';
import GlassButton from '../../../shared/components/ui/GlassButton';
import GlassCard from '../../../shared/components/ui/GlassCard';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../../lib/supabaseClient';

interface ProductExportData {
  // Product main fields
  id: string;
  name: string;
  description?: string;
  shortDescription?: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  brandId?: string;
  supplierId?: string;
  images?: string[];
  isActive: boolean;
  totalQuantity: number;
  totalValue: number;
  condition?: string;
  storeShelf?: string;
  debutDate?: string;
  debutNotes?: string;
  debutFeatures?: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  
  // Related data
  categoryName?: string;
  brandName?: string;
  supplierName?: string;
  
  // All variant data (not just main variant)
  allVariants?: Array<{
    id: string;
    sku: string;
    name: string;
    barcode?: string;
    attributes: Record<string, any>;
    costPrice: number;
    sellingPrice: number;
    quantity: number;
    minQuantity: number;
    maxQuantity?: number;
    dimensions?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
  }>;
  
  // Main variant data (for backward compatibility)
  variantId?: string;
  variantSku?: string;
  variantName?: string;
  variantBarcode?: string;
  costPrice?: number;
  sellingPrice?: number;
  quantity?: number;
  minQuantity?: number;
  maxQuantity?: number;
  dimensions?: string;
  
  // Additional data
  variantCount?: number;
  totalVariantsValue?: number;
  
  // Stock movement data
  lastStockMovement?: {
    type?: string;
    quantity?: number;
    reason?: string;
    date?: string;
  };

  // Additional related data for CSV export
  category?: { name: string; description?: string; color?: string };
  brand?: { name: string; description?: string; logo?: string; website?: string };
  supplier?: { name: string; contact_person?: string; email?: string; phone?: string; address?: string; website?: string; notes?: string };
}

const ProductExcelExport: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const exportToExcel = async () => {
    setIsExporting(true);
    setExportProgress(0);
    
    try {
      toast.loading('Preparing product data for export...', { id: 'export' });
      
      // Step 1: Fetch all products with related data
      setExportProgress(20);
      const { data: products, error: productsError } = await supabase
        .from('lats_products')
        .select(`
          *,
          lats_categories(name, description, color),
          lats_brands(name, description, logo, website),
          lats_suppliers(name, contact_person, email, phone, address, website, notes),
          lats_product_variants(*),
          lats_stock_movements(
            type,
            quantity,
            reason,
            created_at
          )
        `)
        .order('name');

      if (productsError) {
        throw new Error(`Failed to fetch products: ${productsError.message}`);
      }

      setExportProgress(40);
      toast.loading('Processing product data...', { id: 'export' });

      // Step 2: Transform data for export
      const exportData: ProductExportData[] = [];
      
      products?.forEach(product => {
        const category = product.lats_categories;
        const brand = product.lats_brands;
        const supplier = product.lats_suppliers;
        const variants = product.lats_product_variants || [];
        const stockMovements = product.lats_stock_movements || [];
        
        // Get main variant (first one or highest quantity)
        const mainVariant = variants.length > 0 
          ? variants.reduce((prev, current) => 
              (current.quantity || 0) > (prev.quantity || 0) ? current : prev
            )
          : null;

        // Calculate totals
        const totalVariantsValue = variants.reduce((sum, variant) => 
          sum + ((variant.selling_price || 0) * (variant.quantity || 0)), 0
        );

        // Get last stock movement
        const lastStockMovement = stockMovements.length > 0 
          ? stockMovements.reduce((prev, current) => 
              new Date(current.created_at) > new Date(prev.created_at) ? current : prev
            )
          : null;

        // Create one row per variant (or one row if no variants)
        if (variants.length === 0) {
          // Product without variants
          exportData.push({
            // Product main fields
            id: product.id,
            name: product.name,
            description: product.description,
            shortDescription: product.short_description,
            sku: product.sku,
            barcode: product.barcode,
            categoryId: product.category_id,
            brandId: product.brand_id,
            supplierId: product.supplier_id,
            images: product.images || [],
            isActive: product.is_active,
            totalQuantity: product.total_quantity || 0,
            totalValue: product.total_value || 0,
            condition: product.condition,
            storeShelf: product.store_shelf,
            debutDate: product.debut_date,
            debutNotes: product.debut_notes,
            debutFeatures: product.debut_features,
            metadata: product.metadata,
            createdAt: product.created_at,
            updatedAt: product.updated_at,
            
            // Related data
            categoryName: category?.name || 'Uncategorized',
            brandName: brand?.name || 'No Brand',
            supplierName: supplier?.name || 'No Supplier',
            
            // All variant data
            allVariants: [],
            
            // Main variant data (empty for products without variants)
            variantId: '',
            variantSku: '',
            variantName: '',
            variantBarcode: '',
            costPrice: 0,
            sellingPrice: 0,
            quantity: 0,
            minQuantity: 0,
            maxQuantity: 0,
    
            dimensions: '',
            
            // Additional data
            variantCount: 0,
            totalVariantsValue: 0,
            
            // Stock movement data
            lastStockMovement: lastStockMovement ? {
              type: lastStockMovement.type,
              quantity: lastStockMovement.quantity,
              reason: lastStockMovement.reason,
              date: lastStockMovement.created_at
            } : undefined,
            
            // Additional related data for CSV export
            category: category,
            brand: brand,
            supplier: supplier
          });
        } else {
          // Create one row per variant
          variants.forEach(variant => {
            exportData.push({
              // Product main fields
              id: product.id,
              name: product.name,
              description: product.description,
              shortDescription: product.short_description,
              sku: product.sku,
              barcode: product.barcode,
              categoryId: product.category_id,
              brandId: product.brand_id,
              supplierId: product.supplier_id,
              images: product.images || [],
              isActive: product.is_active,
              totalQuantity: product.total_quantity || 0,
              totalValue: product.total_value || 0,
              condition: product.condition,
              storeShelf: product.store_shelf,
              debutDate: product.debut_date,
              debutNotes: product.debut_notes,
              debutFeatures: product.debut_features,
              metadata: product.metadata,
              createdAt: product.created_at,
              updatedAt: product.updated_at,
              
              // Related data
              categoryName: category?.name || 'Uncategorized',
              brandName: brand?.name || 'No Brand',
              supplierName: supplier?.name || 'No Supplier',
              
              // All variant data
              allVariants: variants.map(v => ({
                id: v.id,
                sku: v.sku,
                name: v.name,
                barcode: v.barcode,
                attributes: v.attributes,
                costPrice: v.cost_price,
                sellingPrice: v.selling_price,
                quantity: v.quantity,
                minQuantity: v.min_quantity,
                maxQuantity: v.max_quantity,
        
                dimensions: v.dimensions,
                createdAt: v.created_at,
                updatedAt: v.updated_at,
              })),
              
              // Current variant data
              variantId: variant.id,
              variantSku: variant.sku,
              variantName: variant.name,
              variantBarcode: variant.barcode,
              costPrice: variant.cost_price,
              sellingPrice: variant.selling_price,
              quantity: variant.quantity,
              minQuantity: variant.min_quantity,
              maxQuantity: variant.max_quantity,
      
              dimensions: variant.dimensions ? 
                `${variant.dimensions.length || 0}L x ${variant.dimensions.width || 0}W x ${variant.dimensions.height || 0}H` : '',
              
              // Additional data
              variantCount: variants.length,
              totalVariantsValue,
              
              // Stock movement data
              lastStockMovement: lastStockMovement ? {
                type: lastStockMovement.type,
                quantity: lastStockMovement.quantity,
                reason: lastStockMovement.reason,
                date: lastStockMovement.created_at
              } : undefined,
              
              // Additional related data for CSV export
              category: category,
              brand: brand,
              supplier: supplier
            });
          });
        }
      });

      setExportProgress(60);
      toast.loading('Generating Excel file...', { id: 'export' });

      // Step 3: Create CSV content
      const headers = [
        // Product Information
        'Product ID', 'Product Name', 'Description', 'Short Description', 'SKU', 'Barcode',
        'Category ID', 'Category Name', 'Category Description', 'Category Color',
        'Brand ID', 'Brand Name', 'Brand Description', 'Brand Logo', 'Brand Website',
        'Supplier ID', 'Supplier Name', 'Supplier Contact Person', 'Supplier Email', 'Supplier Phone', 'Supplier Address', 'Supplier Website', 'Supplier Notes',
        'Images', 'Active',
        'Tax Rate (%)', 'Total Quantity', 'Total Value', 'Condition', 'Store Shelf',
        'Debut Date', 'Debut Notes', 'Debut Features', 'Metadata',
        
        // Current Variant Information
        'Variant ID', 'Variant SKU', 'Variant Name', 'Variant Barcode',
        'Cost Price', 'Selling Price', 'Quantity', 'Min Quantity', 'Max Quantity',
        'Dimensions (LxWxH)', 'Variant Attributes',
        
        // All Variants Summary
        'All Variants Count', 'All Variants Data',
        
        // Additional Information
        'Variant Count', 'Total Variants Value', 'Created Date', 'Updated Date',
        
        // Stock Movement Information
        'Last Stock Movement Type', 'Last Stock Movement Quantity', 'Last Stock Movement Reason', 'Last Stock Movement Date'
      ];

      const csvRows = [
        headers.join(','),
        ...exportData.map(product => [
          // Product Information
          `"${product.id}"`,
          `"${(product.name || '').replace(/"/g, '""')}"`,
          `"${(product.description || '').replace(/"/g, '""')}"`,
          `"${(product.shortDescription || '').replace(/"/g, '""')}"`,
          `"${(product.sku || '').replace(/"/g, '""')}"`,
          `"${(product.barcode || '').replace(/"/g, '""')}"`,
          `"${(product.categoryId || '').replace(/"/g, '""')}"`,
          `"${(product.categoryName || '').replace(/"/g, '""')}"`,
          `"${(product.category?.description || '').replace(/"/g, '""')}"`,
          `"${(product.category?.color || '').replace(/"/g, '""')}"`,
          `"${(product.brandId || '').replace(/"/g, '""')}"`,
          `"${(product.brandName || '').replace(/"/g, '""')}"`,
          `"${(product.brand?.description || '').replace(/"/g, '""')}"`,
          `"${(product.brand?.logo || '').replace(/"/g, '""')}"`,
          `"${(product.brand?.website || '').replace(/"/g, '""')}"`,
          `"${(product.supplierId || '').replace(/"/g, '""')}"`,
          `"${(product.supplierName || '').replace(/"/g, '""')}"`,
          `"${(product.supplier?.contact_person || '').replace(/"/g, '""')}"`,
          `"${(product.supplier?.email || '').replace(/"/g, '""')}"`,
          `"${(product.supplier?.phone || '').replace(/"/g, '""')}"`,
          `"${(product.supplier?.address || '').replace(/"/g, '""')}"`,
          `"${(product.supplier?.website || '').replace(/"/g, '""')}"`,
          `"${(product.supplier?.notes || '').replace(/"/g, '""')}"`,
          `"${(product.images || []).join(', ').replace(/"/g, '""')}"`,
          product.isActive ? 'Yes' : 'No',
          product.totalQuantity,
          product.totalValue,
          `"${(product.condition || '').replace(/"/g, '""')}"`,
          `"${(product.storeShelf || '').replace(/"/g, '""')}"`,
          `"${(product.debutDate || '').replace(/"/g, '""')}"`,
          `"${(product.debutNotes || '').replace(/"/g, '""')}"`,
          `"${(product.debutFeatures || []).join(', ').replace(/"/g, '""')}"`,
          `"${JSON.stringify(product.metadata || {}).replace(/"/g, '""')}"`,
          
          // Current Variant Information
          `"${(product.variantId || '').replace(/"/g, '""')}"`,
          `"${(product.variantSku || '').replace(/"/g, '""')}"`,
          `"${(product.variantName || '').replace(/"/g, '""')}"`,
          `"${(product.variantBarcode || '').replace(/"/g, '""')}"`,
          product.costPrice || 0,
          product.sellingPrice || 0,
          product.quantity || 0,
          product.minQuantity || 0,
          product.maxQuantity || 0,
  
          `"${(product.dimensions || '').replace(/"/g, '""')}"`,
          `"${JSON.stringify(product.allVariants?.find(v => v.id === product.variantId)?.attributes || {}).replace(/"/g, '""')}"`,
          
          // All Variants Summary
          product.allVariants?.length || 0,
          `"${JSON.stringify(product.allVariants || []).replace(/"/g, '""')}"`,
          
          // Additional Information
          product.variantCount || 0,
          product.totalVariantsValue || 0,
          `"${new Date(product.createdAt).toLocaleDateString()}"`,
          `"${new Date(product.updatedAt).toLocaleDateString()}"`,
          
          // Stock Movement Information
          `"${(product.lastStockMovement?.type || '').replace(/"/g, '""')}"`,
          product.lastStockMovement?.quantity || 0,
          `"${(product.lastStockMovement?.reason || '').replace(/"/g, '""')}"`,
          `"${(product.lastStockMovement?.date || '').replace(/"/g, '""')}"`
        ].join(','))
      ];

      setExportProgress(80);
      toast.loading('Downloading file...', { id: 'export' });

      // Step 4: Create and download file
      const BOM = '\uFEFF'; // Byte Order Mark for Excel compatibility
      const csvContent = BOM + csvRows.join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `lats_products_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setExportProgress(100);
      toast.success(`✅ Successfully exported ${exportData.length} products!`, { id: 'export' });
      
    } catch (error) {
      console.error('Export error:', error);
      toast.error(`❌ Export failed: ${error.message}`, { id: 'export' });
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <FileSpreadsheet className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Export All Products</h3>
          <p className="text-sm text-gray-600">Download complete product catalog with all fields</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Export Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">What's included in the export:</p>
              <ul className="space-y-1 text-xs">
                <li>• All product details (name, description, SKU, barcode, etc.)</li>
                <li>• Complete category, brand, and supplier information</li>
                <li>• All variant details (price, stock, dimensions, attributes)</li>
                <li>• Product status, metadata, and debut information</li>
                <li>• Images and configuration settings</li>
                <li>• Stock movement history and tracking</li>
                <li>• One row per variant for complete data coverage</li>
                <li>• All timestamps and audit information</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Export Progress */}
        {isExporting && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Exporting products...</span>
              <span className="text-gray-900 font-medium">{exportProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Export Button */}
        <GlassButton
          onClick={exportToExcel}
          disabled={isExporting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Export All Products to Excel
            </>
          )}
        </GlassButton>

        {/* Export Tips */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-gray-600">
              <p className="font-medium mb-1">Export Tips:</p>
              <ul className="space-y-1">
                <li>• File will be saved as CSV (compatible with Excel)</li>
                <li>• Large exports may take a few moments</li>
                <li>• All special characters are properly escaped</li>
                <li>• Dates are formatted for easy reading</li>
                <li>• One row per variant for complete data coverage</li>
                <li>• JSON data (attributes, metadata) is preserved</li>
                <li>• Stock movement history is included</li>
                <li>• All relationships and foreign keys are resolved</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default ProductExcelExport;
