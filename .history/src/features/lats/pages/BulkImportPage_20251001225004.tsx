import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BackButton } from '../../shared/components/ui/BackButton';

// Simple test component to isolate the issue
const BulkProductImport = () => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Bulk Product Import</h2>
      <p className="text-gray-600">This is a test component to verify the import works.</p>
    </div>
  );
};

const BulkImportPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <BackButton onClick={() => navigate('/lats/inventory')} />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bulk Product Import</h1>
            <p className="text-gray-600 mt-2">
              Import multiple products from CSV or JSON files
            </p>
          </div>
        </div>

        {/* Import Component */}
        <BulkProductImport />
      </div>
    </div>
  );
};

export default BulkImportPage;