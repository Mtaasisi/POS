import React from 'react';

const DeviceIntakeUnifiedPage: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 h-full overflow-y-auto pt-8">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">New Device Registration</h1>
          <p className="text-gray-600">This page is temporarily under maintenance. Please check back soon.</p>
        </div>
      </div>
    </div>
  );
};

export { DeviceIntakeUnifiedPage as NewDevicePage };
export default DeviceIntakeUnifiedPage;
