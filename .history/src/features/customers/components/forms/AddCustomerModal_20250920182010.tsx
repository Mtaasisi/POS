import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, UserPlus, Sparkles, CheckCircle } from 'lucide-react';
import { useCustomers } from '../../../../context/CustomersContext';
import { toast } from 'react-hot-toast';
import CustomerForm from './CustomerForm';
import { Customer } from '../../../../types';
import { SoundManager } from '../../../../lib/soundUtils';
import { formatTanzaniaPhoneNumber, formatTanzaniaWhatsAppNumber } from '../../../../lib/phoneUtils';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerCreated?: (customer: Customer) => void;
}

const AddCustomerModal: React.FC<AddCustomerModalProps> = ({ isOpen, onClose, onCustomerCreated }) => {
  const { addCustomer } = useCustomers();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Use centralized phone formatting functions
  const formatPhoneNumber = formatTanzaniaPhoneNumber;
  const formatWhatsAppNumber = formatTanzaniaWhatsAppNumber;

  const handleCustomerCreated = async (customerData: any) => {
    try {
      setIsLoading(true);
      
      // Map CustomerFormValues to the expected Customer format
      const customerPayload = {
        name: customerData.name,
        phone: formatPhoneNumber(customerData.phone),
        email: '', // Email field removed from UI but still required by type
        gender: customerData.gender,
        city: customerData.city,
        whatsapp: formatWhatsAppNumber(customerData.whatsapp || ''),
        referralSource: customerData.referralSource,
        birthMonth: customerData.birthMonth,
        birthDay: customerData.birthDay,
        notes: [], // Initialize empty notes array
        // These fields will be set by the addCustomer function
        loyaltyLevel: 'bronze' as const,
        colorTag: customerData.customerTag,
        referrals: [],
        totalSpent: 0,
        points: 0,
        lastVisit: new Date().toISOString(),
        isActive: true,
        devices: [],
      };
      
      const customer = await addCustomer(customerPayload);
      
      if (customer) {
        setIsSuccess(true);
        SoundManager.playSuccessSound();
        toast.success('Customer created successfully!');
        
        // Auto-close after success animation
        setTimeout(() => {
          if (onCustomerCreated) {
            onCustomerCreated(customer);
          }
          setIsSuccess(false);
          onClose();
        }, 2000);
      } else {
        toast.error('Failed to create customer. Please try again.');
      }
    } catch (error) {
      console.error('AddCustomerModal: Unexpected error:', error);
      toast.error('Failed to create customer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes successPulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        
        .modal-enter {
          animation: slideInUp 0.3s ease-out;
        }
        
        .success-animation {
          animation: successPulse 0.6s ease-in-out;
        }
        
        .fade-in {
          animation: fadeIn 0.2s ease-out;
        }
        
        .glass-effect {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .gradient-border {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2px;
          border-radius: 20px;
        }
        
        .gradient-border > div {
          background: rgba(255, 255, 255, 0.98);
          border-radius: 18px;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #667eea, #764ba2);
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #5a6fd8, #6a4190);
        }
      `}</style>
      
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="modal-enter gradient-border w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
          <div className="glass-effect rounded-t-[18px] flex-1 flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="flex-shrink-0 relative bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-white/30">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-indigo-500/5 to-purple-500/5"></div>
              <div className="relative flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                    {isSuccess ? (
                      <CheckCircle className="w-6 h-6 text-white success-animation" />
                    ) : (
                      <UserPlus className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                      {isSuccess ? 'Customer Created!' : 'Add New Customer'}
                    </h2>
                    <p className="text-gray-600 mt-1 text-sm">
                      {isSuccess ? 'Customer has been added successfully' : 'Enter customer details to add them to your system'}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="p-3 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-6 h-6 text-red-500" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {isSuccess ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mb-6 success-animation">
                    <CheckCircle className="w-12 h-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Customer Added Successfully!</h3>
                  <p className="text-gray-600 max-w-md">
                    The new customer has been added to your system and will appear in your customer list.
                  </p>
                  <div className="mt-6 flex items-center gap-2 text-sm text-gray-500">
                    <Sparkles className="w-4 h-4" />
                    <span>This window will close automatically</span>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <CustomerForm
                    onSubmit={handleCustomerCreated}
                    onCancel={onClose}
                    isLoading={isLoading}
                    renderActionsInModal={false}
                  >
                    {(actions, formFields) => (
                      <div className="space-y-6">
                        {formFields}
                        
                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-6 border-t border-gray-200">
                          <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLoading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                Adding Customer...
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-4 h-4" />
                                Add Customer
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </CustomerForm>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddCustomerModal; 