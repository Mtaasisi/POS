import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-hot-toast';
import { 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Download,
  Trash2,
  Plus,
  Eye,
  Edit3,
  Save,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { useAuth } from '../../../../context/AuthContext';
import { createProduct } from '../../../../lib/latsProductApi';

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

interface ProductPreviewCardProps {
  product: ProductImportData;
  index: number;
  isExpanded: boolean;
  isEditing: boolean;
  onToggleExpansion: (index: number) => void;
  onStartEditing: (index: number) => void;
  onSaveEditing: (index: number, product: ProductImportData) => void;
  onCancelEditing: () => void;
}

const ProductPreviewCard: React.FC<ProductPreviewCardProps> = ({
  product,
  index,
  isExpanded,
  isEditing,
  onToggleExpansion,
  onStartEditing,
  onSaveEditing,
  onCancelEditing
}) => {
  const [editData, setEditData] = useState<ProductImportData>(product);

  const handleSave = () => {
    onSaveEditing(index, editData);
  };

  const handleCancel = () => {
    setEditData(product);
    onCancelEditing();
  };

  return (
    <div className="border rounded-lg bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggleExpansion(index)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <div>
            <h4 className="font-medium text-gray-900">{product.name}</h4>
            <p className="text-sm text-gray-500">SKU: {product.sku}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <button
              onClick={() => onStartEditing(index)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
              title="Edit product"
            >
              <Edit3 size={16} />
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="p-2 text-green-600 hover:bg-green-50 rounded"
                title="Save changes"
              >
                <Save size={16} />
              </button>
              <button
                onClick={handleCancel}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
                title="Cancel editing"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Basic Info */}
      <div className="p-4">
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

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t p-4 bg-gray-50">
          {isEditing ? (
            <ProductEditForm
              product={editData}
              onChange={setEditData}
              onSave={handleSave}
              onCancel={handleCancel}
            />
          ) : (
            <ProductDetailsView product={product} />
          )}
        </div>
      )}
    </div>
  );
};

