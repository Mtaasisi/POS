import React, { useState, useRef } from 'react';
import { X, Upload, Download, AlertCircle, CheckCircle, Package, FileText, Info, Shield } from 'lucide-react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { Product, ProductFormData } from '../types/inventory';
import { toast } from 'react-hot-toast';

interface ProductExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (products: Product[]) => void;
}

interface ImportedProduct {
  name: string;
  sku: string;
  barcode?: string;
  categoryId: string;
  brandId?: string;
  supplierId?: string;
  condition: string;
  internalNotes?: string;
  price: number;
  costPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  shortDescription?: string;
  debutDate?: string;
  debutNotes?: string;
  isActive: boolean;
}

interface ImportResult {
  success: boolean;
  product?: Product;
  error?: string;
  rowNumber: number;
}

const ProductExcelImportModal: React.FC<ProductExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [importedData, setImportedData] = useState<ImportedProduct[]>([]);
  const [previewData, setPreviewData] = useState<ImportedProduct[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'import'>('upload');
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editableData, setEditableData] = useState<ImportedProduct[]>([]);
  const [isCompactView, setIsCompactView] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to format product name
  const formatProductName = (name: string): string => {
    if (!name) return '';
    
    // Capitalize first letter of each word
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .trim();
  };

  // Function to format SKU
  const formatSKU = (sku: string): string => {
    if (!sku) return '';
    
    // Remove spaces and convert to uppercase
    return sku.replace(/\s+/g, '').toUpperCase();
  };

  // Function to format condition
  const formatCondition = (condition: string): string => {
    if (!condition) return 'new';
    
    const lowerCondition = condition.toLowerCase().trim();
    
    const conditionMap: { [key: string]: string } = {
      'new': 'new',
      'used': 'used',
      'refurbished': 'refurbished',
      'refurb': 'refurbished',
      'damaged': 'damaged',
      'broken': 'damaged',
      'good': 'good',
      'excellent': 'excellent',
      'fair': 'fair',
      'poor': 'poor'
    };
    
    return conditionMap[lowerCondition] || 'new';
  };

  // Function to validate product data
  const validateProductData = (product: ImportedProduct, rowNumber: number): string[] => {
    const errors: string[] = [];
    
    if (!product.name || product.name.trim().length < 2) {
      errors.push(`Row ${rowNumber}: Product name must be at least 2 characters long`);
    }
    
    if (!product.sku || product.sku.trim().length < 3) {
      errors.push(`Row ${rowNumber}: SKU must be at least 3 characters long`);
    }
    
    if (!product.categoryId || product.categoryId.trim().length === 0) {
      errors.push(`Row ${rowNumber}: Category ID is required`);
    }
    
    if (product.price < 0) {
      errors.push(`Row ${rowNumber}: Price cannot be negative`);
    }
    
    if (product.costPrice < 0) {
      errors.push(`Row ${rowNumber}: Cost price cannot be negative`);
    }
    
    if (product.stockQuantity < 0) {
      errors.push(`Row ${rowNumber}: Stock quantity cannot be negative`);
    }
    
    if (product.minStockLevel < 0) {
      errors.push(`Row ${rowNumber}: Minimum stock level cannot be negative`);
    }
    
    return errors;
  };

  // Function to handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      processExcelFile(selectedFile);
    }
  };

  // Function to process Excel file
  const processExcelFile = async (file: File) => {
    setIsProcessing(true);
    setValidationErrors([]);
    
    try {
      // This is a simplified version - in a real implementation, you'd use a library like xlsx
      // For now, we'll just simulate processing
      const mockData: ImportedProduct[] = [
        {
          name: 'iPhone 14 Pro',
          sku: 'IPH14PRO-128GB',
          barcode: '1234567890123',
          categoryId: 'smartphones',
          brandId: 'apple',
          supplierId: 'supplier1',
          condition: 'new',
          internalNotes: 'Latest model',
          price: 1200000,
          costPrice: 1000000,
          stockQuantity: 10,
          minStockLevel: 2,
          shortDescription: 'Latest iPhone with advanced features',
          isActive: true
        },
        {
          name: 'Samsung Galaxy S23',
          sku: 'SAMS23-256GB',
          barcode: '1234567890124',
          categoryId: 'smartphones',
          brandId: 'samsung',
          supplierId: 'supplier2',
          condition: 'new',
          internalNotes: 'Android flagship',
          price: 900000,
          costPrice: 750000,
          stockQuantity: 15,
          minStockLevel: 3,
          shortDescription: 'Premium Android smartphone',
          isActive: true
        }
      ];
      
      setImportedData(mockData);
      setPreviewData(mockData);
      setEditableData(mockData);
      setCurrentStep('preview');
      
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Failed to process Excel file');
      setValidationErrors(['Failed to process Excel file. Please check the file format.']);
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to handle import
  const handleImport = async () => {
    setIsImporting(true);
    setImportProgress(0);
    setCurrentStep('import');
    
    const results: ImportResult[] = [];
    const totalProducts = previewData.length;
    
    for (let i = 0; i < totalProducts; i++) {
      const product = previewData[i];
      const errors = validateProductData(product, i + 1);
      
      if (errors.length > 0) {
        results.push({
          success: false,
          error: errors.join(', '),
          rowNumber: i + 1
        });
      } else {
        try {
          // Here you would actually import the product to the database
          // For now, we'll just simulate success
          const importedProduct: Product = {
            id: `imported-${Date.now()}-${i}`,
            name: product.name,
            sku: product.sku,
            barcode: product.barcode,
            categoryId: product.categoryId,
            brandId: product.brandId,
            supplierId: product.supplierId,
            condition: product.condition,
            internalNotes: product.internalNotes,
            price: product.price,
            costPrice: product.costPrice,
            stockQuantity: product.stockQuantity,
            minStockLevel: product.minStockLevel,
            images: [],
            variants: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          results.push({
            success: true,
            product: importedProduct,
            rowNumber: i + 1
          });
          
        } catch (error) {
          results.push({
            success: false,
            error: 'Failed to import product',
            rowNumber: i + 1
          });
        }
      }
      
      setImportProgress(((i + 1) / totalProducts) * 100);
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setImportResults(results);
    setIsImporting(false);
    
    const successfulImports = results.filter(r => r.success);
    if (successfulImports.length > 0) {
      const importedProducts = successfulImports.map(r => r.product!).filter(Boolean);
      onImportComplete(importedProducts);
      toast.success(`Successfully imported ${successfulImports.length} products`);
    }
  };

  // Function to handle close
  const handleClose = () => {
    setFile(null);
    setImportedData([]);
    setPreviewData([]);
    setEditableData([]);
    setCurrentStep('upload');
    setImportProgress(0);
    setImportResults([]);
    setValidationErrors([]);
    setIsProcessing(false);
    setIsImporting(false);
    setIsEditMode(false);
    setIsCompactView(false);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    onClose();
  };

  // Function to download template
  const downloadTemplate = () => {
    const template = [
      ['Name', 'SKU', 'Barcode', 'Category ID', 'Brand ID', 'Supplier ID', 'Condition', 'Internal Notes', 'Price', 'Cost Price', 'Stock Quantity', 'Min Stock Level', 'Short Description', 'Is Active'],
      ['iPhone 14 Pro', 'IPH14PRO-128GB', '1234567890123', 'smartphones', 'apple', 'supplier1', 'new', 'Latest model', '1200000', '1000000', '10', '2', 'Latest iPhone with advanced features', 'true']
    ];
    const csvContent = template.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'product_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <GlassCard className="w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 relative">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
          onClick={handleClose}
        >
          <X size={24} />
        </button>
        
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Import Products from Excel</h2>
        
        {currentStep === 'upload' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mb-4">
                <Package size={48} className="mx-auto text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Upload Excel File</h3>
              <p className="text-gray-600 mb-4">
                Upload an Excel file (.xlsx, .xls) or CSV file with product data
              </p>
              
              <div className="flex gap-4 justify-center">
                <GlassButton
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                >
                  <Upload size={16} className="mr-2" />
                  {isProcessing ? 'Processing...' : 'Choose File'}
                </GlassButton>
                
                <GlassButton variant="secondary" onClick={downloadTemplate}>
                  <Download size={16} className="mr-2" />
                  Download Template
                </GlassButton>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start">
                <Info size={20} className="text-blue-500 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Import Guidelines</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Required fields: Name, SKU, Category ID, Price, Cost Price</li>
                    <li>• SKU must be unique and at least 3 characters long</li>
                    <li>• Condition can be: new, used, refurbished, damaged, good, excellent, fair, poor</li>
                    <li>• Prices should be in Tanzanian Shillings (TZS)</li>
                    <li>• Stock quantities and minimum levels must be non-negative</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {currentStep === 'preview' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Preview Data</h3>
              <div className="flex gap-2">
                <GlassButton
                  variant="secondary"
                  onClick={() => setIsEditMode(!isEditMode)}
                >
                  {isEditMode ? 'View Mode' : 'Edit Mode'}
                </GlassButton>
                <GlassButton
                  variant="secondary"
                  onClick={() => setIsCompactView(!isCompactView)}
                >
                  {isCompactView ? 'Detailed View' : 'Compact View'}
                </GlassButton>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-left">Name</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">SKU</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Category</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Price (TZS)</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Stock</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Condition</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((product, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-3 py-2">{product.name}</td>
                      <td className="border border-gray-300 px-3 py-2">{product.sku}</td>
                      <td className="border border-gray-300 px-3 py-2">{product.categoryId}</td>
                      <td className="border border-gray-300 px-3 py-2">{product.price.toLocaleString()}</td>
                      <td className="border border-gray-300 px-3 py-2">{product.stockQuantity}</td>
                      <td className="border border-gray-300 px-3 py-2">{product.condition}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex gap-2 justify-end">
              <GlassButton variant="secondary" onClick={() => setCurrentStep('upload')}>
                Back
              </GlassButton>
              <GlassButton onClick={handleImport} disabled={isImporting}>
                {isImporting ? 'Importing...' : 'Import Products'}
              </GlassButton>
            </div>
          </div>
        )}
        
        {currentStep === 'import' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Import Results</h3>
            
            {isImporting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Importing products...</span>
                  <span>{Math.round(importProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
              </div>
            )}
            
            {!isImporting && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle size={20} className="text-green-500 mr-2" />
                      <span className="font-semibold text-green-900">
                        {importResults.filter(r => r.success).length} Successful
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle size={20} className="text-red-500 mr-2" />
                      <span className="font-semibold text-red-900">
                        {importResults.filter(r => !r.success).length} Failed
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <FileText size={20} className="text-blue-500 mr-2" />
                      <span className="font-semibold text-blue-900">
                        {importResults.length} Total
                      </span>
                    </div>
                  </div>
                </div>
                
                {importResults.filter(r => !r.success).length > 0 && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-900 mb-2">Failed Imports</h4>
                    <div className="space-y-1">
                      {importResults
                        .filter(r => !r.success)
                        .map((result, index) => (
                          <div key={index} className="text-sm text-red-800">
                            Row {result.rowNumber}: {result.error}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex gap-2 justify-end">
              <GlassButton variant="secondary" onClick={handleClose}>
                Close
              </GlassButton>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default ProductExcelImportModal;
