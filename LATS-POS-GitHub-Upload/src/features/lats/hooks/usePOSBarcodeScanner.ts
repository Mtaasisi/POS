import { useState, useCallback, useRef, useEffect } from 'react';

interface ScanResult {
  barcode: string;
  timestamp: Date;
  success: boolean;
  error?: string;
}

interface ScannerConfig {
  enableCamera: boolean;
  enableKeyboard: boolean;
  enableFileUpload: boolean;
  autoFocus: boolean;
  scanTimeout: number;
  retryAttempts: number;
}

export const usePOSBarcodeScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState<string>('');
  const [scannedBarcodes, setScannedBarcodes] = useState<string[]>([]);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [scannerConfig, setScannerConfig] = useState<ScannerConfig>({
    enableCamera: true,
    enableKeyboard: true,
    enableFileUpload: false,
    autoFocus: true,
    scanTimeout: 5000,
    retryAttempts: 3
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize camera
  const initializeCamera = useCallback(async () => {
    try {
      setScannerError('');
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to access camera';
      setScannerError(errorMessage);
      console.error('Camera initialization error:', error);
      return false;
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  // Simulate barcode scanning (in real app, this would use a barcode library)
  const scanBarcode = useCallback(async (): Promise<ScanResult> => {
    try {
      // Simulate scanning delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate a mock barcode (in real app, this would be detected from camera)
      const mockBarcodes = [
        '1234567890123',
        '9876543210987',
        '4567891234567',
        '7891234567890',
        '3210987654321'
      ];
      
      const barcode = mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)];
      
      const result: ScanResult = {
        barcode,
        timestamp: new Date(),
        success: true
      };

      // Add to history
      setScanHistory(prev => [result, ...prev.slice(0, 49)]); // Keep last 50 scans
      setScannedBarcodes(prev => [barcode, ...prev.slice(0, 9)]); // Keep last 10 barcodes

      return result;
    } catch (error) {
      const result: ScanResult = {
        barcode: '',
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : 'Scanning failed'
      };
      
      setScanHistory(prev => [result, ...prev.slice(0, 49)]);
      return result;
    }
  }, []);

  // Start scanning
  const startScanning = useCallback(async () => {
    if (isScanning) return;

    setIsScanning(true);
    setScannerError('');

    try {
      if (scannerConfig.enableCamera) {
        const cameraInitialized = await initializeCamera();
        if (!cameraInitialized) {
          throw new Error('Failed to initialize camera');
        }
      }

      // Start scanning loop
      let attempts = 0;
      const maxAttempts = scannerConfig.retryAttempts;

      const scanLoop = async () => {
        if (!isScanning || attempts >= maxAttempts) {
          stopScanning();
          return;
        }

        attempts++;
        const result = await scanBarcode();

        if (result.success) {
          // Success - stop scanning
          stopScanning();
          return result;
        } else {
          // Retry after timeout
          scanTimeoutRef.current = setTimeout(scanLoop, scannerConfig.scanTimeout);
        }
      };

      scanLoop();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Scanning failed';
      setScannerError(errorMessage);
      setIsScanning(false);
    }
  }, [isScanning, scannerConfig, initializeCamera, scanBarcode]);

  // Stop scanning
  const stopScanning = useCallback(() => {
    setIsScanning(false);
    
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
    
    stopCamera();
  }, [stopCamera]);

  // Manual barcode input
  const addManualBarcode = useCallback((barcode: string) => {
    if (!barcode.trim()) return;

    const result: ScanResult = {
      barcode: barcode.trim(),
      timestamp: new Date(),
      success: true
    };

    setScanHistory(prev => [result, ...prev.slice(0, 49)]);
    setScannedBarcodes(prev => [barcode.trim(), ...prev.slice(0, 9)]);
  }, []);

  // Clear scan history
  const clearScanHistory = useCallback(() => {
    setScanHistory([]);
    setScannedBarcodes([]);
  }, []);

  // Get recent scans
  const getRecentScans = useCallback((limit: number = 10) => {
    return scanHistory.slice(0, limit);
  }, [scanHistory]);

  // Update scanner configuration
  const updateScannerConfig = useCallback((config: Partial<ScannerConfig>) => {
    setScannerConfig(prev => ({ ...prev, ...config }));
  }, []);

  // Check if camera is supported
  const isCameraSupported = useCallback(() => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  return {
    // State
    isScanning,
    scannerError,
    scannedBarcodes,
    scanHistory,
    scannerConfig,
    
    // Refs
    videoRef,
    canvasRef,
    
    // Actions
    startScanning,
    stopScanning,
    addManualBarcode,
    clearScanHistory,
    updateScannerConfig,
    
    // Utilities
    getRecentScans,
    isCameraSupported
  };
};
