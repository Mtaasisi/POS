import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from '../../../lib/toastUtils';

interface ExternalBarcodeScannerConfig {
  enableAutoScan: boolean;
  enableKeyboard: boolean;
  autoAddToCart: boolean;
  playSound: boolean;
  vibrate: boolean;
  scanTimeout: number;
  barcodeLength: {
    min: number;
    max: number;
  };
  endCharacter: string; // Usually Enter key
  startCharacter?: string; // Some scanners send start character
}

interface ScanResult {
  barcode: string;
  timestamp: Date;
  success: boolean;
  error?: string;
}

export const useExternalBarcodeScanner = (
  onBarcodeDetected: (barcode: string) => void,
  config: ExternalBarcodeScannerConfig
) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState<string>('');
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const barcodeBufferRef = useRef<string>('');
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastKeyTimeRef = useRef<number>(0);
  const isProcessingRef = useRef(false);

  // Initialize external scanner
  const initializeScanner = useCallback(async () => {
    if (!config.enableAutoScan || isInitialized) return;

    try {
      setScannerError('');
      setIsInitialized(true);
      console.log('🔍 External barcode scanner initialized successfully');
      

      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize scanner';
      setScannerError(errorMessage);
      console.error('External barcode scanner initialization error:', error);
    }
  }, [config.enableAutoScan, isInitialized]);

  // Handle keyboard input from external scanner
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!config.enableAutoScan || isProcessingRef.current) return;

    const currentTime = Date.now();
    const key = event.key;
    
    // Clear buffer if too much time has passed (new scan)
    if (currentTime - lastKeyTimeRef.current > config.scanTimeout) {
      barcodeBufferRef.current = '';
    }
    
    lastKeyTimeRef.current = currentTime;

    // Handle different key types
    if (key === config.endCharacter) {
      // End of barcode scan
      event.preventDefault();
      
      const barcode = barcodeBufferRef.current.trim();
      barcodeBufferRef.current = '';
      
      if (barcode && barcode.length >= config.barcodeLength.min && barcode.length <= config.barcodeLength.max) {
        console.log('🔍 External scanner detected barcode:', barcode);
        
        const result: ScanResult = {
          barcode,
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
        
        // Process the barcode
        isProcessingRef.current = true;
        onBarcodeDetected(barcode);
        

        
        // Reset processing flag after a short delay
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 1000);
        
      } else {
        console.warn('Invalid barcode format:', barcode);
      }
      
    } else if (key === config.startCharacter) {
      // Start of barcode scan (if configured)
      event.preventDefault();
      barcodeBufferRef.current = '';
      
    } else if (key.length === 1 && /^[A-Za-z0-9\-_\.]+$/.test(key)) {
      // Valid barcode character
      barcodeBufferRef.current += key;
      
    } else if (key === 'Backspace') {
      // Handle backspace
      barcodeBufferRef.current = barcodeBufferRef.current.slice(0, -1);
    }
  }, [config, onBarcodeDetected]);

  // Start external scanning
  const startExternalScanning = useCallback(() => {
    if (!config.enableAutoScan || isInitialized) return;

    try {
      setIsScanning(true);
      setScannerError('');
      barcodeBufferRef.current = '';
      isProcessingRef.current = false;
      
      console.log('🔍 External barcode scanning started');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start scanning';
      setScannerError(errorMessage);
      setIsScanning(false);
      console.error('External scanning error:', error);
    }
  }, [config.enableAutoScan, isInitialized]);

  // Stop external scanning
  const stopExternalScanning = useCallback(() => {
    setIsScanning(false);
    barcodeBufferRef.current = '';
    isProcessingRef.current = false;
    
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
      scanTimeoutRef.current = null;
    }
    
    console.log('🔍 External barcode scanning stopped');
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



  // Initialize scanner on mount
  useEffect(() => {
    initializeScanner();
  }, [initializeScanner]);

  // Start scanning when initialized
  useEffect(() => {
    if (isInitialized && config.enableAutoScan && !isScanning) {
      startExternalScanning();
    }
  }, [isInitialized, config.enableAutoScan, isScanning, startExternalScanning]);

  // Add keyboard event listener
  useEffect(() => {
    if (isInitialized && config.enableAutoScan) {
      document.addEventListener('keydown', handleKeyPress);
      
      return () => {
        document.removeEventListener('keydown', handleKeyPress);
      };
    }
  }, [isInitialized, config.enableAutoScan, handleKeyPress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopExternalScanning();
    };
  }, [stopExternalScanning]);

  return {
    isScanning,
    scannerError,
    scanHistory,
    isInitialized,
    startExternalScanning,
    stopExternalScanning,
    playBeepSound
  };
};
