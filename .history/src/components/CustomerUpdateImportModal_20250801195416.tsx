import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Download, AlertCircle, CheckCircle, UserPlus, FileText, Info, Shield, SkipForward, Eye, EyeOff, RefreshCw } from 'lucide-react';
import GlassCard from './ui/GlassCard';
import GlassButton from './ui/GlassButton';
import { Customer } from '../types';
import { toast } from 'react-hot-toast';
import { updateCustomerInDb, fetchAllCustomers } from '../lib/customerApi';
import { useAuth } from '../context/AuthContext';
import { formatTanzaniaPhoneNumber, formatTanzaniaWhatsAppNumber } from '../lib/phoneUtils';

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