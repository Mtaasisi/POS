// CustomerImportExport component for LATS module
import React, { useState, useRef } from 'react';
import { LATS_CLASSES } from '../../tokens';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import GlassBadge from '../ui/GlassBadge';
import GlassInput from '../ui/GlassInput';
import { t } from '../../lib/i18n/t';

interface CustomerImportExportProps {
  onImport: (file: File, options: ImportOptions) => Promise<ImportResult>;
  onExport: (options: ExportOptions) => Promise<void>;
  loading?: boolean;
  className?: string;
}

interface ImportOptions {
  updateExisting: boolean;
  skipDuplicates: boolean;
  validateData: boolean;
  defaultTags?: string[];
}

interface ExportOptions {
  format: 'csv' | 'xlsx' | 'json';
  includeFields: string[];
  filters?: {
    status?: string;
    loyaltyProgram?: boolean;
    marketingConsent?: boolean;
    dateRange?: {
      start: string;
      end: string;
    };
  };
}

interface ImportResult {
  success: boolean;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  errors: string[];
  warnings: string[];
}

const CustomerImportExport: React.FC<CustomerImportExportProps> = ({
  onImport,
  onExport,
  loading = false,
  className = ''
}) => {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    updateExisting: false,
    skipDuplicates: true,
    validateData: true,
    defaultTags: []
  });
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    includeFields: ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'company']
  });
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [customTag, setCustomTag] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
      setIsImportModalOpen(true);
    }
  };

  // Handle import
  const handleImport = async () => {
    if (!importFile) return;

    try {
      const result = await onImport(importFile, importOptions);
      setImportResult(result);
      
      if (result.success) {
        // Reset form after successful import
        setTimeout(() => {
          setIsImportModalOpen(false);
          setImportFile(null);
          setImportResult(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }, 3000);
      }
    } catch (error) {
      console.error('Import error:', error);
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      await onExport(exportOptions);
      setIsExportModalOpen(false);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  // Handle tag addition
  const handleAddTag = () => {
    if (customTag.trim() && !importOptions.defaultTags?.includes(customTag.trim())) {
      setImportOptions(prev => ({
        ...prev,
        defaultTags: [...(prev.defaultTags || []), customTag.trim()]
      }));
      setCustomTag('');
    }
  };

  // Handle tag removal
  const handleRemoveTag = (tagToRemove: string) => {
    setImportOptions(prev => ({
      ...prev,
      defaultTags: prev.defaultTags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  // Get file size in readable format
  const getFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file type icon
  const getFileTypeIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'csv':
        return (
          <svg className="w-8 h-8 text-lats-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'xlsx':
      case 'xls':
        return (
          <svg className="w-8 h-8 text-lats-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8 text-lats-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Import/Export Buttons */}
      <div className="flex items-center gap-4">
        <GlassButton
          variant="primary"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          }
        >
          Import Customers
        </GlassButton>

        <GlassButton
          variant="secondary"
          onClick={() => setIsExportModalOpen(true)}
          disabled={loading}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        >
          Export Customers
        </GlassButton>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls,.json"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <GlassCard className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-lats-text">Import Customers</h2>
                  <p className="text-sm text-lats-text-secondary mt-1">
                    Import customer data from CSV, Excel, or JSON files
                  </p>
                </div>
                <GlassButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsImportModalOpen(false)}
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  }
                />
              </div>

              {/* File Info */}
              {importFile && (
                <div className="p-4 bg-lats-surface/30 rounded-lats-radius-md border border-lats-glass-border">
                  <div className="flex items-center gap-3">
                    {getFileTypeIcon(importFile.name)}
                    <div className="flex-1">
                      <h3 className="font-medium text-lats-text">{importFile.name}</h3>
                      <p className="text-sm text-lats-text-secondary">
                        {getFileSize(importFile.size)} • {importFile.type || 'Unknown type'}
                      </p>
                    </div>
                    <GlassButton
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setImportFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      }
                    />
                  </div>
                </div>
              )}

              {/* Import Options */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-lats-text">Import Options</h3>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={importOptions.updateExisting}
                      onChange={(e) => setImportOptions(prev => ({ ...prev, updateExisting: e.target.checked }))}
                      className="w-4 h-4 text-lats-primary bg-lats-surface border-lats-glass-border rounded focus:ring-lats-primary/50"
                    />
                    <span className="text-sm text-lats-text">Update existing customers</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={importOptions.skipDuplicates}
                      onChange={(e) => setImportOptions(prev => ({ ...prev, skipDuplicates: e.target.checked }))}
                      className="w-4 h-4 text-lats-primary bg-lats-surface border-lats-glass-border rounded focus:ring-lats-primary/50"
                    />
                    <span className="text-sm text-lats-text">Skip duplicate entries</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={importOptions.validateData}
                      onChange={(e) => setImportOptions(prev => ({ ...prev, validateData: e.target.checked }))}
                      className="w-4 h-4 text-lats-primary bg-lats-surface border-lats-glass-border rounded focus:ring-lats-primary/50"
                    />
                    <span className="text-sm text-lats-text">Validate data before import</span>
                  </label>
                </div>

                {/* Default Tags */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-lats-text">Default Tags</label>
                  <div className="flex items-center gap-2">
                    <GlassInput
                      placeholder="Add a default tag"
                      value={customTag}
                      onChange={(e) => setCustomTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                      className="flex-1"
                    />
                    <GlassButton
                      variant="secondary"
                      onClick={handleAddTag}
                      disabled={!customTag.trim()}
                      size="sm"
                    >
                      Add
                    </GlassButton>
                  </div>
                  
                  {importOptions.defaultTags && importOptions.defaultTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {importOptions.defaultTags.map((tag) => (
                        <GlassBadge
                          key={tag}
                          variant="primary"
                          size="sm"
                          onRemove={() => handleRemoveTag(tag)}
                        >
                          {tag}
                        </GlassBadge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Import Result */}
              {importResult && (
                <div className={`p-4 rounded-lats-radius-md border ${
                  importResult.success ? 'bg-lats-success/10 border-lats-success/20' : 'bg-lats-error/10 border-lats-error/20'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {importResult.success ? (
                      <svg className="w-5 h-5 text-lats-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-lats-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    )}
                    <h4 className="font-medium text-lats-text">
                      {importResult.success ? 'Import Completed' : 'Import Failed'}
                    </h4>
                  </div>
                  <div className="text-sm text-lats-text-secondary space-y-1">
                    <p>Total rows: {importResult.totalRows}</p>
                    <p>Imported: {importResult.importedRows}</p>
                    <p>Skipped: {importResult.skippedRows}</p>
                    {importResult.errors.length > 0 && (
                      <div>
                        <p className="font-medium text-lats-error">Errors:</p>
                        <ul className="list-disc list-inside text-xs">
                          {importResult.errors.slice(0, 3).map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                          {importResult.errors.length > 3 && (
                            <li>... and {importResult.errors.length - 3} more</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-lats-glass-border">
                <GlassButton
                  variant="secondary"
                  onClick={() => setIsImportModalOpen(false)}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </GlassButton>
                <GlassButton
                  variant="primary"
                  onClick={handleImport}
                  disabled={!importFile || loading}
                  loading={loading}
                  className="flex-1"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  }
                >
                  {loading ? 'Importing...' : 'Import Customers'}
                </GlassButton>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Export Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <GlassCard className="max-w-lg w-full">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-lats-text">Export Customers</h2>
                  <p className="text-sm text-lats-text-secondary mt-1">
                    Export customer data in your preferred format
                  </p>
                </div>
                <GlassButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExportModalOpen(false)}
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  }
                />
              </div>

              {/* Export Options */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-lats-text">Export Format</label>
                  <select
                    value={exportOptions.format}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as any }))}
                    className="w-full px-3 py-2 text-sm bg-lats-surface/50 border border-lats-glass-border rounded-lats-radius-md text-lats-text focus:outline-none focus:ring-2 focus:ring-lats-primary/50"
                  >
                    <option value="csv">CSV (.csv)</option>
                    <option value="xlsx">Excel (.xlsx)</option>
                    <option value="json">JSON (.json)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-lats-text">Include Fields</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'firstName', label: 'First Name' },
                      { value: 'lastName', label: 'Last Name' },
                      { value: 'email', label: 'Email' },
                      { value: 'phone', label: 'Phone' },
                      { value: 'address', label: 'Address' },
                      { value: 'city', label: 'City' },
                      { value: 'company', label: 'Company' },
                      { value: 'tags', label: 'Tags' },
                      { value: 'totalSpent', label: 'Total Spent' },
                      { value: 'totalOrders', label: 'Total Orders' },
                      { value: 'loyaltyPoints', label: 'Loyalty Points' },
                      { value: 'createdAt', label: 'Created Date' }
                    ].map((field) => (
                      <label key={field.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={exportOptions.includeFields.includes(field.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setExportOptions(prev => ({
                                ...prev,
                                includeFields: [...prev.includeFields, field.value]
                              }));
                            } else {
                              setExportOptions(prev => ({
                                ...prev,
                                includeFields: prev.includeFields.filter(f => f !== field.value)
                              }));
                            }
                          }}
                          className="w-4 h-4 text-lats-primary bg-lats-surface border-lats-glass-border rounded focus:ring-lats-primary/50"
                        />
                        <span className="text-sm text-lats-text">{field.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-lats-glass-border">
                <GlassButton
                  variant="secondary"
                  onClick={() => setIsExportModalOpen(false)}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </GlassButton>
                <GlassButton
                  variant="primary"
                  onClick={handleExport}
                  disabled={loading || exportOptions.includeFields.length === 0}
                  loading={loading}
                  className="flex-1"
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                >
                  {loading ? 'Exporting...' : 'Export Customers'}
                </GlassButton>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

// Export with display name for debugging
CustomerImportExport.displayName = 'CustomerImportExport';

export default CustomerImportExport;
