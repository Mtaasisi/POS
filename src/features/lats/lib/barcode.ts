// Barcode utility for LATS module
export interface BarcodeOptions {
  format?: string;
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  margin?: number;
  background?: string;
  lineColor?: string;
  valid?: (valid: boolean) => void;
}

export interface BarcodeResult {
  text: string;
  format: string;
  valid: boolean;
}

class BarcodeScanner {
  private isSupported: boolean;
  private isInitialized: boolean = false;

  constructor() {
    this.isSupported = this.checkSupport();
  }

  private checkSupport(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  /**
   * Check if barcode scanning is supported
   */
  isBarcodeSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Initialize the barcode scanner
   */
  async initialize(): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('[LATS Barcode] Barcode scanning is not supported in this browser');
      return false;
    }

    try {
      // Request camera permission
      await navigator.mediaDevices.getUserMedia({ video: true });
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('[LATS Barcode] Failed to initialize barcode scanner:', error);
      return false;
    }
  }

  /**
   * Start scanning for barcodes
   */
  async startScanning(
    onResult: (result: BarcodeResult) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        onError?.('Failed to initialize barcode scanner');
        return;
      }
    }

    // In a real implementation, you would use a barcode scanning library
    // For demo purposes, we'll simulate scanning
    console.log('[LATS Barcode] Starting barcode scan...');
    
    // Simulate scanning after a delay
    setTimeout(() => {
      const mockResult: BarcodeResult = {
        text: '1234567890123',
        format: 'EAN-13',
        valid: true
      };
      onResult(mockResult);
    }, 2000);
  }

  /**
   * Stop scanning for barcodes
   */
  stopScanning(): void {
    console.log('[LATS Barcode] Stopping barcode scan...');
    // In a real implementation, you would stop the camera stream
  }

  /**
   * Generate a barcode
   */
  generateBarcode(
    text: string,
    options: BarcodeOptions = {}
  ): string {
    const defaultOptions: BarcodeOptions = {
      format: 'CODE128',
      width: 2,
      height: 100,
      displayValue: true,
      fontSize: 20,
      margin: 10,
      background: '#ffffff',
      lineColor: '#000000'
    };

    const opts = { ...defaultOptions, ...options };

    // In a real implementation, you would use a barcode generation library
    // For demo purposes, we'll return a placeholder
    console.log('[LATS Barcode] Generating barcode for:', text, opts);
    
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="${opts.width! * text.length + opts.margin! * 2}" height="${opts.height! + opts.margin! * 2}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${opts.background}"/>
        <text x="50%" y="${opts.height! - opts.margin!}" text-anchor="middle" font-size="${opts.fontSize}" fill="${opts.lineColor}">${text}</text>
      </svg>
    `)}`;
  }

  /**
   * Validate a barcode format
   */
  validateBarcode(text: string, format?: string): boolean {
    if (!text) return false;

    switch (format) {
      case 'EAN-13':
        return this.validateEAN13(text);
      case 'EAN-8':
        return this.validateEAN8(text);
      case 'UPC-A':
        return this.validateUPCA(text);
      case 'UPC-E':
        return this.validateUPCE(text);
      case 'CODE128':
        return this.validateCODE128(text);
      case 'CODE39':
        return this.validateCODE39(text);
      default:
        // For unknown formats, just check if it's not empty
        return text.length > 0;
    }
  }

  /**
   * Validate EAN-13 barcode
   */
  private validateEAN13(text: string): boolean {
    if (text.length !== 13) return false;
    if (!/^\d{13}$/.test(text)) return false;

    // Calculate check digit
    const digits = text.split('').map(Number);
    const checkDigit = digits[12];
    const sum = digits.slice(0, 12).reduce((acc, digit, index) => {
      return acc + digit * (index % 2 === 0 ? 1 : 3);
    }, 0);
    const calculatedCheckDigit = (10 - (sum % 10)) % 10;

    return checkDigit === calculatedCheckDigit;
  }

  /**
   * Validate EAN-8 barcode
   */
  private validateEAN8(text: string): boolean {
    if (text.length !== 8) return false;
    if (!/^\d{8}$/.test(text)) return false;

    // Calculate check digit
    const digits = text.split('').map(Number);
    const checkDigit = digits[7];
    const sum = digits.slice(0, 7).reduce((acc, digit, index) => {
      return acc + digit * (index % 2 === 0 ? 3 : 1);
    }, 0);
    const calculatedCheckDigit = (10 - (sum % 10)) % 10;

    return checkDigit === calculatedCheckDigit;
  }

  /**
   * Validate UPC-A barcode
   */
  private validateUPCA(text: string): boolean {
    if (text.length !== 12) return false;
    if (!/^\d{12}$/.test(text)) return false;

    // Calculate check digit
    const digits = text.split('').map(Number);
    const checkDigit = digits[11];
    const sum = digits.slice(0, 11).reduce((acc, digit, index) => {
      return acc + digit * (index % 2 === 0 ? 3 : 1);
    }, 0);
    const calculatedCheckDigit = (10 - (sum % 10)) % 10;

    return checkDigit === calculatedCheckDigit;
  }

  /**
   * Validate UPC-E barcode
   */
  private validateUPCE(text: string): boolean {
    if (text.length !== 8) return false;
    if (!/^\d{8}$/.test(text)) return false;

    // Calculate check digit
    const digits = text.split('').map(Number);
    const checkDigit = digits[7];
    const sum = digits.slice(0, 7).reduce((acc, digit, index) => {
      return acc + digit * (index % 2 === 0 ? 3 : 1);
    }, 0);
    const calculatedCheckDigit = (10 - (sum % 10)) % 10;

    return checkDigit === calculatedCheckDigit;
  }

  /**
   * Validate CODE128 barcode
   */
  private validateCODE128(text: string): boolean {
    // CODE128 can contain alphanumeric characters (ASCII 32-127 for printable characters)
    return /^[\x20-\x7F]+$/.test(text) && text.length > 0;
  }

  /**
   * Validate CODE39 barcode
   */
  private validateCODE39(text: string): boolean {
    // CODE39 can contain alphanumeric characters and some symbols
    return /^[A-Z0-9\-./+\s]+$/.test(text) && text.length > 0;
  }

  /**
   * Get barcode format from text
   */
  detectBarcodeFormat(text: string): string {
    if (!text) return 'UNKNOWN';

    if (/^\d{13}$/.test(text) && this.validateEAN13(text)) {
      return 'EAN-13';
    }

    if (/^\d{8}$/.test(text) && this.validateEAN8(text)) {
      return 'EAN-8';
    }

    if (/^\d{12}$/.test(text) && this.validateUPCA(text)) {
      return 'UPC-A';
    }

    if (/^\d{8}$/.test(text) && this.validateUPCE(text)) {
      return 'UPC-E';
    }

    if (/^[\x20-\x7F]+$/.test(text)) {
      return 'CODE128';
    }

    if (/^[A-Z0-9\-./+\s]+$/.test(text)) {
      return 'CODE39';
    }

    return 'UNKNOWN';
  }

  /**
   * Generate a random barcode for testing
   */
  generateRandomBarcode(format: string = 'EAN-13'): string {
    switch (format) {
      case 'EAN-13':
        return this.generateRandomEAN13();
      case 'EAN-8':
        return this.generateRandomEAN8();
      case 'UPC-A':
        return this.generateRandomUPCA();
      case 'UPC-E':
        return this.generateRandomUPCE();
      case 'CODE128':
        return this.generateRandomCODE128();
      case 'CODE39':
        return this.generateRandomCODE39();
      default:
        return this.generateRandomEAN13();
    }
  }

  private generateRandomEAN13(): string {
    const digits = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10));
    const sum = digits.reduce((acc, digit, index) => {
      return acc + digit * (index % 2 === 0 ? 1 : 3);
    }, 0);
    const checkDigit = (10 - (sum % 10)) % 10;
    return digits.join('') + checkDigit;
  }

  private generateRandomEAN8(): string {
    const digits = Array.from({ length: 7 }, () => Math.floor(Math.random() * 10));
    const sum = digits.reduce((acc, digit, index) => {
      return acc + digit * (index % 2 === 0 ? 3 : 1);
    }, 0);
    const checkDigit = (10 - (sum % 10)) % 10;
    return digits.join('') + checkDigit;
  }

  private generateRandomUPCA(): string {
    const digits = Array.from({ length: 11 }, () => Math.floor(Math.random() * 10));
    const sum = digits.reduce((acc, digit, index) => {
      return acc + digit * (index % 2 === 0 ? 3 : 1);
    }, 0);
    const checkDigit = (10 - (sum % 10)) % 10;
    return digits.join('') + checkDigit;
  }

  private generateRandomUPCE(): string {
    const digits = Array.from({ length: 7 }, () => Math.floor(Math.random() * 10));
    const sum = digits.reduce((acc, digit, index) => {
      return acc + digit * (index % 2 === 0 ? 3 : 1);
    }, 0);
    const checkDigit = (10 - (sum % 10)) % 10;
    return digits.join('') + checkDigit;
  }

  private generateRandomCODE128(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const length = Math.floor(Math.random() * 10) + 5;
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  private generateRandomCODE39(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const length = Math.floor(Math.random() * 8) + 3;
    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }
}

// Export singleton instance
export const barcodeScanner = new BarcodeScanner();

// Convenience functions
export const scanBarcode = (
  onResult: (result: BarcodeResult) => void,
  onError?: (error: string) => void
) => barcodeScanner.startScanning(onResult, onError);

export const stopBarcodeScan = () => barcodeScanner.stopScanning();

export const generateBarcode = (text: string, options?: BarcodeOptions) => 
  barcodeScanner.generateBarcode(text, options);

export const validateBarcode = (text: string, format?: string) => 
  barcodeScanner.validateBarcode(text, format);

export const detectBarcodeFormat = (text: string) => 
  barcodeScanner.detectBarcodeFormat(text);

export const generateRandomBarcode = (format?: string) => 
  barcodeScanner.generateRandomBarcode(format);
