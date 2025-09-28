import React, { useState } from 'react';
import { X, Printer, QrCode, Tag } from 'lucide-react';
import { useBluetoothPrinter } from '../hooks/useBluetoothPrinter';
import GlassButton from '../features/shared/components/ui/GlassButton';
import GlassCard from '../features/shared/components/ui/GlassCard';

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  size?: string;
  color?: string;
  brand?: string;
  category?: string;
}

interface LabelPrintingModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  formatMoney: (amount: number) => string;
}

export const LabelPrintingModal: React.FC<LabelPrintingModalProps> = ({
  isOpen,
  onClose,
  product,
  formatMoney
}) => {
  const {
    isConnected: isBluetoothConnected,
    isPrinting: isBluetoothPrinting,
    printLabel,
    connectedDevice
  } = useBluetoothPrinter();

  const [labelData, setLabelData] = useState({
    title: product.name,
    barcode: product.barcode || product.sku,
    qrCode: `https://latschance.com/product/${product.id}`,
    text: `${product.brand || ''} ${product.category || ''}`.trim(),
    price: formatMoney(product.price),
    sku: product.sku,
    size: product.size || '',
    color: product.color || ''
  });

  const [copies, setCopies] = useState(1);

  if (!isOpen) return null;

  const handlePrintLabel = async () => {
    try {
      await printLabel(labelData);
      // You could show a success message here
    } catch (error) {
      console.error('Failed to print label:', error);
      alert('Failed to print label. Please check your printer connection.');
    }
  };

  const generateQRCode = (text: string) => {
    // This is a simple QR code generation - in a real app you might want to use a library
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(text)}`;
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <GlassCard 
        className="max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Tag className="w-6 h-6" />
              Print Product Label
            </h2>
            <p className="text-sm text-gray-600">Print label for {product.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Bluetooth Printer Status */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${isBluetoothConnected ? 'bg-green-100' : 'bg-gray-100'}`}>
                {isBluetoothConnected ? (
                  <Printer className="w-4 h-4 text-green-600" />
                ) : (
                  <X className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <div>
                <p className="font-medium text-sm">
                  {isBluetoothConnected ? 'Bluetooth Printer Connected' : 'Bluetooth Printer Not Connected'}
                </p>
                <p className="text-xs text-gray-600">
                  {isBluetoothConnected ? connectedDevice?.name : 'Connect a Bluetooth printer to print labels'}
                </p>
              </div>
            </div>
            {!isBluetoothConnected && (
              <GlassButton
                onClick={() => window.open('/bluetooth-printer', '_blank')}
                variant="primary"
                size="sm"
              >
                Connect Printer
              </GlassButton>
            )}
          </div>
        </div>

        {/* Label Preview */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Label Preview</h3>
          <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
            <div className="text-center space-y-2">
              {/* Title */}
              <div className="text-lg font-bold">{labelData.title}</div>
              
              {/* Make/Category */}
              {labelData.text && (
                <div className="text-sm text-gray-600">{labelData.text}</div>
              )}
              
              {/* Barcode */}
              {labelData.barcode && (
                <div className="flex items-center justify-center gap-2">
                  <Barcode className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-mono">{labelData.barcode}</span>
                </div>
              )}
              
              {/* QR Code */}
              {labelData.qrCode && (
                <div className="flex items-center justify-center gap-2">
                  <QrCode className="w-4 h-4 text-gray-500" />
                  <img 
                    src={generateQRCode(labelData.qrCode)} 
                    alt="QR Code"
                    className="w-16 h-16"
                  />
                </div>
              )}
              
              {/* Price */}
              <div className="text-xl font-bold text-green-600">{labelData.price}</div>
              
              {/* SKU */}
              <div className="text-sm text-gray-500">SKU: {labelData.sku}</div>
              
              {/* Size and Color */}
              {(labelData.size || labelData.color) && (
                <div className="text-sm text-gray-600">
                  {[labelData.size, labelData.color].filter(Boolean).join(' | ')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Label Configuration */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">Label Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={labelData.title}
                onChange={(e) => setLabelData({...labelData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
              <input
                type="text"
                value={labelData.price}
                onChange={(e) => setLabelData({...labelData, price: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
              <input
                type="text"
                value={labelData.barcode}
                onChange={(e) => setLabelData({...labelData, barcode: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <input
                type="text"
                value={labelData.sku}
                onChange={(e) => setLabelData({...labelData, sku: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
              <input
                type="text"
                value={labelData.size}
                onChange={(e) => setLabelData({...labelData, size: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <input
                type="text"
                value={labelData.color}
                onChange={(e) => setLabelData({...labelData, color: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                value={labelData.text}
                onChange={(e) => setLabelData({...labelData, text: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Copies</label>
              <input
                type="number"
                min="1"
                max="10"
                value={copies}
                onChange={(e) => setCopies(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <GlassButton
            onClick={handlePrintLabel}
            variant="primary"
            disabled={!isBluetoothConnected || isBluetoothPrinting}
            className="w-full py-4 text-lg font-semibold"
          >
            <Printer className="w-5 h-5 mr-2" />
            {isBluetoothPrinting ? 'Printing...' : `Print Label${copies > 1 ? ` (${copies} copies)` : ''}`}
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
};
