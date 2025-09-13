import React, { useState, useRef } from 'react';
import { X, Upload, Download, AlertCircle, CheckCircle, UserPlus, FileText, Info, Shield } from 'lucide-react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { Customer } from '../../../types';
import { toast } from 'react-hot-toast';
import { addCustomerToDb } from '../../../lib/customerApi';
import { useAuth } from '../../../context/AuthContext';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (customers: Customer[]) => void;
}

interface ImportedCustomer {
  name: string;
  email: string;
  phone: string;
  gender: 'male' | 'female' | 'other';
  city: string;
  whatsapp?: string;
  notes?: string;
  loyaltyLevel?: 'bronze' | 'silver' | 'gold' | 'platinum';
  colorTag?: 'vip' | 'new' | 'complainer' | 'purchased';
  birthMonth?: string;
  birthDay?: string;
  referralSource?: string;
  referralSourceCustom?: string;
}

interface ImportResult {
  success: boolean;
  customer?: Customer;
  error?: string;
  rowNumber: number;
}

const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const { currentUser } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [importedData, setImportedData] = useState<ImportedCustomer[]>([]);
  const [previewData, setPreviewData] = useState<ImportedCustomer[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'import'>('upload');
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editableData, setEditableData] = useState<ImportedCustomer[]>([]);
  const [isCompactView, setIsCompactView] = useState(false);
  const [expandedColumns, setExpandedColumns] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to format phone numbers with 255 prefix
  const formatPhoneNumber = (phone: string): string => {
    if (!phone) return '';
    
    // Remove any existing spaces or special characters
    const cleanPhone = phone.replace(/[\s\-()]/g, '');
    
    // If already has +255 or 255 prefix, return as is
    if (cleanPhone.startsWith('+255') || cleanPhone.startsWith('255')) {
      return cleanPhone;
    }
    
    // If starts with 0, convert to +255 format
    if (cleanPhone.startsWith('0')) {
      return '+255' + cleanPhone.substring(1);
    }
    
    // If it's a 9-digit number without prefix, add 255
    if (cleanPhone.length === 9 && /^\d+$/.test(cleanPhone)) {
      return '255' + cleanPhone;
    }
    
    // For any other format, add 255 prefix
    return '255' + cleanPhone;
  };



  // Function to format customer names
  const formatCustomerName = (name: string): string => {
    if (!name) return '';
    
    // Capitalize first letter of each word
    return name
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .trim();
  };

  // Function to format gender
  const formatGender = (gender: string): 'male' | 'female' | 'other' => {
    if (!gender) return 'other';
    
    const lowerGender = gender.toLowerCase().trim();
    
    if (lowerGender === 'male' || lowerGender === 'm' || lowerGender === '1') {
      return 'male';
    } else if (lowerGender === 'female' || lowerGender === 'f' || lowerGender === '2') {
      return 'female';
    } else {
      return 'other';
    }
  };

  // Function to format referral source
  const formatReferralSource = (referral: string): string => {
    if (!referral) return 'other';
    
    const lowerReferral = referral.toLowerCase().trim();
    
    const referralMap: { [key: string]: string } = {
      'facebook': 'facebook',
      'fb': 'facebook',
      'instagram': 'instagram',
      'ig': 'instagram',
      'twitter': 'twitter',
      'x': 'twitter',
      'whatsapp': 'whatsapp',
      'wa': 'whatsapp',
      'google': 'google',
      'search': 'google',
      'friend': 'friend',
      'family': 'family',
      'colleague': 'colleague',
      'work': 'colleague',
      'advertisement': 'advertisement',
      'ad': 'advertisement',
      'billboard': 'advertisement',
      'radio': 'advertisement',
      'tv': 'advertisement',
      'newspaper': 'advertisement',
      'magazine': 'advertisement',
      'website': 'website',
      'online': 'website',
      'walk-in': 'walk-in',
      'walkin': 'walk-in',
      'passerby': 'walk-in',
      'other': 'other',
      'unknown': 'other'
    };
    
    return referralMap[lowerReferral] || 'other';
  };

  // Function to format city names
  const formatCityName = (city: string): string => {
    if (!city) return '';
    
    // Capitalize first letter of each word
    return city
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
      .trim();
  };

  // Function to parse birthday
  const parseBirthday = (birthday: string): { month: string; day: string } => {
    if (!birthday) return { month: '', day: '' };
    
    // Try to parse different date formats
    const dateFormats = [
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // MM/DD/YYYY
      /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // MM-DD-YYYY
      /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
      /^(\d{1,2})\/(\d{1,2})$/, // MM/DD
      /^(\d{1,2})-(\d{1,2})$/, // MM-DD
    ];
    
    for (const format of dateFormats) {
      const match = birthday.match(format);
      if (match) {
        let month, day;
        
        if (format.source.includes('YYYY')) {
          // Full date format
          if (format.source.startsWith('(\\d{4})')) {
            // YYYY-MM-DD format
            [, month, day] = match;
          } else {
            // MM/DD/YYYY or MM-DD-YYYY format
            [, month, day] = match;
          }
        } else {
          // MM/DD or MM-DD format
          [, month, day] = match;
        }
        
        // Validate month and day
        const monthNum = parseInt(month);
        const dayNum = parseInt(day);
        
        if (monthNum >= 1 && monthNum <= 12 && dayNum >= 1 && dayNum <= 31) {
          return {
            month: monthNum.toString().padStart(2, '0'),
            day: dayNum.toString().padStart(2, '0')
          };
        }
      }
    }
    
    // If no valid format found, try to extract month and day from text
    const monthNames: { [key: string]: string } = {
      'january': '01', 'jan': '01',
      'february': '02', 'feb': '02',
      'march': '03', 'mar': '03',
      'april': '04', 'apr': '04',
      'may': '05',
      'june': '06', 'jun': '06',
      'july': '07', 'jul': '07',
      'august': '08', 'aug': '08',
      'september': '09', 'sep': '09', 'sept': '09',
      'october': '10', 'oct': '10',
      'november': '11', 'nov': '11',
      'december': '12', 'dec': '12'
    };
    
    const lowerBirthday = birthday.toLowerCase();
    
    for (const [monthName, monthNum] of Object.entries(monthNames)) {
      if (lowerBirthday.includes(monthName)) {
        // Try to extract day number
        const dayMatch = lowerBirthday.match(/(\d{1,2})/);
        if (dayMatch) {
          const dayNum = parseInt(dayMatch[1]);
          if (dayNum >= 1 && dayNum <= 31) {
            return {
              month: monthNum,
              day: dayNum.toString().padStart(2, '0')
            };
          }
        }
      }
    }
    
    return { month: '', day: '' };
  };

  // Function to validate customer data
  const validateCustomerData = (customer: ImportedCustomer, rowNumber: number): string[] => {
    const errors: string[] = [];
    
    if (!customer.name || customer.name.trim().length < 2) {
      errors.push(`Row ${rowNumber}: Name must be at least 2 characters long`);
    }
    
    if (!customer.phone || customer.phone.trim().length < 9) {
      errors.push(`Row ${rowNumber}: Phone number must be at least 9 digits`);
    }
    
    if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) {
      errors.push(`Row ${rowNumber}: Invalid email format`);
    }
    
    if (!customer.city || customer.city.trim().length < 2) {
      errors.push(`Row ${rowNumber}: City must be at least 2 characters long`);
    }
    
    return errors;
  };

  // Function to handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      processExcelFile(selectedFile);
    }
  };

  // Function to process Excel file
  const processExcelFile = async (file: File) => {
    setIsProcessing(true);
    setValidationErrors([]);
    
    try {
      // This is a simplified version - in a real implementation, you'd use a library like xlsx
      // For now, we'll just simulate processing
      const mockData: ImportedCustomer[] = [
        {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '0712345678',
          gender: 'male',
          city: 'Dar es Salaam',
          whatsapp: '0712345678',
          notes: 'Test customer',
          loyaltyLevel: 'bronze',
          colorTag: 'new',
          birthMonth: '01',
          birthDay: '15',
          referralSource: 'facebook'
        }
      ];
      
      setImportedData(mockData);
      setPreviewData(mockData);
      setEditableData(mockData);
      setCurrentStep('preview');
      
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Error processing file. Please check the file format.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to handle import
  const handleImport = async () => {
    setIsImporting(true);
    setImportProgress(0);
    setImportResults([]);
    
    const results: ImportResult[] = [];
    const successfulCustomers: Customer[] = [];
    
    for (let i = 0; i < editableData.length; i++) {
      const customer = editableData[i];
      const rowNumber = i + 1;
      
      try {
        // Validate customer data
        const validationErrors = validateCustomerData(customer, rowNumber);
        if (validationErrors.length > 0) {
          results.push({
            success: false,
            error: validationErrors.join(', '),
            rowNumber
          });
          continue;
        }
        
        // Format customer data
        const formattedCustomer: Customer = {
          id: '',
          name: formatCustomerName(customer.name),
          email: customer.email?.toLowerCase().trim() || '',
          phone: formatPhoneNumber(customer.phone),
          gender: formatGender(customer.gender),
          city: formatCityName(customer.city),
          whatsapp: customer.whatsapp ? formatPhoneNumber(customer.whatsapp) : '',
          notes: customer.notes || '',
          loyaltyLevel: customer.loyaltyLevel || 'bronze',
          colorTag: customer.colorTag || 'new',
          birthMonth: customer.birthMonth || '',
          birthDay: customer.birthDay || '',
          referralSource: formatReferralSource(customer.referralSource || ''),
          referralSourceCustom: customer.referralSourceCustom || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Add customer to database
        const addedCustomer = await addCustomerToDb(formattedCustomer);
        
        results.push({
          success: true,
          customer: addedCustomer,
          rowNumber
        });
        
        successfulCustomers.push(addedCustomer);
        
      } catch (error) {
        console.error(`Error importing customer at row ${rowNumber}:`, error);
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          rowNumber
        });
      }
      
      setImportProgress(((i + 1) / editableData.length) * 100);
    }
    
    setImportResults(results);
    setCurrentStep('import');
    
    if (successfulCustomers.length > 0) {
      onImportComplete(successfulCustomers);
      toast.success(`Successfully imported ${successfulCustomers.length} customers`);
    }
    
    setIsImporting(false);
  };

  // Function to handle close
  const handleClose = () => {
    setFile(null);
    setImportedData([]);
    setPreviewData([]);
    setEditableData([]);
    setCurrentStep('upload');
    setImportProgress(0);
    setImportResults([]);
    setValidationErrors([]);
    setIsProcessing(false);
    setIsImporting(false);
    setIsEditMode(false);
    setIsCompactView(false);
    setExpandedColumns(new Set());
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    onClose();
  };

  // Function to download template
  const downloadTemplate = () => {
    const template = [
      ['Name', 'Email', 'Phone', 'Gender', 'City', 'WhatsApp', 'Notes', 'Loyalty Level', 'Color Tag', 'Birth Month', 'Birth Day', 'Referral Source'],
      ['John Doe', 'john@example.com', '0712345678', 'male', 'Dar es Salaam', '0712345678', 'Sample notes', 'bronze', 'new', '01', '15', 'facebook']
    ];
    const csvContent = template.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customer_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <GlassCard className="w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 relative">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
          onClick={handleClose}
        >
          <X size={24} />
        </button>
        
        <h2 className="text-2xl font-bold mb-6 text-gray-900">Import Customers from Excel</h2>
        
        {currentStep === 'upload' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mb-4">
                <Upload size={48} className="mx-auto text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Upload Excel File</h3>
              <p className="text-gray-600 mb-4">
                Upload an Excel file (.xlsx, .xls) or CSV file with customer data
              </p>
              
              <div className="flex gap-4 justify-center">
                <GlassButton
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                >
                  <Upload size={16} className="mr-2" />
                  {isProcessing ? 'Processing...' : 'Choose File'}
                </GlassButton>
                
                <GlassButton variant="secondary" onClick={downloadTemplate}>
                  <Download size={16} className="mr-2" />
                  Download Template
                </GlassButton>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start">
                <Info size={20} className="text-blue-500 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Import Guidelines</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Required fields: Name, Phone, City</li>
                    <li>• Phone numbers will be automatically formatted with country code</li>
                    <li>• Gender can be: male, female, or other</li>
                    <li>• Loyalty levels: bronze, silver, gold, platinum</li>
                    <li>• Color tags: vip, new, complainer, purchased</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {currentStep === 'preview' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Preview Data</h3>
              <div className="flex gap-2">
                <GlassButton
                  variant="secondary"
                  onClick={() => setIsEditMode(!isEditMode)}
                >
                  {isEditMode ? 'View Mode' : 'Edit Mode'}
                </GlassButton>
                <GlassButton
                  variant="secondary"
                  onClick={() => setIsCompactView(!isCompactView)}
                >
                  {isCompactView ? 'Detailed View' : 'Compact View'}
                </GlassButton>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-3 py-2 text-left">Name</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Phone</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Email</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">City</th>
                    <th className="border border-gray-300 px-3 py-2 text-left">Gender</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((customer, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-3 py-2">{customer.name}</td>
                      <td className="border border-gray-300 px-3 py-2">{customer.phone}</td>
                      <td className="border border-gray-300 px-3 py-2">{customer.email}</td>
                      <td className="border border-gray-300 px-3 py-2">{customer.city}</td>
                      <td className="border border-gray-300 px-3 py-2">{customer.gender}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="flex gap-2 justify-end">
              <GlassButton variant="secondary" onClick={() => setCurrentStep('upload')}>
                Back
              </GlassButton>
              <GlassButton onClick={handleImport} disabled={isImporting}>
                {isImporting ? 'Importing...' : 'Import Customers'}
              </GlassButton>
            </div>
          </div>
        )}
        
        {currentStep === 'import' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Import Results</h3>
            
            {isImporting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Importing customers...</span>
                  <span>{Math.round(importProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
              </div>
            )}
            
            {!isImporting && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle size={20} className="text-green-500 mr-2" />
                      <span className="font-semibold text-green-900">
                        {importResults.filter(r => r.success).length} Successful
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle size={20} className="text-red-500 mr-2" />
                      <span className="font-semibold text-red-900">
                        {importResults.filter(r => !r.success).length} Failed
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <FileText size={20} className="text-blue-500 mr-2" />
                      <span className="font-semibold text-blue-900">
                        {importResults.length} Total
                      </span>
                    </div>
                  </div>
                </div>
                
                {importResults.filter(r => !r.success).length > 0 && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-900 mb-2">Failed Imports</h4>
                    <div className="space-y-1">
                      {importResults
                        .filter(r => !r.success)
                        .map((result, index) => (
                          <div key={index} className="text-sm text-red-800">
                            Row {result.rowNumber}: {result.error}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex gap-2 justify-end">
              <GlassButton variant="secondary" onClick={handleClose}>
                Close
              </GlassButton>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default ExcelImportModal;
