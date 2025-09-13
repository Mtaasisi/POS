// Bluetooth Printer Service for LATS CHANCE
// Handles Bluetooth printer connections and printing

export interface BluetoothPrinter {
  id: string;
  name: string;
  address: string;
  connected: boolean;
  type: 'thermal' | 'label' | 'receipt';
  paperWidth: number; // in mm
  labelHeight?: number; // in mm for label printers
  dpi?: number; // dots per inch for label printers
  supportedCommands: string[];
}

export interface PrintJob {
  content: string;
  commands?: string[];
  copies?: number;
  paperWidth?: number;
  labelHeight?: number;
  dpi?: number;
  printType?: 'receipt' | 'label';
}

export interface PrinterSettings {
  defaultPrinter?: string;
  paperWidth: number;
  printCopies: number;
  autoConnect: boolean;
  connectionTimeout: number;
  labelHeight: number;
  dpi: number;
  defaultPrintType: 'receipt' | 'label';
}

class BluetoothPrinterService {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private service: BluetoothRemoteGATTService | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private isConnected = false;
  private settings: PrinterSettings = {
    paperWidth: 80,
    printCopies: 1,
    autoConnect: false,
    connectionTimeout: 10000,
    labelHeight: 25,
    dpi: 203,
    defaultPrintType: 'receipt'
  };

  // Initialize the service
  async initialize(): Promise<boolean> {
    try {
      // Check if Bluetooth is available
      if (!navigator.bluetooth) {
        throw new Error('Bluetooth not supported in this browser');
      }

      // Load saved settings
      this.loadSettings();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize Bluetooth printer service:', error);
      return false;
    }
  }

  // Request Bluetooth device
  async requestDevice(): Promise<BluetoothPrinter[]> {
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: ['000018f0-0000-1000-8000-00805f9b34fb'] }, // Generic Access
          { namePrefix: 'Printer' },
          { namePrefix: 'Thermal' },
          { namePrefix: 'Receipt' },
          { namePrefix: 'POS' },
          { namePrefix: 'ESC' },
          { namePrefix: 'Star' },
          { namePrefix: 'Citizen' },
          { namePrefix: 'Epson' },
          { namePrefix: 'Zebra' }
        ],
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb',
          '000018f1-0000-1000-8000-00805f9b34fb',
          '000018f2-0000-1000-8000-00805f9b34fb'
        ]
      });

      this.device = device;
      
      // Listen for disconnection
      device.addEventListener('gattserverdisconnected', () => {
        this.handleDisconnection();
      });

      // Determine printer type based on name
      const deviceName = device.name || '';
      let printerType: 'thermal' | 'label' | 'receipt' = 'thermal';
      let paperWidth = 80;
      let labelHeight = 25;
      let dpi = 203;
      
      // Special handling for XP-P301A (dual function printer)
      if (deviceName.toLowerCase().includes('xp-p301a') || deviceName.toLowerCase().includes('xprinter')) {
        printerType = 'receipt'; // Default to receipt mode, can switch to label
        paperWidth = 80;
        labelHeight = 25;
        dpi = 203;
      } else if (deviceName.toLowerCase().includes('label') || deviceName.toLowerCase().includes('zebra')) {
        printerType = 'label';
        paperWidth = 50;
        labelHeight = 25;
        dpi = 203;
      } else if (deviceName.toLowerCase().includes('receipt') || deviceName.toLowerCase().includes('thermal')) {
        printerType = 'receipt';
        paperWidth = 80;
      }
      
      return [{
        id: device.id,
        name: device.name || 'Unknown Printer',
        address: device.id,
        connected: false,
        type: printerType,
        paperWidth,
        labelHeight,
        dpi,
        supportedCommands: printerType === 'label' ? ['text', 'barcode', 'qr', 'image'] : 
                           deviceName.toLowerCase().includes('xp-p301a') ? ['text', 'barcode', 'qr', 'cut', 'feed', 'label'] : 
                           ['text', 'cut', 'feed']
      }];
    } catch (error) {
      console.error('Failed to request Bluetooth device:', error);
      throw error;
    }
  }

  // Connect to a Bluetooth printer
  async connect(deviceId?: string): Promise<boolean> {
    try {
      if (!this.device && deviceId) {
        // Try to reconnect to a previously paired device
        const devices = await navigator.bluetooth.getDevices();
        this.device = devices.find(d => d.id === deviceId) || null;
        
        if (!this.device) {
          throw new Error('Device not found. Please pair the printer first.');
        }
      }

      if (!this.device) {
        throw new Error('No device selected');
      }

      console.log('Connecting to printer:', this.device.name);

      // Connect to GATT server
      this.server = await this.device.gatt?.connect();
      if (!this.server) {
        throw new Error('Failed to connect to GATT server');
      }

      // Get the primary service
      this.service = await this.server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
      if (!this.service) {
        throw new Error('Printer service not found');
      }

      // Get the characteristic for writing data
      this.characteristic = await this.service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');
      if (!this.characteristic) {
        throw new Error('Printer characteristic not found');
      }

      this.isConnected = true;
      console.log('Successfully connected to printer');
      
      // Save connected device
      this.saveConnectedDevice();
      
      return true;
    } catch (error) {
      console.error('Failed to connect to printer:', error);
      this.isConnected = false;
      throw error;
    }
  }

  // Disconnect from printer
  async disconnect(): Promise<void> {
    try {
      if (this.server && this.server.connected) {
        await this.server.disconnect();
      }
      
      this.device = null;
      this.server = null;
      this.service = null;
      this.characteristic = null;
      this.isConnected = false;
      
      console.log('Disconnected from printer');
    } catch (error) {
      console.error('Error disconnecting from printer:', error);
    }
  }

  // Send print job to connected printer
  async print(job: PrintJob): Promise<boolean> {
    try {
      console.log('Print job received:', job);
      console.log('Is connected:', this.isConnected);
      console.log('Characteristic exists:', !!this.characteristic);
      
      if (!this.isConnected || !this.characteristic) {
        throw new Error('Printer not connected');
      }

      const { 
        content, 
        commands = [], 
        copies = 1, 
        paperWidth = this.settings.paperWidth,
        labelHeight = this.settings.labelHeight,
        dpi = this.settings.dpi,
        printType = this.settings.defaultPrintType
      } = job;

      let printData = '';
      
      if (printType === 'label') {
        // Label printer commands (ZPL-like format)
        printData += this.generateLabelCommands(content, paperWidth, labelHeight, dpi);
      } else {
        // Receipt printer commands (ESC/POS) - Simplified
        console.log('Adding ESC/POS commands...');
        printData += '\x1B\x40'; // Initialize printer
        console.log('Added initialize command (ESC @)');
        
        // Add content first
        printData += content;
        console.log('Added content:', content);
        
        // Add paper feed
        printData += '\n\n\n\n\n'; // Feed paper
        console.log('Added paper feed');
        
        // Only add cut command if supported
        // printData += '\x1D\x56\x00'; // Cut paper (commented out for testing)
      }

      // Convert to Uint8Array
      const encoder = new TextEncoder();
      const data = encoder.encode(printData);
      
      console.log('Print data length:', data.length);
      console.log('Print data preview:', printData.substring(0, 100) + '...');

      // Send data to printer
      for (let i = 0; i < copies; i++) {
        console.log(`Sending copy ${i + 1}/${copies}...`);
        await this.characteristic.writeValue(data);
        console.log(`Copy ${i + 1} sent successfully`);
        
        if (copies > 1 && i < copies - 1) {
          // Wait a bit between copies
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      console.log('Print job completed successfully');
      return true;
    } catch (error) {
      console.error('Failed to print:', error);
      throw error;
    }
  }

  // Generate label printer commands
  private generateLabelCommands(content: string, paperWidth: number, labelHeight: number, dpi: number): string {
    // Convert mm to dots based on DPI
    const mmToDots = (mm: number) => Math.round((mm * dpi) / 25.4);
    const widthDots = mmToDots(paperWidth);
    const heightDots = mmToDots(labelHeight);
    
    let commands = '';
    
    // Initialize label printer
    commands += '\x1B\x40'; // Initialize
    commands += '\x1B\x69\x4D\x40'; // Set label mode
    commands += `\x1B\x69\x41${String.fromCharCode(widthDots & 0xFF)}${String.fromCharCode((widthDots >> 8) & 0xFF)}`; // Set label width
    commands += `\x1B\x69\x51${String.fromCharCode(heightDots & 0xFF)}${String.fromCharCode((heightDots >> 8) & 0xFF)}`; // Set label height
    
    // Add content with proper positioning
    commands += '\x1B\x69\x61\x01'; // Center alignment
    commands += '\x1B\x69\x21\x00'; // Normal text size
    commands += content;
    
    // Print and feed
    commands += '\x1B\x69\x4D\x00'; // Print label
    commands += '\x1B\x69\x4D\x02'; // Feed label
    
    return commands;
  }

  // Print receipt with formatting
  async printReceipt(receiptData: {
    header: string;
    items: Array<{ name: string; quantity: number; price: number; total: number }>;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    paymentMethod: string;
    cashier: string;
    footer: string;
  }): Promise<boolean> {
    try {
      const { paperWidth = this.settings.paperWidth } = this.settings;
      const maxWidth = Math.floor(paperWidth / 8); // Approximate characters per line

      let content = '';
      
      // Header
      content += '\x1B\x61\x01'; // Center alignment
      content += receiptData.header + '\n';
      content += '='.repeat(maxWidth) + '\n';
      
      // Items
      content += '\x1B\x61\x00'; // Left alignment
      receiptData.items.forEach(item => {
        const itemLine = `${item.name}\n`;
        const priceLine = `  ${item.quantity} x ${this.formatMoney(item.price)} = ${this.formatMoney(item.total)}\n`;
        content += itemLine + priceLine;
      });
      
      // Totals
      content += '\n' + '='.repeat(maxWidth) + '\n';
      content += `Subtotal: ${this.formatMoney(receiptData.subtotal)}\n`;
      if (receiptData.tax > 0) {
        content += `Tax: ${this.formatMoney(receiptData.tax)}\n`;
      }
      if (receiptData.discount > 0) {
        content += `Discount: -${this.formatMoney(receiptData.discount)}\n`;
      }
      content += `TOTAL: ${this.formatMoney(receiptData.total)}\n`;
      content += '='.repeat(maxWidth) + '\n';
      
      // Payment info
      content += `Payment: ${receiptData.paymentMethod}\n`;
      content += `Cashier: ${receiptData.cashier}\n`;
      content += `Date: ${new Date().toLocaleString()}\n`;
      
      // Footer
      content += '\n\x1B\x61\x01'; // Center alignment
      content += receiptData.footer + '\n';

      return await this.print({ content, copies: this.settings.printCopies });
    } catch (error) {
      console.error('Failed to print receipt:', error);
      throw error;
    }
  }

  // Print label with formatting
  async printLabel(labelData: {
    title: string;
    barcode?: string;
    qrCode?: string;
    text?: string;
    price?: string;
    sku?: string;
    size?: string;
    color?: string;
    customFields?: Array<{ label: string; value: string }>;
  }): Promise<boolean> {
    try {
      const { paperWidth = this.settings.paperWidth, labelHeight = this.settings.labelHeight } = this.settings;
      
      let content = '';
      
      // Title
      if (labelData.title) {
        content += `\x1B\x69\x21\x11`; // Large text
        content += labelData.title + '\n';
      }
      
      // Barcode
      if (labelData.barcode) {
        content += `\x1B\x62\x01`; // Start barcode
        content += labelData.barcode;
        content += `\x1B\x62\x00`; // End barcode
        content += '\n';
      }
      
      // QR Code
      if (labelData.qrCode) {
        content += `\x1B\x71\x01`; // Start QR code
        content += labelData.qrCode;
        content += `\x1B\x71\x00`; // End QR code
        content += '\n';
      }
      
      // Text content
      if (labelData.text) {
        content += `\x1B\x69\x21\x00`; // Normal text
        content += labelData.text + '\n';
      }
      
      // Price
      if (labelData.price) {
        content += `\x1B\x69\x21\x01`; // Bold text
        content += `Price: ${labelData.price}\n`;
      }
      
      // SKU
      if (labelData.sku) {
        content += `SKU: ${labelData.sku}\n`;
      }
      
      // Size and Color
      if (labelData.size || labelData.color) {
        const details = [];
        if (labelData.size) details.push(`Size: ${labelData.size}`);
        if (labelData.color) details.push(`Color: ${labelData.color}`);
        content += details.join(' | ') + '\n';
      }
      
      // Custom fields
      if (labelData.customFields) {
        labelData.customFields.forEach(field => {
          content += `${field.label}: ${field.value}\n`;
        });
      }

      return await this.print({ 
        content, 
        copies: this.settings.printCopies,
        printType: 'label',
        paperWidth,
        labelHeight
      });
    } catch (error) {
      console.error('Failed to print label:', error);
      throw error;
    }
  }

  // Check connection status
  isPrinterConnected(): boolean {
    return this.isConnected && this.server?.connected === true;
  }

  // Get connected device info
  getConnectedDevice(): BluetoothPrinter | null {
    if (!this.device || !this.isConnected) {
      return null;
    }

    return {
      id: this.device.id,
      name: this.device.name || 'Unknown Printer',
      address: this.device.id,
      connected: this.isConnected,
      type: 'thermal',
      paperWidth: this.settings.paperWidth,
      supportedCommands: ['text', 'cut', 'feed']
    };
  }

  // Update settings
  updateSettings(newSettings: Partial<PrinterSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  // Get current settings
  getSettings(): PrinterSettings {
    return { ...this.settings };
  }

  // Handle disconnection
  private handleDisconnection(): void {
    console.log('Printer disconnected');
    this.isConnected = false;
    this.server = null;
    this.service = null;
    this.characteristic = null;
    
    // Try to reconnect if auto-connect is enabled
    if (this.settings.autoConnect && this.device) {
      setTimeout(() => {
        this.connect().catch(error => {
          console.error('Auto-reconnect failed:', error);
        });
      }, 2000);
    }
  }

  // Save settings to localStorage
  private saveSettings(): void {
    try {
      localStorage.setItem('bluetoothPrinterSettings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('Failed to save printer settings:', error);
    }
  }

  // Load settings from localStorage
  private loadSettings(): void {
    try {
      const saved = localStorage.getItem('bluetoothPrinterSettings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Failed to load printer settings:', error);
    }
  }

  // Save connected device info
  private saveConnectedDevice(): void {
    try {
      if (this.device) {
        localStorage.setItem('connectedPrinterDevice', this.device.id);
      }
    } catch (error) {
      console.error('Failed to save connected device:', error);
    }
  }

  // Format money for receipt
  private formatMoney(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount);
  }
}

// Create singleton instance
export const bluetoothPrinterService = new BluetoothPrinterService();

// Export types for use in components
export type { BluetoothPrinter, PrintJob, PrinterSettings };
