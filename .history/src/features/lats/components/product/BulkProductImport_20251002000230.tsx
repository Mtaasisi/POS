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
  ChevronUp,
  Package,
  FileText,
  BarChart3
} from 'lucide-react';
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
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-blue-300 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggleExpansion(index)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isExpanded ? <ChevronUp size={16} className="text-gray-700" /> : <ChevronDown size={16} className="text-gray-700" />}
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
              <p className="text-sm text-gray-600">SKU: {product.sku}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <button
              onClick={() => onStartEditing(index)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit product"
            >
              <Edit3 size={16} />
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Save changes"
              >
                <Save size={16} />
              </button>
              <button
                onClick={handleCancel}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs font-medium text-gray-600 mb-1">Cost Price</div>
            <div className="text-base font-bold text-gray-900">TZS {product.costPrice.toLocaleString()}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs font-medium text-gray-600 mb-1">Selling Price</div>
            <div className="text-base font-bold text-gray-900">TZS {product.sellingPrice.toLocaleString()}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs font-medium text-gray-600 mb-1">Stock</div>
            <div className="text-base font-bold text-gray-900">{product.stockQuantity}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs font-medium text-gray-600 mb-1">Min Level</div>
            <div className="text-base font-bold text-gray-900">{product.minStockLevel}</div>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
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
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h3 className="text-base font-bold text-gray-900 mb-3">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-600">Product Name</div>
            <div className="text-sm font-semibold text-gray-900">{product.name}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-600">SKU</div>
            <div className="text-sm font-semibold text-gray-900 font-mono">{product.sku}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-600">Category</div>
            <div className="text-sm font-semibold text-gray-900">{product.category || 'Not specified'}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs font-medium text-gray-600">Supplier</div>
            <div className="text-sm font-semibold text-gray-900">{product.supplier || 'Not specified'}</div>
          </div>
        </div>
        {product.description && (
          <div className="mt-4">
            <div className="text-xs font-medium text-gray-600 mb-1">Description</div>
            <div className="text-sm text-gray-800 bg-gray-50 rounded-lg p-3">{product.description}</div>
          </div>
        )}
      </div>

      {/* Pricing & Stock */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h3 className="text-base font-bold text-gray-900 mb-3">Pricing & Stock</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs font-medium text-gray-600 mb-1">Cost Price</div>
            <div className="text-base font-bold text-gray-900">TZS {product.costPrice.toLocaleString()}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs font-medium text-gray-600 mb-1">Selling Price</div>
            <div className="text-base font-bold text-gray-900">TZS {product.sellingPrice.toLocaleString()}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs font-medium text-gray-600 mb-1">Stock Quantity</div>
            <div className="text-base font-bold text-gray-900">{product.stockQuantity}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs font-medium text-gray-600 mb-1">Min Stock Level</div>
            <div className="text-base font-bold text-gray-900">{product.minStockLevel}</div>
          </div>
        </div>
        <div className="mt-4 bg-green-50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-medium text-green-700">Profit Margin</div>
            <div className="text-lg font-bold text-green-900">
              {((product.sellingPrice - product.costPrice) / product.costPrice * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Variants */}
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h3 className="text-base font-bold text-gray-900 mb-3">Product Variants</h3>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600">Variant Name</div>
              <div className="text-sm font-semibold text-gray-900">Default</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600">Variant SKU</div>
              <div className="text-sm font-semibold text-gray-900 font-mono">{product.sku}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600">Cost Price</div>
              <div className="text-sm font-semibold text-gray-900">TZS {product.costPrice.toLocaleString()}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-600">Selling Price</div>
              <div className="text-sm font-semibold text-gray-900">TZS {product.sellingPrice.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications */}
      {product.specifications && Object.keys(product.specifications).length > 0 && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h3 className="text-base font-bold text-gray-900 mb-3">Specifications</h3>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <div className="text-xs font-medium text-gray-600">{key}</div>
                  <div className="text-sm font-semibold text-gray-900">{String(value)}</div>
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
  const [showPreview, setShowPreview] = useState(true);
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
      setPreviewData(products); // Show all products for preview
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
    <div className="space-y-6">
      {/* Download Template Button */}
      <div className="flex justify-end">
        <button
          onClick={downloadSampleCSV}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          <Download size={14} />
          <span className="hidden sm:inline">Download Template</span>
          <span className="sm:hidden">Template</span>
        </button>
      </div>

        {/* File Upload Area */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Upload File</h2>
              <p className="text-sm text-gray-600">Choose your CSV or JSON file to import products</p>
            </div>
          </div>
          
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragActive 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload size={32} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {isDragActive ? 'Drop your file here' : 'Upload CSV or JSON file'}
            </h3>
            <p className="text-gray-600 mb-4">
              Drag and drop your product data file, or click to browse
            </p>
            <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-2 px-2 py-1 bg-green-100 text-green-700 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                CSV
              </span>
              <span className="flex items-center gap-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                JSON
              </span>
            </div>
          </div>
        </div>

        {/* Preview Data */}
        {previewData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <Eye className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Product Preview</h2>
                  <p className="text-sm text-gray-600">
                    {importData.length} products loaded • {previewData.length} shown
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Eye size={14} />
                  {showPreview ? 'Hide' : 'Show'} Details
                </button>
                <button
                  onClick={clearData}
                  className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  <Trash2 size={14} />
                  Clear
                </button>
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
            </div>
          )}
        </div>
      )}

        {/* Import Actions */}
        {importData.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                  <Plus className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Ready to Import</h2>
                  <p className="text-sm text-gray-600">
                    {importData.length} products ready for import
                  </p>
                </div>
              </div>
              <button
                onClick={importProducts}
                disabled={isImporting}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
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
              </button>
            </div>
          </div>
        )}

        {/* Import Results */}
        {importResults.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Import Results</h2>
                <p className="text-sm text-gray-600">
                  {importResults.filter(r => r.status === 'success').length} successful, {importResults.filter(r => r.status === 'error').length} failed
                </p>
              </div>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {importResults.map((result, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                    result.status === 'success' 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  {result.status === 'success' ? (
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle size={16} className="text-green-600" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <AlertCircle size={16} className="text-red-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-base font-bold text-gray-900">{result.product}</p>
                    {result.error && (
                      <p className="text-red-600 mt-1 text-sm">{result.error}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkProductImport;
