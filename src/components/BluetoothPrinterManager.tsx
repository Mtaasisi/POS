import React, { useState } from 'react';
import { 
  Bluetooth, 
  Printer, 
  Settings, 
  Wifi, 
  WifiOff, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  TestTube,
  Save,
  Trash2,
  Zap
} from 'lucide-react';
import { useBluetoothPrinter } from '../hooks/useBluetoothPrinter';
import GlassButton from '../features/shared/components/ui/GlassButton';
import GlassCard from '../features/shared/components/ui/GlassCard';

interface BluetoothPrinterManagerProps {
  className?: string;
  onPrinterConnected?: (deviceId: string) => void;
  onPrinterDisconnected?: () => void;
}

export const BluetoothPrinterManager: React.FC<BluetoothPrinterManagerProps> = ({
  className = '',
  onPrinterConnected,
  onPrinterDisconnected
}) => {
  const {
    isInitialized,
    isConnected,
    isConnecting,
    isPrinting,
    connectedDevice,
    availableDevices,
    settings,
    error,
    initialize,
    requestDevice,
    connect,
    disconnect,
    print,
    printReceipt,
    printLabel,
    updateSettings,
    clearError
  } = useBluetoothPrinter();

  const [showSettings, setShowSettings] = useState(false);
  const [showLabelForm, setShowLabelForm] = useState(false);
  const [testContent, setTestContent] = useState('Test Print\nHello from LATS CHANCE!\n\nDate: ' + new Date().toLocaleString());
  const [labelData, setLabelData] = useState({
    title: 'Test Product',
    barcode: '123456789',
    qrCode: 'https://latschance.com',
    text: 'Sample product description',
    price: 'TZS 5,000',
    sku: 'SKU-001',
    size: 'M',
    color: 'Blue'
  });

  // Handle printer connection
  const handleConnect = async (deviceId: string) => {
    const success = await connect(deviceId);
    if (success && onPrinterConnected) {
      onPrinterConnected(deviceId);
    }
  };

  // Handle printer disconnection
  const handleDisconnect = async () => {
    await disconnect();
    if (onPrinterDisconnected) {
      onPrinterDisconnected();
    }
  };

  // Test print
  const handleTestPrint = async () => {
    try {
      console.log('Starting test print...');
      console.log('Is connected:', isConnected);
      console.log('Connected device:', connectedDevice);
      
      if (!isConnected) {
        alert('Please connect to a printer first');
        return;
      }
      
      // Simple test content
      const simpleTestContent = 'TEST PRINT\nHello World!\nDate: ' + new Date().toLocaleString() + '\n\n\n\n\n';
      
      console.log('Simple test content:', simpleTestContent);
      
      await print({
        content: simpleTestContent,
        copies: 1
      });
      
      console.log('Test print completed successfully');
      alert('Test print sent successfully!');
    } catch (error) {
      console.error('Test print failed:', error);
      alert(`Test print failed: ${error.message}`);
    }
  };

  // Test receipt print
  const handleTestReceipt = async () => {
    try {
      console.log('Starting test receipt print...');
      
      if (!isConnected) {
        alert('Please connect to a printer first');
        return;
      }
      
      await printReceipt({
        header: 'LATS CHANCE STORE',
        items: [
          { name: 'Test Product 1', quantity: 2, price: 1000, total: 2000 },
          { name: 'Test Product 2', quantity: 1, price: 1500, total: 1500 }
        ],
        subtotal: 3500,
        tax: 630,
        discount: 0,
        total: 4130,
        paymentMethod: 'Cash',
        cashier: 'Test User',
        footer: 'Thank you for your purchase!'
      });
      
      console.log('Test receipt print completed successfully');
    } catch (error) {
      console.error('Test receipt print failed:', error);
      alert(`Test receipt print failed: ${error.message}`);
    }
  };

  // Test label print
  const handleTestLabel = async () => {
    try {
      console.log('Starting test label print...');
      console.log('Label data:', labelData);
      
      if (!isConnected) {
        alert('Please connect to a printer first');
        return;
      }
      
      await printLabel(labelData);
      
      console.log('Test label print completed successfully');
    } catch (error) {
      console.error('Test label print failed:', error);
      alert(`Test label print failed: ${error.message}`);
    }
  };

  // Simple raw test print
  const handleRawTestPrint = async () => {
    try {
      console.log('Starting raw test print...');
      
      if (!isConnected) {
        alert('Please connect to a printer first');
        return;
      }
      
      // Send raw text without any commands
      const rawContent = 'RAW TEST\nSimple text\nNo commands\n\n\n\n\n';
      
      console.log('Raw test content:', rawContent);
      
      await print({
        content: rawContent,
        copies: 1
      });
      
      console.log('Raw test print completed successfully');
      alert('Raw test print sent successfully!');
    } catch (error) {
      console.error('Raw test print failed:', error);
      alert(`Raw test print failed: ${error.message}`);
    }
  };

  // Ultra simple test - no ESC/POS commands at all
  const handleUltraSimpleTest = async () => {
    try {
      console.log('Starting ultra simple test...');
      
      if (!isConnected) {
        alert('Please connect to a printer first');
        return;
      }
      
      // Send just plain text, no commands, no formatting
      const ultraSimpleContent = 'ULTRA SIMPLE\nJust text\nNo commands\nNo formatting\n\n\n\n\n';
      
      console.log('Ultra simple content:', ultraSimpleContent);
      
      // Send directly to the characteristic without any processing
      if (bluetoothPrinterService.characteristic) {
        const encoder = new TextEncoder();
        const data = encoder.encode(ultraSimpleContent);
        await bluetoothPrinterService.characteristic.writeValue(data);
        console.log('Ultra simple test sent directly to characteristic');
        alert('Ultra simple test sent directly!');
      } else {
        alert('No characteristic available');
      }
    } catch (error) {
      console.error('Ultra simple test failed:', error);
      alert(`Ultra simple test failed: ${error.message}`);
    }
  };

  // Save settings
  const handleSaveSettings = () => {
    setShowSettings(false);
  };

  if (!isInitialized) {
    return (
      <GlassCard className={`p-6 ${className}`}>
        <div className="text-center">
          <Bluetooth className="w-12 h-12 mx-auto mb-4 text-blue-500" />
          <h3 className="text-lg font-semibold mb-2">Bluetooth Printer</h3>
          <p className="text-gray-600 mb-4">Initializing Bluetooth printer service...</p>
          <GlassButton
            onClick={initialize}
            variant="primary"
            className="w-full"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Initialize
          </GlassButton>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Connection Status */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isConnected ? 'bg-green-100' : 'bg-gray-100'}`}>
              {isConnected ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="font-semibold">Bluetooth Printer</h3>
              <p className="text-sm text-gray-600">
                {isConnected 
                  ? `Connected to ${connectedDevice?.name || 'Unknown Printer'}`
                  : 'Not connected'
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <GlassButton
              onClick={() => setShowSettings(!showSettings)}
              variant="ghost"
              size="sm"
            >
              <Settings className="w-4 h-4" />
            </GlassButton>
            
            {isConnected ? (
              <GlassButton
                onClick={handleDisconnect}
                variant="secondary"
                size="sm"
                disabled={isConnecting}
              >
                <WifiOff className="w-4 h-4 mr-1" />
                Disconnect
              </GlassButton>
            ) : (
              <GlassButton
                onClick={requestDevice}
                variant="primary"
                size="sm"
                disabled={isConnecting}
              >
                <Bluetooth className="w-4 h-4 mr-1" />
                {isConnecting ? 'Connecting...' : 'Connect'}
              </GlassButton>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Error Display */}
      {error && (
        <GlassCard className="p-4 border-l-4 border-red-500 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-red-700">{error}</p>
              <GlassButton
                onClick={clearError}
                variant="ghost"
                size="sm"
                className="mt-2"
              >
                Dismiss
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Available Devices */}
      {availableDevices.length > 0 && !isConnected && (
        <GlassCard className="p-4">
          <h4 className="font-semibold mb-3">Available Printers</h4>
          <div className="space-y-2">
            {availableDevices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Printer className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium">{device.name}</p>
                    <p className="text-sm text-gray-600">{device.address}</p>
                  </div>
                </div>
                <GlassButton
                  onClick={() => handleConnect(device.id)}
                  variant="primary"
                  size="sm"
                  disabled={isConnecting}
                >
                  Connect
                </GlassButton>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold">Printer Settings</h4>
            <GlassButton
              onClick={handleSaveSettings}
              variant="primary"
              size="sm"
            >
              <Save className="w-4 h-4 mr-1" />
              Save
            </GlassButton>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paper Width (mm)
              </label>
              <select
                value={settings.paperWidth}
                onChange={(e) => updateSettings({ paperWidth: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={50}>50mm (Label)</option>
                <option value={58}>58mm (Narrow)</option>
                <option value={80}>80mm (Standard)</option>
                <option value={112}>112mm (Wide)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Print Copies
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={settings.printCopies}
                onChange={(e) => updateSettings({ printCopies: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Label Height (mm)
              </label>
              <input
                type="number"
                min="10"
                max="100"
                value={settings.labelHeight}
                onChange={(e) => updateSettings({ labelHeight: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                DPI (Dots Per Inch)
              </label>
              <select
                value={settings.dpi}
                onChange={(e) => updateSettings({ dpi: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={203}>203 DPI (Standard)</option>
                <option value={300}>300 DPI (High Quality)</option>
                <option value={600}>600 DPI (Ultra High)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Print Type
              </label>
              <select
                value={settings.defaultPrintType}
                onChange={(e) => updateSettings({ defaultPrintType: e.target.value as 'receipt' | 'label' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="receipt">Receipt</option>
                <option value="label">Label</option>
              </select>
              {connectedDevice?.name?.toLowerCase().includes('xp-p301a') && (
                <p className="text-xs text-blue-600 mt-1">
                  XP-P301A supports both receipt and label printing modes
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auto-Connect
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.autoConnect}
                  onChange={(e) => updateSettings({ autoConnect: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-600">
                  Automatically reconnect when available
                </span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Connection Timeout (ms)
              </label>
              <input
                type="number"
                min="1000"
                max="30000"
                step="1000"
                value={settings.connectionTimeout}
                onChange={(e) => updateSettings({ connectionTimeout: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </GlassCard>
      )}

      {/* Test Print Section */}
      {isConnected && (
        <GlassCard className="p-4">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Test Print
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Content
              </label>
              <textarea
                value={testContent}
                onChange={(e) => setTestContent(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter test content to print..."
              />
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <GlassButton
                onClick={handleTestPrint}
                variant="primary"
                disabled={isPrinting}
                className="flex-1 min-w-[120px]"
              >
                <Printer className="w-4 h-4 mr-2" />
                {isPrinting ? 'Printing...' : 'Test Print'}
              </GlassButton>
              
              <GlassButton
                onClick={handleTestReceipt}
                variant="secondary"
                disabled={isPrinting}
                className="flex-1 min-w-[120px]"
              >
                <Printer className="w-4 h-4 mr-2" />
                Test Receipt
              </GlassButton>
              
              <GlassButton
                onClick={handleRawTestPrint}
                variant="outline"
                disabled={isPrinting}
                className="flex-1 min-w-[120px]"
              >
                <TestTube className="w-4 h-4 mr-2" />
                Raw Test
              </GlassButton>
              
              <GlassButton
                onClick={handleUltraSimpleTest}
                variant="outline"
                disabled={isPrinting}
                className="flex-1 min-w-[120px]"
              >
                <Zap className="w-4 h-4 mr-2" />
                Ultra Simple
              </GlassButton>
            </div>

            {/* Label Printing Section */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-medium text-gray-900">Label Printing</h5>
                <GlassButton
                  onClick={() => setShowLabelForm(!showLabelForm)}
                  variant="ghost"
                  size="sm"
                >
                  {showLabelForm ? 'Hide' : 'Show'} Label Form
                </GlassButton>
              </div>
              
              {showLabelForm && (
                <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={labelData.title}
                        onChange={(e) => setLabelData({...labelData, title: e.target.value})}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                      <input
                        type="text"
                        value={labelData.price}
                        onChange={(e) => setLabelData({...labelData, price: e.target.value})}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Barcode</label>
                      <input
                        type="text"
                        value={labelData.barcode}
                        onChange={(e) => setLabelData({...labelData, barcode: e.target.value})}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                      <input
                        type="text"
                        value={labelData.sku}
                        onChange={(e) => setLabelData({...labelData, sku: e.target.value})}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                      <input
                        type="text"
                        value={labelData.size}
                        onChange={(e) => setLabelData({...labelData, size: e.target.value})}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                      <input
                        type="text"
                        value={labelData.color}
                        onChange={(e) => setLabelData({...labelData, color: e.target.value})}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={labelData.text}
                      onChange={(e) => setLabelData({...labelData, text: e.target.value})}
                      rows={2}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
              
              <GlassButton
                onClick={handleTestLabel}
                variant="secondary"
                disabled={isPrinting}
                className="w-full"
              >
                <Printer className="w-4 h-4 mr-2" />
                {isPrinting ? 'Printing...' : 'Test Label'}
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
};
