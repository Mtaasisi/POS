import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Download, AlertCircle, CheckCircle, UserPlus, FileText, Info, Shield, SkipForward, Eye, EyeOff } from 'lucide-react';
import GlassCard from './ui/GlassCard';
import GlassButton from './ui/GlassButton';
import { Customer } from '../types';
import { toast } from 'react-hot-toast';
import { addCustomerToDb } from '../lib/customerApi';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { formatTanzaniaPhoneNumber, formatTanzaniaWhatsAppNumber } from '../lib/phoneUtils';

interface EnhancedExcelImportModalProps {
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
  // Additional fields for complete customer data
  locationDescription?: string;
  nationalId?: string;
  referredBy?: string;
  totalSpent?: number;
  points?: number;
  isActive?: boolean;
  profileImage?: string;
}

interface ImportResult {
  success: boolean;
  customer?: Customer;
  error?: string;
  rowNumber: number;
  skipped?: boolean;
  reason?: string;
}

interface ColumnMapping {
  name: string[];
  phone: string[];
  whatsapp: string[];
  gender: string[];
  city: string[];
  notes: string[];
  loyaltyLevel: string[];
  colorTag: string[];
  birthMonth: string[];
  birthDay: string[];
  referralSource: string[];
  referralSourceCustom: string[];
  locationDescription: string[];
  nationalId: string[];
  referredBy: string[];
  totalSpent: string[];
  points: string[];
  isActive: string[];
  profileImage: string[];
  birthday: string[];
}

