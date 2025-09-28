import React, { ReactNode, useState, useEffect } from 'react';
import { User, Phone, Mail, MapPin, Tag, Check, RefreshCw, X, ArrowLeft, AlertTriangle, ChevronDown } from 'lucide-react';
// import FloatingActionBar from '../ui/FloatingActionBar';
// import { addCustomer } from '../../../services/customer.services'; // Not used in this context
import { supabase } from '../../../../lib/supabaseClient';
import { saveActionOffline } from '../../../../lib/offlineSync';
import { useDraftForm } from '../../../../lib/useDraftForm';
import { formatTanzaniaPhoneNumber, formatTanzaniaWhatsAppNumber } from '../../../lib/phoneUtils';

// Define ActionButton type for local use
export interface ActionButton {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  color?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
  disabled?: boolean;
}

// Update types to include id
type CustomerFormValues = Omit<
  {
    id?: string;
    name: string;
    phone: string;
    whatsapp: string;
    gender: 'male' | 'female';
    city: string;
    birthMonth: string;
    birthDay: string;
    referralSource: string;
    notes: string;
    referralSourceCustom?: string;
  }, 'customerTag'>;

interface CustomerFormProps {
  onSubmit: (values: CustomerFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  initialValues?: Partial<CustomerFormValues>;
  showBackAction?: boolean;
  onBack?: () => void;
  renderActionsInModal?: boolean;
  children?: (actions: ReactNode, formFields: ReactNode) => ReactNode;
}

const defaultValues: CustomerFormValues = {
  name: '',
  phone: '',
  whatsapp: '',
  gender: '' as any, // No default
  city: '',
  birthMonth: '',
  birthDay: '',
  referralSource: '',
  notes: '',
  referralSourceCustom: '' // Initialize custom referral source
};

const REFERRAL_CLICK_KEY = 'referral_source_clicks';

function getReferralClicks() {
  try {
    return JSON.parse(localStorage.getItem(REFERRAL_CLICK_KEY) || '{}');
  } catch {
    return {};
  }
}
function setReferralClicks(clicks: Record<string, number>) {
  localStorage.setItem(REFERRAL_CLICK_KEY, JSON.stringify(clicks));
}

const CustomerForm: React.FC<CustomerFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
  initialValues = {},
  showBackAction = false,
  onBack,
  renderActionsInModal = false,
  children
}) => {
  const [formData, setFormData] = useState<CustomerFormValues>({ ...defaultValues, ...initialValues });
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [hasWhatsapp, setHasWhatsapp] = useState(true);
  const [duplicateCustomers, setDuplicateCustomers] = useState<any[]>([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showDayDropdown, setShowDayDropdown] = useState(false);
  const [showReferralDropdown, setShowReferralDropdown] = useState(false);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [offlineSuccess, setOfflineSuccess] = useState(false);
  const [referralClicks, setReferralClicksState] = useState<Record<string, number>>(getReferralClicks());


  // Draft-saving hook
  const { clearDraft } = useDraftForm<CustomerFormValues>({
    key: 'customer_form_draft',
    formData,
    setFormData,
    clearOnSubmit: true,
    submitted,
  });

  // Autofill form when initialValues change (e.g., when opening edit modal)
  useEffect(() => {
    // Always set formData from initialValues when they change
    setFormData({ ...defaultValues, ...initialValues });
    // eslint-disable-next-line
  }, [JSON.stringify(initialValues)]);

  const handleReset = () => {
    setFormData({ ...defaultValues });
    clearDraft();
  };

  // Tanzania regions array
  const tanzaniaRegions = [
    'Dar es Salaam', 'Arusha', 'Mwanza', 'Dodoma', 'Mbeya', 'Tanga', 'Morogoro', 
    'Iringa', 'Tabora', 'Kigoma', 'Mara', 'Kagera', 'Shinyanga', 'Singida', 
    'Rukwa', 'Ruvuma', 'Lindi', 'Mtwara', 'Pwani', 'Manyara', 'Geita', 
    'Simiyu', 'Katavi', 'Njombe', 'Songwe'
  ];

  // Months array
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Days array (1-31)
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

  type ReferralColor = 'green' | 'orange' | 'blue' | 'pink' | 'gray' | 'teal' | 'yellow' | 'red' | 'indigo' | 'violet' | 'slate';

  interface ReferralSource {
    label: string;
    icon: React.ReactNode;
    color: ReferralColor;
  }

  const referralSources: ReferralSource[] = [
    { label: 'Friend', icon: '🤝', color: 'green' },
    { label: 'Walk-in', icon: '🚶', color: 'orange' },
    { label: 'Facebook', icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style={{ display: 'inline', verticalAlign: 'middle' }}><path d="M22.675 0h-21.35C.595 0 0 .592 0 1.326v21.348C0 23.408.595 24 1.325 24h11.495v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.406 24 24 23.408 24 22.674V1.326C24 .592 23.406 0 22.675 0"/></svg>, color: 'blue' },
    { label: 'Instagram', icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style={{ display: 'inline', verticalAlign: 'middle' }}><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.334 3.608 1.308.974.974 1.246 2.241 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.334 2.633-1.308 3.608-.974.974-2.241 1.246-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.334-3.608-1.308-.974-.974-1.246-2.241-1.308-3.608C2.175 15.647 2.163 15.267 2.163 12s.012-3.584.07-4.85c.062-1.366.334-2.633 1.308-3.608.974-.974 2.241-1.246 3.608-1.308C8.416 2.175 8.796 2.163 12 2.163zm0-2.163C8.741 0 8.332.013 7.052.072 5.771.131 4.659.363 3.678 1.344c-.98.98-1.213 2.092-1.272 3.373C2.013 5.668 2 6.077 2 9.333v5.334c0 3.256.013 3.665.072 4.946.059 1.281.292 2.393 1.272 3.373.98.98 2.092 1.213 3.373 1.272C8.332 23.987 8.741 24 12 24s3.668-.013 4.948-.072c1.281-.059 2.393-.292 3.373-1.272.98-.98 1.213-2.092 1.272-3.373.059-1.281.072-1.69.072-4.946V9.333c0-3.256-.013-3.665-.072-4.946-.059-1.281-.292-2.393-1.272-3.373-.98-.98-2.092-1.213-3.373-1.272C15.668.013 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a3.999 3.999 0 1 1 0-7.998 3.999 3.999 0 0 1 0 7.998zm6.406-11.845a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z"/></svg>, color: 'pink' },
    { label: 'Tiktok', icon: '🎵', color: 'gray' },
    { label: 'Website', icon: '🌐', color: 'teal' },
    { label: 'Business Card', icon: '💳', color: 'yellow' },
    { label: 'Newspaper', icon: '📰', color: 'gray' },
    { label: 'Google Search', icon: '🔍', color: 'red' },
    { label: 'Billboard', icon: '🏢', color: 'indigo' },
    { label: 'Event', icon: '🎫', color: 'violet' },
    { label: 'Other', icon: '❓', color: 'slate' },
  ];

  const colorMap: Record<ReferralColor, { selected: string; unselected: string }> = {
    green: {
      selected: 'bg-green-600 text-white font-semibold shadow-lg ring-2 ring-green-300',
      unselected: 'bg-green-100 text-green-700',
    },
    orange: {
      selected: 'bg-orange-600 text-white font-semibold shadow-lg ring-2 ring-orange-300',
      unselected: 'bg-orange-100 text-orange-700',
    },
    blue: {
      selected: 'bg-blue-600 text-white font-semibold shadow-lg ring-2 ring-blue-300',
      unselected: 'bg-blue-100 text-blue-700',
    },
    pink: {
      selected: 'bg-pink-600 text-white font-semibold shadow-lg ring-2 ring-pink-300',
      unselected: 'bg-pink-100 text-pink-700',
    },
    gray: {
      selected: 'bg-gray-600 text-white font-semibold shadow-lg ring-2 ring-gray-300',
      unselected: 'bg-gray-100 text-gray-700',
    },
    teal: {
      selected: 'bg-teal-600 text-white font-semibold shadow-lg ring-2 ring-teal-300',
      unselected: 'bg-teal-100 text-teal-700',
    },
    yellow: {
      selected: 'bg-yellow-500 text-white font-semibold shadow-lg ring-2 ring-yellow-200',
      unselected: 'bg-yellow-100 text-yellow-700',
    },
    red: {
      selected: 'bg-red-600 text-white font-semibold shadow-lg ring-2 ring-red-300',
      unselected: 'bg-red-100 text-red-700',
    },
    indigo: {
      selected: 'bg-indigo-600 text-white font-semibold shadow-lg ring-2 ring-indigo-300',
      unselected: 'bg-indigo-100 text-indigo-700',
    },
    violet: {
      selected: 'bg-violet-600 text-white font-semibold shadow-lg ring-2 ring-violet-300',
      unselected: 'bg-violet-100 text-violet-700',
    },
    slate: {
      selected: 'bg-slate-600 text-white font-semibold shadow-lg ring-2 ring-slate-300',
      unselected: 'bg-slate-100 text-slate-700',
    },
  };

  // Add a prop for customerId to know if we're editing
  const customerId = initialValues?.id;

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      
      // Close region dropdown
      if (showRegionDropdown && !target.closest('[data-dropdown="region"]')) {
        setShowRegionDropdown(false);
      }
      
      // Close month dropdown
      if (showMonthDropdown && !target.closest('[data-dropdown="month"]')) {
        setShowMonthDropdown(false);
      }
      
      // Close day dropdown
      if (showDayDropdown && !target.closest('[data-dropdown="day"]')) {
        setShowDayDropdown(false);
      }
      
      // Close referral dropdown
      if (showReferralDropdown && !target.closest('[data-dropdown="referral"]')) {
        setShowReferralDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showRegionDropdown, showMonthDropdown, showDayDropdown, showReferralDropdown]);

  // Check for duplicate phone numbers with enhanced error handling
  const checkDuplicatePhone = async (phone: string) => {
    if (!phone || phone.length < 10) return;
    
    setCheckingPhone(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, phone, email')
        .eq('phone', phone);
      
      if (error) {
        console.error('Error checking phone:', error);
        
        // Handle specific database errors
        if (error.code === 'PGRST116') {
          console.warn('Table not found or access denied');
          return;
        } else if (error.code === '42P01') {
          console.warn('Table does not exist');
          return;
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          console.warn('Network error during phone check');
          return;
        }
        
        // For other errors, show a user-friendly message
        setValidationErrors(prev => ({
          ...prev,
          phone: 'Unable to verify phone number. Please try again.'
        }));
        return;
      }
      
      // If editing, ignore the current customer
      const duplicates = data ? (customerId ? data.filter((c: any) => c.id !== customerId) : data) : [];
      if (duplicates.length > 0) {
        setDuplicateCustomers(duplicates);
        setShowDuplicateWarning(true);
        setValidationErrors(prev => ({
          ...prev,
          phone: customerId ? 'Another customer with this phone number already exists.' : 'A customer with this phone number already exists.'
        }));
      } else {
        setDuplicateCustomers([]);
        setShowDuplicateWarning(false);
        setValidationErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.phone;
          return newErrors;
        });
      }
    } catch (error) {
      console.error('Error checking duplicate phone:', error);
      
      // Handle network or other unexpected errors
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          console.warn('Network error during phone check');
        } else {
          console.warn('Unexpected error during phone check:', error.message);
        }
      }
    } finally {
      setCheckingPhone(false);
    }
  };

  // Debounced phone check
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.phone && formData.phone.length >= 10) {
        checkDuplicatePhone(formData.phone);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.phone]);



  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Auto-capitalize first letter for name field
    let processedValue = value;
    if (name === 'name') {
      processedValue = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
    }
    
    setFormData(prev => ({ ...prev, [name]: processedValue }));
    
    // Auto-fill WhatsApp number when phone number changes and WhatsApp is enabled
    if (name === 'phone' && hasWhatsapp) {
      setFormData(prev => ({ ...prev, whatsapp: processedValue }));
    }
    
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    
    // Enhanced validation with better error messages
    const errors: { [key: string]: string } = {};
    
    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Customer name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters long';
    } else if (formData.name.trim().length > 100) {
      errors.name = 'Name must be less than 100 characters';
    } else if (!/^[a-zA-Z\s\u00C0-\u017F]+$/.test(formData.name.trim())) {
      errors.name = 'Name can only contain letters and spaces';
    }
    
    // Phone validation
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else {
      const cleanPhone = formData.phone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        errors.phone = 'Phone number must be at least 10 digits';
      } else if (cleanPhone.length > 15) {
        errors.phone = 'Phone number must be less than 15 digits';
      } else if (!/^[0-9+\-\s()]+$/.test(formData.phone)) {
        errors.phone = 'Phone number contains invalid characters';
      }
    }
    
    // Duplicate phone check
    if (showDuplicateWarning && duplicateCustomers.length > 0) {
      errors.phone = 'A customer with this phone number already exists. Please use a different phone number.';
    }
    
    // WhatsApp validation (if enabled)
    if (hasWhatsapp && formData.whatsapp.trim()) {
      const cleanWhatsApp = formData.whatsapp.replace(/\D/g, '');
      if (cleanWhatsApp.length < 10) {
        errors.whatsapp = 'WhatsApp number must be at least 10 digits';
      } else if (cleanWhatsApp.length > 15) {
        errors.whatsapp = 'WhatsApp number must be less than 15 digits';
      }
    }
    
    // Gender validation
    if (!formData.gender) {
      errors.gender = 'Please select customer gender';
    }
    
    // City validation (optional but with length check)
    if (formData.city && formData.city.length > 100) {
      errors.city = 'City name must be less than 100 characters';
    }
    
    // Notes validation (optional but with length check)
    if (formData.notes && formData.notes.length > 500) {
      errors.notes = 'Notes must be less than 500 characters';
    }
    
    // Show validation errors if any
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      
      // Scroll to first error field
      const firstErrorField = Object.keys(errors)[0];
      const errorElement = document.querySelector(`[name="${firstErrorField}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (errorElement as HTMLElement).focus();
      }
      
      return;
    }
    
    // Prevent multiple submissions
    if (isLoading) {
      return;
    }
    
    try {
      if (navigator.onLine) {
        await onSubmit(formData);
        setSubmitted(true); // Clear draft on successful submit
      } else {
        await saveActionOffline({ type: 'submitData', payload: formData });
        setOfflineSuccess(true);
        setFormData({ ...defaultValues });
        setTimeout(() => setOfflineSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      
      // Handle different types of errors
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          setValidationErrors({ 
            general: 'Network error. Please check your connection and try again.' 
          });
        } else if (error.message.includes('duplicate') || error.message.includes('unique')) {
          setValidationErrors({ 
            phone: 'A customer with this phone number already exists. Please use a different phone number.' 
          });
        } else if (error.message.includes('validation')) {
          setValidationErrors({ 
            general: 'Please check your input and try again.' 
          });
        } else {
          setValidationErrors({ 
            general: 'An unexpected error occurred. Please try again.' 
          });
        }
      } else {
        setValidationErrors({ 
          general: 'An unexpected error occurred. Please try again.' 
        });
      }
    }
  };

  const isEditMode = !!formData.id;

  // Action buttons for both modal and page
  const actionButtons = [
    showBackAction && onBack ? {
      icon: <ArrowLeft />, label: 'Back', onClick: onBack, color: 'primary',
    } : null,
    {
      icon: <X />, label: 'Cancel', onClick: onCancel, color: 'danger',
    },
    {
      icon: <RefreshCw />, label: 'Reset', onClick: handleReset, color: 'secondary',
    },
    {
      icon: isLoading ? <RefreshCw className="animate-spin" /> : <Check />, 
      label: isLoading ? (isEditMode ? 'Updating...' : 'Adding...') : (isEditMode ? 'Update Customer' : 'Add Customer'), 
      onClick: () => {}, // Submit button - onClick will be ignored, form submit handles it
      color: 'success', 
      disabled: isLoading,
    },
  ].filter(Boolean) as ActionButton[];

  // Sort referralSources by click count (desc), fallback to original order
  const sortedReferralSources = [...referralSources].sort((a, b) => {
    const ac = referralClicks[a.label] || 0;
    const bc = referralClicks[b.label] || 0;
    return bc - ac;
  });

  function handleReferralClick(label: string) {
    setFormData(prev => ({ ...prev, referralSource: label }));
    const clicks = { ...referralClicks, [label]: (referralClicks[label] || 0) + 1 };
    setReferralClicks(clicks);
    setReferralClicksState(clicks);
  }

  // Reusable form fields component
  const renderFormFields = () => (
    <div className="space-y-4">
      {/* General Error Display */}
      {validationErrors.general && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-500 flex-shrink-0" />
            <div className="text-red-700 font-medium">
              {validationErrors.general}
            </div>
          </div>
        </div>
      )}
      
      {/* Offline Success Message */}
      {offlineSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <Check size={20} className="text-green-500 flex-shrink-0" />
            <div className="text-green-700 font-medium">
              Customer data saved offline. Will sync when connection is restored.
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {/* Name */}
      <div>
        <label className="block text-gray-700 mb-2 font-medium">Name *</label>
        <div className="relative">
          <input
            type="text"
            name="name"
            value={formData.name || ''}
            onChange={handleInputChange}
            className={`w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none ${
              validationErrors.name 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-gray-300 focus:border-blue-500'
            }`}
            placeholder="Enter customer name"
            required
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
        </div>
        {validationErrors.name && (
          <div className="mt-1 text-sm text-red-600 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" />
            {validationErrors.name}
          </div>
        )}
      </div>
      {/* Phone Number */}
      <div>
        <label className="block text-gray-700 mb-2 font-medium">Phone Number *</label>
        <div className="relative">
          <input
            type="tel"
            name="phone"
            value={formData.phone || ''}
            onChange={handleInputChange}
            className={`w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none ${
              validationErrors.phone 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-gray-300 focus:border-blue-500'
            }`}
            placeholder="Enter phone number"
            required
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          {checkingPhone && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>
        {validationErrors.phone && (
          <div className="mt-1 text-sm text-red-600 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" />
            {validationErrors.phone}
          </div>
        )}
        {showDuplicateWarning && duplicateCustomers.length > 0 && (
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Existing customer found:</span>
            </div>
            {duplicateCustomers.map((customer, _index) => (
              <div key={customer.id} className="text-sm text-yellow-700">
                • {customer.name} ({customer.phone}) {customer.email && `- ${customer.email}`}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* WhatsApp */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-gray-700 font-medium">WhatsApp</label>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="hasWhatsapp"
              checked={hasWhatsapp}
              onChange={(e) => {
                setHasWhatsapp(e.target.checked);
                if (!e.target.checked) {
                  // Clear WhatsApp field when unchecked
                  setFormData(prev => ({ ...prev, whatsapp: '' }));
                } else if (formData.phone) {
                  // Auto-fill WhatsApp with phone number when checked and phone exists
                  setFormData(prev => ({ ...prev, whatsapp: formData.phone }));
                }
              }}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <label htmlFor="hasWhatsapp" className="text-sm text-gray-600">Has WhatsApp</label>
          </div>
        </div>
        <div className="relative">
          <input
            type="text"
            name="whatsapp"
            value={formData.whatsapp || ''}
            onChange={handleInputChange}
            disabled={!hasWhatsapp}
            className={`w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none ${
              validationErrors.whatsapp
                ? 'border-red-500 focus:border-red-500'
                : hasWhatsapp 
                  ? 'border-gray-300 focus:border-blue-500' 
                  : 'border-gray-200 bg-gray-50 text-gray-500'
            }`}
            placeholder={hasWhatsapp ? "Enter WhatsApp number" : "WhatsApp disabled"}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
        </div>
        {validationErrors.whatsapp && (
          <div className="mt-1 text-sm text-red-600 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" />
            {validationErrors.whatsapp}
          </div>
        )}
      </div>
      {/* Region & Gender on the same row */}
      <div className="md:col-span-1">
        <label className="block text-gray-700 mb-2 font-medium">Region</label>
        <div className="relative">
          <input
            type="text"
            name="city"
            value={formData.city || ''}
            onChange={handleInputChange}
            onFocus={() => setShowRegionDropdown(true)}
            onBlur={() => setTimeout(() => setShowRegionDropdown(false), 200)}
            className={`w-full min-h-[48px] py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none ${
              validationErrors.city 
                ? 'border-red-500 focus:border-red-500' 
                : 'border-gray-300 focus:border-blue-500'
            }`}
            placeholder="Type or select region"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
          <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
          {/* Region Dropdown */}
          {showRegionDropdown && (
            <div data-dropdown="region" className="absolute top-full left-0 right-0 mt-1 bg-white/95 backdrop-blur-md border-2 border-gray-300 rounded-lg shadow-xl z-[9999] max-h-60 overflow-y-auto">
              {tanzaniaRegions
                .filter(region => 
                  region.toLowerCase().includes(formData.city.toLowerCase()) || 
                  formData.city === ''
                )
                .map((region, _index) => (
                  <div
                    key={region}
                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, city: region }));
                      setShowRegionDropdown(false);
                    }}
                  >
                    {region}
                  </div>
                ))}
              {tanzaniaRegions.filter(region => 
                region.toLowerCase().includes(formData.city.toLowerCase()) || 
                formData.city === ''
              ).length === 0 && (
                <div className="px-4 py-3 text-gray-500">
                  No matching regions found
                </div>
              )}
            </div>
          )}
        </div>
        {validationErrors.city && (
          <div className="mt-1 text-sm text-red-600 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-500" />
            {validationErrors.city}
          </div>
        )}
      </div>
      <div className="md:col-span-1 flex flex-col justify-end">
        <label className="block text-gray-700 mb-2 font-medium">Gender <span className="text-red-500">*</span></label>
        <div className="flex gap-3">
          {[{ value: 'male', label: 'Male', icon: '👨' }, { value: 'female', label: 'Female', icon: '👩' }].map(option => {
            const isSelected = formData.gender === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, gender: option.value as 'male' | 'female' }))}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 text-sm font-medium transition-all duration-200 cursor-pointer relative
                  ${isSelected
                    ? option.value === 'male'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                      : 'bg-pink-600 text-white border-pink-600 shadow-lg'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400 hover:shadow-md'
                  }
                  focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50
                  h-[52px]`}
                style={{ userSelect: 'none' }}
              >
                <span className="text-lg">{option.icon}</span>
                <span className="font-medium">{option.label}</span>
              </button>
            );
          })}
        </div>
        {validationErrors.gender && <div className="text-red-600 text-xs mt-1">{validationErrors.gender}</div>}
      </div>
      {/* Birthday */}
      <div className="md:col-span-2">
        <label className="block text-gray-700 mb-2 font-medium">Birthday</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <input
              type="text"
              name="birthMonth"
              value={formData.birthMonth || ''}
              onChange={handleInputChange}
              onFocus={() => setShowMonthDropdown(true)}
              onBlur={() => setTimeout(() => setShowMonthDropdown(false), 200)}
              className="w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="Type or select month"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">🎂</span>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            {/* Month Dropdown */}
            {showMonthDropdown && (
              <div data-dropdown="month" className="absolute top-full left-0 right-0 mt-1 bg-white/95 backdrop-blur-md border-2 border-gray-300 rounded-lg shadow-xl z-[9999] max-h-60 overflow-y-auto">
                {months
                  .filter(month => 
                    month.toLowerCase().includes(formData.birthMonth.toLowerCase()) || 
                    formData.birthMonth === ''
                  )
                  .map((month) => (
                    <div
                      key={month}
                      className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, birthMonth: month }));
                        setShowMonthDropdown(false);
                      }}
                    >
                      {month}
                    </div>
                  ))}
                {months.filter(month => 
                  month.toLowerCase().includes(formData.birthMonth.toLowerCase()) || 
                  formData.birthMonth === ''
                ).length === 0 && (
                  <div className="px-4 py-3 text-gray-500">
                    No matching months found
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="relative">
            <input
              type="text"
              name="birthDay"
              value={formData.birthDay || ''}
              onChange={handleInputChange}
              onFocus={() => setShowDayDropdown(true)}
              onBlur={() => setTimeout(() => setShowDayDropdown(false), 200)}
              className="w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="Type or select day"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-lg">🎉</span>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            {/* Day Dropdown */}
            {showDayDropdown && (
              <div data-dropdown="day" className="absolute top-full left-0 right-0 mt-1 bg-white/95 backdrop-blur-md border-2 border-gray-300 rounded-lg shadow-xl z-[9999] max-h-60 overflow-y-auto">
                {days
                  .filter(day => 
                    day.includes(formData.birthDay) || 
                    formData.birthDay === ''
                  )
                  .map((day) => (
                    <div
                      key={day}
                      className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, birthDay: day }));
                        setShowDayDropdown(false);
                      }}
                    >
                      {day}
                    </div>
                  ))}
                {days.filter(day => 
                  day.includes(formData.birthDay) || 
                  formData.birthDay === ''
                ).length === 0 && (
                  <div className="px-4 py-3 text-gray-500">
                    No matching days found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Referral Source */}
      <div className="md:col-span-2">
        <label className="block text-gray-700 mb-4 font-semibold text-lg">How did you hear about us?</label>
        <div className="w-full">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {sortedReferralSources.map((source) => {
              const selected = formData.referralSource === source.label;
              const colorClass = colorMap[source.color][selected ? 'selected' : 'unselected'];
              return (
                <button
                  key={source.label}
                  type="button"
                  onClick={() => handleReferralClick(source.label)}
                  className={`group relative w-full flex flex-col items-center justify-center gap-2 px-4 py-6 rounded-xl text-sm transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-blue-500/30 ${
                    selected 
                      ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-400 shadow-lg scale-105' 
                      : 'bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-200 hover:border-gray-400 hover:shadow-lg hover:scale-105'
                  }`}
                  style={{ userSelect: 'none' }}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-2xl shadow-lg group-hover:scale-110 transition-transform duration-300 ${
                    selected 
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                      : colorClass.includes('green') ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
                        colorClass.includes('orange') ? 'bg-gradient-to-br from-orange-500 to-amber-600' :
                        colorClass.includes('blue') ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
                        colorClass.includes('pink') ? 'bg-gradient-to-br from-pink-500 to-rose-600' :
                        colorClass.includes('gray') ? 'bg-gradient-to-br from-gray-500 to-slate-600' :
                        colorClass.includes('teal') ? 'bg-gradient-to-br from-teal-500 to-cyan-600' :
                        colorClass.includes('yellow') ? 'bg-gradient-to-br from-yellow-500 to-amber-600' :
                        colorClass.includes('red') ? 'bg-gradient-to-br from-red-500 to-orange-600' :
                        colorClass.includes('indigo') ? 'bg-gradient-to-br from-indigo-500 to-purple-600' :
                        colorClass.includes('violet') ? 'bg-gradient-to-br from-violet-500 to-purple-600' :
                        'bg-gradient-to-br from-slate-500 to-gray-600'
                  }`}>
                    {source.icon}
                  </div>
                  <span className={`font-medium whitespace-nowrap ${
                    selected ? 'text-blue-800' : 'text-gray-700'
                  }`}>
                    {source.label}
                  </span>
                  {selected && (
                    <div className="absolute top-2 right-2 w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        {/* Show custom input if 'Other' is selected */}
        {formData.referralSource === 'Other' && (
          <div className="mt-2">
            <input
              type="text"
              name="referralSource"
              value={formData.referralSourceCustom || ''}
              onChange={e => setFormData(prev => ({ ...prev, referralSourceCustom: e.target.value }))}
              className="w-full min-h-[48px] py-3 px-4 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              placeholder="Please specify referral source"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
        )}
      </div>
      {/* Show Notes Button */}
      <div className="md:col-span-2 flex justify-end">
        {!showNotes ? (
          <button
            type="button"
            onClick={() => setShowNotes(true)}
            className="text-blue-600 hover:underline text-sm mt-2"
          >
            + Add Notes
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setShowNotes(false)}
            className="text-gray-500 hover:underline text-sm mt-2"
          >
            Hide Notes
          </button>
        )}
      </div>
      {/* Notes */}
      {showNotes && (
        <div className="md:col-span-2">
          <label className="block text-gray-700 mb-2 font-medium">Notes</label>
          <textarea
            name="notes"
            value={formData.notes || ''}
            onChange={handleInputChange}
            rows={2}
            className="w-full min-h-[48px] py-3 px-4 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
            placeholder="Additional notes"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>
      )}
    </div>
  );

  const formContent = (
    <div style={{ position: 'relative' }}>
      {offlineSuccess && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg text-center text-base font-semibold animate-fade-in">
          Customer saved offline! Will sync when you are back online.
        </div>
      )}
      <form id="customer-form" onSubmit={handleSubmit} className="space-y-6 pb-28">
        {renderFormFields()}
      </form>
      {/* Sticky action bar for standalone page and modal */}
      <div
        className="w-full"
        style={{
          position: 'sticky',
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255,255,255,0.97)',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.05)',
          padding: 16,
          display: 'flex',
          justifyContent: 'flex-end',
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          zIndex: 20,
        }}
      >
        {actionButtons.map((btn, i) => (
          <button
            key={btn.label + i}
            type={i === actionButtons.length - 1 ? 'submit' : 'button'}
            onClick={i === actionButtons.length - 1 ? (e) => {
              // For submit button, trigger form submission
              e.preventDefault();
              const form = document.getElementById('customer-form');
              if (form) {
                form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
              }
            } : btn.onClick}
            disabled={btn.disabled}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-base transition-all duration-200 shadow-sm ml-2
              ${btn.color === 'danger' ? 'bg-rose-500 text-white hover:bg-rose-600 hover:shadow-md' :
                btn.color === 'success' ? 'bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-md' :
                btn.color === 'primary' ? 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md' :
                'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'}
              ${btn.disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
              focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50`
            }
          >
            {btn.icon} {btn.label}
          </button>
        ))}
      </div>
    </div>
  );

  if (renderActionsInModal && typeof children === 'function') {
    // Create the action buttons JSX for the modal (inline, not sticky)
    const modalActions = (
      <div className="flex gap-3 w-full justify-end">
        {actionButtons.map((btn: ActionButton, i: number) => {
          const { icon, label, onClick, color, disabled } = btn;
          return (
            <button
              key={label}
              type={i === actionButtons.length - 1 ? 'submit' : 'button'}
              onClick={i === actionButtons.length - 1 ? (e) => {
                // For submit button, trigger form submission
                e.preventDefault();
                const form = document.getElementById('customer-form');
                if (form) {
                  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                }
              } : onClick}
              disabled={disabled}
              className={`flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold text-base transition-all duration-200 shadow-sm ml-2
                ${color === 'danger' ? 'bg-rose-500 text-white hover:bg-rose-600 hover:shadow-md' :
                  color === 'success' ? 'bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow-md' :
                  color === 'primary' ? 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-md' :
                  'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}
                focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50
              `}
            >
              {icon} {label}
            </button>
          );
        })}
      </div>
    );

    return children(
      modalActions,
      <form id="customer-form" onSubmit={handleSubmit} className={`space-y-6`}>
        {renderFormFields()}
      </form>
    );
  }

  return formContent;
};

export default CustomerForm; 