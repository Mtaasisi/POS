// Bulk Import Modal for LATS Inventory
import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle, Download, Trash2 } from 'lucide-react';
import { useInventoryStore } from '../../stores/useInventoryStore';
import { toast } from 'react-hot-toast';

interface BulkImportData {
  file: File;
  categoryId?: string;
  brandId?: string;
  supplierId?: string;
  defaultPrice?: number;
  defaultCost?: number;
  defaultStock?: number;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

const BulkImportModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (result: ImportResult) => void;
}> = ({ isOpen, onClose, onImportComplete }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { categories, brands, suppliers, createProduct } = useInventoryStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<BulkImportData>();

  const watchedFile = watch('file');

  // Parse Excel/CSV file
  const parseFile = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          
          const data = lines.slice(1)
            .filter(line => line.trim())
            .map((line, index) => {
              const values = line.split(',').map(v => v.trim());
              const row: any = {};
              
              headers.forEach((header, i) => {
                row[header] = values[i] || '';
              });
              
              row._rowIndex = index + 2; // Excel row number (1-based + header)
              return row;
            });
          
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  // Preview file data
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseFile(file);
      setPreviewData(data.slice(0, 5)); // Show first 5 rows
      toast.success(`File loaded: ${data.length} products found`);
    } catch (error) {
      toast.error('Error parsing file. Please check the format.');
      console.error('File parsing error:', error);
    }
  };

  // Import products
  const handleImport = async (data: BulkImportData) => {
    if (!data.file) {
      toast.error('Please select a file to import');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);
    setImportResult(null);

    try {
      const fileData = await parseFile(data.file);
      const results: ImportResult = {
        success: 0,
        failed: 0,
        errors: []
      };

      // Process each row
      for (let i = 0; i < fileData.length; i++) {
        const row = fileData[i];
        
        try {
          // Validate required fields
          if (!row.name || !row.sku) {
            throw new Error(`Row ${row._rowIndex}: Missing required fields (name, sku)`);
          }

          // Create product data
          const productData = {
            name: row.name,
            description: row.description || '',
            sku: row.sku,
            barcode: row.barcode || '',
            categoryId: data.categoryId || row.category_id || '',
            brandId: data.brandId || row.brand_id || '',
            supplierId: data.supplierId || row.supplier_id || '',
            variants: [{
              sku: row.sku,
              name: row.variant_name || 'Default Variant',
              barcode: row.barcode || '',
              price: parseFloat(row.price) || data.defaultPrice || 0,
              costPrice: parseFloat(row.cost_price) || data.defaultCost || 0,
              stockQuantity: parseInt(row.stock_quantity) || data.defaultStock || 0,
              minStockLevel: parseInt(row.min_stock) || 5,
      
              attributes: {}
            }],
            isActive: true,
            
            metadata: {}
          };

          // Create product
          const result = await createProduct(productData);
          
          if (result.ok) {
            results.success++;
          } else {
            results.failed++;
            results.errors.push(`Row ${row._rowIndex}: ${result.message}`);
          }
        } catch (error) {
          results.failed++;
          results.errors.push(`Row ${row._rowIndex}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }

        // Update progress
        setImportProgress(((i + 1) / fileData.length) * 100);
      }

      setImportResult(results);
      
      if (results.success > 0) {
        toast.success(`Import completed: ${results.success} products imported successfully`);
      }
      
      if (results.failed > 0) {
        toast.error(`${results.failed} products failed to import. Check the error log.`);
      }

      onImportComplete?.(results);
    } catch (error) {
      toast.error('Import failed. Please check your file format.');
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
    }
  };

  // Download template
  const downloadTemplate = () => {
    // Create a comprehensive template with instructions and sample data
    const template = `Product Import Template - LATS System
Instructions:
1. Fill in the required fields (marked with *)

3. Prices should be numbers only (no currency symbols)
4. Stock quantities should be whole numbers
5. Category, Brand, and Supplier IDs can be left empty if not available

Required Fields (*),name*,sku*,barcode,description,price,cost_price,stock_quantity,min_stock,max_stock,category_id,brand_id,supplier_id,variant_name
Sample Product 1,iPhone 14 Pro,IPH14P-128,1234567890123,Latest iPhone model with A16 chip,159999,120000,15,5,50,,,smartphone,apple,Default Variant
Sample Product 2,Samsung Galaxy S23,SAMS23-256,1234567890124,Flagship Android phone with Snapdragon,129999,100000,12,5,50,,,smartphone,samsung,Default Variant
Sample Product 3,MacBook Air M2,MBA-M2-256,1234567890125,13-inch laptop with Apple M2 chip,899999,750000,8,3,25,,,laptop,apple,Default Variant
Sample Product 4,AirPods Pro,APP-GEN2,1234567890126,Wireless earbuds with noise cancellation,299999,200000,20,10,100,,,audio,apple,Default Variant
Sample Product 5,Galaxy Watch 6,GW6-44MM,1234567890127,Smartwatch with health tracking,199999,150000,10,5,30,,,wearable,samsung,Default Variant

Field Descriptions:
name* - Product name (required)
sku* - Stock Keeping Unit (required, unique identifier)
barcode - Product barcode (optional)
description - Product description (optional)
price - Selling price in cents (e.g., 159999 = 1,599.99)
cost_price - Cost price in cents (e.g., 120000 = 1,200.00)
stock_quantity - Current stock level
min_stock - Minimum stock level for alerts
max_stock - Maximum stock level
category_id - Category UUID (optional)
brand_id - Brand UUID (optional)
supplier_id - Supplier UUID (optional)

variant_name - Product variant name (optional)`;

    // Add BOM for Excel compatibility
    const BOM = '\uFEFF';
    const csvContent = BOM + template;
    
    // Create the blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lats_product_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    // Show comprehensive instructions
    toast.success('✅ Product import template downloaded! Open in Excel for best formatting. Required fields: name, sku');
  };

  // Reset form
  const handleClose = () => {
    reset();
    setPreviewData([]);
    setImportResult(null);
    setImportProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Bulk Import Products</h2>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XCircle className="w-6 h-6" />
            </button>
          </div>

          {!isImporting && !importResult && (
            <form onSubmit={handleSubmit(handleImport)} className="space-y-6">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload CSV/Excel File
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                    {...register('file', { required: 'File is required' })}
                  />
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">
                    Drag and drop your file here, or{' '}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports CSV, Excel files. Max 1000 products per import.
                  </p>
                  {watchedFile && (
                    <div className="mt-4 p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-green-600" />
                        <span className="text-green-800">{watchedFile.name}</span>
                      </div>
                    </div>
                  )}
                </div>
                {errors.file && (
                  <p className="mt-1 text-sm text-red-600">{errors.file.message}</p>
                )}
              </div>

              {/* Default Values */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Category
                  </label>
                  <select
                    {...register('categoryId')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Brand
                  </label>
                  <select
                    {...register('brandId')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Brand</option>
                    {brands.map(brand => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Price (TZS)
                  </label>
                  <input
                    type="number"
                    {...register('defaultPrice', { min: 0 })}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Stock
                  </label>
                  <input
                    type="number"
                    {...register('defaultStock', { min: 0 })}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Preview */}
              {previewData.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Preview (First 5 rows)</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          {Object.keys(previewData[0] || {}).filter(key => !key.startsWith('_')).map(key => (
                            <th key={key} className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                              {key}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((row, index) => (
                          <tr key={index} className="border-t border-gray-200">
                            {Object.keys(row).filter(key => !key.startsWith('_')).map(key => (
                              <td key={key} className="px-4 py-2 text-sm text-gray-900">
                                {row[key]}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download Template
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <GlassButton
                    type="button"
                    onClick={handleClose}
                    variant="secondary"
                  >
                    Cancel
                  </GlassButton>
                  <GlassButton
                    type="submit"
                    disabled={!watchedFile || isImporting}
                    loading={isImporting}
                  >
                    {isImporting ? 'Importing...' : 'Start Import'}
                  </GlassButton>
                </div>
              </div>
            </form>
          )}

          {/* Import Progress */}
          {isImporting && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Importing Products</h3>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">{Math.round(importProgress)}% complete</p>
              </div>
            </div>
          )}

          {/* Import Results */}
          {importResult && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Import Results</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-900">Successful</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600 mt-1">
                      {importResult.success}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2">
                      <XCircle className="w-5 h-5 text-red-600" />
                      <span className="font-semibold text-red-900">Failed</span>
                    </div>
                    <div className="text-2xl font-bold text-red-600 mt-1">
                      {importResult.failed}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-blue-600" />
                      <span className="font-semibold text-blue-900">Total</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-600 mt-1">
                      {importResult.success + importResult.failed}
                    </div>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="text-left">
                    <h4 className="font-medium text-gray-900 mb-2">Errors:</h4>
                    <div className="max-h-40 overflow-y-auto bg-red-50 rounded-lg p-3">
                      {importResult.errors.map((error, index) => (
                        <div key={index} className="text-sm text-red-700 mb-1">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6">
                  <GlassButton onClick={handleClose}>
                    Close
                  </GlassButton>
                </div>
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default BulkImportModal;