const EnhancedExcelImportModal: React.FC<EnhancedExcelImportModalProps> = ({
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
  const [existingCustomers, setExistingCustomers] = useState<Map<string, any>>(new Map());
  const [showAllCustomers, setShowAllCustomers] = useState(true);
  const [visibleCustomers, setVisibleCustomers] = useState<ImportedCustomer[]>([]);
  const [duplicatePhoneErrors, setDuplicatePhoneErrors] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<{row: number, field: string} | null>(null);
  const [editValue, setEditValue] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [detectedColumns, setDetectedColumns] = useState<{[key: string]: number}>({});
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    name: ['name', 'full name', 'customer name', 'first name', 'client name', 'customer', 'client', 'fullname', 'firstname', 'lastname', 'first name', 'last name'],
    phone: ['phone', 'phone number', 'mobile', 'mobile phone', 'primary phone', 'phone 1 - value', 'contact', 'contact number', 'telephone', 'tel', 'cell', 'cell phone', 'mobile number'],
    whatsapp: ['whatsapp', 'whatsapp number', 'whats app', 'whatsapp phone', 'wa', 'whatsapp contact'],
    gender: ['gender', 'sex', 'male/female', 'm/f', 'gender identity'],
    city: ['city', 'location', 'home city', 'business city', 'town', 'address', 'residence', 'home town', 'business town'],
    notes: ['notes', 'comments', 'remarks', 'description', 'details', 'additional info', 'extra info'],
    loyaltyLevel: ['loyalty', 'loyalty level', 'level', 'customer level', 'tier', 'membership level', 'loyalty tier'],
    colorTag: ['color tag', 'tag', 'customer tag', 'status tag', 'priority', 'category', 'type'],
    birthMonth: ['birth month', 'month', 'birthday month', 'month of birth', 'dob month'],
    birthDay: ['birth day', 'day', 'birthday day', 'day of birth', 'dob day', 'birth date'],
    referralSource: ['referral source', 'referral', 'referred by', 'referral resource', 'how did you hear', 'source', 'referrer source'],
    referralSourceCustom: ['referral source custom', 'custom referral', 'other referral', 'custom source'],
    locationDescription: ['location description', 'address', 'home address', 'business address', 'street address', 'full address', 'detailed address'],
    nationalId: ['national id', 'id number', 'national id number', 'identity number', 'id card', 'passport number'],
    referredBy: ['referred by', 'referrer', 'who referred', 'referred by name', 'referrer name'],
    totalSpent: ['total spent', 'spent', 'total amount', 'amount spent', 'total purchase', 'total value'],
    points: ['points', 'loyalty points', 'reward points', 'customer points', 'bonus points'],
    isActive: ['is active', 'active', 'status', 'customer status', 'active status'],
    profileImage: ['profile image', 'image', 'photo', 'picture', 'avatar', 'profile picture'],
    birthday: ['birthday', 'birth day', 'birth', 'birth date', 'date of birth', 'dob', 'birth date']
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use centralized phone formatting functions
  const formatPhoneNumber = formatTanzaniaPhoneNumber;
  const formatWhatsAppNumber = formatTanzaniaWhatsAppNumber;

  // Enhanced column detection function
  const detectColumns = (headers: string[]): {[key: string]: number} => {
    const detected: {[key: string]: number} = {};
    const normalizedHeaders = headers.map(h => h.trim().toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' '));
    
    // For each field type, find the best matching column
    Object.entries(columnMapping).forEach(([fieldType, possibleNames]) => {
      let bestMatch = -1;
      let bestScore = 0;
      
      normalizedHeaders.forEach((header, index) => {
        possibleNames.forEach(possibleName => {
          // Exact match gets highest score
          if (header === possibleName) {
            if (bestScore < 100) {
              bestScore = 100;
              bestMatch = index;
            }
          }
          // Contains match gets medium score
          else if (header.includes(possibleName) || possibleName.includes(header)) {
            const score = Math.min(header.length, possibleName.length) / Math.max(header.length, possibleName.length) * 80;
            if (score > bestScore) {
              bestScore = score;
              bestMatch = index;
            }
          }
          // Partial match gets lower score
          else {
            const words = possibleName.split(' ');
            const headerWords = header.split(' ');
            let matchCount = 0;
            
            words.forEach(word => {
              if (word.length > 2 && headerWords.some(hw => hw.includes(word) || word.includes(hw))) {
                matchCount++;
              }
            });
            
            if (matchCount > 0) {
              const score = (matchCount / words.length) * 60;
              if (score > bestScore) {
                bestScore = score;
                bestMatch = index;
              }
            }
          }
        });
      });
      
      if (bestMatch !== -1) {
        detected[fieldType] = bestMatch;
      }
    });
    
    return detected;
  };

  // Enhanced value extraction function
  const extractValue = (values: string[], fieldType: string, detectedColumns: {[key: string]: number}): string => {
    const columnIndex = detectedColumns[fieldType];
    if (columnIndex !== undefined && columnIndex >= 0 && columnIndex < values.length) {
      return values[columnIndex] || '';
    }
    return '';
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
      
      // Month abbreviation mapping
      const monthMap: { [key: string]: string } = {
        'jan': 'January',
        'feb': 'February',
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
    
    // Handle formats like "dec-12", "jan-15", etc.
    const reversePattern = /^([a-z]{3,})-(\d{1,2})$/;
    const reverseMatch = trimmedBirthday.match(reversePattern);
    
    if (reverseMatch) {
      const monthAbbr = reverseMatch[1];
      const day = reverseMatch[2];
      
      const monthMap: { [key: string]: string } = {
        'jan': 'January',
        'feb': 'February',
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

  // Function to normalize color tag values
  const normalizeColorTag = (colorTag: string): 'new' | 'vip' | 'complainer' | 'purchased' => {
    if (!colorTag) return 'new';
    
    const normalized = colorTag.trim().toLowerCase();
    
    // Map common variations to valid values
    const colorMap: { [key: string]: 'new' | 'vip' | 'complainer' | 'purchased' } = {
      'new': 'new',
      'vip': 'vip',
      'complainer': 'complainer',
      'purchased': 'purchased',
      'not new': 'new', // Map "not new" to "new"
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

  // Check for existing customers by phone
  const checkExistingCustomers = async (customers: ImportedCustomer[]): Promise<Map<string, any>> => {
    const existingMap = new Map<string, any>();
    
    try {
      // Get all phone numbers from the import data
      const phones = customers.map(c => formatPhoneNumber(c.phone)).filter(p => p);
      
      // Check for existing customers by phone
      if (phones.length > 0) {
        const { data: phoneMatches, error: phoneError } = await supabase
          .from('customers')
          .select('id, name, phone')
          .in('phone', phones);
        
        if (!phoneError && phoneMatches) {
          phoneMatches.forEach(customer => {
            existingMap.set(customer.phone, customer);
          });
        }
      }
      
    } catch (error) {
      console.error('Error checking existing customers:', error);
    }
    
    return existingMap;
  };

  const validateCustomerData = (customer: ImportedCustomer, rowNumber: number): string[] => {
    const errors: string[] = [];
    
    if (!customer.name?.trim()) {
      errors.push(`Row ${rowNumber}: Name is required`);
    }
    
    if (!customer.phone?.trim()) {
      errors.push(`Row ${rowNumber}: Phone number is required`);
    } else if (!/^[\+]?[0-9\s\-\(\)]{8,}$/.test(customer.phone)) {
      errors.push(`Row ${rowNumber}: Invalid phone number format`);
    }
    
    if (customer.gender && !['male', 'female', 'other'].includes(customer.gender)) {
      errors.push(`Row ${rowNumber}: Gender must be male, female, or other`);
    }
    
    if (customer.loyaltyLevel && !['bronze', 'silver', 'gold', 'platinum'].includes(customer.loyaltyLevel)) {
      errors.push(`Row ${rowNumber}: Invalid loyalty level`);
    }
    
    if (customer.birthMonth && !customer.birthDay) {
      errors.push(`Row ${rowNumber}: Birth day is required if birth month is provided`);
    }
    
    if (customer.birthDay && !customer.birthMonth) {
      errors.push(`Row ${rowNumber}: Birth month is required if birth day is provided`);
    }
    
    if (customer.birthDay) {
      const day = parseInt(customer.birthDay);
      if (isNaN(day) || day < 1 || day > 31) {
        errors.push(`Row ${rowNumber}: Birth day must be a number between 1-31`);
      }
    }
    
    return errors;
  };

  // Check for duplicate phone numbers within the Excel file
  const checkDuplicatePhonesInFile = (customers: ImportedCustomer[]): string[] => {
    const phoneMap = new Map<string, number[]>();
    const errors: string[] = [];
    
    customers.forEach((customer, index) => {
      const formattedPhone = formatPhoneNumber(customer.phone);
      if (formattedPhone) {
        if (!phoneMap.has(formattedPhone)) {
          phoneMap.set(formattedPhone, []);
        }
        phoneMap.get(formattedPhone)!.push(index + 2); // +2 because Excel rows are 1-indexed and we have header
      }
    });
    
    // Check for duplicates
    phoneMap.forEach((rows, phone) => {
      if (rows.length > 1) {
        errors.push(`Duplicate phone number "${phone}" found in rows: ${rows.join(', ')}`);
      }
    });
    
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
      
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error('File must contain at least a header row and one data row');
        return;
      }
      
      const headers = lines[0]?.split(',').map(h => h.trim()) || [];
      const detectedColumns = detectColumns(headers);
      setDetectedColumns(detectedColumns);
      
      // Show detected column mapping to user
      const detectedFields = Object.keys(detectedColumns);
      const detectedCount = detectedFields.length;
      const totalFields = Object.keys(columnMapping).length;
      
      console.log('Detected columns:', detectedColumns);
      console.log('Original headers:', headers);
      
      if (detectedCount > 0) {
        toast.success(`Intelligently detected ${detectedCount}/${totalFields} columns automatically!`);
      } else {
        toast.warning('Could not automatically detect column positions. Please check your file format.');
      }
      
      const data: ImportedCustomer[] = [];
      const errors: string[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        
        // Use intelligent column detection to extract values
        const rawName = extractValue(values, 'name', detectedColumns);
        const rawPhone = extractValue(values, 'phone', detectedColumns);
        const rawWhatsApp = extractValue(values, 'whatsapp', detectedColumns);
        const rawGender = extractValue(values, 'gender', detectedColumns);
        const rawCity = extractValue(values, 'city', detectedColumns);
        const rawNotes = extractValue(values, 'notes', detectedColumns);
        const rawLoyaltyLevel = extractValue(values, 'loyaltyLevel', detectedColumns);
        const rawColorTag = extractValue(values, 'colorTag', detectedColumns);
        const rawBirthMonth = extractValue(values, 'birthMonth', detectedColumns);
        const rawBirthDay = extractValue(values, 'birthDay', detectedColumns);
        const rawReferralSource = extractValue(values, 'referralSource', detectedColumns);
        const rawReferralSourceCustom = extractValue(values, 'referralSourceCustom', detectedColumns);
        const rawLocationDescription = extractValue(values, 'locationDescription', detectedColumns);
        const rawNationalId = extractValue(values, 'nationalId', detectedColumns);
        const rawReferredBy = extractValue(values, 'referredBy', detectedColumns);
        const rawTotalSpent = extractValue(values, 'totalSpent', detectedColumns);
        const rawPoints = extractValue(values, 'points', detectedColumns);
        const rawIsActive = extractValue(values, 'isActive', detectedColumns);
        const rawProfileImage = extractValue(values, 'profileImage', detectedColumns);
        const rawBirthday = extractValue(values, 'birthday', detectedColumns);
        
        const customer: ImportedCustomer = {
          name: formatCustomerName(rawName),
          email: '', // Email field removed from UI
          phone: formatPhoneNumber(rawPhone),
          gender: formatGender(rawGender || 'other'),
          city: formatCityName(rawCity),
          whatsapp: formatWhatsAppNumber(rawWhatsApp),
          notes: rawNotes,
          loyaltyLevel: (rawLoyaltyLevel || 'bronze') as 'bronze' | 'silver' | 'gold' | 'platinum',
          colorTag: normalizeColorTag(rawColorTag || 'new'),
          birthMonth: rawBirthMonth,
          birthDay: rawBirthDay,
          referralSource: formatReferralSource(rawReferralSource),
          referralSourceCustom: rawReferralSourceCustom,
          // Additional fields
          locationDescription: rawLocationDescription,
          nationalId: rawNationalId,
          referredBy: rawReferredBy,
          totalSpent: parseFloat(rawTotalSpent || '0') || 0,
          points: parseInt(rawPoints || '0') || 0,
          isActive: rawIsActive !== 'false', // Default to true
          profileImage: rawProfileImage
        };
        
        // Parse birthday if in "DD-MMM" or "MMM-DD" format
        if (rawBirthday) {
          const parsedBirthday = parseBirthday(rawBirthday);
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
        
        const rowErrors = validateCustomerData(customer, i + 1);
        errors.push(...rowErrors);
        
        if (customer.name && customer.phone) {
          data.push(customer);
        }
      }
      
      // Check for duplicates within the file
      const duplicatePhoneErrors = checkDuplicatePhonesInFile(data);
      
      // Combine all validation errors
      const allErrors = [...errors, ...duplicatePhoneErrors];
      
      // Check for existing customers
      const existing = await checkExistingCustomers(data);
      setExistingCustomers(existing);
      
      setValidationErrors(errors);
      setDuplicatePhoneErrors(duplicatePhoneErrors);
      setImportedData(data);
      setEditableData([...data]);
      setPreviewData(data); // Show all customers for preview
      setVisibleCustomers(data); // Initialize visible customers with all data
      setCurrentStep('preview');
      
      if (allErrors.length > 0) {
        const validationCount = errors.length;
        const duplicateCount = duplicatePhoneErrors.length;
        toast.error(`Found ${validationCount} validation errors and ${duplicateCount} duplicate entries. Please review before importing.`);
      } else {
        const existingCount = existing.size;
        const newCount = data.length - existingCount;
        toast.success(`Processed ${data.length} customers. ${newCount} new, ${existingCount} existing will be skipped.`);
      }
      
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Error processing file. Please ensure it\'s a valid CSV/Excel file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (currentUser?.role !== 'admin') {
      toast.error('Only administrators can import customers. You can view the preview and results.');
      return;
    }
    
    const dataToImport = isEditMode ? editableData : importedData;
    
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
        const formattedPhone = formatPhoneNumber(customerData.phone);
        
        // Validate this specific customer
        const rowErrors = validateCustomerData(customerData, i + 2);
        
        // Skip this row if it has validation errors
        if (rowErrors.length > 0) {
          results.push({
            success: false,
            skipped: true,
            reason: `Validation errors: ${rowErrors.join(', ')}`,
            rowNumber: i + 2
          });
          continue; // Skip to next row
        }
        
        // Check if customer already exists
        const existingByPhone = existingCustomers.get(formattedPhone);
        
        if (existingByPhone) {
          const existing = existingByPhone;
          const reason = 'Phone number already exists';
          
          results.push({
            success: false,
            skipped: true,
            reason,
            rowNumber: i + 2
          });
        } else {
          try {
            const newCustomer = await addCustomerToDb({
              id: crypto.randomUUID(),
              name: customerData.name,
              email: customerData.email,
              phone: formattedPhone,
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
              totalSpent: customerData.totalSpent || 0,
              points: customerData.points || 0,
              lastVisit: new Date().toISOString(),
              isActive: customerData.isActive !== false,
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
        }
        
        setImportProgress(((i + 1) / dataToImport.length) * 100);
        setImportResults(results);
      }
      
      const successCount = results.filter(r => r.success).length;
      const skippedCount = results.filter(r => r.skipped).length;
      const errorCount = results.filter(r => !r.success && !r.skipped).length;
      
      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} customers!`);
        onImportComplete(createdCustomers);
      }
      
      if (skippedCount > 0) {
        toast.success(`Skipped ${skippedCount} rows (validation errors or existing customers).`);
      }
      
      if (errorCount > 0) {
        toast.error(`${errorCount} customers failed to import. Check the results below.`);
      }
      
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
    setVisibleCustomers([]);
    setCurrentStep('upload');
    setIsProcessing(false);
    setIsImporting(false);
    setIsEditMode(false);
    setIsCompactView(false);
    setExpandedColumns(new Set());
    setImportProgress(0);
    setImportResults([]);
    setValidationErrors([]);
    setDuplicatePhoneErrors([]);
    setExistingCustomers(new Map());
    setShowAllCustomers(false);
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

    // Always show all customers
  const toggleShowAllCustomers = () => {
    setVisibleCustomers(importedData);
    setShowAllCustomers(true);
  };

  // Check sidebar state
  useEffect(() => {
    const checkSidebarState = () => {
      // Simple check for sidebar visibility based on common patterns
      const body = document.body;
      const hasSidebar = body.classList.contains('sidebar-open') || 
                        body.classList.contains('sidebar-visible') ||
                        document.querySelector('.sidebar:not(.hidden)') !== null;
      setSidebarOpen(hasSidebar);
    };

    // Check initially
    checkSidebarState();

    // Listen for window resize and DOM changes
    window.addEventListener('resize', checkSidebarState);
    document.addEventListener('DOMContentLoaded', checkSidebarState);

    return () => {
      window.removeEventListener('resize', checkSidebarState);
      document.removeEventListener('DOMContentLoaded', checkSidebarState);
    };
  }, []);

  // Handle cell editing
  const handleCellClick = (rowIndex: number, field: string, currentValue: string) => {
    // If already editing this cell, don't change anything
    if (editingCell?.row === rowIndex && editingCell?.field === field) {
      return;
    }
    
    // If editing a different cell, save the current edit first
    if (editingCell && (editingCell.row !== rowIndex || editingCell.field !== field)) {
      handleCellEdit(editValue);
    }
    
    setEditingCell({ row: rowIndex, field });
    setEditValue(currentValue);
    
    // Use setTimeout to ensure the input is rendered before focusing
    setTimeout(() => {
      const input = document.querySelector(`input[data-row="${rowIndex}"][data-field="${field}"], select[data-row="${rowIndex}"][data-field="${field}"], textarea[data-row="${rowIndex}"][data-field="${field}"]`) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
      if (input) {
        input.focus();
        if (input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) {
          input.setSelectionRange(input.value.length, input.value.length);
        }
      }
    }, 0);
  };

  const handleCellEdit = (newValue: string) => {
    if (editingCell) {
      const newData = [...visibleCustomers];
      const { row, field } = editingCell;
      
      if (field === 'birthday') {
        const parts = newValue.trim().split(' ');
        if (parts.length === 2) {
          newData[row].birthMonth = parts[0];
          newData[row].birthDay = parts[1];
        }
      } else if (field === 'gender') {
        if (['male', 'female', 'other'].includes(newValue.toLowerCase())) {
          newData[row].gender = newValue.toLowerCase() as 'male' | 'female' | 'other';
        }
      } else if (field === 'loyaltyLevel') {
        if (['bronze', 'silver', 'gold', 'platinum'].includes(newValue.toLowerCase())) {
          newData[row].loyaltyLevel = newValue.toLowerCase() as 'bronze' | 'silver' | 'gold' | 'platinum';
        }
      } else if (field === 'colorTag') {
        if (['new', 'vip', 'complainer', 'purchased'].includes(newValue.toLowerCase())) {
          newData[row].colorTag = newValue.toLowerCase() as 'new' | 'vip' | 'complainer' | 'purchased';
        }
      } else {
        (newData[row] as any)[field] = newValue;
      }
      
      setVisibleCustomers(newData);
      setImportedData(newData);
    }
    setEditingCell(null);
    setEditValue('');
  };

  const handleCellKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellEdit(editValue);
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  };

  if (!isOpen || !['admin', 'customer-care'].includes(currentUser?.role || '')) return null;

  return (
    <div 
      className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4 transition-all duration-300 ${
        sidebarOpen ? 'ml-0' : 'ml-0'
      }`}
      style={{ 
        marginLeft: sidebarOpen ? '280px' : '0px',
        left: sidebarOpen ? '0' : '0',
        right: '0'
      }}
    >
      <GlassCard className="w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-500" />
            Import Customers from Excel (Skip Existing)
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
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Import Features:
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>Auto-skip existing customers</strong> - Based on phone number or email</li>
                <li>• <strong>Duplicate detection</strong> - Checks for duplicate phones/emails within Excel file</li>
                <li>• <strong>Required fields:</strong> name, phone</li>
                <li>• <strong>Optional fields:</strong> email, gender, city, whatsapp, birth month/day, referral source, notes, loyalty level, color tag, location description, national id, referred by, total spent, points, is active, profile image</li>
                <li>• <strong>Tanzania phone formatting:</strong> Automatically adds +255 country code to all numbers</li>
                <li>• <strong>Validation:</strong> Checks for valid email format and required fields</li>
                <li>• <strong>Scroll to view all customers</strong> - Click "Show All Customers" to see complete list</li>
              </ul>
            </div>
          </div>
        )}

        {currentStep === 'preview' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">📈</span>
                  </div>
                  Import Summary
                </h3>
                <div className="text-sm text-gray-600 font-medium">
                  Ready to Import
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-lg border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">👥</span>
                    </div>
                    <div className="text-xs text-blue-600 font-medium">TOTAL</div>
                  </div>
                  <div className="text-3xl font-bold text-blue-600 mb-1">{importedData.length}</div>
                  <div className="text-xs text-gray-500">Customers Found</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-lg border border-yellow-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">⏭️</span>
                    </div>
                    <div className="text-xs text-yellow-600 font-medium">SKIP</div>
                  </div>
                  <div className="text-3xl font-bold text-yellow-600 mb-1">{existingCustomers.size}</div>
                  <div className="text-xs text-gray-500">Already Exist</div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-lg border border-green-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="text-xs text-green-600 font-medium">IMPORT</div>
                  </div>
                  <div className="text-3xl font-bold text-green-600 mb-1">{importedData.length - existingCustomers.size}</div>
                  <div className="text-xs text-gray-500">New Customers</div>
                </div>
              </div>
            </div>
            
            {validationErrors.length > 0 && (
              <div className="space-y-4">
                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Validation Warnings ({validationErrors.length} rows will be skipped):
                    </h4>
                    <div className="max-h-48 overflow-y-auto">
                      <ul className="text-sm text-yellow-700 space-y-1">
                        {validationErrors.map((error: string, index: number) => (
                          <li key={index} className="py-1 border-b border-yellow-100 last:border-b-0">
                            • {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-3 p-2 bg-yellow-100 rounded text-sm text-yellow-800">
                      <strong>Note:</strong> Rows with validation errors will be automatically skipped during import. 
                      Valid customers will still be imported successfully.
                    </div>
                  </div>
                )}
                

                

              </div>
            )}
            

            
            {/* Customer Data Table with Enhanced Scrolling */}
            {validationErrors.length > 0 && (
              <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Field Validation Summary:
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                    <span className="text-yellow-700">
                      Name: {validationErrors.filter(e => e.includes('Name is required')).length} missing
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                    <span className="text-yellow-700">
                      Phone: {validationErrors.filter(e => e.includes('Phone')).length} issues
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                    <span className="text-green-700">
                      Valid rows: {importedData.length - validationErrors.filter(e => e.includes('Row')).length} ready
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                    <span className="text-blue-700">
                      Total rows: {importedData.length}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
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
            
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-full">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="text-left p-3 font-medium text-gray-700">Name</th>
                      <th className="text-left p-3 font-medium text-gray-700">Phone</th>
                      <th className="text-left p-3 font-medium text-gray-700">City</th>
                      <th className="text-left p-3 font-medium text-gray-700">Gender</th>
                      <th className="text-left p-3 font-medium text-gray-700">WhatsApp</th>
                      <th className="text-left p-3 font-medium text-gray-700">Birthday</th>
                      <th className="text-left p-3 font-medium text-gray-700">Notes</th>
                      <th className="text-left p-3 font-medium text-gray-700">Loyalty</th>
                      <th className="text-left p-3 font-medium text-gray-700">Tag</th>
                      <th className="text-left p-3 font-medium text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {visibleCustomers.map((customer, index) => {
                      const formattedPhone = formatPhoneNumber(customer.phone);
                      const formattedEmail = customer.email?.toLowerCase();
                      const existingByPhone = existingCustomers.get(formattedPhone);
                      const existingByEmail = formattedEmail ? existingCustomers.get(formattedEmail) : null;
                      const isExisting = existingByPhone || existingByEmail;
                      
                      return (
                        <tr key={index} className={`hover:bg-gray-50 transition-colors ${getRowValidationErrors(customer, index).length > 0 ? 'bg-yellow-50' : ''}`}>
                          <td 
                            className={`p-3 font-medium cursor-pointer hover:bg-blue-50 relative ${
                              hasFieldError(customer, index, 'name') 
                                ? 'bg-yellow-100 border-l-4 border-yellow-500' 
                                : 'text-gray-900'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCellClick(index, 'name', customer.name);
                            }}
                            title={hasFieldError(customer, index, 'name') ? getFieldError(customer, index, 'name') : ''}
                          >
                            {hasFieldError(customer, index, 'name') && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">⚠️</span>
                              </div>
                            )}
                            {editingCell?.row === index && editingCell?.field === 'name' ? (
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={handleCellKeyDown}
                                onBlur={() => handleCellEdit(editValue)}
                                className="w-full h-full bg-transparent border-none outline-none text-sm font-medium text-gray-900 p-0 m-0"
                                style={{ fontSize: 'inherit', fontFamily: 'inherit', lineHeight: 'inherit' }}
                                data-row={index}
                                data-field="name"
                                autoFocus
                              />
                            ) : (
                              <span className={hasFieldError(customer, index, 'name') ? 'text-yellow-800' : ''}>
                                {customer.name || (hasFieldError(customer, index, 'name') ? '⚠️ Required' : '')}
                              </span>
                            )}
                          </td>
                          <td 
                            className={`p-3 cursor-pointer hover:bg-blue-50 relative ${
                              hasFieldError(customer, index, 'phone') 
                                ? 'bg-yellow-100 border-l-4 border-yellow-500' 
                                : 'text-gray-700'
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCellClick(index, 'phone', customer.phone);
                            }}
                            title={hasFieldError(customer, index, 'phone') ? getFieldError(customer, index, 'phone') : ''}
                          >
                            {hasFieldError(customer, index, 'phone') && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">⚠️</span>
                              </div>
                            )}
                            {editingCell?.row === index && editingCell?.field === 'phone' ? (
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={handleCellKeyDown}
                                onBlur={() => handleCellEdit(editValue)}
                                className="w-full h-full bg-transparent border-none outline-none text-sm text-gray-700 p-0 m-0"
                                style={{ fontSize: 'inherit', fontFamily: 'inherit', lineHeight: 'inherit' }}
                                data-row={index}
                                data-field="phone"
                                autoFocus
                              />
                            ) : (
                              <span className={hasFieldError(customer, index, 'phone') ? 'text-yellow-800' : ''}>
                                {customer.phone || (hasFieldError(customer, index, 'phone') ? '⚠️ Required' : '')}
                              </span>
                            )}
                          </td>
                          <td 
                            className="p-3 text-gray-700 cursor-pointer hover:bg-blue-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCellClick(index, 'city', customer.city || '');
                            }}
                          >
                            {editingCell?.row === index && editingCell?.field === 'city' ? (
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={handleCellKeyDown}
                                onBlur={() => handleCellEdit(editValue)}
                                className="w-full h-full bg-transparent border-none outline-none text-sm text-gray-700 p-0 m-0"
                                style={{ fontSize: 'inherit', fontFamily: 'inherit', lineHeight: 'inherit' }}
                                data-row={index}
                                data-field="city"
                                autoFocus
                              />
                            ) : (
                              customer.city || '-'
                            )}
                          </td>
                          <td 
                            className="p-3 text-gray-700 capitalize cursor-pointer hover:bg-blue-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCellClick(index, 'gender', customer.gender || '');
                            }}
                          >
                            {editingCell?.row === index && editingCell?.field === 'gender' ? (
                              <select
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={handleCellKeyDown}
                                onBlur={() => handleCellEdit(editValue)}
                                className="w-full h-full bg-transparent border-none outline-none text-sm text-gray-700 capitalize p-0 m-0"
                                style={{ fontSize: 'inherit', fontFamily: 'inherit', lineHeight: 'inherit' }}
                                data-row={index}
                                data-field="gender"
                                autoFocus
                              >
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                              </select>
                            ) : (
                              customer.gender || '-'
                            )}
                          </td>
                          <td 
                            className="p-3 text-gray-700 cursor-pointer hover:bg-blue-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCellClick(index, 'whatsapp', customer.whatsapp || '');
                            }}
                          >
                            {editingCell?.row === index && editingCell?.field === 'whatsapp' ? (
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={handleCellKeyDown}
                                onBlur={() => handleCellEdit(editValue)}
                                className="w-full h-full bg-transparent border-none outline-none text-sm text-gray-700 p-0 m-0"
                                style={{ fontSize: 'inherit', fontFamily: 'inherit', lineHeight: 'inherit' }}
                                data-row={index}
                                data-field="whatsapp"
                                autoFocus
                              />
                            ) : (
                              customer.whatsapp || '-'
                            )}
                          </td>
                          <td 
                            className="p-3 text-gray-700 cursor-pointer hover:bg-blue-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCellClick(index, 'birthday', customer.birthMonth && customer.birthDay ? `${customer.birthMonth} ${customer.birthDay}` : '');
                            }}
                          >
                            {editingCell?.row === index && editingCell?.field === 'birthday' ? (
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={handleCellKeyDown}
                                onBlur={() => handleCellEdit(editValue)}
                                placeholder="e.g., January 15"
                                className="w-full h-full bg-transparent border-none outline-none text-sm text-gray-700 p-0 m-0"
                                style={{ fontSize: 'inherit', fontFamily: 'inherit', lineHeight: 'inherit' }}
                                data-row={index}
                                data-field="birthday"
                                autoFocus
                              />
                            ) : (
                              customer.birthMonth && customer.birthDay ? `${customer.birthMonth} ${customer.birthDay}` : '-'
                            )}
                          </td>
                          <td 
                            className="p-3 text-gray-700 max-w-xs truncate cursor-pointer hover:bg-blue-50"
                            title={customer.notes || ''}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCellClick(index, 'notes', customer.notes || '');
                            }}
                          >
                            {editingCell?.row === index && editingCell?.field === 'notes' ? (
                              <textarea
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={handleCellKeyDown}
                                onBlur={() => handleCellEdit(editValue)}
                                className="w-full h-full bg-transparent border-none outline-none text-sm text-gray-700 p-0 m-0 resize-none"
                                style={{ fontSize: 'inherit', fontFamily: 'inherit', lineHeight: 'inherit' }}
                                data-row={index}
                                data-field="notes"
                                rows={1}
                                autoFocus
                              />
                            ) : (
                              customer.notes || '-'
                            )}
                          </td>
                          <td 
                            className="p-3 text-gray-700 capitalize cursor-pointer hover:bg-blue-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCellClick(index, 'loyaltyLevel', customer.loyaltyLevel || '');
                            }}
                          >
                            {editingCell?.row === index && editingCell?.field === 'loyaltyLevel' ? (
                              <select
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={handleCellKeyDown}
                                onBlur={() => handleCellEdit(editValue)}
                                className="w-full h-full bg-transparent border-none outline-none text-sm text-gray-700 capitalize p-0 m-0"
                                style={{ fontSize: 'inherit', fontFamily: 'inherit', lineHeight: 'inherit' }}
                                data-row={index}
                                data-field="loyaltyLevel"
                                autoFocus
                              >
                                <option value="">Select Level</option>
                                <option value="bronze">Bronze</option>
                                <option value="silver">Silver</option>
                                <option value="gold">Gold</option>
                                <option value="platinum">Platinum</option>
                              </select>
                            ) : (
                              customer.loyaltyLevel || 'bronze'
                            )}
                          </td>
                          <td 
                            className="p-3 text-gray-700 capitalize cursor-pointer hover:bg-blue-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCellClick(index, 'colorTag', customer.colorTag || '');
                            }}
                          >
                            {editingCell?.row === index && editingCell?.field === 'colorTag' ? (
                              <select
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={handleCellKeyDown}
                                onBlur={() => handleCellEdit(editValue)}
                                className="w-full h-full bg-transparent border-none outline-none text-sm text-gray-700 capitalize p-0 m-0"
                                style={{ fontSize: 'inherit', fontFamily: 'inherit', lineHeight: 'inherit' }}
                                data-row={index}
                                data-field="colorTag"
                                autoFocus
                              >
                                <option value="">Select Tag</option>
                                <option value="normal">Normal</option>
                                <option value="vip">VIP</option>
                                <option value="complainer">Complainer</option>
                                <option value="purchased">Purchased</option>
                              </select>
                            ) : (
                              customer.colorTag || 'normal'
                            )}
                          </td>
                          <td className="p-3">
                            {isExisting ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                <SkipForward className="w-3 h-3" />
                                Skip
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                <CheckCircle className="w-3 h-3" />
                                Import
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
            
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentStep('upload')}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => {
                  setCurrentStep('import');
                  // Automatically start import when clicking Continue
                  setTimeout(() => {
                    handleImport();
                  }, 100);
                }}
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
              <div className="space-y-6">
                <div className="text-center">
                  <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-2" />
                  <h3 className="text-lg font-medium mb-2">Import Complete</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Import results for {importedData.length} customers
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-800 mb-1">Imported</h4>
                    <p className="text-2xl font-bold text-green-900">
                      {importResults.filter(r => r.success).length}
                    </p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-1">Skipped</h4>
                    <p className="text-2xl font-bold text-yellow-900">
                      {importResults.filter(r => r.skipped).length}
                    </p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-medium text-red-800 mb-1">Failed</h4>
                    <p className="text-2xl font-bold text-red-900">
                      {importResults.filter(r => !r.success && !r.skipped).length}
                    </p>
                  </div>
                </div>
                
                {importResults.filter(r => r.skipped).length > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-2">Skipped Customers:</h4>
                    <div className="max-h-32 overflow-y-auto">
                      <ul className="text-sm text-yellow-700 space-y-1">
                        {importResults.filter(r => r.skipped).slice(0, 10).map((result, index) => (
                          <li key={index}>Row {result.rowNumber}: {result.reason}</li>
                        ))}
                        {importResults.filter(r => r.skipped).length > 10 && (
                          <li className="text-yellow-600">... and {importResults.filter(r => r.skipped).length - 10} more skipped</li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
                
                {importResults.filter(r => !r.success && !r.skipped).length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-medium text-red-800 mb-2">Failed Imports:</h4>
                    <div className="max-h-32 overflow-y-auto">
                      <ul className="text-sm text-red-700 space-y-1">
                        {importResults.filter(r => !r.success && !r.skipped).map((result, index) => (
                          <li key={index}>Row {result.rowNumber}: {result.error}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
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
                onClick={handleClose}
                disabled={isImporting}
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
                    Close
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

export default EnhancedExcelImportModal; 