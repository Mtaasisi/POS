import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Download, AlertCircle, CheckCircle, UserPlus, FileText, Info, Shield, SkipForward, Eye, EyeOff, RefreshCw } from 'lucide-react';
import GlassCard from './ui/GlassCard';
import GlassButton from './ui/GlassButton';
import { Customer } from '../types';
import { toast } from 'react-hot-toast';
import { updateCustomerInDb, fetchAllCustomers } from '../lib/customerApi';
import { useAuth } from '../context/AuthContext';
import { formatTanzaniaPhoneNumber, formatTanzaniaWhatsAppNumber } from '../lib/phoneUtils';
import { supabase } from '../lib/supabaseClient';

interface CustomerUpdateImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (updatedCustomers: Customer[]) => void;
}

interface ImportedCustomerUpdate {
  id?: string;
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
  locationDescription?: string;
  nationalId?: string;
  referredBy?: string;
  totalSpent?: number;
  points?: number;
  isActive?: boolean;
  profileImage?: string;
}

interface UpdateResult {
  success: boolean;
  customer?: Customer;
  error?: string;
  rowNumber: number;
  skipped?: boolean;
  reason?: string;
  existingCustomer?: Customer;
}

const CustomerUpdateImportModal: React.FC<CustomerUpdateImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  console.log('CustomerUpdateImportModal render - isOpen:', isOpen);
  
  const { currentUser } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [importedData, setImportedData] = useState<ImportedCustomerUpdate[]>([]);
  const [previewData, setPreviewData] = useState<ImportedCustomerUpdate[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'import'>('upload');
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<UpdateResult[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [existingCustomers, setExistingCustomers] = useState<Map<string, Customer>>(new Map());
  const [matchedCustomers, setMatchedCustomers] = useState<Map<string, Customer>>(new Map());
  const [showMatchedOnly, setShowMatchedOnly] = useState(true);
  const [visibleCustomers, setVisibleCustomers] = useState<ImportedCustomerUpdate[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use centralized phone formatting functions
  const formatPhoneNumber = formatTanzaniaPhoneNumber;
  const formatWhatsAppNumber = formatTanzaniaWhatsAppNumber;

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

  // Function to format gender
  const formatGender = (gender: string): 'male' | 'female' | 'other' => {
    if (!gender) return 'male';
    
    const normalized = gender.trim().toLowerCase();
    
    if (normalized === 'male' || normalized === 'm') return 'male';
    if (normalized === 'female' || normalized === 'f') return 'female';
    if (normalized === 'other' || normalized === 'o') return 'other';
    
    return 'male'; // Default to male
  };

  // Function to format referral source
  const formatReferralSource = (referral: string): string => {
    if (!referral) return '';
    
    const normalized = referral.trim().toLowerCase();
    
    // Map common variations
    const referralMap: { [key: string]: string } = {
      'instagram': 'Instagram',
      'facebook': 'Facebook',
      'twitter': 'Twitter',
      'tiktok': 'TikTok',
      'friend': 'Friend',
      'family': 'Family',
      'walk-in': 'Walk-in',
      'walkin': 'Walk-in',
      'walk in': 'Walk-in',
      'social media': 'Social Media',
      'socialmedia': 'Social Media',
      'google': 'Google',
      'search': 'Google',
      'website': 'Website',
      'referral': 'Referral',
      'word of mouth': 'Word of Mouth',
      'wordofmouth': 'Word of Mouth',
      'advertisement': 'Advertisement',
      'ad': 'Advertisement',
      'flyer': 'Flyer',
      'poster': 'Poster',
      'radio': 'Radio',
      'tv': 'TV',
      'newspaper': 'Newspaper',
      'magazine': 'Magazine',
      'other': 'Other'
    };
    
    return referralMap[normalized] || referral.trim();
  };

  // Function to format city name
  const formatCityName = (city: string): string => {
    if (!city) return '';
    
    const trimmedCity = city.trim();
    
    // Convert from ALL CAPS to Title Case
    if (trimmedCity === trimmedCity.toUpperCase() && trimmedCity.length > 1) {
      return trimmedCity.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
    }
    
    // Convert from Capital Letters to Title Case
    if (trimmedCity === trimmedCity.toUpperCase()) {
      return trimmedCity.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
    }
    
    return trimmedCity;
  };

  // Function to parse birthday
  const parseBirthday = (birthday: string): { month: string; day: string } => {
    if (!birthday) return { month: '', day: '' };
    
    const trimmed = birthday.trim();
    
    // Try to parse as MM/DD or DD/MM format
    const dateParts = trimmed.split('/');
    if (dateParts.length === 2) {
      const [first, second] = dateParts;
      const firstNum = parseInt(first);
      const secondNum = parseInt(second);
      
      // If first number is > 12, it's likely DD/MM format
      if (firstNum > 12 && secondNum <= 12) {
        return { month: second, day: first };
      }
      // If second number is > 12, it's likely MM/DD format
      else if (secondNum > 12 && firstNum <= 12) {
        return { month: first, day: second };
      }
      // Default to MM/DD if both are <= 12
      else if (firstNum <= 12 && secondNum <= 31) {
        return { month: first, day: second };
      }
    }
    
    // Try to parse as month name
    const monthNames = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    
    const lowerBirthday = trimmed.toLowerCase();
    for (let i = 0; i < monthNames.length; i++) {
      if (lowerBirthday.includes(monthNames[i])) {
        const monthIndex = (i + 1).toString();
        // Try to extract day number
        const dayMatch = trimmed.match(/\d+/);
        const day = dayMatch ? dayMatch[0] : '';
        return { month: monthIndex, day };
      }
    }
    
    return { month: '', day: '' };
  };

  // Function to normalize color tag
  const normalizeColorTag = (colorTag: string): 'new' | 'vip' | 'complainer' | 'purchased' => {
    if (!colorTag) return 'new';
    
    const normalized = colorTag.trim().toLowerCase();
    
    const colorMap: { [key: string]: 'new' | 'vip' | 'complainer' | 'purchased' } = {
      'new': 'new',
      'vip': 'vip',
      'complainer': 'complainer',
      'purchased': 'purchased',
      'normal': 'new',
      'regular': 'new',
      'standard': 'new',
      'basic': 'new',
      'premium': 'vip',
      'important': 'vip',
      'priority': 'vip',
      'problem': 'complainer',
      'issue': 'complainer',
      'buyer': 'purchased',
      'customer': 'purchased',
      'buying': 'purchased'
    };
    
    return colorMap[normalized] || 'new';
  };

  // Function to check existing customers and match them
  const checkExistingCustomers = async (customers: ImportedCustomerUpdate[]): Promise<Map<string, Customer>> => {
    try {
      console.log('🔍 Loading existing customers for matching...');
      const existingCustomersList = await fetchAllCustomers();
      
      const customerMap = new Map<string, Customer>();
      const matchedMap = new Map<string, Customer>();
      
      // Create maps for different matching strategies
      const phoneMap = new Map<string, Customer>();
      const whatsappMap = new Map<string, Customer>();
      const emailMap = new Map<string, Customer>();
      
      existingCustomersList.forEach(customer => {
        if (customer.phone) {
          const normalizedPhone = customer.phone.replace(/[^0-9]/g, '');
          phoneMap.set(normalizedPhone, customer);
        }
        if (customer.whatsapp) {
          const normalizedWhatsApp = customer.whatsapp.replace(/[^0-9]/g, '');
          whatsappMap.set(normalizedWhatsApp, customer);
        }
        if (customer.email) {
          emailMap.set(customer.email.toLowerCase(), customer);
        }
      });
      
      console.log(`📊 Loaded ${existingCustomersList.length} existing customers`);
      console.log(`📱 Phone matches available: ${phoneMap.size}`);
      console.log(`💬 WhatsApp matches available: ${whatsappMap.size}`);
      console.log(`📧 Email matches available: ${emailMap.size}`);
      
      // Match imported customers with existing ones
      customers.forEach(importedCustomer => {
        const normalizedPhone = importedCustomer.phone.replace(/[^0-9]/g, '');
        const normalizedWhatsApp = importedCustomer.whatsapp?.replace(/[^0-9]/g, '') || '';
        const normalizedEmail = importedCustomer.email.toLowerCase();
        
        // Try to find existing customer by phone, whatsapp, or email
        let matchedCustomer = phoneMap.get(normalizedPhone) || 
                            whatsappMap.get(normalizedPhone) ||
                            whatsappMap.get(normalizedWhatsApp) ||
                            emailMap.get(normalizedEmail);
        
        if (matchedCustomer) {
          matchedMap.set(importedCustomer.phone, matchedCustomer);
        }
      });
      
      setExistingCustomers(customerMap);
      setMatchedCustomers(matchedMap);
      
      const matchedCount = matchedMap.size;
      const totalCount = customers.length;
      
      console.log(`✅ Matched ${matchedCount} out of ${totalCount} imported customers with existing records`);
      
      return matchedMap;
    } catch (error) {
      console.error('❌ Error checking existing customers:', error);
      toast.error('Failed to load existing customers');
      return new Map();
    }
  };

  // Function to validate customer data
  const validateCustomerData = (customer: ImportedCustomerUpdate, rowNumber: number): string[] => {
    const errors: string[] = [];
    
    if (!customer.name || customer.name.trim().length < 2) {
      errors.push('Name must be at least 2 characters');
    }
    
    if (!customer.phone || customer.phone.trim().length < 10) {
      errors.push('Phone number must be at least 10 digits');
    }
    
    if (customer.email && !customer.email.includes('@')) {
      errors.push('Invalid email format');
    }
    
    if (customer.birthDay && (parseInt(customer.birthDay) < 1 || parseInt(customer.birthDay) > 31)) {
      errors.push('Birth day must be between 1 and 31');
    }
    
    if (customer.birthMonth && (parseInt(customer.birthMonth) < 1 || parseInt(customer.birthMonth) > 12)) {
      errors.push('Birth month must be between 1 and 12');
    }
    
    return errors;
  };

  // Function to check if customer exists and can be updated
  const canUpdateCustomer = (importedCustomer: ImportedCustomerUpdate, existingCustomer: Customer): boolean => {
    // Check if any non-null fields in imported data that are null in existing customer
    const fieldsToCheck = [
      'email', 'gender', 'city', 'whatsapp', 'birthMonth', 'birthDay', 
      'referralSource', 'locationDescription', 'nationalId', 'referredBy'
    ];
    
    for (const field of fieldsToCheck) {
      const importedValue = importedCustomer[field as keyof ImportedCustomerUpdate];
      const existingValue = existingCustomer[field as keyof Customer];
      
      if (importedValue && !existingValue) {
        return true; // Found a field that can be updated
      }
    }
    
    return false; // No fields to update
  };

  // Function to handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;
    
    setFile(selectedFile);
    processCSVFile(selectedFile);
  };

  // Function to process CSV file
  const processCSVFile = async (file: File) => {
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
      const data: ImportedCustomerUpdate[] = [];
      const errors: string[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const rawPhone = values[headers.indexOf('phone')] || values[headers.indexOf('phone number')] || values[headers.indexOf('mobile')] || values[headers.indexOf('mobile phone')] || values[headers.indexOf('primary phone')] || values[headers.indexOf('phone 1 - value')] || '';
        const rawWhatsApp = values[headers.indexOf('whatsapp')] || values[headers.indexOf('whatsapp number')] || '';
        
        const customer: ImportedCustomerUpdate = {
          name: formatCustomerName(values[headers.indexOf('name')] || ''),
          email: values[headers.indexOf('email')] || '',
          phone: formatPhoneNumber(rawPhone),
          gender: formatGender(values[headers.indexOf('gender')] || ''),
          city: formatCityName(values[headers.indexOf('city')] || ''),
          whatsapp: formatWhatsAppNumber(rawWhatsApp),
          notes: values[headers.indexOf('notes')] || values[headers.indexOf('initial notes')] || '',
          loyaltyLevel: (values[headers.indexOf('loyalty level')] || 'bronze') as 'bronze' | 'silver' | 'gold' | 'platinum',
          colorTag: normalizeColorTag(values[headers.indexOf('color tag')] || ''),
          referralSource: formatReferralSource(values[headers.indexOf('referral source')] || ''),
          locationDescription: values[headers.indexOf('location description')] || '',
          nationalId: values[headers.indexOf('national id')] || '',
          referredBy: values[headers.indexOf('referred by')] || '',
          totalSpent: parseFloat(values[headers.indexOf('total spent')] || '0') || 0,
          points: parseInt(values[headers.indexOf('points')] || '0') || 0,
          isActive: values[headers.indexOf('is active')]?.toLowerCase() === 'yes' || values[headers.indexOf('is active')]?.toLowerCase() === 'true',
          profileImage: values[headers.indexOf('profile image')] || ''
        };
        
        // Parse birthday if available
        const birthday = values[headers.indexOf('birth month')] || values[headers.indexOf('birthday')] || '';
        if (birthday) {
          const { month, day } = parseBirthday(birthday);
          customer.birthMonth = month;
          customer.birthDay = day;
        }
        
        // Validate customer data
        const rowErrors = validateCustomerData(customer, i + 2);
        if (rowErrors.length > 0) {
          errors.push(`Row ${i + 2}: ${rowErrors.join(', ')}`);
        }
        
        data.push(customer);
      }
      
      setImportedData(data);
      setValidationErrors(errors);
      
      // Check for existing customers
      const matchedCustomers = await checkExistingCustomers(data);
      
      // Filter to show only matched customers by default
      const matchedData = data.filter(customer => matchedCustomers.has(customer.phone));
      setVisibleCustomers(matchedData);
      setPreviewData(matchedData);
      
      console.log(`📊 Processed ${data.length} customers from CSV`);
      console.log(`✅ Found ${matchedCustomers.size} existing customers to update`);
      console.log(`⚠️ ${errors.length} validation errors found`);
      
      if (matchedCustomers.size === 0) {
        toast.warning('No existing customers found to update. Make sure phone numbers match existing records.');
      } else {
        toast.success(`Found ${matchedCustomers.size} existing customers to update`);
      }
      
      setCurrentStep('preview');
    } catch (error) {
      console.error('❌ Error processing CSV file:', error);
      toast.error('Failed to process CSV file');
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to handle the import process
  const handleImport = async () => {
    if (currentUser?.role !== 'admin') {
      toast.error('Only administrators can update customers via CSV import.');
      return;
    }
    
    const dataToImport = visibleCustomers;
    
    if (dataToImport.length === 0) {
      toast.error('No customers to update. Please ensure you have matched customers.');
      return;
    }
    
    try {
      setIsImporting(true);
      setImportProgress(0);
      setImportResults([]);
      
      const updatedCustomers: Customer[] = [];
      const results: UpdateResult[] = [];
      
      for (let i = 0; i < dataToImport.length; i++) {
        const customerData = dataToImport[i];
        const existingCustomer = matchedCustomers.get(customerData.phone);
        
        if (!existingCustomer) {
          results.push({
            success: false,
            error: 'No existing customer found to update',
            rowNumber: i + 2,
            skipped: true,
            reason: 'No match found'
          });
          continue;
        }
        
        // Check if there are any fields to update
        if (!canUpdateCustomer(customerData, existingCustomer)) {
          results.push({
            success: false,
            error: 'No null fields to update',
            rowNumber: i + 2,
            skipped: true,
            reason: 'No updates needed',
            existingCustomer
          });
          continue;
        }
        
        try {
          // Prepare update data - only include fields that are not null in existing customer
          const updateData: Partial<Customer> = {};
          
          if (customerData.email && !existingCustomer.email) {
            updateData.email = customerData.email;
          }
          if (customerData.gender && !existingCustomer.gender) {
            updateData.gender = customerData.gender;
          }
          if (customerData.city && !existingCustomer.city) {
            updateData.city = customerData.city;
          }
          if (customerData.whatsapp && !existingCustomer.whatsapp) {
            updateData.whatsapp = customerData.whatsapp;
          }
          if (customerData.birthMonth && !existingCustomer.birthMonth) {
            updateData.birthMonth = customerData.birthMonth;
          }
          if (customerData.birthDay && !existingCustomer.birthDay) {
            updateData.birthDay = customerData.birthDay;
          }
          if (customerData.referralSource && !existingCustomer.referralSource) {
            updateData.referralSource = customerData.referralSource;
          }
          if (customerData.locationDescription && !existingCustomer.locationDescription) {
            updateData.locationDescription = customerData.locationDescription;
          }
          if (customerData.nationalId && !existingCustomer.nationalId) {
            updateData.nationalId = customerData.nationalId;
          }
          if (customerData.referredBy && !existingCustomer.referredBy) {
            updateData.referredBy = customerData.referredBy;
          }
          if (customerData.notes && !existingCustomer.notes?.length) {
            // Add note to existing customer
            try {
              await supabase.from('customer_notes').insert({
                id: crypto.randomUUID(),
                content: customerData.notes,
                created_by: currentUser.id,
                created_at: new Date().toISOString(),
                customer_id: existingCustomer.id
              });
            } catch (noteError) {
              console.warn('Could not add note:', noteError);
            }
          }
          
          // Only update if there are fields to update
          if (Object.keys(updateData).length > 0) {
            const updatedCustomer = await updateCustomerInDb(existingCustomer.id, updateData);
            
            if (updatedCustomer) {
              updatedCustomers.push(updatedCustomer);
              results.push({
                success: true,
                customer: updatedCustomer,
                rowNumber: i + 2,
                existingCustomer
              });
            } else {
              results.push({
                success: false,
                error: 'Failed to update customer',
                rowNumber: i + 2,
                existingCustomer
              });
            }
          } else {
            results.push({
              success: false,
              error: 'No fields to update',
              rowNumber: i + 2,
              skipped: true,
              reason: 'All fields already populated',
              existingCustomer
            });
          }
        } catch (error) {
          console.error(`Error updating customer ${customerData.name}:`, error);
          results.push({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            rowNumber: i + 2,
            existingCustomer
          });
        }
        
        // Update progress
        setImportProgress(((i + 1) / dataToImport.length) * 100);
      }
      
      setImportResults(results);
      
      const successCount = results.filter(r => r.success).length;
      const skippedCount = results.filter(r => r.skipped).length;
      const errorCount = results.filter(r => !r.success && !r.skipped).length;
      
      console.log(`✅ Import completed: ${successCount} updated, ${skippedCount} skipped, ${errorCount} errors`);
      
      if (successCount > 0) {
        toast.success(`Successfully updated ${successCount} customers`);
        onImportComplete(updatedCustomers);
      }
      
      if (errorCount > 0) {
        toast.error(`${errorCount} customers failed to update`);
      }
      
      setCurrentStep('import');
    } catch (error) {
      console.error('❌ Error during import:', error);
      toast.error('Failed to import customers');
    } finally {
      setIsImporting(false);
    }
  };

  // Function to handle modal close
  const handleClose = () => {
    setFile(null);
    setImportedData([]);
    setPreviewData([]);
    setVisibleCustomers([]);
    setImportResults([]);
    setValidationErrors([]);
    setCurrentStep('upload');
    setImportProgress(0);
    setExistingCustomers(new Map());
    setMatchedCustomers(new Map());
    setShowMatchedOnly(true);
    setSidebarOpen(true);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    onClose();
  };

  // Function to download template
  const downloadTemplate = () => {
    const template = `Name,Email,Phone,Gender,City,WhatsApp,Notes,Loyalty Level,Color Tag,Referral Source,Location Description,National ID,Referred By,Birth Month,Birth Day
John Doe,john@example.com,+255123456789,male,Dar es Salaam,+255123456789,New customer notes,bronze,normal,Instagram,City Center,123456789,John Smith,January,15
Jane Smith,jane@example.com,+255987654321,female,Arusha,+255987654321,Another customer,bronze,vip,Friend,Suburb Area,987654321,Jane Doe,March,22`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customer_update_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Function to toggle between matched and all customers
  const toggleShowMatchedOnly = () => {
    setShowMatchedOnly(!showMatchedOnly);
    if (!showMatchedOnly) {
      // Show only matched customers
      const matchedData = importedData.filter(customer => matchedCustomers.has(customer.phone));
      setVisibleCustomers(matchedData);
      setPreviewData(matchedData);
    } else {
      // Show all customers
      setVisibleCustomers(importedData);
      setPreviewData(importedData);
    }
  };

  // Effect to handle sidebar state
  useEffect(() => {
    const checkSidebarState = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };
    
    checkSidebarState();
    window.addEventListener('resize', checkSidebarState);
    
    return () => window.removeEventListener('resize', checkSidebarState);
  }, []);

  if (!isOpen) {
    console.log('CustomerUpdateImportModal: not showing because isOpen is false');
    return null;
  }

  console.log('CustomerUpdateImportModal: rendering modal content');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/20">
          <div className="flex items-center space-x-3">
            <RefreshCw className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Update Customers from CSV</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          {sidebarOpen && (
            <div className="w-64 bg-white/5 border-r border-white/20 p-4 overflow-y-auto">
              <div className="space-y-4">
                {/* Upload Section */}
                {currentStep === 'upload' && (
                  <div className="space-y-4">
                    <div className="text-center p-6 border-2 border-dashed border-white/30 rounded-lg">
                      <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-200 mb-3">Upload CSV file to update existing customers</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <GlassButton
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full"
                        disabled={isProcessing}
                      >
                        {isProcessing ? 'Processing...' : 'Choose CSV File'}
                      </GlassButton>
                    </div>
                    
                    <div className="space-y-2">
                      <GlassButton
                        onClick={downloadTemplate}
                        variant="outline"
                        className="w-full"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Template
                      </GlassButton>
                    </div>
                  </div>
                )}

                {/* Preview Section */}
                {currentStep === 'preview' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">Preview</h3>
                      <GlassButton
                        onClick={toggleShowMatchedOnly}
                        variant="outline"
                        size="sm"
                      >
                        {showMatchedOnly ? 'Show All' : 'Show Matched Only'}
                      </GlassButton>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm text-gray-300">
                        Total: {importedData.length}
                      </div>
                      <div className="text-sm text-green-400">
                        Matched: {matchedCustomers.size}
                      </div>
                      <div className="text-sm text-yellow-400">
                        Unmatched: {importedData.length - matchedCustomers.size}
                      </div>
                    </div>
                    
                    {validationErrors.length > 0 && (
                      <div className="bg-yellow-500/20 border border-yellow-500/30 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertCircle className="w-4 h-4 text-yellow-400" />
                          <span className="text-sm font-medium text-yellow-400">
                            {validationErrors.length} Validation Errors
                          </span>
                        </div>
                        <div className="text-xs text-yellow-300 max-h-32 overflow-y-auto">
                          {validationErrors.slice(0, 5).map((error, index) => (
                            <div key={index} className="mb-1">• {error}</div>
                          ))}
                          {validationErrors.length > 5 && (
                            <div className="text-yellow-400">... and {validationErrors.length - 5} more</div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <GlassButton
                      onClick={handleImport}
                      className="w-full"
                      disabled={matchedCustomers.size === 0 || isImporting}
                    >
                      {isImporting ? 'Updating...' : `Update ${matchedCustomers.size} Customers`}
                    </GlassButton>
                  </div>
                )}

                {/* Import Results Section */}
                {currentStep === 'import' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Import Results</h3>
                    
                    <div className="space-y-2">
                      <div className="text-sm text-green-400">
                        Updated: {importResults.filter(r => r.success).length}
                      </div>
                      <div className="text-sm text-yellow-400">
                        Skipped: {importResults.filter(r => r.skipped).length}
                      </div>
                      <div className="text-sm text-red-400">
                        Errors: {importResults.filter(r => !r.success && !r.skipped).length}
                      </div>
                    </div>
                    
                    <GlassButton
                      onClick={handleClose}
                      className="w-full"
                    >
                      Close
                    </GlassButton>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 overflow-hidden">
            {/* Progress Bar */}
            {isImporting && (
              <div className="p-4 border-b border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="flex-1 bg-white/10 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                                          <span className="text-sm text-gray-300">{Math.round(importProgress)}%</span>
                </div>
              </div>
            )}

            {/* Content Area */}
            <div className="h-full overflow-y-auto p-6">
              {currentStep === 'upload' && (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Update Existing Customers
                  </h3>
                  <p className="text-gray-300 max-w-md mx-auto">
                    Upload a CSV file to update existing customer records. 
                    Only null fields in existing customers will be updated.
                  </p>
                </div>
              )}

              {currentStep === 'preview' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-white">
                      Preview ({visibleCustomers.length} customers)
                    </h3>
                    <button
                      onClick={() => setSidebarOpen(!sidebarOpen)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      {sidebarOpen ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  {/* Customer Preview Table */}
                  <div className="bg-white/5 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-white/10">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-200">Name</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-200">Phone</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-200">Email</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-200">City</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-200">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {visibleCustomers.map((customer, index) => {
                            const existingCustomer = matchedCustomers.get(customer.phone);
                            const canUpdate = existingCustomer ? canUpdateCustomer(customer, existingCustomer) : false;
                            
                            return (
                              <tr key={index} className="hover:bg-white/5">
                                <td className="px-4 py-3 text-sm text-white">
                                  {customer.name}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-300">
                                  {customer.phone}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-300">
                                  {customer.email || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-300">
                                  {customer.city || '-'}
                                </td>
                                <td className="px-4 py-3">
                                  {existingCustomer ? (
                                    canUpdate ? (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Will Update
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
                                        <SkipForward className="w-3 h-3 mr-1" />
                                        No Updates
                                      </span>
                                    )
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                                      <AlertCircle className="w-3 h-3 mr-1" />
                                      No Match
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 'import' && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-white">Import Results</h3>
                  
                  {/* Results Table */}
                  <div className="bg-white/5 rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-white/10">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-200">Row</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-200">Customer</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-200">Status</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-200">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {importResults.map((result, index) => (
                            <tr key={index} className="hover:bg-white/5">
                              <td className="px-4 py-3 text-sm text-gray-300">
                                {result.rowNumber}
                              </td>
                              <td className="px-4 py-3 text-sm text-white">
                                {result.existingCustomer?.name || 'Unknown'}
                              </td>
                              <td className="px-4 py-3">
                                {result.success ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Updated
                                  </span>
                                ) : result.skipped ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
                                    <SkipForward className="w-3 h-3 mr-1" />
                                    Skipped
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    Error
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-300">
                                {result.error || result.reason || 'Success'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default CustomerUpdateImportModal;