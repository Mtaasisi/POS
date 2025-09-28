import React from 'react';
import { useParams } from 'react-router-dom';

const PurchaseOrderDetailPage: React.FC<{ editMode?: boolean }> = ({ editMode = false }) => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Purchase Order Detail {editMode ? '(Edit Mode)' : ''}
          </h1>
          <p className="text-gray-600">
            Purchase Order ID: {id}
          </p>
          <p className="text-gray-600">
            This is a minimal version of the Purchase Order Detail Page.
          </p>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800">
              ✅ The page is loading successfully! The route is working.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderDetailPage;
