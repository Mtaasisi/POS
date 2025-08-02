import React, { forwardRef } from 'react';
import { Device } from '../types';

interface PrintableSlipProps {
  device: Device;
}

const PrintableSlip = forwardRef<HTMLDivElement, PrintableSlipProps>(({ device }, ref) => {
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  return (
    <div ref={ref} className="p-8 bg-white text-black" style={{ display: 'none' }}>
      <div className="border-2 border-black p-6 max-w-md mx-auto">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold">REPAIR SHOP</h2>
          <p className="text-sm">Customer Receipt</p>
        </div>
        
        <div className="border-t-2 border-b-2 border-black py-4 my-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold">Device ID:</span>
            <span className="text-xl">{device.id}</span>
          </div>
          
          <div className="flex justify-between mb-2">
            <span className="font-bold">Customer:</span>
            <span>{device.customerName}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="font-bold">Expected Return:</span>
            <span>{formatDate(device.expectedReturnDate)}</span>
          </div>
        </div>
        
        <div className="text-center text-sm">
          <p className="mb-1">Please present this receipt when collecting your device.</p>
          <p>Contact: (555) 123-4567</p>
        </div>
        
        <div className="mt-4 pt-4 border-t border-dashed border-black text-xs">
          <p>Device: {device.brand} {device.model}</p>
          <p>Received: {formatDate(device.createdAt)}</p>
        </div>
      </div>
    </div>
  );
});

PrintableSlip.displayName = 'PrintableSlip';

export default PrintableSlip;