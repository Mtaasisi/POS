import React, { useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, User, Calendar, Hash, Key, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import Modal from '../../shared/components/ui/Modal';
import GlassButton from '../../shared/components/ui/GlassButton';

interface DeviceQRCodePrintProps {
  isOpen: boolean;
  onClose: () => void;
  device: {
    id: string;
    brand: string;
    model: string;
    serialNumber: string;
    unlockCode: string;
    customerName: string;
    phoneNumber: string;
    expectedReturnDate: string;
    status: string;
    issueDescription: string;
    conditions: string[];
    otherText?: string;
  };
}

const DeviceQRCodePrint: React.FC<DeviceQRCodePrintProps> = ({
  isOpen,
  onClose,
  device
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Device QR Code - ${device.brand} ${device.model}</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  margin: 0;
                  padding: 20px;
                  background: white;
                }
                .print-container {
                  max-width: 400px;
                  margin: 0 auto;
                  border: 2px solid #333;
                  border-radius: 8px;
                  padding: 20px;
                  background: white;
                }
                .header {
                  text-align: center;
                  border-bottom: 2px solid #333;
                  padding-bottom: 15px;
                  margin-bottom: 20px;
                }
                .company-name {
                  font-size: 24px;
                  font-weight: bold;
                  color: #2563eb;
                  margin-bottom: 5px;
                }
                .tagline {
                  font-size: 14px;
                  color: #666;
                }
                .qr-section {
                  text-align: center;
                  margin: 20px 0;
                }
                .qr-code {
                  border: 1px solid #ddd;
                  padding: 10px;
                  display: inline-block;
                  background: white;
                }
                .device-info {
                  margin: 20px 0;
                }
                .info-row {
                  display: flex;
                  justify-content: space-between;
                  margin: 8px 0;
                  font-size: 14px;
                }
                .label {
                  font-weight: bold;
                  color: #333;
                }
                .value {
                  color: #666;
                }
                .conditions-section {
                  margin: 20px 0;
                  border-top: 1px solid #ddd;
                  padding-top: 15px;
                }
                .conditions-title {
                  font-weight: bold;
                  margin-bottom: 10px;
                  color: #333;
                }
                .condition-item {
                  background: #f3f4f6;
                  padding: 4px 8px;
                  margin: 2px;
                  border-radius: 4px;
                  font-size: 12px;
                  display: inline-block;
                }
                .footer {
                  text-align: center;
                  margin-top: 20px;
                  padding-top: 15px;
                  border-top: 1px solid #ddd;
                  font-size: 12px;
                  color: #666;
                }
                .status-badge {
                  display: inline-block;
                  padding: 4px 12px;
                  border-radius: 20px;
                  font-size: 12px;
                  font-weight: bold;
                  text-transform: uppercase;
                }
                .status-assigned {
                  background: #dbeafe;
                  color: #1d4ed8;
                }
                .status-diagnosis {
                  background: #fef3c7;
                  color: #d97706;
                }
                .status-repair {
                  background: #fce7f3;
                  color: #be185d;
                }
                .status-complete {
                  background: #d1fae5;
                  color: #059669;
                }
                @media print {
                  body { margin: 0; }
                  .print-container { border: none; }
                }
              </style>
            </head>
            <body>
              <div class="print-container">
                <div class="header">
                  <div class="company-name">CLEAN REPAIRS</div>
                  <div class="tagline">Professional Device Repair Services</div>
                </div>
                
                <div class="qr-section">
                  <div class="qr-code">
                    ${document.querySelector('.qr-code svg')?.outerHTML || ''}
                  </div>
                  <div style="margin-top: 10px; font-size: 12px; color: #666;">
                    Scan to track device status
                  </div>
                </div>
                
                <div class="device-info">
                  <div class="info-row">
                    <span class="label">Device ID:</span>
                    <span class="value">${device.id}</span>
                  </div>
                                      <div class="info-row">
                      <span class="label">Model:</span>
                      <span class="value">${device.model}</span>
                    </div>
                  <div class="info-row">
                    <span class="label">Serial/IMEI:</span>
                    <span class="value">${device.serialNumber}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Customer:</span>
                    <span class="value">${device.customerName}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Phone:</span>
                    <span class="value">${device.phoneNumber}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Expected Return:</span>
                    <span class="value">${new Date(device.expectedReturnDate).toLocaleDateString()}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Status:</span>
                    <span class="value">
                      <span class="status-badge status-${device.status}">${device.status}</span>
                    </span>
                  </div>
                </div>
                
                ${device.conditions.length > 0 ? `
                <div class="conditions-section">
                  <div class="conditions-title">Reported Issues:</div>
                  ${device.conditions.map(condition => `
                    <span class="condition-item">${condition}</span>
                  `).join('')}
                  ${device.otherText ? `<span class="condition-item">${device.otherText}</span>` : ''}
                </div>
                ` : ''}
                
                <div class="footer">
                  <div>Thank you for choosing Clean Repairs</div>
                  <div>Contact: +255 XXX XXX XXX</div>
                  <div>Email: info@cleanrepairs.com</div>
                </div>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return 'text-blue-600 bg-blue-100';
      case 'diagnosis-started': return 'text-yellow-600 bg-yellow-100';
      case 'in-repair': return 'text-purple-600 bg-purple-100';
      case 'repair-complete': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Smartphone size={24} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Print Device QR Code</h2>
            <p className="text-sm text-gray-600">Print QR code with device information</p>
          </div>
        </div>
      }
      maxWidth="500px"
    >
      <div className="p-6 space-y-6">
        {/* QR Code Preview */}
        <div className="text-center">
          <div className="inline-block p-4 bg-white border border-gray-200 rounded-lg">
            <QRCodeSVG
              value={`${window.location.origin}/devices/${device.id}`}
              size={200}
              level="M"
              className="qr-code"
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">Scan to track device status</p>
        </div>

        {/* Device Information */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Device ID:</span>
            <span className="text-gray-900 font-mono">{device.id}</span>
          </div>
                      <div className="flex justify-between items-center">
              <span className="font-medium text-gray-700">Model:</span>
              <span className="text-gray-900">{device.model}</span>
            </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Customer:</span>
            <span className="text-gray-900">{device.customerName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-700">Status:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(device.status)}`}>
              {device.status}
            </span>
          </div>
        </div>

        {/* Conditions Summary */}
        {device.conditions.length > 0 && (
          <div className="bg-yellow-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <AlertTriangle size={16} className="text-yellow-600" />
              Reported Issues
            </h3>
            <div className="flex flex-wrap gap-2">
              {device.conditions.map((condition, idx) => (
                <span key={idx} className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                  {condition}
                </span>
              ))}
              {device.otherText && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                  {device.otherText}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <GlassButton
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </GlassButton>
          <GlassButton
            variant="primary"
            onClick={handlePrint}
          >
            Print QR Code
          </GlassButton>
        </div>
      </div>
    </Modal>
  );
};

export default DeviceQRCodePrint; 