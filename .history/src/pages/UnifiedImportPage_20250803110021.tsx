import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EnhancedExcelImportModal from '../components/EnhancedExcelImportModal';
import CustomerUpdateImportModal from '../components/CustomerUpdateImportModal';
import { Customer } from '../types';
import { 
  ArrowLeft, 
  Upload, 
  Users, 
  CheckCircle, 
  SkipForward, 
  AlertCircle, 
  Eye, 
  FileSpreadsheet,
  UserPlus,
  Download,
  Smartphone,
  Globe,
  Calendar,
  MapPin,
  MessageSquare,
  Award,
  Tag,
  CreditCard,
  Star,
  RefreshCw
} from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { useAuth } from '../context/AuthContext';

const UnifiedImportPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [importMode, setImportMode] = useState<'excel' | 'manual' | 'update'>('excel');
  const [importHistory, setImportHistory] = useState<{
    imported: Customer[];
    skipped: number;
    failed: number;
    timestamp: string;
    mode: 'excel' | 'manual' | 'update';
  }[]>([]);

  const handleImportComplete = (customers: Customer[]) => {
    // Add to import history
    const newHistory = {
      imported: customers,
      skipped: 0, // This would be calculated from the modal results
      failed: 0, // This would be calculated from the modal results
      timestamp: new Date().toLocaleString(),
      mode: importMode
    };
    setImportHistory(prev => [newHistory, ...prev.slice(0, 4)]); // Keep last 5 imports
  };

  const handleUpdateImportComplete = (updatedCustomers: Customer[]) => {
    // Add to import history
    const newHistory = {
      imported: updatedCustomers,
      skipped: 0, // This would be calculated from the modal results
      failed: 0, // This would be calculated from the modal results
      timestamp: new Date().toLocaleString(),
      mode: 'update'
    };
    setImportHistory(prev => [newHistory, ...prev.slice(0, 4)]); // Keep last 5 imports
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/customers')}
            className="mr-4 p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Import Customers</h1>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Import Options */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Excel Import Option */}
              <GlassCard className="p-6 hover:shadow-lg transition-shadow cursor-pointer" 
                onClick={() => {
                  setImportMode('excel');
                  setIsModalOpen(true);
                }}>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileSpreadsheet className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Import from Excel</h2>
                  <p className="text-gray-600 mb-4">
                    Upload Excel/CSV files with intelligent column detection
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <h3 className="font-medium text-green-900">Smart Column Detection</h3>
                      <p className="text-sm text-green-700">Automatically detects column positions</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Users className="w-5 h-5 text-blue-500" />
                    <div>
                      <h3 className="font-medium text-blue-900">Bulk Processing</h3>
                      <p className="text-sm text-blue-700">Import hundreds of customers at once</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                    <SkipForward className="w-5 h-5 text-yellow-500" />
                    <div>
                      <h3 className="font-medium text-yellow-900">Auto-skip Existing</h3>
                      <p className="text-sm text-yellow-700">Skip customers that already exist</p>
                    </div>
                  </div>
                </div>

                <GlassButton
                  onClick={() => {
                    setImportMode('excel');
                    setIsModalOpen(true);
                  }}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Import from Excel
                </GlassButton>
              </GlassCard>

              {/* Manual Entry Option */}
              <GlassCard className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  setImportMode('manual');
                  setIsModalOpen(true);
                }}>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserPlus className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Manual Entry</h2>
                  <p className="text-gray-600 mb-4">
                    Add customers one by one with full control
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <UserPlus className="w-5 h-5 text-blue-500" />
                    <div>
                      <h3 className="font-medium text-blue-900">Individual Entry</h3>
                      <p className="text-sm text-blue-700">Add customers one at a time</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-purple-500" />
                    <div>
                      <h3 className="font-medium text-purple-900">Full Validation</h3>
                      <p className="text-sm text-purple-700">Real-time validation and formatting</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
                    <Star className="w-5 h-5 text-indigo-500" />
                    <div>
                      <h3 className="font-medium text-indigo-900">Complete Control</h3>
                      <p className="text-sm text-indigo-700">Full control over each field</p>
                    </div>
                  </div>
                </div>

                <GlassButton
                  onClick={() => {
                    setImportMode('manual');
                    setIsModalOpen(true);
                  }}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Manual Entry
                </GlassButton>
              </GlassCard>

              {/* Update Existing Option */}
              <GlassCard className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  setImportMode('update');
                  setIsUpdateModalOpen(true);
                }}>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <RefreshCw className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Update Existing</h2>
                  <p className="text-gray-600 mb-4">
                    Update existing customers with new information
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                    <RefreshCw className="w-5 h-5 text-orange-500" />
                    <div>
                      <h3 className="font-medium text-orange-900">Smart Matching</h3>
                      <p className="text-sm text-orange-700">Matches by phone, WhatsApp, or email</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                    <div>
                      <h3 className="font-medium text-blue-900">Selective Updates</h3>
                      <p className="text-sm text-blue-700">Only updates empty/null fields</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <h3 className="font-medium text-green-900">Safe Updates</h3>
                      <p className="text-sm text-green-700">Preserves existing data</p>
                    </div>
                  </div>
                </div>

                <GlassButton
                  onClick={() => {
                    setImportMode('update');
                    setIsUpdateModalOpen(true);
                  }}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Update Existing
                </GlassButton>
              </GlassCard>
            </div>
          </div>

          {/* Instructions & Features */}
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4">Features & Instructions</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                  1
                </div>
                <div>
                  <h3 className="font-medium">Choose Import Method</h3>
                  <p className="text-sm text-gray-600">Select Excel import, manual entry, or update existing customers</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                  2
                </div>
                <div>
                  <h3 className="font-medium">Prepare Your Data</h3>
                  <p className="text-sm text-gray-600">For Excel: Use CSV format with headers. For manual: Fill out the form. For update: Include phone/email for matching</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                  3
                </div>
                <div>
                  <h3 className="font-medium">Review & Import</h3>
                  <p className="text-sm text-gray-600">Preview your data and confirm the import/update</p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-3">Supported Fields:</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-500" />
                  <span>Name</span>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-green-500" />
                  <span>Phone</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-purple-500" />
                  <span>Email</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-500" />
                  <span>City</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-green-500" />
                  <span>WhatsApp</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  <span>Birthday</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-500" />
                  <span>Loyalty Level</span>
                </div>
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-pink-500" />
                  <span>Color Tag</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-500" />
                  <span>Total Spent</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-500" />
                  <span>Points</span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Smart Features:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Intelligent Column Detection</strong> - Works with any column order</li>
                <li>• <strong>Auto Phone Formatting</strong> - Adds +255 prefix automatically</li>
                <li>• <strong>Duplicate Detection</strong> - Prevents duplicate entries</li>
                <li>• <strong>Real-time Validation</strong> - Checks data as you enter</li>
                <li>• <strong>Smart Customer Matching</strong> - Updates existing customers by phone/email</li>
                <li>• <strong>Selective Updates</strong> - Only updates empty fields in existing customers</li>
              </ul>
            </div>
          </GlassCard>
        </div>

        {/* Import History */}
        {importHistory.length > 0 && (
          <GlassCard className="mt-6 p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Imports</h2>
            <div className="space-y-3">
              {importHistory.map((import_, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="font-medium">
                        {import_.mode === 'excel' ? 'Excel Import' : 
                         import_.mode === 'manual' ? 'Manual Entry' : 
                         import_.mode === 'update' ? 'Update Existing' : 'Import'} completed
                      </p>
                      <p className="text-sm text-gray-600">{import_.timestamp}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-green-600">{import_.imported.length} imported</span>
                    {import_.skipped > 0 && (
                      <span className="text-yellow-600">{import_.skipped} skipped</span>
                    )}
                    {import_.failed > 0 && (
                      <span className="text-red-600">{import_.failed} failed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </div>

      {/* Enhanced Excel Import Modal */}
      <EnhancedExcelImportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onImportComplete={handleImportComplete}
        mode={importMode}
      />

      {/* Customer Update Import Modal */}
      <CustomerUpdateImportModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        onImportComplete={handleUpdateImportComplete}
      />
    </div>
  );
};

export default UnifiedImportPage; 