const ProductDetailsView: React.FC<{ product: ProductImportData }> = ({ product }) => {
  return (
    <div className="space-y-4">
      {/* Basic Information */}
      <div>
        <h5 className="font-medium text-gray-900 mb-2">Basic Information</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Name:</span>
            <span className="ml-2 font-medium">{product.name}</span>
          </div>
          <div>
            <span className="text-gray-600">SKU:</span>
            <span className="ml-2 font-medium">{product.sku}</span>
          </div>
          <div>
            <span className="text-gray-600">Category:</span>
            <span className="ml-2 font-medium">{product.category || 'Not specified'}</span>
          </div>
          <div>
            <span className="text-gray-600">Supplier:</span>
            <span className="ml-2 font-medium">{product.supplier || 'Not specified'}</span>
          </div>
        </div>
        {product.description && (
          <div className="mt-2">
            <span className="text-gray-600">Description:</span>
            <p className="ml-2 text-sm text-gray-800">{product.description}</p>
          </div>
        )}
      </div>

      {/* Pricing & Stock */}
      <div>
        <h5 className="font-medium text-gray-900 mb-2">Pricing & Stock</h5>
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
            <span className="text-gray-600">Stock Quantity:</span>
            <span className="ml-2 font-medium">{product.stockQuantity}</span>
          </div>
          <div>
            <span className="text-gray-600">Min Stock Level:</span>
            <span className="ml-2 font-medium">{product.minStockLevel}</span>
          </div>
        </div>
        <div className="mt-2">
          <span className="text-gray-600">Profit Margin:</span>
          <span className="ml-2 font-medium text-green-600">
            {((product.sellingPrice - product.costPrice) / product.costPrice * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Variants */}
      <div>
        <h5 className="font-medium text-gray-900 mb-2">Product Variants</h5>
        <div className="bg-white border rounded-lg p-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Variant Name:</span>
              <span className="ml-2 font-medium">Default</span>
            </div>
            <div>
              <span className="text-gray-600">Variant SKU:</span>
              <span className="ml-2 font-medium">{product.sku}</span>
            </div>
            <div>
              <span className="text-gray-600">Cost Price:</span>
              <span className="ml-2 font-medium">TZS {product.costPrice.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-600">Selling Price:</span>
              <span className="ml-2 font-medium">TZS {product.sellingPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications */}
      {product.specifications && Object.keys(product.specifications).length > 0 && (
        <div>
          <h5 className="font-medium text-gray-900 mb-2">Specifications</h5>
          <div className="bg-white border rounded-lg p-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key}>
                  <span className="text-gray-600">{key}:</span>
                  <span className="ml-2 font-medium">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ProductEditForm: React.FC<{
  product: ProductImportData;
  onChange: (product: ProductImportData) => void;
  onSave: () => void;
  onCancel: () => void;
}> = ({ product, onChange, onSave, onCancel }) => {
  const handleChange = (field: keyof ProductImportData, value: any) => {
    onChange({ ...product, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
          <input
            type="text"
            value={product.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
          <input
            type="text"
            value={product.sku}
            onChange={(e) => handleChange('sku', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <input
            type="text"
            value={product.category || ''}
            onChange={(e) => handleChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
          <input
            type="text"
            value={product.supplier || ''}
            onChange={(e) => handleChange('supplier', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (TZS)</label>
          <input
            type="number"
            value={product.costPrice}
            onChange={(e) => handleChange('costPrice', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (TZS)</label>
          <input
            type="number"
            value={product.sellingPrice}
            onChange={(e) => handleChange('sellingPrice', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
          <input
            type="number"
            value={product.stockQuantity}
            onChange={(e) => handleChange('stockQuantity', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock Level</label>
          <input
            type="number"
            value={product.minStockLevel}
            onChange={(e) => handleChange('minStockLevel', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={product.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};

const BulkProductImport: React.FC = () => {
  const { currentUser } = useAuth();
  const [importData, setImportData] = useState<ProductImportData[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [previewData, setPreviewData] = useState<ProductImportData[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [editingProduct, setEditingProduct] = useState<number | null>(null);
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set());

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
      
      // Parse CSV line properly handling quoted values
      const parseCSVLine = (line: string): string[] => {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };
      
      const headers = parseCSVLine(lines[0]);
      const products: ProductImportData[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = parseCSVLine(line);
        if (values.length < headers.length) continue;
        
        // Parse specifications safely
        let specifications = {};
        if (values[9]) {
          try {
            // Try to parse as JSON first
            specifications = JSON.parse(values[9]);
          } catch (error) {
            // If JSON parsing fails, treat as plain text and create a simple object
            console.warn(`Could not parse specifications as JSON for product ${values[0]}:`, values[9]);
            specifications = { note: values[9] };
          }
        }

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
          specifications: specifications
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
          // Create product using the API
          const productData = {
            name: product.name,
            description: product.description,
            sku: product.sku,
            categoryId: '', // We'll need to handle categories separately
            variants: [{
              sku: product.sku,
              name: 'Default',
              sellingPrice: product.sellingPrice,
              costPrice: product.costPrice,
              quantity: product.stockQuantity,
              minQuantity: product.minStockLevel,
              attributes: product.specifications || {}
            }]
          };

          await createProduct(productData, currentUser?.id || '');

          results.push({ product: product.name, status: 'success' });

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
    setEditingProduct(null);
    setExpandedProducts(new Set());
  };

  // Toggle product expansion
  const toggleProductExpansion = (index: number) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedProducts(newExpanded);
  };

  // Start editing a product
  const startEditing = (index: number) => {
    setEditingProduct(index);
  };

  // Save edited product
  const saveEditedProduct = (index: number, updatedProduct: ProductImportData) => {
    const newImportData = [...importData];
    newImportData[index] = updatedProduct;
    setImportData(newImportData);
    
    const newPreviewData = [...previewData];
    if (index < newPreviewData.length) {
      newPreviewData[index] = updatedProduct;
    }
    setPreviewData(newPreviewData);
    
    setEditingProduct(null);
    toast.success(`Product "${updatedProduct.name}" updated successfully`);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingProduct(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Bulk Product Import</h2>
                <p className="text-sm text-gray-600">Import multiple products from CSV or JSON files</p>
              </div>
            </div>
            <div className="flex gap-2">
              <GlassButton
                onClick={downloadSampleCSV}
                className="flex items-center gap-2 px-4 py-2"
              >
                <Download size={16} />
                <span className="hidden sm:inline">Download Template</span>
                <span className="sm:hidden">Template</span>
              </GlassButton>
            </div>
          </div>
        </div>

        {/* File Upload Area */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">File Upload</h3>
          </div>
          
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragActive 
                ? 'border-blue-500 bg-blue-50 shadow-lg scale-[1.02]' 
                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
            }`}
          >
            <input {...getInputProps()} />
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload size={32} className="text-blue-600" />
            </div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">
              {isDragActive ? 'Drop your file here' : 'Upload CSV or JSON file'}
            </h4>
            <p className="text-gray-600 mb-4">
              Drag and drop your product data file, or click to browse
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                CSV
              </span>
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                JSON
              </span>
            </div>
          </div>
        </div>

        {/* Preview Data */}
        {previewData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <Eye className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    Product Preview
                  </h3>
                  <p className="text-sm text-gray-600">
                    {importData.length} products loaded • {previewData.length} shown
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <GlassButton
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 px-4 py-2"
                >
                  <Eye size={16} />
                  {showPreview ? 'Hide' : 'Show'} Details
                </GlassButton>
                <GlassButton
                  onClick={clearData}
                  variant="outline"
                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={16} />
                  Clear
                </GlassButton>
              </div>
            </div>

          {showPreview && (
            <div className="space-y-4">
              {previewData.map((product, index) => (
                <ProductPreviewCard
                  key={index}
                  product={product}
                  index={index}
                  isExpanded={expandedProducts.has(index)}
                  isEditing={editingProduct === index}
                  onToggleExpansion={toggleProductExpansion}
                  onStartEditing={startEditing}
                  onSaveEditing={saveEditedProduct}
                  onCancelEditing={cancelEditing}
                />
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
