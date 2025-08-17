// Barcode Scanner Settings Component for POS
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { Barcode, Scan, Settings, Save, RefreshCw, TestTube, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface BarcodeScannerSettings {
  // Scanner Settings
  enableScanner: boolean;
  autoScan: boolean;
  scanTimeout: number;
  scanRetries: number;
  
  // Behavior Settings
  autoAddToCart: boolean;
  playBeepSound: boolean;
  vibrateOnScan: boolean;
  showScanHistory: boolean;
  maxHistoryItems: number;
  
  // Error Handling
  showScanErrors: boolean;
  retryOnError: boolean;
  errorTimeout: number;
  
  // Device Settings
  scannerType: 'usb' | 'bluetooth' | 'camera' | 'keyboard';
  deviceName: string;
  connectionTimeout: number;
  autoReconnect: boolean;
  
  // Code Types
  supportedCodes: {
    ean13: boolean;
    ean8: boolean;
    upc: boolean;
    code128: boolean;
    code39: boolean;
    qr: boolean;
    datamatrix: boolean;
  };
  
  // Advanced Settings
  scanDelay: number;
  debounceTime: number;
  caseSensitive: boolean;
  trimWhitespace: boolean;
}

const BarcodeScannerSettings: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch
  } = useForm<BarcodeScannerSettings>({
    defaultValues: {
      enableScanner: true,
      autoScan: true,
      scanTimeout: 5000,
      scanRetries: 3,
      autoAddToCart: true,
      playBeepSound: true,
      vibrateOnScan: false,
      showScanHistory: true,
      maxHistoryItems: 20,
      showScanErrors: true,
      retryOnError: true,
      errorTimeout: 3000,
      scannerType: 'usb',
      deviceName: 'Default Scanner',
      connectionTimeout: 10000,
      autoReconnect: true,
      supportedCodes: {
        ean13: true,
        ean8: true,
        upc: true,
        code128: true,
        code39: true,
        qr: false,
        datamatrix: false
      },
      scanDelay: 100,
      debounceTime: 300,
      caseSensitive: false,
      trimWhitespace: true
    }
  });

  const watchedValues = watch();

  // Load current settings
  useEffect(() => {
    loadCurrentSettings();
  }, []);

  const loadCurrentSettings = async () => {
    setIsLoading(true);
    try {
      const savedSettings = localStorage.getItem('lats-barcode-scanner-settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        reset(settings);
      }
    } catch (error) {
      console.error('Error loading barcode scanner settings:', error);
      toast.error('Failed to load barcode scanner settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Save settings
  const handleSaveSettings = async (data: BarcodeScannerSettings) => {
    setIsSaving(true);
    try {
      localStorage.setItem('lats-barcode-scanner-settings', JSON.stringify(data));
      toast.success('Barcode scanner settings saved successfully');
    } catch (error) {
      console.error('Error saving barcode scanner settings:', error);
      toast.error('Failed to save barcode scanner settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Test scanner
  const handleTestScanner = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      // Simulate scanner test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Random test result for demo
      const success = Math.random() > 0.3;
      setTestResult(success ? 'success' : 'error');
      
      if (success) {
        toast.success('Scanner test completed successfully!');
      } else {
        toast.error('Scanner test failed. Please check your device connection.');
      }
    } catch (error) {
      setTestResult('error');
      toast.error('Scanner test failed');
    } finally {
      setIsTesting(false);
    }
  };

  // Reset to defaults
  const handleReset = () => {
    reset({
      enableScanner: true,
      autoScan: true,
      scanTimeout: 5000,
      scanRetries: 3,
      autoAddToCart: true,
      playBeepSound: true,
      vibrateOnScan: false,
      showScanHistory: true,
      maxHistoryItems: 20,
      showScanErrors: true,
      retryOnError: true,
      errorTimeout: 3000,
      scannerType: 'usb',
      deviceName: 'Default Scanner',
      connectionTimeout: 10000,
      autoReconnect: true,
      supportedCodes: {
        ean13: true,
        ean8: true,
        upc: true,
        code128: true,
        code39: true,
        qr: false,
        datamatrix: false
      },
      scanDelay: 100,
      debounceTime: 300,
      caseSensitive: false,
      trimWhitespace: true
    });
    toast.success('Barcode scanner settings reset to defaults');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading barcode scanner settings...</span>
      </div>
    );
  }

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Barcode className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Barcode Scanner Settings</h2>
          <p className="text-sm text-gray-600">Configure barcode scanner behavior and options</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(handleSaveSettings)} className="space-y-6">
        {/* Scanner Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Scan className="w-5 h-5" />
            Scanner Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Enable Scanner</div>
                <div className="text-sm text-gray-600">Enable barcode scanner functionality</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('enableScanner')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Auto Scan</div>
                <div className="text-sm text-gray-600">Automatically start scanning when focused</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('autoScan')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Scan Timeout (ms)</label>
              <input
                type="number"
                {...register('scanTimeout', { min: 1000, max: 30000 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1000"
                max="30000"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum time to wait for scan completion</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Scan Retries</label>
              <input
                type="number"
                {...register('scanRetries', { min: 0, max: 10 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                max="10"
              />
              <p className="text-xs text-gray-500 mt-1">Number of retry attempts on failed scans</p>
            </div>
          </div>
        </div>

        {/* Behavior Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Behavior Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Auto Add to Cart</div>
                <div className="text-sm text-gray-600">Automatically add scanned products to cart</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('autoAddToCart')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Play Beep Sound</div>
                <div className="text-sm text-gray-600">Play sound on successful scan</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('playBeepSound')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Vibrate on Scan</div>
                <div className="text-sm text-gray-600">Vibrate device on successful scan</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('vibrateOnScan')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Show Scan History</div>
                <div className="text-sm text-gray-600">Display recent scan history</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('showScanHistory')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max History Items</label>
              <input
                type="number"
                {...register('maxHistoryItems', { min: 5, max: 100 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="5"
                max="100"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum number of items in scan history</p>
            </div>
          </div>
        </div>

        {/* Error Handling */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Error Handling
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Show Scan Errors</div>
                <div className="text-sm text-gray-600">Display error messages for failed scans</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('showScanErrors')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Retry on Error</div>
                <div className="text-sm text-gray-600">Automatically retry failed scans</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('retryOnError')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Error Timeout (ms)</label>
              <input
                type="number"
                {...register('errorTimeout', { min: 1000, max: 10000 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1000"
                max="10000"
              />
              <p className="text-xs text-gray-500 mt-1">Time to display error messages</p>
            </div>
          </div>
        </div>

        {/* Device Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Barcode className="w-5 h-5" />
            Device Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Scanner Type</label>
              <select
                {...register('scannerType')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="usb">USB Scanner</option>
                <option value="bluetooth">Bluetooth Scanner</option>
                <option value="camera">Camera Scanner</option>
                <option value="keyboard">Keyboard Scanner</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Device Name</label>
              <input
                type="text"
                {...register('deviceName')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Default Scanner"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Connection Timeout (ms)</label>
              <input
                type="number"
                {...register('connectionTimeout', { min: 5000, max: 30000 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="5000"
                max="30000"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Auto Reconnect</div>
                <div className="text-sm text-gray-600">Automatically reconnect if connection lost</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('autoReconnect')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Supported Code Types */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Barcode className="w-5 h-5" />
            Supported Code Types
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">EAN-13</div>
                <div className="text-sm text-gray-600">European Article Number (13 digits)</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('supportedCodes.ean13')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">EAN-8</div>
                <div className="text-sm text-gray-600">European Article Number (8 digits)</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('supportedCodes.ean8')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">UPC</div>
                <div className="text-sm text-gray-600">Universal Product Code</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('supportedCodes.upc')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Code 128</div>
                <div className="text-sm text-gray-600">Code 128 barcode format</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('supportedCodes.code128')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Code 39</div>
                <div className="text-sm text-gray-600">Code 39 barcode format</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('supportedCodes.code39')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">QR Code</div>
                <div className="text-sm text-gray-600">QR Code format</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('supportedCodes.qr')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Advanced Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Scan Delay (ms)</label>
              <input
                type="number"
                {...register('scanDelay', { min: 0, max: 1000 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                max="1000"
              />
              <p className="text-xs text-gray-500 mt-1">Delay between scans</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Debounce Time (ms)</label>
              <input
                type="number"
                {...register('debounceTime', { min: 0, max: 1000 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                max="1000"
              />
              <p className="text-xs text-gray-500 mt-1">Debounce time for scan input</p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Case Sensitive</div>
                <div className="text-sm text-gray-600">Treat scanned codes as case sensitive</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('caseSensitive')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Trim Whitespace</div>
                <div className="text-sm text-gray-600">Remove leading/trailing spaces from scans</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('trimWhitespace')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Scanner Test */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <TestTube className="w-5 h-5" />
            Scanner Test
          </h3>
          
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-medium text-gray-900">Test Scanner Connection</div>
                <div className="text-sm text-gray-600">Verify scanner is working properly</div>
              </div>
              <div className="flex items-center gap-2">
                {testResult === 'success' && (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Success</span>
                  </div>
                )}
                {testResult === 'error' && (
                  <div className="flex items-center gap-1 text-red-600">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">Failed</span>
                  </div>
                )}
              </div>
            </div>
            
            <GlassButton
              type="button"
              onClick={handleTestScanner}
              disabled={isTesting}
              loading={isTesting}
              variant="secondary"
            >
              {isTesting ? 'Testing...' : 'Test Scanner'}
            </GlassButton>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <GlassButton
              type="button"
              onClick={handleReset}
              variant="secondary"
            >
              Reset to Defaults
            </GlassButton>
          </div>
          <div className="flex items-center gap-3">
            <GlassButton
              type="submit"
              disabled={!isDirty || isSaving}
              loading={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </GlassButton>
          </div>
        </div>
      </form>
    </GlassCard>
  );
};

export default BarcodeScannerSettings;
