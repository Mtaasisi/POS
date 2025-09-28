import React, { useState, useRef, useEffect } from 'react';

import { X, Upload, Download, AlertCircle, CheckCircle, UserPlus, FileText, Info, Shield } from 'lucide-react';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
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

  // Function to format WhatsApp numbers with 255 prefix
  const formatWhatsAppNumber = (whatsapp: string): string => {
    if (!whatsapp) return '';
    
    // Remove any existing spaces or special characters
    const cleanWhatsApp = whatsapp.replace(/[\s\-()]/g, '');
    
    // If already has +255 or 255 prefix, return as is
    if (cleanWhatsApp.startsWith('+255') || cleanWhatsApp.startsWith('255')) {
      return cleanWhatsApp;
    }
    
    // If starts with 0, convert to +255 format
    if (cleanWhatsApp.startsWith('0')) {
      return '+255' + cleanWhatsApp.substring(1);
    }
    
    // If it's a 9-digit number without prefix, add 255
    if (cleanWhatsApp.length === 9 && /^\d+$/.test(cleanWhatsApp)) {
      return '255' + cleanWhatsApp;
    }
    
    // For any other format, add 255 prefix
    return '255' + cleanWhatsApp;
  };

  // Function to format customer names from capital to normal case
  const formatCustomerName = (name: string): string => {
    if (!name) return '';
    
    const trimmedName = name.trim();
    
    // Convert from ALL CAPS to Title Case
    if (trimmedName === trimmedName.toUpperCase() && trimmedName.length > 1) {
      return trimmedName.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
    }
    
    // Convert from Capital Letters to Title Case
    if (trimmedName === trimmedName.toUpperCase()) {
      return trimmedName.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
    }
    
    // Return the original name if no special formatting needed
    return trimmedName;
  };

  // Function to format gender from capital to normal case
  const formatGender = (gender: string): 'male' | 'female' | 'other' => {
    if (!gender) return 'other';
    
    const trimmedGender = gender.trim().toLowerCase();
    
    // Convert from ALL CAPS to Title Case
    if (trimmedGender === 'male' || trimmedGender === 'm') {
      return 'male';
    }
    
    if (trimmedGender === 'female' || trimmedGender === 'f') {
      return 'female';
    }
    
    // Default to other for any other value
    return 'other';
  };

  // Function to format referral sources
  const formatReferralSource = (referral: string): string => {
    if (!referral) return '';
    
    const trimmedReferral = referral.trim();
    
    // Referral source mapping
    const referralMap: { [key: string]: string } = {
      'instagram': 'Instagram',
      'mtandaoni': 'Social Media',
      'physically': 'Walk-in',
      'recommendation': 'Friend',
      'social media': 'Social Media',
      'facebook': 'Facebook',
      'google': 'Google',
      'friend': 'Friend',
      'family': 'Family',
      'colleague': 'Colleague',
      'advertisement': 'Advertisement',
      'website': 'Website',
      'walk-in': 'Walk-in',
      'referral': 'Referral',
      'other': 'Other'
    };
    
    // Check if it's a known referral source
    const normalizedReferral = trimmedReferral.toLowerCase();
    if (referralMap[normalizedReferral]) {
      return referralMap[normalizedReferral];
    }
    
    // Convert from ALL CAPS to Title Case if not in map
    if (trimmedReferral === trimmedReferral.toUpperCase() && trimmedReferral.length > 1) {
      return trimmedReferral.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
    }
    
    // Return the original referral source if no special formatting needed
    return trimmedReferral;
  };

  // Function to format city names
  const formatCityName = (city: string): string => {
    if (!city) return '';
    
    const trimmedCity = city.trim();
    
    // City abbreviation mapping
    const cityMap: { [key: string]: string } = {
      'dsm': 'Dar es Salaam',
      'dar': 'Dar es Salaam',
      'dar es': 'Dar es Salaam',
      'dar es salaam': 'Dar es Salaam',
      'mara': 'Mara',
      'moro': 'Morogoro',
      'arusha': 'Arusha',
      'mwanza': 'Mwanza',
      'dodoma': 'Dodoma',
      'tanga': 'Tanga',
      'mbeya': 'Mbeya',
      'morogoro': 'Morogoro',
      'tabora': 'Tabora',
      'singida': 'Singida',
      'kigoma': 'Kigoma',
      'shinyanga': 'Shinyanga',
      'kagera': 'Kagera',
      'manyara': 'Manyara',
      'njombe': 'Njombe',
      'katavi': 'Katavi',
      'geita': 'Geita',
      'simiyu': 'Simiyu',
      'songwe': 'Songwe'
    };
    
    // Check if it's a known abbreviation
    const normalizedCity = trimmedCity.toLowerCase();
    if (cityMap[normalizedCity]) {
      return cityMap[normalizedCity];
    }
    
    // Return the original city name if no special formatting needed
    return trimmedCity;
  };

  // Function to parse birthday formats
  const parseBirthday = (birthday: string): { month: string; day: string } => {
    if (!birthday) return { month: '', day: '' };
    
    const trimmedBirthday = birthday.trim().toLowerCase();
    
    // Handle formats like "12-dec", "15-jan", "3-mar", etc.
    const datePattern = /^(\d{1,2})-([a-z]{3,})$/;
    const match = trimmedBirthday.match(datePattern);
    
    if (match) {
      const day = match[1];
      const monthAbbr = match[2];
      
      // Month abbreviation mapping with common typos
      const monthMap: { [key: string]: string } = {
        'jan': 'January',
        'feb': 'February',
        'fe': 'February', // Handle corrupted "Feb" -> "Fe"
        'mar': 'March',
        'apr': 'April',
        'may': 'May',
        'jun': 'June',
        'jul': 'July',
        'aug': 'August',
        'sep': 'September',
        'oct': 'October',
        'nov': 'November',
        'dec': 'December'
      };
      
      const fullMonth = monthMap[monthAbbr];
      if (fullMonth) {
        // Convert month name to number for database storage
        const monthNumber = new Date(`${fullMonth} 1, 2000`).getMonth() + 1;
        return { month: monthNumber.toString(), day };
      }
    }
    
    // Handle formats like "dec-12", "jan-15", etc.
    const reversePattern = /^([a-z]{3,})-(\d{1,2})$/;
    const reverseMatch = trimmedBirthday.match(reversePattern);
    
    if (reverseMatch) {
      const monthAbbr = reverseMatch[1];
      const day = reverseMatch[2];
      
      const monthMap: { [key: string]: string } = {
        'jan': 'January',
        'feb': 'February',
        'fe': 'February', // Handle corrupted "Feb" -> "Fe"
        'mar': 'March',
        'apr': 'April',
        'may': 'May',
        'jun': 'June',
        'jul': 'July',
        'aug': 'August',
        'sep': 'September',
        'oct': 'October',
        'nov': 'November',
        'dec': 'December'
      };
      
      const fullMonth = monthMap[monthAbbr];
      if (fullMonth) {
        return { month: fullMonth, day };
      }
    }
    
    // Return empty if no valid format found
    return { month: '', day: '' };
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('column-expand-dropdown');
      const button = event.target as Element;
      if (dropdown && !dropdown.contains(button) && !button.closest('[data-dropdown-button]')) {
        dropdown.classList.add('hidden');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const validateCustomerData = (customer: ImportedCustomer, rowNumber: number): string[] => {
    const errors: string[] = [];
    
    if (!customer.name?.trim()) {
      errors.push(`Row ${rowNumber}: Name is required`);
    }
    
    if (!customer.phone?.trim()) {
      errors.push(`Row ${rowNumber}: Phone number is required`);
    } else if (!/^[+]?[0-9\s\-()]{8,}$/.test(customer.phone)) {
      errors.push(`Row ${rowNumber}: Invalid phone number format`);
    }
    
    if (customer.gender && !['male', 'female', 'other'].includes(customer.gender)) {
      errors.push(`Row ${rowNumber}: Gender must be male, female, or other`);
    }
    
    if (customer.loyaltyLevel && !['bronze', 'silver', 'gold', 'platinum'].includes(customer.loyaltyLevel)) {
      errors.push(`Row ${rowNumber}: Invalid loyalty level`);
    }
    
    // Validate birthday fields if provided
    if (customer.birthMonth && !customer.birthDay) {
      errors.push(`Row ${rowNumber}: Birth day is required if birth month is provided`);
    }
    
    if (customer.birthDay && !customer.birthMonth) {
      errors.push(`Row ${rowNumber}: Birth month is required if birth day is provided`);
    }
    
    // Validate birth day is a number between 1-31
    if (customer.birthDay) {
      const day = parseInt(customer.birthDay);
      if (isNaN(day) || day < 1 || day > 31) {
        errors.push(`Row ${rowNumber}: Birth day must be a number between 1-31`);
      }
    }
    
    return errors;
  };

  // Function to get validation errors for a specific row
  const getRowValidationErrors = (customer: ImportedCustomer, rowIndex: number): string[] => {
    return validateCustomerData(customer, rowIndex + 2);
  };

  // Function to check if a specific field has validation errors
  const hasFieldError = (customer: ImportedCustomer, rowIndex: number, field: string): boolean => {
    const errors = getRowValidationErrors(customer, rowIndex);
    return errors.some(error => 
      error.toLowerCase().includes(field.toLowerCase()) ||
      (field === 'name' && error.includes('Name is required')) ||
      (field === 'phone' && (error.includes('Phone number is required') || error.includes('Invalid phone number format')))
    );
  };

  // Function to get the specific validation error message for a field
  const getFieldError = (customer: ImportedCustomer, rowIndex: number, field: string): string => {
    const errors = getRowValidationErrors(customer, rowIndex);
    return errors.find(error => 
      error.toLowerCase().includes(field.toLowerCase()) ||
      (field === 'name' && error.includes('Name is required')) ||
      (field === 'phone' && (error.includes('Phone number is required') || error.includes('Invalid phone number format')))
    ) || '';
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      
      setFile(selectedFile);
      processExcelFile(selectedFile);
    }
  };

  const processExcelFile = async (file: File) => {
    try {
      setIsProcessing(true);
      setValidationErrors([]);
      
      // Read the file as text (CSV format)
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error('File must contain at least a header row and one data row');
        return;
      }
      
      // Parse CSV data
      const headers = lines[0]?.split(',').map(h => h.trim().toLowerCase()) || [];
      const data: ImportedCustomer[] = [];
      const errors: string[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const rawPhone = values[headers.indexOf('phone')] || values[headers.indexOf('phone number')] || values[headers.indexOf('mobile')] || values[headers.indexOf('mobile phone')] || values[headers.indexOf('primary phone')] || values[headers.indexOf('phone 1 - value')] || '';
        const rawWhatsApp = values[headers.indexOf('whatsapp')] || values[headers.indexOf('whatsapp number')] || '';
        
        const customer: ImportedCustomer = {
          name: formatCustomerName(values[headers.indexOf('name')] || values[headers.indexOf('full name')] || values[headers.indexOf('customer name')] || values[headers.indexOf('first name')] || ''),
          email: '', // Email field removed from UI
          phone: formatPhoneNumber(rawPhone),
          gender: formatGender(values[headers.indexOf('gender')] || 'other'),
          city: formatCityName(values[headers.indexOf('city')] || values[headers.indexOf('location')] || values[headers.indexOf('home city')] || values[headers.indexOf('business city')] || ''),
          whatsapp: formatWhatsAppNumber(rawWhatsApp),
          notes: values[headers.indexOf('notes')] || values[headers.indexOf('comments')] || '',
          loyaltyLevel: (values[headers.indexOf('loyalty')] || values[headers.indexOf('loyalty level')] || 'bronze') as 'bronze' | 'silver' | 'gold' | 'platinum',
          colorTag: (values[headers.indexOf('color tag')] || values[headers.indexOf('tag')] || 'new') as 'new' | 'vip' | 'complainer' | 'purchased',
          birthMonth: values[headers.indexOf('birth month')] || values[headers.indexOf('month')] || '',
          birthDay: values[headers.indexOf('birth day')] || values[headers.indexOf('day')] || '',
          referralSource: formatReferralSource(values[headers.indexOf('referral source')] || values[headers.indexOf('referral')] || values[headers.indexOf('referred by')] || values[headers.indexOf('referral resource')] || ''),
          referralSourceCustom: values[headers.indexOf('referral source custom')] || values[headers.indexOf('custom referral')] || ''
        };
        
        // Parse birthday if in "DD-MMM" or "MMM-DD" format
        const birthdayValue = values[headers.indexOf('birthday')] || values[headers.indexOf('birth day')] || values[headers.indexOf('birth')] || values[headers.indexOf('birth date')] || '';
        if (birthdayValue) {
          const parsedBirthday = parseBirthday(birthdayValue);
          if (parsedBirthday.month && parsedBirthday.day) {
            customer.birthMonth = parsedBirthday.month;
            customer.birthDay = parsedBirthday.day;
          }
        }
        
        // Handle birthday format like "15-Mar" in birth month column
        if (customer.birthMonth && customer.birthMonth.includes('-')) {
          const parsedBirthday = parseBirthday(customer.birthMonth);
          if (parsedBirthday.month && parsedBirthday.day) {
            customer.birthMonth = parsedBirthday.month;
            customer.birthDay = parsedBirthday.day;
          }
        }

        // Validate customer data
        const rowErrors = validateCustomerData(customer, i + 1);
        errors.push(...rowErrors);
        
        if (customer.name && customer.phone) {
          data.push(customer);
        }
      }
      
      setValidationErrors(errors);
      setImportedData(data);
      setEditableData([...data]); // Initialize editable data
      setPreviewData(data.slice(0, 5)); // Show first 5 for preview
      setCurrentStep('preview');
      
      if (errors.length > 0) {
        toast.error(`Found ${errors.length} validation errors. Please review before importing.`);
      } else {
        toast.success(`Successfully processed ${data.length} customers`);
      }
      
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Error processing file. Please ensure it\'s a valid CSV/Excel file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    // Double-check admin role before proceeding
    if (currentUser?.role !== 'admin') {
      toast.error('Only administrators can import customers');
      return;
    }
    
    // Use editable data if in edit mode, otherwise use original imported data
    const dataToImport = isEditMode ? editableData : importedData;
    
    // Check if there's any data to import
    if (dataToImport.length === 0) {
      toast.error('No data to import. Please add at least one customer.');
      return;
    }
    
    // Remove the validation error blocking - allow import with warnings
    const hasValidationErrors = validationErrors.length > 0;
    if (hasValidationErrors) {
      // Show warning but allow import to proceed
      toast.error(`Found ${validationErrors.length} validation errors. Invalid rows will be skipped.`);
    }
    
    try {
      setIsImporting(true);
      setImportProgress(0);
      setImportResults([]);
      
      const createdCustomers: Customer[] = [];
      const results: ImportResult[] = [];
      
      for (let i = 0; i < dataToImport.length; i++) {
        const customerData = dataToImport[i];
        
        // Validate this specific customer
        const rowErrors = validateCustomerData(customerData, i + 2);
        
        // Skip this row if it has validation errors
        if (rowErrors.length > 0) {
          results.push({
            success: false,
            error: `Validation errors: ${rowErrors.join(', ')}`,
            rowNumber: i + 2
          });
          continue; // Skip to next row
        }
        
        try {
          const newCustomer = await addCustomerToDb({
            id: crypto.randomUUID(),
            name: customerData.name,
            email: customerData.email,
            phone: formatPhoneNumber(customerData.phone),
            gender: customerData.gender,
            city: customerData.city,
            whatsapp: formatWhatsAppNumber(customerData.whatsapp || ''),
            initialNotes: customerData.notes,
            loyaltyLevel: customerData.loyaltyLevel || 'bronze',
            colorTag: customerData.colorTag || 'new',
            birthMonth: customerData.birthMonth,
            birthDay: customerData.birthDay,
            referralSource: customerData.referralSource,
            joinedDate: new Date().toISOString(),
            totalSpent: 0,
            points: 0,
            lastVisit: new Date().toISOString(),
            isActive: true,
            notes: [],
            referrals: []
          });
          
          if (newCustomer) {
            createdCustomers.push(newCustomer);
            results.push({
              success: true,
              customer: newCustomer,
              rowNumber: i + 2
            });
          } else {
            results.push({
              success: false,
              error: 'Failed to create customer',
              rowNumber: i + 2
            });
          }
        } catch (error) {
          console.error(`Error creating customer ${customerData.name}:`, error);
          results.push({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            rowNumber: i + 2
          });
        }
        
        // Update progress
        setImportProgress(((i + 1) / dataToImport.length) * 100);
        setImportResults(results);
      }
      
      const successCount = results.filter(r => r.success).length;
      const skippedCount = results.filter(r => !r.success && r.error?.includes('Validation errors')).length;
      const errorCount = results.filter(r => !r.success && !r.error?.includes('Validation errors')).length;
      
      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} customers!`);
        onImportComplete(createdCustomers);
      }
      
      if (skippedCount > 0) {
        toast.success(`Skipped ${skippedCount} rows with validation errors.`);
      }
      
      if (errorCount > 0) {
        toast.error(`${errorCount} customers failed to import. Check the results below.`);
      }
      
      // Stay on import step to show results
      setCurrentStep('import');
      
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Error importing customers. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setImportedData([]);
    setEditableData([]);
    setPreviewData([]);
    setCurrentStep('upload');
    setIsProcessing(false);
    setIsImporting(false);
    setIsEditMode(false);
    setIsCompactView(false);
    setExpandedColumns(new Set());
    setImportProgress(0);
    setImportResults([]);
    setValidationErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const downloadTemplate = () => {
    // Create a more comprehensive template with dropdown options
    const template = `name,email,phone,gender,city,whatsapp,birth month,birth day,referral source,notes,loyalty level,color tag
John Doe,john@example.com,748757641,male,DSM,748757641,January,15,MTANDAONI,New customer,bronze,new
Jane Smith,jane@example.com,717377078,female,MARA,717377078,March,22,RECOMMENDATION,VIP customer,silver,vip
Mike Johnson,mike@example.com,676947420,male,MORO,676947420,December,5,PHYSICALLY,Regular customer,gold,new
Alice Brown,alice@example.com,655123456,female,DSM,655123456,June,10,INSTAGRAM,Social media customer,platinum,purchased`;
    
    // Create the CSV content
    const csvContent = template;
    
    // Create the blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customer_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    // Show instructions for dropdown setup
    toast.success('Template downloaded! To add dropdowns in Excel: Select column → Data → Data Validation → List → Enter values separated by commas');
  };

  // Only allow admin users to access this modal
  if (!isOpen || currentUser?.role !== 'admin') return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-500" />
            Import Customers from Excel (Admin Only)
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {currentStep === 'upload' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="mb-4">
                <Upload className="w-12 h-12 mx-auto text-blue-500 mb-2" />
                <h3 className="text-lg font-medium mb-2">Upload Customer Data</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Import customers from Excel/CSV file. Download the template below for the correct format.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                >
                  <Upload className="w-4 h-4 mr-2 inline" />
                  {isProcessing ? 'Processing...' : 'Choose File'}
                </button>
                
                <button
                  onClick={() => {
                    setCurrentStep('preview');
                    setIsEditMode(true);
                    setEditableData([{
                      name: '',
                      email: '',
                      phone: '',
                      gender: 'other',
                      city: '',
                      whatsapp: '',
                      birthMonth: '',
                      birthDay: '',
                      referralSource: '',
                      notes: '',
                      loyaltyLevel: 'bronze',
                      colorTag: 'new'
                    }]);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
                >
                  <UserPlus className="w-4 h-4 mr-2 inline" />
                  Manual Entry
                </button>
                
                <button
                  onClick={downloadTemplate}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4 mr-2 inline" />
                  Download Template
                </button>
                
                <div className="flex items-center justify-center text-sm text-gray-500">
                  or
                </div>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Dropdown Values for Excel:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-700">
                <div>
                  <strong>Gender:</strong> male, female, other
                </div>
                <div>
                  <strong>Loyalty Level:</strong> bronze, silver, gold, platinum
                </div>
                <div>
                  <strong>Color Tag:</strong> new, vip, complainer, purchased
                </div>
                <div>
                  <strong>Referral Source:</strong> MTANDAONI, RECOMMENDATION, PHYSICALLY, INSTAGRAM, FACEBOOK, GOOGLE, FRIEND, FAMILY, OTHER
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                How to Add Dropdowns in Excel:
              </h4>
              <ol className="text-sm text-yellow-700 space-y-1">
                <li>1. Select the column you want to add dropdown to (e.g., Gender column)</li>
                <li>2. Go to <strong>Data</strong> tab → <strong>Data Validation</strong></li>
                <li>3. Choose <strong>List</strong> from "Allow" dropdown</li>
                <li>4. In "Source" field, enter values separated by commas (e.g., male,female,other)</li>
                <li>5. Click <strong>OK</strong> to apply</li>
              </ol>
            </div>
          </div>
        )}

        {currentStep === 'preview' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">
                {importedData.length > 0 ? 'Preview Data' : 'Manual Entry'}
              </h3>
                            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                  {importedData.length > 0 ? `${importedData.length} customers found` : 'No file uploaded - manual entry mode'}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="relative">
                    <button
                      data-dropdown-button
                      onClick={() => {
                        const dropdown = document.getElementById('column-expand-dropdown');
                        if (dropdown) {
                          dropdown.classList.toggle('hidden');
                        }
                      }}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200 transition-colors"
                    >
                      Expand Columns
                    </button>
                    <div id="column-expand-dropdown" className="hidden absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-48">
                      <div className="p-2 text-xs text-gray-500 border-b">Select columns to expand:</div>
                      {[
                        { key: 'name', label: 'Name' },
                        { key: 'phone', label: 'Phone' },
                        { key: 'email', label: 'Email' },
                        { key: 'city', label: 'City' },
                        { key: 'whatsapp', label: 'WhatsApp' },
                        { key: 'referral', label: 'Referral Source' },
                        { key: 'notes', label: 'Notes' }
                      ].map(column => (
                        <label key={column.key} className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={expandedColumns.has(column.key)}
                            onChange={(e) => {
                              const newExpanded = new Set(expandedColumns);
                              if (e.target.checked) {
                                newExpanded.add(column.key);
                              } else {
                                newExpanded.delete(column.key);
                              }
                              setExpandedColumns(newExpanded);
                            }}
                            className="w-4 h-4 text-blue-600"
                          />
                          <span className="text-sm">{column.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => setIsCompactView(!isCompactView)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      isCompactView 
                        ? "bg-blue-500 text-white hover:bg-blue-600" 
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {isCompactView ? "Normal View" : "Compact View"}
                  </button>
                  <button
                    onClick={() => setIsEditMode(!isEditMode)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      isEditMode 
                        ? "bg-blue-500 text-white hover:bg-blue-600" 
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {isEditMode ? "View Mode" : "Edit Mode"}
                  </button>
                </div>
              </div>
            </div>
            
            {validationErrors.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Validation Warnings ({validationErrors.length} rows will be skipped):
                </h4>
                <div className="max-h-32 overflow-y-auto">
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {validationErrors.slice(0, 10).map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                    {validationErrors.length > 10 && (
                      <li className="text-yellow-600">... and {validationErrors.length - 10} more warnings</li>
                    )}
                  </ul>
                </div>
                <div className="mt-3 p-2 bg-yellow-100 rounded text-sm text-yellow-800">
                  <strong>Note:</strong> Rows with validation errors will be automatically skipped during import. 
                  Valid customers will still be imported successfully.
                </div>
              </div>
            )}
            
            {isEditMode && (
              <div className="mb-4">
                <button
                  onClick={() => {
                    const newCustomer: ImportedCustomer = {
                      name: '',
                      email: '',
                      phone: '',
                      gender: 'other',
                      city: '',
                      whatsapp: '',
                      birthMonth: '',
                      birthDay: '',
                      referralSource: '',
                      notes: '',
                      loyaltyLevel: 'bronze',
                      colorTag: 'new'
                    };
                    setEditableData([...editableData, newCustomer]);
                  }}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200 transition-colors"
                >
                  + Add Row
                </button>
              </div>
            )}
            <div className="max-h-64 overflow-y-auto">
              <div className="overflow-x-auto">
                <table className={`w-full ${isCompactView ? 'text-xs' : 'text-sm'} min-w-full`}>
                <thead className="bg-gray-50">
                  <tr>
                    <th className={`text-left ${isCompactView ? 'p-1' : 'p-2'} ${isCompactView ? (expandedColumns.has('name') ? 'w-32' : 'w-20') : ''} ${isEditMode ? 'min-w-32' : ''}`}>Name</th>
                    <th className={`text-left ${isCompactView ? 'p-1' : 'p-2'} ${isCompactView ? (expandedColumns.has('phone') ? 'w-32' : 'w-24') : ''} ${isEditMode ? 'min-w-36' : ''}`}>Phone</th>
                    <th className={`text-left ${isCompactView ? 'p-1' : 'p-2'} ${isCompactView ? 'w-16' : ''} ${isEditMode ? 'min-w-20' : ''}`}>Gender</th>
                    <th className={`text-left ${isCompactView ? 'p-1' : 'p-2'} ${isCompactView ? (expandedColumns.has('city') ? 'w-32' : 'w-20') : ''} ${isEditMode ? 'min-w-28' : ''}`}>City</th>
                    <th className={`text-left ${isCompactView ? 'p-1' : 'p-2'} ${isCompactView ? (expandedColumns.has('whatsapp') ? 'w-32' : 'w-20') : ''} ${isEditMode ? 'min-w-32' : ''}`}>WhatsApp</th>
                    <th className={`text-left ${isCompactView ? 'p-1' : 'p-2'} ${isCompactView ? 'w-20' : ''} ${isEditMode ? 'min-w-24' : ''}`}>Birthday</th>
                    <th className={`text-left ${isCompactView ? 'p-1' : 'p-2'} ${isCompactView ? (expandedColumns.has('referral') ? 'w-32' : 'w-16') : ''} ${isEditMode ? 'min-w-32' : ''}`}>Referral</th>
                    <th className={`text-left ${isCompactView ? 'p-1' : 'p-2'} ${isCompactView ? (expandedColumns.has('notes') ? 'w-40' : 'w-20') : ''} ${isEditMode ? 'min-w-48' : ''}`}>Notes</th>
                    <th className={`text-left ${isCompactView ? 'p-1' : 'p-2'} ${isCompactView ? 'w-16' : ''} ${isEditMode ? 'min-w-20' : ''}`}>Loyalty</th>
                    <th className={`text-left ${isCompactView ? 'p-1' : 'p-2'} ${isCompactView ? 'w-16' : ''} ${isEditMode ? 'min-w-20' : ''}`}>Color Tag</th>
                    {isEditMode && <th className={`text-left ${isCompactView ? 'p-1' : 'p-2'} ${isCompactView ? 'w-12' : ''} ${isEditMode ? 'min-w-16' : ''}`}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                    {(isEditMode ? editableData : (previewData.length > 0 ? previewData : importedData)).map((customer, index) => (
                    <tr key={index} className={`border-b ${getRowValidationErrors(customer, index).length > 0 ? 'bg-yellow-50' : ''}`}>
                                                <td className={`${isCompactView ? 'p-1' : 'p-2'} relative ${
                              hasFieldError(customer, index, 'name') 
                                ? 'bg-yellow-100 border-l-4 border-yellow-500' 
                                : ''
                            }`}>
                          {hasFieldError(customer, index, 'name') && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">⚠️</span>
                            </div>
                          )}
                          {isEditMode ? (
                            <input
                              type="text"
                              value={customer.name || ''}
                              onChange={(e) => {
                                const newData = [...editableData];
                                newData[index].name = e.target.value;
                                setEditableData(newData);
                              }}
                              className="w-full bg-transparent border-none outline-none text-sm focus:bg-white focus:border focus:border-blue-300 focus:rounded px-1 py-0.5"
                            />
                          ) : (
                            <span className={hasFieldError(customer, index, 'name') ? 'text-yellow-800' : ''}>
                              {customer.name || (hasFieldError(customer, index, 'name') ? '⚠️ Required' : '')}
                            </span>
                          )}
                        </td>
                      <td className={`${isCompactView ? 'p-1' : 'p-2'} relative ${
                              hasFieldError(customer, index, 'phone') 
                                ? 'bg-yellow-100 border-l-4 border-yellow-500' 
                                : ''
                            }`}>
                        {hasFieldError(customer, index, 'phone') && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">⚠️</span>
                          </div>
                        )}
                        {isEditMode ? (
                          <input
                            type="text"
                            value={customer.phone || ''}
                            onChange={(e) => {
                              const newData = [...editableData];
                              newData[index].phone = e.target.value;
                              setEditableData(newData);
                            }}
                            className="w-full bg-transparent border-none outline-none text-sm focus:bg-white focus:border focus:border-blue-300 focus:rounded px-1 py-0.5"
                          />
                        ) : (
                          <span className={hasFieldError(customer, index, 'phone') ? 'text-yellow-800' : ''}>
                            {customer.phone || (hasFieldError(customer, index, 'phone') ? '⚠️ Required' : '')}
                          </span>
                        )}
                      </td>

                      <td className={`${isCompactView ? 'p-1' : 'p-2'}`}>
                        {isEditMode ? (
                          <select
                            value={customer.gender || 'other'}
                            onChange={(e) => {
                              const newData = [...editableData];
                              newData[index].gender = e.target.value as 'male' | 'female' | 'other';
                              setEditableData(newData);
                            }}
                            className="w-full bg-transparent border-none outline-none text-sm focus:bg-white focus:border focus:border-blue-300 focus:rounded px-1 py-0.5 capitalize"
                          >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        ) : (
                          <span className="capitalize">{customer.gender}</span>
                        )}
                      </td>
                      <td className={`${isCompactView ? 'p-1' : 'p-2'}`}>
                        {isEditMode ? (
                          <input
                            type="text"
                            value={customer.city || ''}
                            onChange={(e) => {
                              const newData = [...editableData];
                              newData[index].city = e.target.value;
                              setEditableData(newData);
                            }}
                            className="w-full bg-transparent border-none outline-none text-sm focus:bg-white focus:border focus:border-blue-300 focus:rounded px-1 py-0.5"
                          />
                        ) : (
                          customer.city
                        )}
                      </td>
                      <td className={`${isCompactView ? 'p-1' : 'p-2'}`}>
                        {isEditMode ? (
                          <input
                            type="text"
                            value={customer.whatsapp || ''}
                            onChange={(e) => {
                              const newData = [...editableData];
                              newData[index].whatsapp = e.target.value;
                              setEditableData(newData);
                            }}
                            className="w-full bg-transparent border-none outline-none text-sm focus:bg-white focus:border focus:border-blue-300 focus:rounded px-1 py-0.5"
                          />
                        ) : (
                          customer.whatsapp || '-'
                        )}
                      </td>
                      <td className={`${isCompactView ? 'p-1' : 'p-2'}`}>
                        {isEditMode ? (
                          <div className="flex gap-1">
                            <input
                              type="text"
                              placeholder="Month"
                              value={customer.birthMonth || ''}
                              onChange={(e) => {
                                const newData = [...editableData];
                                newData[index].birthMonth = e.target.value;
                                setEditableData(newData);
                              }}
                              className="w-20 bg-transparent border-none outline-none text-sm focus:bg-white focus:border focus:border-blue-300 focus:rounded px-1 py-0.5"
                            />
                            <input
                              type="number"
                              placeholder="Day"
                              min="1"
                              max="31"
                              value={customer.birthDay || ''}
                              onChange={(e) => {
                                const newData = [...editableData];
                                newData[index].birthDay = e.target.value;
                                setEditableData(newData);
                              }}
                              className="w-16 bg-transparent border-none outline-none text-sm focus:bg-white focus:border focus:border-blue-300 focus:rounded px-1 py-0.5"
                            />
                          </div>
                        ) : (
                          customer.birthMonth && customer.birthDay ? `${customer.birthMonth} ${customer.birthDay}` : '-'
                        )}
                      </td>
                      <td className={`${isCompactView ? 'p-1' : 'p-2'}`}>
                        {isEditMode ? (
                          <input
                            type="text"
                            value={customer.referralSource || ''}
                            onChange={(e) => {
                              const newData = [...editableData];
                              newData[index].referralSource = e.target.value;
                              setEditableData(newData);
                            }}
                            className="w-full bg-transparent border-none outline-none text-sm focus:bg-white focus:border focus:border-blue-300 focus:rounded px-1 py-0.5"
                          />
                        ) : (
                          customer.referralSource || '-'
                        )}
                      </td>
                      <td className={`${isCompactView ? 'p-1' : 'p-2'}`}>
                        {isEditMode ? (
                          <textarea
                            value={customer.notes || ''}
                            onChange={(e) => {
                              const newData = [...editableData];
                              newData[index].notes = e.target.value;
                              setEditableData(newData);
                            }}
                            className="w-full bg-transparent border-none outline-none text-sm focus:bg-white focus:border focus:border-blue-300 focus:rounded px-1 py-0.5 resize-none"
                            rows={1}
                            placeholder="Notes..."
                          />
                        ) : (
                          <span className="text-xs text-gray-600 max-w-xs truncate block" title={customer.notes}>
                            {customer.notes || '-'}
                          </span>
                        )}
                      </td>
                      <td className={`${isCompactView ? 'p-1' : 'p-2'}`}>
                        {isEditMode ? (
                          <select
                            value={customer.loyaltyLevel || 'bronze'}
                            onChange={(e) => {
                              const newData = [...editableData];
                              newData[index].loyaltyLevel = e.target.value as 'bronze' | 'silver' | 'gold' | 'platinum';
                              setEditableData(newData);
                            }}
                            className="w-full bg-transparent border-none outline-none text-sm focus:bg-white focus:border focus:border-blue-300 focus:rounded px-1 py-0.5 capitalize"
                          >
                            <option value="bronze">Bronze</option>
                            <option value="silver">Silver</option>
                            <option value="gold">Gold</option>
                            <option value="platinum">Platinum</option>
                          </select>
                        ) : (
                          <span className="capitalize">{customer.loyaltyLevel}</span>
                        )}
                      </td>
                      <td className={`${isCompactView ? 'p-1' : 'p-2'}`}>
                        {isEditMode ? (
                          <select
                            value={customer.colorTag || 'new'}
                            onChange={(e) => {
                              const newData = [...editableData];
                              newData[index].colorTag = e.target.value as 'new' | 'vip' | 'complainer' | 'purchased';
                              setEditableData(newData);
                            }}
                            className="w-full bg-transparent border-none outline-none text-sm focus:bg-white focus:border focus:border-blue-300 focus:rounded px-1 py-0.5 capitalize"
                          >
                            <option value="new">New</option>
                            <option value="vip">VIP</option>
                            <option value="complainer">Complainer</option>
                            <option value="purchased">Purchased</option>
                          </select>
                        ) : (
                          <span className="capitalize">{customer.colorTag}</span>
                        )}
                      </td>
                      {isEditMode && (
                        <td className={`${isCompactView ? 'p-1' : 'p-2'}`}>
                          <button
                            onClick={() => {
                              const newData = [...editableData];
                              newData.splice(index, 1);
                              setEditableData(newData);
                            }}
                            className="text-red-600 hover:text-red-800 text-sm"
                            title="Remove row"
                          >
                            ✕
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep('upload')}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setCurrentStep('import')}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm font-medium transition-colors"
              >
                {validationErrors.length > 0 ? 'Continue (Skip Invalid Rows)' : 'Continue to Import'}
              </button>
            </div>
          </div>
        )}

        {currentStep === 'import' && (
          <div className="space-y-6">
            {isImporting ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-medium mb-2">Importing Customers</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Progress: {Math.round(importProgress)}% ({importResults.length}/{importedData.length})
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${importProgress}%` }}
                  ></div>
                </div>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-2" />
                  <h3 className="text-lg font-medium mb-2">Import Complete</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Import results for {importedData.length} customers
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 mb-1">Successful</h4>
                    <p className="text-2xl font-bold text-green-900">
                      {importResults.filter(r => r.success).length}
                    </p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-medium text-red-800 mb-1">Failed</h4>
                    <p className="text-2xl font-bold text-red-900">
                      {importResults.filter(r => !r.success).length}
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-1">Total</h4>
                    <p className="text-2xl font-bold text-blue-900">
                      {importResults.length}
                    </p>
                  </div>
                </div>
                
                {importResults.filter(r => !r.success).length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-medium text-red-800 mb-2">Failed Imports:</h4>
                    <div className="max-h-32 overflow-y-auto">
                      <ul className="text-sm text-red-700 space-y-1">
                        {importResults.filter(r => !r.success).map((result, index) => (
                          <li key={index}>Row {result.rowNumber}: {result.error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </>
            )}
            
            <div className="flex gap-3">
              <GlassButton
                onClick={() => setCurrentStep('preview')}
                variant="secondary"
                className="flex-1"
                disabled={isImporting}
              >
                Back
              </GlassButton>
              <GlassButton
                onClick={handleImport}
                disabled={isImporting || validationErrors.length > 0}
                className="flex-1"
              >
                {isImporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Importing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Import Customers
                  </>
                )}
              </GlassButton>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default ExcelImportModal; 