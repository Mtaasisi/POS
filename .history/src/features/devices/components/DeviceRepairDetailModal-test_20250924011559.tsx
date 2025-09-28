import React from 'react';

interface DeviceRepairDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string;
}

const DeviceRepairDetailModal: React.FC<DeviceRepairDetailModalProps> = ({
  isOpen,
  onClose,
  deviceId
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4" style={{ zIndex: 99999 }}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Device Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
          <p>Device ID: {deviceId}</p>
          <p>This is a test modal to verify the import works.</p>
        </div>
      </div>
    </div>
  );
};

export default DeviceRepairDetailModal;
