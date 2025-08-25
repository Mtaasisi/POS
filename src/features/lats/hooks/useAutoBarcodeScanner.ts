import { useState, useCallback, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { toast } from '../../../lib/toastUtils';

interface AutoBarcodeScannerConfig {
  enableAutoScan: boolean;
  enableCamera: boolean;
  enableKeyboard: boolean;
  autoAddToCart: boolean;
  playSound: boolean;
  vibrate: boolean;
  scanTimeout: number;
  retryAttempts: number;
}

interface ScanResult {
  barcode: string;
  timestamp: Date;
  success: boolean;
  error?: string;
}

export const useAutoBarcodeScanner = (
  onBarcodeDetected: (barcode: string) => void,
  config: AutoBarcodeScannerConfig
) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState<string>('');
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const isScanningRef = useRef(false);

  // Initialize scanner
  const initializeScanner = useCallback(async () => {
    if (!config.enableAutoScan || isInitialized) return;

    try {
      setScannerError('');
      
      // Check if camera is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported in this browser');
      }

      // Test camera access
      await navigator.mediaDevices.getUserMedia({ video: true });
      
      // Initialize Html5Qrcode
      html5QrCodeRef.current = new Html5Qrcode("auto-barcode-scanner");
      
      setIsInitialized(true);
      console.log('🔍 Auto barcode scanner initialized successfully');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize scanner';
      setScannerError(errorMessage);
      console.error('Auto barcode scanner initialization error:', error);
      
      // Show user-friendly error message
      toast.error('Barcode scanner not available. You can still search manually.');
    }
  }, [config.enableAutoScan, isInitialized]);

  // Start automatic scanning
  const startAutoScanning = useCallback(async () => {
    if (!config.enableAutoScan || !isInitialized || isScanningRef.current) return;

    try {
      setIsScanning(true);
      isScanningRef.current = true;
      setScannerError('');
      retryCountRef.current = 0;

      if (!html5QrCodeRef.current) {
        throw new Error('Scanner not initialized');
      }

      // Get available cameras
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        const cameraId = devices[0].id;
        
        console.log('🔍 Starting auto-scanning with camera:', cameraId);

        // Start scanning
        await html5QrCodeRef.current.start(
          { deviceId: cameraId },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            console.log('🔍 Barcode detected:', decodedText);
            
            // Clean and validate barcode format
            const cleanBarcode = decodedText?.trim().replace(/[^A-Za-z0-9]/g, '');
            
            if (cleanBarcode && cleanBarcode.length >= 8) {
              const result: ScanResult = {
                barcode: cleanBarcode,
                timestamp: new Date(),
                success: true
              };

              // Add to scan history
              setScanHistory(prev => [result, ...prev.slice(0, 49)]);
              
              // Play sound if enabled
              if (config.playSound) {
                playBeepSound();
              }
              
              // Vibrate if enabled
              if (config.vibrate && 'vibrate' in navigator) {
                navigator.vibrate(200);
              }
              
              // Stop scanning
              stopAutoScanning();
              
              // Call the callback with the detected barcode
              onBarcodeDetected(cleanBarcode);
              
              // Show success message
              toast.success(`Barcode detected: ${cleanBarcode}`);
              
            } else {
              console.warn('Invalid barcode format:', decodedText, 'Cleaned:', cleanBarcode);
              toast.error('Invalid barcode format');
            }
          },
          (error) => {
            // Handle scan errors
            console.error('Scan error:', error);
            retryCountRef.current++;
            
            if (retryCountRef.current >= config.retryAttempts) {
              setScannerError('Failed to scan barcode. Please try again.');
              stopAutoScanning();
            }
          }
        );
      } else {
        throw new Error('No cameras available');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start scanning';
      setScannerError(errorMessage);
      setIsScanning(false);
      isScanningRef.current = false;
      console.error('Auto scanning error:', error);
    }
  }, [config, isInitialized, onBarcodeDetected]);

  // Stop automatic scanning
  const stopAutoScanning = useCallback(async () => {
    setIsScanning(false);
    isScanningRef.current = false;
    
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
    
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        console.log('🔍 Auto-scanning stopped');
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    }
  }, []);

  // Play beep sound
  const playBeepSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.error('Error playing beep sound:', error);
    }
  }, []);

  // Manual barcode input
  const addManualBarcode = useCallback((barcode: string) => {
    if (!barcode.trim()) return;

    const result: ScanResult = {
      barcode: barcode.trim(),
      timestamp: new Date(),
      success: true
    };

    setScanHistory(prev => [result, ...prev.slice(0, 49)]);
    onBarcodeDetected(barcode.trim());
  }, [onBarcodeDetected]);

  // Clear scan history
  const clearScanHistory = useCallback(() => {
    setScanHistory([]);
  }, []);

  // Get recent scans
  const getRecentScans = useCallback(() => {
    return scanHistory.slice(0, 10);
  }, [scanHistory]);

  // Initialize scanner on mount
  useEffect(() => {
    initializeScanner();
  }, [initializeScanner]);

  // Start auto scanning when initialized
  useEffect(() => {
    if (isInitialized && config.enableAutoScan && !isScanningRef.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        startAutoScanning();
      }, 2000); // Increased delay to ensure everything is ready
      
      return () => clearTimeout(timer);
    }
  }, [isInitialized, config.enableAutoScan, startAutoScanning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAutoScanning();
    };
  }, [stopAutoScanning]);

  return {
    isScanning,
    scannerError,
    scanHistory,
    isInitialized,
    startAutoScanning,
    stopAutoScanning,
    addManualBarcode,
    clearScanHistory,
    getRecentScans,
    playBeepSound
  };
};
