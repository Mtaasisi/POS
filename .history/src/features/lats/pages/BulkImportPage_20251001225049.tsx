import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BackButton } from '../../shared/components/ui/BackButton';
import BulkProductImport from '../components/product/BulkProductImport';

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
        <Suspense fallback={
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading import component...</span>
          </div>
        }>
          <BulkProductImport />
        </Suspense>
      </div>
    </div>
  );
};

export default BulkImportPage;