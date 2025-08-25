import { useState, useEffect, useCallback } from 'react';
import { 
  bluetoothPrinterService, 
  BluetoothPrinter, 
  PrintJob, 
  PrinterSettings 
} from '../lib/bluetoothPrinterService';

export interface UseBluetoothPrinterReturn {
  // State
  isInitialized: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  isPrinting: boolean;
  connectedDevice: BluetoothPrinter | null;
  availableDevices: BluetoothPrinter[];
  settings: PrinterSettings;
  error: string | null;

  // Actions
  initialize: () => Promise<boolean>;
  requestDevice: () => Promise<void>;
  connect: (deviceId?: string) => Promise<boolean>;
  disconnect: () => Promise<void>;
  print: (job: PrintJob) => Promise<boolean>;
  printReceipt: (receiptData: {
    header: string;
    items: Array<{ name: string; quantity: number; price: number; total: number }>;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    paymentMethod: string;
    cashier: string;
    footer: string;
  }) => Promise<boolean>;
  printLabel: (labelData: {
    title: string;
    barcode?: string;
    qrCode?: string;
    text?: string;
    price?: string;
    sku?: string;
    size?: string;
    color?: string;
    customFields?: Array<{ label: string; value: string }>;
  }) => Promise<boolean>;
  updateSettings: (settings: Partial<PrinterSettings>) => void;
  clearError: () => void;
}

export const useBluetoothPrinter = (): UseBluetoothPrinterReturn => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<BluetoothPrinter | null>(null);
  const [availableDevices, setAvailableDevices] = useState<BluetoothPrinter[]>([]);
  const [settings, setSettings] = useState<PrinterSettings>({
    paperWidth: 80,
    printCopies: 1,
    autoConnect: false,
    connectionTimeout: 10000,
    labelHeight: 25,
    dpi: 203,
    defaultPrintType: 'receipt'
  });
  const [error, setError] = useState<string | null>(null);

  // Initialize the service
  const initialize = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      const success = await bluetoothPrinterService.initialize();
      setIsInitialized(success);
      
      if (success) {
        // Load current settings
        const currentSettings = bluetoothPrinterService.getSettings();
        setSettings(currentSettings);
        
        // Check if we have a connected device
        const device = bluetoothPrinterService.getConnectedDevice();
        if (device) {
          setConnectedDevice(device);
          setIsConnected(true);
        }
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize Bluetooth printer service';
      setError(errorMessage);
      return false;
    }
  }, []);

  // Request Bluetooth device
  const requestDevice = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      setIsConnecting(true);
      
      const devices = await bluetoothPrinterService.requestDevice();
      setAvailableDevices(devices);
      
      // Auto-connect if only one device found
      if (devices.length === 1) {
        await connect(devices[0].id);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request Bluetooth device';
      setError(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Connect to printer
  const connect = useCallback(async (deviceId?: string): Promise<boolean> => {
    try {
      setError(null);
      setIsConnecting(true);
      
      const success = await bluetoothPrinterService.connect(deviceId);
      
      if (success) {
        const device = bluetoothPrinterService.getConnectedDevice();
        setConnectedDevice(device);
        setIsConnected(true);
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect to printer';
      setError(errorMessage);
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  // Disconnect from printer
  const disconnect = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      await bluetoothPrinterService.disconnect();
      setConnectedDevice(null);
      setIsConnected(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect from printer';
      setError(errorMessage);
    }
  }, []);

  // Print job
  const print = useCallback(async (job: PrintJob): Promise<boolean> => {
    try {
      setError(null);
      setIsPrinting(true);
      
      const success = await bluetoothPrinterService.print(job);
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to print';
      setError(errorMessage);
      return false;
    } finally {
      setIsPrinting(false);
    }
  }, []);

  // Print receipt
  const printReceipt = useCallback(async (receiptData: {
    header: string;
    items: Array<{ name: string; quantity: number; price: number; total: number }>;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    paymentMethod: string;
    cashier: string;
    footer: string;
  }): Promise<boolean> => {
    try {
      setError(null);
      setIsPrinting(true);
      
      const success = await bluetoothPrinterService.printReceipt(receiptData);
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to print receipt';
      setError(errorMessage);
      return false;
    } finally {
      setIsPrinting(false);
    }
  }, []);

  // Print label
  const printLabel = useCallback(async (labelData: {
    title: string;
    barcode?: string;
    qrCode?: string;
    text?: string;
    price?: string;
    sku?: string;
    size?: string;
    color?: string;
    customFields?: Array<{ label: string; value: string }>;
  }): Promise<boolean> => {
    try {
      setError(null);
      setIsPrinting(true);
      
      const success = await bluetoothPrinterService.printLabel(labelData);
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to print label';
      setError(errorMessage);
      return false;
    } finally {
      setIsPrinting(false);
    }
  }, []);

  // Update settings
  const updateSettings = useCallback((newSettings: Partial<PrinterSettings>): void => {
    try {
      bluetoothPrinterService.updateSettings(newSettings);
      const updatedSettings = bluetoothPrinterService.getSettings();
      setSettings(updatedSettings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update settings';
      setError(errorMessage);
    }
  }, []);

  // Clear error
  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Check connection status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const connected = bluetoothPrinterService.isPrinterConnected();
      setIsConnected(connected);
      
      if (!connected && connectedDevice) {
        setConnectedDevice(null);
      } else if (connected && !connectedDevice) {
        const device = bluetoothPrinterService.getConnectedDevice();
        setConnectedDevice(device);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [connectedDevice]);

  return {
    // State
    isInitialized,
    isConnected,
    isConnecting,
    isPrinting,
    connectedDevice,
    availableDevices,
    settings,
    error,

    // Actions
    initialize,
    requestDevice,
    connect,
    disconnect,
    print,
    printReceipt,
    printLabel,
    updateSettings,
    clearError
  };
};
