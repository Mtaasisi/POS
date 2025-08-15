import React, { forwardRef } from 'react';

interface Device {
  id: string;
  customerId: string;
  customerName: string;
  phoneNumber: string;
  brand: string;
  model: string;
  serialNumber: string;
  createdAt: string;
  updatedAt: string;
  expectedReturnDate: string;
  estimatedHours: number;
  status: string;
  assignedTo: string;
  issueDescription: string;
  unlockCode: string;
  repairCost: string;
  depositAmount: string;
  diagnosisRequired: boolean;
  deviceNotes: string;
  deviceCost: string;
}

interface PrintableSlipProps {
  device: Device;
}

const PrintableSlip = forwardRef<HTMLDivElement, PrintableSlipProps>(({ device }, ref) => {
  return (
    <div ref={ref} className="hidden">
      {/* This component is hidden by default and only used for printing */}
      <div className="receipt-container">
        <div className="receipt">
          <div className="header">
            <h2>REPAIR SHOP</h2>
            <p>Customer Receipt</p>
          </div>
          
          <div className="divider">
            <div className="row">
              <span><strong>Device:</strong></span>
              <span style={{ fontSize: '18px' }}>
                {device.brand} {device.model}
              </span>
            </div>
            
            <div className="row">
              <span><strong>Customer:</strong></span>
              <span>{device.customerName || 'N/A'}</span>
            </div>
            
            <div className="row">
              <span><strong>Expected Return:</strong></span>
              <span>{new Date(device.expectedReturnDate || new Date().toISOString()).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="footer">
            <p>Please present this receipt when collecting your device.</p>
            <p>Contact: (555) 123-4567</p>
          </div>
          
          <div className="dotted-divider small-text">
            <p>Device: {device.brand || 'N/A'} {device.model || 'N/A'}</p>
            <p>Received: {new Date(device.createdAt || new Date().toISOString()).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
      
      <style>
        {`
          .receipt-container {
            padding: 20px;
          }
          .receipt {
            border: 2px solid #000;
            padding: 20px;
            max-width: 400px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
          .divider {
            border-top: 2px solid #000;
            border-bottom: 2px solid #000;
            padding: 15px 0;
            margin: 15px 0;
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
          }
          .footer {
            text-align: center;
            font-size: 12px;
          }
          .dotted-divider {
            border-top: 1px dashed #000;
            margin-top: 15px;
            padding-top: 15px;
          }
          .small-text {
            font-size: 10px;
          }
        `}
      </style>
    </div>
  );
});

PrintableSlip.displayName = 'PrintableSlip';

export default PrintableSlip;
