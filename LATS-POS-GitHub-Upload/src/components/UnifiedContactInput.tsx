import React, { useState, useEffect } from 'react';
import { Phone, MessageCircle, PhoneCall, Settings, Check, X } from 'lucide-react';
import { UnifiedContactService, ContactMethod, ContactPreferences } from '../lib/unifiedContactService';
import { formatTanzaniaPhoneNumber } from '../lib/phoneUtils';

interface UnifiedContactInputProps {
  value: string;
  onChange: (value: string) => void;
  onMethodChange?: (method: ContactMethod) => void;
  customerId?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showMethodSelector?: boolean;
  showPreferences?: boolean;
  label?: string;
  required?: boolean;
  error?: string;
}

interface ContactMethodOption {
  type: 'sms' | 'phone_call';
  label: string;
  icon: React.ReactNode;
  description: string;
  available: boolean;
}

const contactMethodOptions: ContactMethodOption[] = [
  {
    type: 'sms',
    label: 'SMS',
    icon: <MessageCircle size={16} className="text-blue-500" />,
    description: 'Send SMS message',
    available: true
  },
  {
    type: 'phone_call',
    label: 'Call',
    icon: <PhoneCall size={16} className="text-purple-500" />,
    description: 'Make phone call',
    available: true
  }
];

export const UnifiedContactInput: React.FC<UnifiedContactInputProps> = ({
  value,
  onChange,
  onMethodChange,
  customerId,
  placeholder = "Enter phone number",
  disabled = false,
  className = "",
  showMethodSelector = true,
  showPreferences = false,
  label = "Contact Number",
  required = false,
  error
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'sms' | 'phone_call'>('sms');
  const [showMethodMenu, setShowMethodMenu] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [contactMethods, setContactMethods] = useState<ContactMethod[]>([]);
  const [preferences, setPreferences] = useState<ContactPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);


  const unifiedContactService = UnifiedContactService.getInstance();

  useEffect(() => {
    if (customerId) {
      loadCustomerContactInfo();
    }
  }, [customerId]);



  const loadCustomerContactInfo = async () => {
    if (!customerId) return;

    try {
      setIsLoading(true);
      const contact = await unifiedContactService.getUnifiedContact(customerId);
      if (contact) {
        setContactMethods(contact.contactMethods);
        setSelectedMethod(contact.preferredMethod);
      }

      const prefs = await unifiedContactService.getContactPreferences(customerId);
      setPreferences(prefs);
    } catch (error) {
      console.error('Error loading contact info:', error);
    } finally {
      setIsLoading(false);
    }
  };



  const handleInputChange = (newValue: string) => {
    onChange(newValue);
  };

  const handleMethodSelect = (method: 'sms' | 'phone_call') => {
    setSelectedMethod(method);
    setShowMethodMenu(false);

    const contactMethod = contactMethods.find(m => m.type === method);
    if (contactMethod && onMethodChange) {
      onMethodChange(contactMethod);
    }
  };

  const formatNumberForMethod = (number: string, method: 'sms' | 'phone_call') => {
    if (!number) return number;

    switch (method) {
      case 'sms':
      case 'phone_call':
        return formatTanzaniaPhoneNumber(number);
      default:
        return number;
    }
  };

  const getMethodIcon = () => {
    const option = contactMethodOptions.find(opt => opt.type === selectedMethod);
    return option?.icon || <Phone size={16} />;
  };

  const getMethodColor = () => {
    switch (selectedMethod) {
      case 'sms':
        return 'text-blue-500';
      case 'phone_call':
        return 'text-purple-500';
      default:
        return 'text-gray-500';
    }
  };

  const handleQuickAction = async (action: 'sms' | 'call') => {
    if (!value) return;

    const formattedNumber = formatNumberForMethod(value, action);
    
    switch (action) {
      case 'sms':
        window.open(`sms:${formattedNumber}`, '_blank');
        break;
      case 'call':
        window.open(`tel:${formattedNumber}`, '_blank');
        break;
    }
  };

  const updatePreferences = async (newPreferences: Partial<ContactPreferences>) => {
    if (!customerId || !preferences) return;

    try {
      const updatedPrefs = { ...preferences, ...newPreferences };
      await unifiedContactService.updateContactPreferences(updatedPrefs);
      setPreferences(updatedPrefs);
      setShowPreferencesModal(false);
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {/* Main Input */}
        <div className="flex items-center">
          <div className="relative flex-1">
            <input
              type="tel"
              value={value}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={placeholder}
              disabled={disabled}
              className={`w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none transition-colors ${
                error 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-gray-300 focus:border-blue-500'
              } ${disabled ? 'bg-gray-50 text-gray-500' : ''}`}
              autoComplete="tel"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
              {getMethodIcon()}
            </div>
          </div>

          {/* Method Selector */}
          {showMethodSelector && (
            <div className="relative ml-2">
              <button
                type="button"
                onClick={() => setShowMethodMenu(!showMethodMenu)}
                disabled={disabled}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  showMethodMenu 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Settings size={16} className={getMethodColor()} />
              </button>

              {/* Method Menu */}
              {showMethodMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <div className="p-2 space-y-1">
                    {contactMethodOptions.map((option) => (
                      <button
                        key={option.type}
                        type="button"
                        onClick={() => handleMethodSelect(option.type)}
                        disabled={!option.available}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors ${
                          selectedMethod === option.type
                            ? 'bg-blue-50 text-blue-700'
                            : 'hover:bg-gray-50'
                        } ${!option.available ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {option.icon}
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-xs text-gray-500">{option.description}</div>
                        </div>
                        {selectedMethod === option.type && (
                          <Check size={14} className="ml-auto text-blue-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Preferences Button */}
          {showPreferences && customerId && (
            <button
              type="button"
              onClick={() => setShowPreferencesModal(true)}
              disabled={disabled}
              className="ml-2 p-3 rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors"
            >
              <Settings size={16} className="text-gray-500" />
            </button>
          )}
        </div>

        {/* Quick Action Buttons */}
        {value && (
          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={() => handleQuickAction('sms')}
              className="flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
            >
              <MessageCircle size={12} />
              SMS
            </button>
            <button
              type="button"
              onClick={() => handleQuickAction('call')}
              className="flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
            >
              <PhoneCall size={12} />
              Call
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="text-red-600 text-xs mt-1">{error}</div>
        )}
      </div>

      {/* Preferences Modal */}
      {showPreferencesModal && preferences && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">Contact Preferences</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Preferred Method</label>
                <select
                  value={preferences.preferredMethod}
                  onChange={(e) => updatePreferences({ preferredMethod: e.target.value as any })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="sms">SMS</option>
                  <option value="phone_call">Phone Call</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Enabled Methods</label>
                <div className="space-y-2">
                  {[
                    { key: 'smsEnabled', label: 'SMS' },
                    { key: 'phoneCallEnabled', label: 'Phone Calls' }
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences[key as keyof ContactPreferences] as boolean}
                        onChange={(e) => updatePreferences({ [key]: e.target.checked })}
                        className="mr-2"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Language</label>
                <select
                  value={preferences.language}
                  onChange={(e) => updatePreferences({ language: e.target.value as 'en' | 'sw' })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="en">English</option>
                  <option value="sw">Swahili</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setShowPreferencesModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowPreferencesModal(false)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
