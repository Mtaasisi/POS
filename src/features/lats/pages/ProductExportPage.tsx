import React from 'react';
import { ArrowLeft, FileSpreadsheet, Download, Database, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import GlassButton from '../../shared/components/ui/GlassButton';
import GlassCard from '../../shared/components/ui/GlassCard';
import ProductExcelExport from '../components/inventory/ProductExcelExport';

const ProductExportPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <GlassButton
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </GlassButton>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Export Center</h1>
          <p className="text-gray-600">Export your complete product catalog with all data</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <GlassCard className="p-4 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Database className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-600">Complete Data</div>
          <div className="text-sm text-gray-600">All product fields included</div>
        </GlassCard>
        
        <GlassCard className="p-4 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <FileSpreadsheet className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-600">Excel Ready</div>
          <div className="text-sm text-gray-600">CSV format for Excel</div>
        </GlassCard>
        
        <GlassCard className="p-4 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <BarChart3 className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-600">Analytics Ready</div>
          <div className="text-sm text-gray-600">Perfect for analysis</div>
        </GlassCard>
      </div>

      {/* Main Export Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export Component */}
        <div className="lg:col-span-2">
          <ProductExcelExport />
        </div>

        {/* Export Information */}
        <div className="space-y-4">
          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Download className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Export Features</h3>
                <p className="text-sm text-gray-600">What you'll get</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Product Information</p>
                  <p className="text-xs text-gray-600">Name, description, SKU, tags</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Relationships</p>
                  <p className="text-xs text-gray-600">Category, brand, supplier names</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Variant Data</p>
                  <p className="text-xs text-gray-600">Prices, stock levels, dimensions</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Metadata</p>
                  <p className="text-xs text-gray-600">Status, dates, conditions</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Calculations</p>
                  <p className="text-xs text-gray-600">Total quantities and values</p>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">File Format</h3>
                <p className="text-sm text-gray-600">CSV with Excel compatibility</p>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">File Type:</span>
                <span className="font-medium">CSV (Comma Separated Values)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Excel Compatible:</span>
                <span className="font-medium text-green-600">Yes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Encoding:</span>
                <span className="font-medium">UTF-8 with BOM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Special Characters:</span>
                <span className="font-medium text-green-600">Properly Escaped</span>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-teal-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Use Cases</h3>
                <p className="text-sm text-gray-600">What you can do with the data</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-teal-500 rounded-full"></div>
                <span className="text-gray-700">Inventory analysis and reporting</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-teal-500 rounded-full"></div>
                <span className="text-gray-700">Price optimization studies</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-teal-500 rounded-full"></div>
                <span className="text-gray-700">Stock level monitoring</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-teal-500 rounded-full"></div>
                <span className="text-gray-700">Supplier performance analysis</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-teal-500 rounded-full"></div>
                <span className="text-gray-700">Category performance review</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-teal-500 rounded-full"></div>
                <span className="text-gray-700">Data backup and migration</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default ProductExportPage;
