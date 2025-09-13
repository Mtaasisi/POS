// Receipt Settings Tab Component
import React, { forwardRef, useImperativeHandle } from 'react';
import { Receipt, Printer, FileText, Settings, Image, Calendar } from 'lucide-react';
import UniversalSettingsTab from './UniversalSettingsTab';
import { ToggleSwitch, NumberInput, TextInput, Select } from './UniversalFormComponents';
import { useReceiptSettings } from '../../../../hooks/usePOSSettings';


export interface ReceiptSettingsTabRef {
  saveSettings: () => Promise<boolean>;
  resetSettings: () => Promise<boolean>;
}

const ReceiptSettingsTab = forwardRef<ReceiptSettingsTabRef>((props, ref) => {
  const {
    settings,
    setSettings,
    loading: isLoading,
    saving: isSaving,
    error,
    saveSettings,
    updateSettings,
    resetSettings
  } = useReceiptSettings();

  const handleSave = async () => {
    const success = await saveSettings(settings);
    if (success) {
      // Settings saved successfully
    }
    return success;
  };

  const handleReset = async () => {
    const success = await resetSettings();
    if (success) {
      // Settings reset successfully
    }
  };

  const handleSettingChange = (key: keyof typeof settings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  // Expose save and reset functions through ref
  useImperativeHandle(ref, () => ({
    saveSettings: handleSave,
    resetSettings: handleReset
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2 text-gray-600">Loading settings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <UniversalSettingsTab
      title="Receipt Settings"
      description="Configure receipt templates, content, and printing options"
      onSave={handleSave}
      onReset={handleReset}
      onCancel={() => {}} // Add empty function for now
      isLoading={isLoading}
      isSaving={isSaving}
      isDirty={false} // Add default value for now
    >
      {/* Template Settings */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <FileText className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Template Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Receipt Template"
            value={settings.receipt_template}
            onChange={(value) => handleSettingChange('receipt_template', value)}
            options={[
              { value: 'standard', label: 'Standard' },
              { value: 'compact', label: 'Compact' },
              { value: 'detailed', label: 'Detailed' },
              { value: 'custom', label: 'Custom' }
            ]}
          />
          <NumberInput
            label="Receipt Width"
            value={settings.receipt_width}
            onChange={(value) => handleSettingChange('receipt_width', value)}
            min={40}
            max={120}
            step={5}
          />
          <NumberInput
            label="Font Size"
            value={settings.receipt_font_size}
            onChange={(value) => handleSettingChange('receipt_font_size', value)}
            min={8}
            max={16}
            step={1}
          />
        </div>
      </div>

      {/* Business Information */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Image className="w-5 h-5 text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Business Information</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Show Business Logo"
            checked={settings.show_business_logo}
            onChange={(checked) => handleSettingChange('show_business_logo', checked)}
          />
          <ToggleSwitch
            label="Show Business Name"
            checked={settings.show_business_name}
            onChange={(checked) => handleSettingChange('show_business_name', checked)}
          />
          <ToggleSwitch
            label="Show Business Address"
            checked={settings.show_business_address}
            onChange={(checked) => handleSettingChange('show_business_address', checked)}
          />
          <ToggleSwitch
            label="Show Business Phone"
            checked={settings.show_business_phone}
            onChange={(checked) => handleSettingChange('show_business_phone', checked)}
          />
          <ToggleSwitch
            label="Show Business Email"
            checked={settings.show_business_email}
            onChange={(checked) => handleSettingChange('show_business_email', checked)}
          />
          <ToggleSwitch
            label="Show Business Website"
            checked={settings.show_business_website}
            onChange={(checked) => handleSettingChange('show_business_website', checked)}
          />
        </div>
      </div>

      {/* Transaction Details */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Calendar className="w-5 h-5 text-purple-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Transaction Details</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Show Transaction ID"
            checked={settings.show_transaction_id}
            onChange={(checked) => handleSettingChange('show_transaction_id', checked)}
          />
          <ToggleSwitch
            label="Show Date & Time"
            checked={settings.show_date_time}
            onChange={(checked) => handleSettingChange('show_date_time', checked)}
          />
          <ToggleSwitch
            label="Show Cashier Name"
            checked={settings.show_cashier_name}
            onChange={(checked) => handleSettingChange('show_cashier_name', checked)}
          />
          <ToggleSwitch
            label="Show Customer Name"
            checked={settings.show_customer_name}
            onChange={(checked) => handleSettingChange('show_customer_name', checked)}
          />
          <ToggleSwitch
            label="Show Customer Phone"
            checked={settings.show_customer_phone}
            onChange={(checked) => handleSettingChange('show_customer_phone', checked)}
          />
        </div>
      </div>

      {/* Product Details */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Receipt className="w-5 h-5 text-orange-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Product Details</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Show Product Names"
            checked={settings.show_product_names}
            onChange={(checked) => handleSettingChange('show_product_names', checked)}
          />
          <ToggleSwitch
            label="Show Product SKUs"
            checked={settings.show_product_skus}
            onChange={(checked) => handleSettingChange('show_product_skus', checked)}
          />
          <ToggleSwitch
            label="Show Product Barcodes"
            checked={settings.show_product_barcodes}
            onChange={(checked) => handleSettingChange('show_product_barcodes', checked)}
          />
          <ToggleSwitch
            label="Show Quantities"
            checked={settings.show_quantities}
            onChange={(checked) => handleSettingChange('show_quantities', checked)}
          />
          <ToggleSwitch
            label="Show Unit Prices"
            checked={settings.show_unit_prices}
            onChange={(checked) => handleSettingChange('show_unit_prices', checked)}
          />
          <ToggleSwitch
            label="Show Discounts"
            checked={settings.show_discounts}
            onChange={(checked) => handleSettingChange('show_discounts', checked)}
          />
        </div>
      </div>

      {/* Totals Section */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Settings className="w-5 h-5 text-indigo-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Totals & Summary</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Show Subtotal"
            checked={settings.show_subtotal}
            onChange={(checked) => handleSettingChange('show_subtotal', checked)}
          />
          <ToggleSwitch
            label="Show Tax"
            checked={settings.show_tax}
            onChange={(checked) => handleSettingChange('show_tax', checked)}
          />
          <ToggleSwitch
            label="Show Discount Total"
            checked={settings.show_discount_total}
            onChange={(checked) => handleSettingChange('show_discount_total', checked)}
          />
          <ToggleSwitch
            label="Show Grand Total"
            checked={settings.show_grand_total}
            onChange={(checked) => handleSettingChange('show_grand_total', checked)}
          />
          <ToggleSwitch
            label="Show Payment Method"
            checked={settings.show_payment_method}
            onChange={(checked) => handleSettingChange('show_payment_method', checked)}
          />
          <ToggleSwitch
            label="Show Change Amount"
            checked={settings.show_change_amount}
            onChange={(checked) => handleSettingChange('show_change_amount', checked)}
          />
        </div>
      </div>

      {/* Print Settings */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Printer className="w-5 h-5 text-red-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Print Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Auto Print Receipt"
            checked={settings.auto_print_receipt}
            onChange={(checked) => handleSettingChange('auto_print_receipt', checked)}
          />
          <ToggleSwitch
            label="Print Duplicate Receipt"
            checked={settings.print_duplicate_receipt}
            onChange={(checked) => handleSettingChange('print_duplicate_receipt', checked)}
          />
          <ToggleSwitch
            label="Enable Email Receipt"
            checked={settings.enable_email_receipt}
            onChange={(checked) => handleSettingChange('enable_email_receipt', checked)}
          />
          <ToggleSwitch
            label="Enable SMS Receipt"
            checked={settings.enable_sms_receipt}
            onChange={(checked) => handleSettingChange('enable_sms_receipt', checked)}
          />
        </div>
      </div>

      {/* Receipt Numbering */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <FileText className="w-5 h-5 text-teal-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Receipt Numbering</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ToggleSwitch
            label="Enable Receipt Numbering"
            checked={settings.enable_receipt_numbering}
            onChange={(checked) => handleSettingChange('enable_receipt_numbering', checked)}
          />
          <TextInput
            label="Receipt Prefix"
            value={settings.receipt_number_prefix}
            onChange={(value) => handleSettingChange('receipt_number_prefix', value)}
            placeholder="RCP"
          />
          <NumberInput
            label="Start Number"
            value={settings.receipt_number_start}
            onChange={(value) => handleSettingChange('receipt_number_start', value)}
            min={1}
            max={999999}
            step={1}
          />
          <TextInput
            label="Number Format"
            value={settings.receipt_number_format}
            onChange={(value) => handleSettingChange('receipt_number_format', value)}
            placeholder="RCP-{YEAR}-{NUMBER}"
          />
        </div>
      </div>

      {/* Footer Settings */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <FileText className="w-5 h-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Footer Settings</h3>
        </div>
        <div className="grid grid-cols-1 gap-4">
          <ToggleSwitch
            label="Show Footer Message"
            checked={settings.show_footer_message}
            onChange={(checked) => handleSettingChange('show_footer_message', checked)}
          />
          <TextInput
            label="Footer Message"
            value={settings.footer_message}
            onChange={(value) => handleSettingChange('footer_message', value)}
            placeholder="Thank you for your business!"
          />
          <ToggleSwitch
            label="Show Return Policy"
            checked={settings.show_return_policy}
            onChange={(checked) => handleSettingChange('show_return_policy', checked)}
          />
          <TextInput
            label="Return Policy Text"
            value={settings.return_policy_text}
            onChange={(value) => handleSettingChange('return_policy_text', value)}
            placeholder="Returns accepted within 7 days with receipt"
          />
        </div>
      </div>
    </UniversalSettingsTab>
  );
});

export default ReceiptSettingsTab;
