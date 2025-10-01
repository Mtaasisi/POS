import React from 'react';
import { BackButton } from '../../shared/components/ui/BackButton';
import BulkProductImport from '../components/product/BulkProductImport';

const BulkImportPage: React.FC = () => {

  return (
    <div className="p-2 sm:p-4 h-full overflow-y-auto pt-4">
      <div className="max-w-4xl mx-auto space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton to="/lats/unified-inventory" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Bulk Product Import</h1>
              <p className="text-sm text-gray-600">Import multiple products from CSV or JSON files</p>
            </div>
          </div>
        </div>

        {/* Import Component */}
        <BulkProductImport />
      </div>
    </div>
  );
};

export default BulkImportPage;