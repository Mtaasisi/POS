import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Download,
  Trash2,
  Plus,
  Eye,
  X
} from 'lucide-react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { supabase } from '../../../../lib/supabaseClient';
import { useAuth } from '../../../../context/AuthContext';

interface ProductImportData {
  name: string;
  description?: string;
  sku: string;
  category?: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  supplier?: string;
  specifications?: Record<string, any>;
}

interface ImportResult {
  product: string;
  status: 'success' | 'error';
  error?: string;
}

const BulkProductImport: React.FC = () => {
  const { currentUser } = useAuth();
  const [importData, setImportData] = useState<ProductImportData[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [previewData, setPreviewData] = useState<ProductImportData[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Handle CSV file upload
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      parseCSVFile(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json']
    },
    multiple: false
  });

  // Parse CSV file
  const parseCSVFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      const lines = csv.split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      
      const products: ProductImportData[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',').map(v => v.replace(/"/g, '').trim());
        if (values.length < headers.length) continue;
        
        const product: ProductImportData = {
          name: values[0] || '',
          description: values[1] || '',
          sku: values[2] || '',
          category: values[3] || '',
          costPrice: parseFloat(values[4]) || 0,
          sellingPrice: parseFloat(values[5]) || 0,
          stockQuantity: parseInt(values[6]) || 0,
          minStockLevel: parseInt(values[7]) || 0,
          supplier: values[8] || '',
          specifications: values[9] ? JSON.parse(values[9]) : {}
        };
        
        products.push(product);
      }
      
      setImportData(products);
      setPreviewData(products.slice(0, 5)); // Show first 5 for preview
      toast.success(`Loaded ${products.length} products from CSV`);
    };
    
    reader.readAsText(file);
  };

  // Import products to database
  const importProducts = async () => {
    if (importData.length === 0) {
      toast.error('No products to import');
      return;
    }

    setIsImporting(true);
    const results: ImportResult[] = [];

    try {
      for (const product of importData) {
        try {
          // Create product
          const { data: createdProduct, error: productError } = await supabase
            .from('lats_products')
            .insert([{
              name: product.name,
              description: product.description,
              sku: product.sku,
              cost_price: product.costPrice,
              selling_price: product.sellingPrice,
              stock_quantity: product.stockQuantity,
              min_stock_level: product.minStockLevel,
              is_active: true,
              attributes: product.specifications || {},
              total_quantity: product.stockQuantity,
              total_value: product.stockQuantity * product.costPrice,
              created_by: currentUser?.id,
              updated_by: currentUser?.id
            }])
            .select()
            .single();

          if (productError) {
            console.error(`Error creating product ${product.name}:`, productError);
            results.push({ 
              product: product.name, 
              status: 'error', 
              error: productError.message 
            });
            continue;
          }

          // Create default variant
          const { error: variantError } = await supabase
            .from('lats_product_variants')
            .insert([{
              product_id: createdProduct.id,
              sku: product.sku,
              name: 'Default',
              cost_price: product.costPrice,
              selling_price: product.sellingPrice,
              quantity: product.stockQuantity,
              min_quantity: product.minStockLevel,
              attributes: product.specifications || {}
            }]);

          if (variantError) {
            console.error(`Error creating variant for ${product.name}:`, variantError);
            results.push({ 
              product: product.name, 
              status: 'error', 
              error: variantError.message 
            });
          } else {
            results.push({ product: product.name, status: 'success' });
          }

        } catch (error) {
          console.error(`Unexpected error importing ${product.name}:`, error);
          results.push({ 
            product: product.name, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      setImportResults(results);
      
      const successCount = results.filter(r => r.status === 'success').length;
      const errorCount = results.filter(r => r.status === 'error').length;
      
      toast.success(`Import completed: ${successCount} success, ${errorCount} errors`);
      
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import products');
    } finally {
      setIsImporting(false);
    }
  };

  // Download sample CSV template
  const downloadSampleCSV = () => {
    const sampleData = [
      'name,description,sku,category,cost_price,selling_price,stock_quantity,min_stock_level,supplier,specifications',
      '"Samsung Galaxy S23","Latest Samsung smartphone","SAM-GS23-001","Electronics",850000,1200000,50,5,"Samsung Electronics","{\"Screen Size\":\"6.1 inches\",\"Storage\":\"128GB\"}"',
      '"iPhone 15 Pro","Apple flagship smartphone","APP-IP15P-001","Electronics",1200000,1800000,30,3,"Apple Inc","{\"Screen Size\":\"6.1 inches\",\"Storage\":\"256GB\"}"'
    ].join('\n');

    const blob = new Blob([sampleData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product-import-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Clear import data
  const clearData = () => {
    setImportData([]);
    setPreviewData([]);
    setImportResults([]);
    setShowPreview(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Bulk Product Import</h2>
        <div className="flex gap-2">
          <GlassButton
            onClick={downloadSampleCSV}
            className="flex items-center gap-2"
          >
            <Download size={16} />
            Download Template
          </GlassButton>
        </div>
      </div>

      {/* File Upload Area */}
      <GlassCard>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <Upload size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isDragActive ? 'Drop your file here' : 'Upload CSV or JSON file'}
          </h3>
          <p className="text-gray-600 mb-4">
            Drag and drop your product data file, or click to browse
          </p>
          <p className="text-sm text-gray-500">
            Supported formats: CSV, JSON
          </p>
        </div>
      </GlassCard>

      {/* Preview Data */}
      {previewData.length > 0 && (
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Preview ({importData.length} products)
            </h3>
            <div className="flex gap-2">
              <GlassButton
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-2"
              >
                <Eye size={16} />
                {showPreview ? 'Hide' : 'Show'} Details
              </GlassButton>
              <GlassButton
                onClick={clearData}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Trash2 size={16} />
                Clear
              </GlassButton>
            </div>
          </div>

          {showPreview && (
            <div className="space-y-4">
              {previewData.map((product, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{product.name}</h4>
                    <span className="text-sm text-gray-500">{product.sku}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Cost Price:</span>
                      <span className="ml-2 font-medium">TZS {product.costPrice.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Selling Price:</span>
                      <span className="ml-2 font-medium">TZS {product.sellingPrice.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Stock:</span>
                      <span className="ml-2 font-medium">{product.stockQuantity}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Min Level:</span>
                      <span className="ml-2 font-medium">{product.minStockLevel}</span>
                    </div>
                  </div>
                </div>
              ))}
              {importData.length > 5 && (
                <p className="text-sm text-gray-500 text-center">
                  ... and {importData.length - 5} more products
                </p>
              )}
            </div>
          )}
        </GlassCard>
      )}

      {/* Import Actions */}
      {importData.length > 0 && (
        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Ready to Import
              </h3>
              <p className="text-gray-600">
                {importData.length} products ready for import
              </p>
            </div>
            <GlassButton
              onClick={importProducts}
              disabled={isImporting}
              className="flex items-center gap-2"
            >
              {isImporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Importing...
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Import Products
                </>
              )}
            </GlassButton>
          </div>
        </GlassCard>
      )}

      {/* Import Results */}
      {importResults.length > 0 && (
        <GlassCard>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Import Results
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {importResults.map((result, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  result.status === 'success' 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                {result.status === 'success' ? (
                  <CheckCircle size={20} className="text-green-600" />
                ) : (
                  <AlertCircle size={20} className="text-red-600" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{result.product}</p>
                  {result.error && (
                    <p className="text-sm text-red-600">{result.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default BulkProductImport;
