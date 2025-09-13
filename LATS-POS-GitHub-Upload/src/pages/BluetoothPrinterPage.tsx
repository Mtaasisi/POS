import React from 'react';
import { BluetoothPrinterManager } from '../components/BluetoothPrinterManager';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BluetoothPrinterPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white hover:shadow-md rounded-lg transition-all duration-200"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bluetooth Printer Management</h1>
                          <p className="text-gray-600">Connect and manage your Bluetooth thermal and label printers</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Printer Manager */}
          <div className="lg:col-span-2">
            <BluetoothPrinterManager />
          </div>

          {/* Help & Information */}
          <div className="space-y-6">
            {/* Quick Help */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Setup Guide</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold mt-0.5">
                    1
                  </div>
                  <p>Make sure your Bluetooth printer is turned on and in pairing mode</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold mt-0.5">
                    2
                  </div>
                  <p>Click "Connect" to search for available Bluetooth printers</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold mt-0.5">
                    3
                  </div>
                  <p>Select your printer from the list and wait for connection</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold mt-0.5">
                    4
                  </div>
                  <p>Use "Test Print" to verify the connection works properly</p>
                </div>
                
                {/* XP-P301A Specific Instructions */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">XP-P301A Specific Setup:</h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• Ensure battery is charged (3+ hours printing time)</li>
                    <li>• Use 25-80mm paper width for receipts</li>
                    <li>• Use 25-80mm label paper for labels</li>
                    <li>• Supports both ESC/POS and TSPL emulation</li>
                    <li>• 203 DPI resolution for crisp printing</li>
                    <li>• 70mm/s print speed</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Supported Printers */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Supported Printers</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p className="font-medium text-gray-700">Thermal Receipt Printers:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Star TSP100 series</li>
                  <li>Citizen CT-S310II</li>
                  <li>Epson TM-T88VI</li>
                  <li>Generic ESC/POS printers</li>
                </ul>
                
                <p className="font-medium text-gray-700 mt-3">Dual Function Printers:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li><strong>Xprinter XP-P301A</strong> (Receipt & Label)</li>
                  <li>Other Xprinter mobile models</li>
                </ul>
                
                <p className="font-medium text-gray-700 mt-3">Label Printers:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Zebra ZD220</li>
                  <li>Zebra ZD420</li>
                  <li>Zebra ZD620</li>
                  <li>Brother QL-820NWB</li>
                  <li>Dymo LabelWriter 450</li>
                  <li>Generic label printers</li>
                </ul>
                <p className="text-xs text-gray-500 mt-3">
                  Most Bluetooth thermal and label printers with ESC/POS or ZPL support should work
                </p>
              </div>
            </div>

            {/* Troubleshooting */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Troubleshooting</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <div>
                  <p className="font-medium text-gray-700">Can't find printer?</p>
                  <p className="text-xs">Make sure Bluetooth is enabled and printer is in pairing mode</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Connection fails?</p>
                  <p className="text-xs">Try restarting the printer and clearing browser Bluetooth cache</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Print not working?</p>
                  <p className="text-xs">Check paper and ensure printer is not in error state</p>
                </div>
              </div>
            </div>

            {/* Browser Compatibility */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Browser Support</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Chrome 56+ (Recommended)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Edge 79+</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span>Firefox 55+ (Limited)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Safari (Not supported)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BluetoothPrinterPage;
