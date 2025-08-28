import React from 'react';
import { Device } from '../../../types';
import StatusBadge from '../../shared/components/ui/StatusBadge';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, User, Calendar, Clock } from 'lucide-react';

interface DeviceDetailHeaderProps {
  device: Device;
}

const DeviceDetailHeader: React.FC<DeviceDetailHeaderProps> = ({ device }) => {
  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Smartphone className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{device.brand} {device.model}</h2>
              <p className="text-gray-600">#{device.id.slice(0, 8)}</p>
            </div>
            <StatusBadge status={device.status} className="ml-2" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Customer: {device.customerName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Received: {new Date(device.createdAt).toLocaleDateString()}</span>
            </div>
            {device.expectedReturnDate && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Expected: {new Date(device.expectedReturnDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex-shrink-0">
          <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
            <QRCodeSVG value={device.id} size={80} className="barcode-svg" />
            <p className="text-xs text-center mt-2 text-gray-600">Device QR</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceDetailHeader;