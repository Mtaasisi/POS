// Receipt Settings Component for POS
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { Receipt, Printer, Mail, FileText, Settings, Save, RefreshCw, Download, Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ReceiptSettings {
  // Template Settings
  showLogo: boolean;
  showTax: boolean;
  showDiscount: boolean;
  showCustomerInfo: boolean;
  showBarcode: boolean;
  showCashierInfo: boolean;
  
  // Content Settings
  headerText: string;
  footerText: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  
  // Print Settings
  printMode: 'thermal' | 'a4' | 'email';
  autoPrint: boolean;
  printCopies: number;
  paperSize: '80mm' | '58mm' | 'a4';
  
  // Numbering Settings
  receiptPrefix: string;
  receiptNumbering: boolean;
  startNumber: number;
  resetDaily: boolean;
  
  // History Settings
  keepHistory: boolean;
  historyDays: number;
  autoBackup: boolean;
  backupLocation: string;
}

const ReceiptSettings: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch
  } = useForm<ReceiptSettings>({
    defaultValues: {
      showLogo: true,
      showTax: true,
      showDiscount: true,
      showCustomerInfo: true,
      showBarcode: true,
      showCashierInfo: true,
      headerText: 'Welcome to Our Store',
      footerText: 'Thank you for your purchase!',
      companyName: 'Your Company Name',
      companyAddress: '123 Business Street, City',
      companyPhone: '+255 123 456 789',
      companyEmail: 'info@yourcompany.com',
      printMode: 'thermal',
      autoPrint: false,
      printCopies: 1,
      paperSize: '80mm',
      receiptPrefix: 'RCP',
      receiptNumbering: true,
      startNumber: 1,
      resetDaily: true,
      keepHistory: true,
      historyDays: 30,
      autoBackup: false,
      backupLocation: '/receipts/backup'
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
      const savedSettings = localStorage.getItem('lats-receipt-settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        reset(settings);
      }
    } catch (error) {
      console.error('Error loading receipt settings:', error);
      toast.error('Failed to load receipt settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Save settings
  const handleSaveSettings = async (data: ReceiptSettings) => {
    setIsSaving(true);
    try {
      localStorage.setItem('lats-receipt-settings', JSON.stringify(data));
      toast.success('Receipt settings saved successfully');
    } catch (error) {
      console.error('Error saving receipt settings:', error);
      toast.error('Failed to save receipt settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to defaults
  const handleReset = () => {
    reset({
      showLogo: true,
      showTax: true,
      showDiscount: true,
      showCustomerInfo: true,
      showBarcode: true,
      showCashierInfo: true,
      headerText: 'Welcome to Our Store',
      footerText: 'Thank you for your purchase!',
      companyName: 'Your Company Name',
      companyAddress: '123 Business Street, City',
      companyPhone: '+255 123 456 789',
      companyEmail: 'info@yourcompany.com',
      printMode: 'thermal',
      autoPrint: false,
      printCopies: 1,
      paperSize: '80mm',
      receiptPrefix: 'RCP',
      receiptNumbering: true,
      startNumber: 1,
      resetDaily: true,
      keepHistory: true,
      historyDays: 30,
      autoBackup: false,
      backupLocation: '/receipts/backup'
    });
    toast.success('Receipt settings reset to defaults');
  };

  // Export settings
  const handleExport = () => {
    const settings = watchedValues;
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'receipt-settings.json';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Receipt settings exported successfully');
  };

  // Import settings
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target?.result as string);
        reset(settings);
        toast.success('Receipt settings imported successfully');
      } catch (error) {
        toast.error('Invalid settings file');
      }
    };
    reader.readAsText(file);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading receipt settings...</span>
      </div>
    );
  }

  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Receipt className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Receipt Settings</h2>
          <p className="text-sm text-gray-600">Configure receipt templates and printing options</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(handleSaveSettings)} className="space-y-6">
        {/* Template Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Template Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Show Logo</div>
                <div className="text-sm text-gray-600">Display company logo on receipts</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('showLogo')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Show Tax</div>
                <div className="text-sm text-gray-600">Display tax information on receipts</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('showTax')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Show Discount</div>
                <div className="text-sm text-gray-600">Display discount information on receipts</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('showDiscount')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Show Customer Info</div>
                <div className="text-sm text-gray-600">Display customer information on receipts</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('showCustomerInfo')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Show Barcode</div>
                <div className="text-sm text-gray-600">Display barcode on receipts</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('showBarcode')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Show Cashier Info</div>
                <div className="text-sm text-gray-600">Display cashier information on receipts</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('showCashierInfo')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Content Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Content Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Header Text</label>
              <input
                type="text"
                {...register('headerText')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Welcome to Our Store"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Footer Text</label>
              <input
                type="text"
                {...register('footerText')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Thank you for your purchase!"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
              <input
                type="text"
                {...register('companyName')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your Company Name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Address</label>
              <input
                type="text"
                {...register('companyAddress')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="123 Business Street, City"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Phone</label>
              <input
                type="text"
                {...register('companyPhone')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="+255 123 456 789"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Email</label>
              <input
                type="email"
                {...register('companyEmail')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="info@yourcompany.com"
              />
            </div>
          </div>
        </div>

        {/* Print Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <Printer className="w-5 h-5" />
            Print Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Print Mode</label>
              <select
                {...register('printMode')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="thermal">Thermal Printer</option>
                <option value="a4">A4 Paper</option>
                <option value="email">Email Receipt</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Paper Size</label>
              <select
                {...register('paperSize')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="80mm">80mm (Thermal)</option>
                <option value="58mm">58mm (Thermal)</option>
                <option value="a4">A4 (Standard)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Print Copies</label>
              <input
                type="number"
                {...register('printCopies', { min: 1, max: 10 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="10"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Auto Print</div>
                <div className="text-sm text-gray-600">Automatically print receipts after payment</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('autoPrint')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Numbering Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Numbering Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Receipt Prefix</label>
              <input
                type="text"
                {...register('receiptPrefix')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="RCP"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Number</label>
              <input
                type="number"
                {...register('startNumber', { min: 1 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Receipt Numbering</div>
                <div className="text-sm text-gray-600">Enable automatic receipt numbering</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('receiptNumbering')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Reset Daily</div>
                <div className="text-sm text-gray-600">Reset receipt numbers daily</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('resetDaily')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* History Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            History Settings
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Keep History</div>
                <div className="text-sm text-gray-600">Store receipt history</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('keepHistory')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">History Days</label>
              <input
                type="number"
                {...register('historyDays', { min: 1, max: 365 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                max="365"
              />
              <p className="text-xs text-gray-500 mt-1">Number of days to keep receipt history</p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">Auto Backup</div>
                <div className="text-sm text-gray-600">Automatically backup receipts</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('autoBackup')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Backup Location</label>
              <input
                type="text"
                {...register('backupLocation')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="/receipts/backup"
              />
            </div>
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
            <GlassButton
              type="button"
              onClick={handleExport}
              variant="secondary"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </GlassButton>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              <GlassButton
                type="button"
                variant="secondary"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </GlassButton>
            </label>
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

export default ReceiptSettings;
