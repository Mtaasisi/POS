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