import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EnhancedExcelImportModal from '../components/EnhancedExcelImportModal';
import { Customer } from '../types';
import { ArrowLeft, Upload, Users, CheckCircle, SkipForward, AlertCircle, Eye } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { useAuth } from '../context/AuthContext';

const ExcelImportPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [importHistory, setImportHistory] = useState<{
    imported: Customer[];
    skipped: number;
    failed: number;
    timestamp: string;
  }[]>([]);

  const handleImportComplete = (customers: Customer[]) => {
    // Add to import history
    const newHistory = {
      imported: customers,
      skipped: 0, // This would be calculated from the modal results
      failed: 0, // This would be calculated from the modal results
      timestamp: new Date().toLocaleString()
    };
    setImportHistory(prev => [newHistory, ...prev.slice(0, 4)]); // Keep last 5 imports
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate('/customers')}
            className="mr-4 p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Import Customers from Excel</h1>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Import Section */}
          <GlassCard className="p-6">
            <div className="text-center mb-6">
              {currentUser?.role === 'admin' ? (
                <Upload className="w-16 h-16 mx-auto text-blue-500 mb-4" />
              ) : (
                <Eye className="w-16 h-16 mx-auto text-green-500 mb-4" />
              )}
              <h2 className="text-xl font-semibold mb-2">
                {currentUser?.role === 'admin' ? 'Bulk Import Customers' : 'View Import Results'}
              </h2>
              <p className="text-gray-600 mb-4">
                {currentUser?.role === 'admin' 
                  ? 'Import customers from Excel/CSV files. Existing customers will be automatically skipped.'
                  : 'View import results and customer data. Only administrators can perform imports.'
                }
              </p>
            </div>

            <div className="space-y-4 mb-6">
              {currentUser?.role === 'admin' ? (
                <>
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <h3 className="font-medium text-blue-900">Auto-skip existing customers</h3>
                      <p className="text-sm text-blue-700">Based on phone number or email</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <Users className="w-5 h-5 text-green-500" />
                    <div>
                      <h3 className="font-medium text-green-900">Bulk processing</h3>
                      <p className="text-sm text-green-700">Import hundreds of customers at once</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                    <SkipForward className="w-5 h-5 text-yellow-500" />
                    <div>
                      <h3 className="font-medium text-yellow-900">Smart validation</h3>
                      <p className="text-sm text-yellow-700">Automatic phone formatting and validation</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                    <Eye className="w-5 h-5 text-green-500" />
                    <div>
                      <h3 className="font-medium text-green-900">View import results</h3>
                      <p className="text-sm text-green-700">See what passed and failed</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                    <div>
                      <h3 className="font-medium text-blue-900">Track progress</h3>
                      <p className="text-sm text-blue-700">Monitor import status and results</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    <div>
                      <h3 className="font-medium text-yellow-900">Read-only access</h3>
                      <p className="text-sm text-yellow-700">View data without import permissions</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <GlassButton
              onClick={() => setIsModalOpen(true)}
              className="w-full"
            >
              {currentUser?.role === 'admin' ? (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Start Import
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  View Import
                </>
              )}
            </GlassButton>
          </GlassCard>

          {/* Instructions */}
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              {currentUser?.role === 'admin' ? 'How to Import' : 'How to View Results'}
            </h2>
            
            <div className="space-y-4">
              {currentUser?.role === 'admin' ? (
                <>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                      1
                    </div>
                    <div>
                      <h3 className="font-medium">Prepare your file</h3>
                      <p className="text-sm text-gray-600">Use CSV format with headers: name, phone, email, gender, city, etc.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                      2
                    </div>
                    <div>
                      <h3 className="font-medium">Upload and preview</h3>
                      <p className="text-sm text-gray-600">Review the data and see which customers will be imported vs skipped</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                      3
                    </div>
                    <div>
                      <h3 className="font-medium">Import and confirm</h3>
                      <p className="text-sm text-gray-600">Start the import process and review results</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                      1
                    </div>
                    <div>
                      <h3 className="font-medium">View import status</h3>
                      <p className="text-sm text-gray-600">See which customers were imported, skipped, or failed</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                      2
                    </div>
                    <div>
                      <h3 className="font-medium">Review results</h3>
                      <p className="text-sm text-gray-600">Check detailed information about import outcomes</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                      3
                    </div>
                    <div>
                      <h3 className="font-medium">Monitor progress</h3>
                      <p className="text-sm text-gray-600">Track import progress and final results</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {currentUser?.role === 'admin' && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Required Fields:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>name</strong> - Customer's full name</li>
                  <li>• <strong>phone</strong> - Phone number (auto-formats with 255 prefix)</li>
                  <li>• <strong>email</strong> - Email address (optional)</li>
                  <li>• <strong>gender</strong> - male, female, or other</li>
                  <li>• <strong>city</strong> - City/location</li>
                </ul>
              </div>
            )}
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
                      <p className="font-medium">Import completed</p>
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
      />
    </div>
  );
};

export default ExcelImportPage; 