import React, { useState } from 'react';
import GlassCard from '../../../../features/shared/components/ui/GlassCard';
import { Printer, Smartphone, MessageSquare, X, Bluetooth, CheckCircle, XCircle, Settings } from 'lucide-react';
import { useBluetoothPrinter } from '../../../../hooks/useBluetoothPrinter';

interface Receipt {
  id: string;
  date: string;
  time: string;
  items: any[];
  customer?: any;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: any;
  cashier: string;
  receiptNumber: string;
}

interface POSReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: Receipt;
  formatMoney: (amount: number) => string;
  onPrint: () => void;
  onSendWhatsApp: () => void;
  onSendSMS: () => void;
}

const POSReceiptModal: React.FC<POSReceiptModalProps> = ({
  isOpen,
  onClose,
  receipt,
  formatMoney,
  onPrint,
  onSendWhatsApp,
  onSendSMS
}) => {
  const {
    isConnected: isBluetoothConnected,
    isPrinting: isBluetoothPrinting,
    printReceipt: printBluetoothReceipt,
    connectedDevice
  } = useBluetoothPrinter();
  
  const [showBluetoothOptions, setShowBluetoothOptions] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <GlassCard className="max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Receipt</h2>
            <p className="text-sm text-gray-600">Transaction completed successfully</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Receipt Content */}
        <div className="bg-white rounded-lg border-2 border-gray-200 p-6 mb-6">
          {/* Receipt Header */}
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">LATS POS System</h3>
            <p className="text-sm text-gray-600">Receipt #{receipt.receiptNumber}</p>
            <p className="text-sm text-gray-600">{receipt.date} at {receipt.time}</p>
            <p className="text-sm text-gray-600">Cashier: {receipt.cashier}</p>
          </div>

          {/* Customer Info */}
          {receipt.customer && (
            <div className="border-b border-gray-200 pb-4 mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Customer Information</h4>
              <p className="text-sm text-gray-700">Name: {receipt.customer.name}</p>
              <p className="text-sm text-gray-700">Phone: {receipt.customer.phone}</p>
              {receipt.customer.email && (
                <p className="text-sm text-gray-700">Email: {receipt.customer.email}</p>
              )}
            </div>
          )}

          {/* Items */}
          <div className="mb-4">
            <h4 className="font-semibold text-gray-900 mb-2">Items</h4>
            <div className="space-y-2">
              {receipt.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-gray-600">Qty: {item.quantity} × {formatMoney(item.price)}</p>
                  </div>
                  <p className="font-semibold text-gray-900">{formatMoney(item.quantity * item.price)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t border-gray-200 pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">{formatMoney(receipt.subtotal)}</span>
            </div>
            {receipt.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax:</span>
                <span className="font-medium">{formatMoney(receipt.tax)}</span>
              </div>
            )}
            {receipt.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount:</span>
                <span className="font-medium text-red-600">-{formatMoney(receipt.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
              <span>Total:</span>
              <span className="text-green-600">{formatMoney(receipt.total)}</span>
            </div>
          </div>

          {/* Payment Method */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{receipt.paymentMethod.icon}</span>
              <div>
                <p className="font-semibold text-gray-900">{receipt.paymentMethod.name}</p>
                <p className="text-sm text-gray-600">{receipt.paymentMethod.description}</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">Thank you for your purchase!</p>
            <p className="text-xs text-gray-500 mt-1">Please keep this receipt for your records</p>
          </div>
        </div>

        {/* Receipt Actions */}
        <div className="mt-4 space-y-3">
          {/* Bluetooth Printer Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isBluetoothConnected ? 'bg-green-100' : 'bg-gray-100'}`}>
                {isBluetoothConnected ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <div>
                <p className="font-medium text-sm">
                  {isBluetoothConnected ? 'Bluetooth Printer Connected' : 'Bluetooth Printer Not Connected'}
                </p>
                <p className="text-xs text-gray-600">
                  {isBluetoothConnected ? connectedDevice?.name : 'Connect a Bluetooth printer to print receipts'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowBluetoothOptions(!showBluetoothOptions)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {showBluetoothOptions ? 'Hide' : 'Options'}
            </button>
          </div>

          {/* Bluetooth Options */}
          {showBluetoothOptions && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">Bluetooth Printer Options</h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={async () => {
                    try {
                      await printBluetoothReceipt({
                        header: 'LATS POS System',
                        items: receipt.items.map(item => ({
                          name: item.name,
                          quantity: item.quantity,
                          price: item.price,
                          total: item.quantity * item.price
                        })),
                        subtotal: receipt.subtotal,
                        tax: receipt.tax,
                        discount: receipt.discount,
                        total: receipt.total,
                        paymentMethod: receipt.paymentMethod.name,
                        cashier: receipt.cashier,
                        footer: 'Thank you for your purchase!'
                      });
                    } catch (error) {
                      console.error('Failed to print via Bluetooth:', error);
                      alert('Failed to print via Bluetooth printer');
                    }
                  }}
                  disabled={!isBluetoothConnected || isBluetoothPrinting}
                  className="p-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <Bluetooth className="w-4 h-4" />
                  {isBluetoothPrinting ? 'Printing...' : 'Bluetooth Print'}
                </button>
                <button
                  onClick={() => {
                    // Open Bluetooth printer manager in a new window or modal
                    window.open('/bluetooth-printer', '_blank');
                  }}
                  className="p-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Manage Printer
                </button>
              </div>
            </div>
          )}

          {/* Standard Actions */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={onPrint}
              className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={onSendWhatsApp}
              className="p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Smartphone className="w-4 h-4" />
              WhatsApp
            </button>
            <button
              onClick={onSendSMS}
              className="p-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              SMS
            </button>
          </div>
        </div>

        {/* Close Button */}
        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </GlassCard>
    </div>
  );
};

export default POSReceiptModal;
