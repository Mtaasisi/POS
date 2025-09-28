import React, { useState } from 'react';
import Modal from '../../../shared/components/ui/Modal';
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

  // Use centralized phone formatting functions
  const formatPhoneNumber = formatTanzaniaPhoneNumber;
  const formatWhatsAppNumber = formatTanzaniaWhatsAppNumber;

  const handleCustomerCreated = async (customerData: any, retryCount = 0) => {
    const maxRetries = 3;
    const baseDelay = 1000;
    
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
        initialNotes: customerData.notes,
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
        SoundManager.playSuccessSound();
        toast.success('Customer created successfully!');
        if (onCustomerCreated) {
          onCustomerCreated(customer);
        }
        onClose();
      } else {
        throw new Error('Customer creation returned null');
      }
    } catch (error) {
      console.error('AddCustomerModal: Error creating customer:', error);
      
      // Handle different types of errors
      let errorMessage = 'Failed to create customer. Please try again.';
      let shouldRetry = false;
      
      if (error instanceof Error) {
        // Network errors - retry with exponential backoff
        if (error.message.includes('network') || 
            error.message.includes('fetch') || 
            error.message.includes('timeout') ||
            error.message.includes('QUIC_PROTOCOL_ERROR')) {
          shouldRetry = retryCount < maxRetries;
          errorMessage = shouldRetry 
            ? `Network error. Retrying... (${retryCount + 1}/${maxRetries})`
            : 'Network error. Please check your connection and try again.';
        }
        // Database constraint errors
        else if (error.message.includes('duplicate') || 
                 error.message.includes('unique') ||
                 error.message.includes('constraint')) {
          errorMessage = 'A customer with this phone number already exists. Please use a different phone number.';
        }
        // Authentication errors
        else if (error.message.includes('auth') || 
                 error.message.includes('unauthorized') ||
                 error.message.includes('permission')) {
          errorMessage = 'Authentication error. Please refresh the page and try again.';
        }
        // Server errors (5xx)
        else if (error.message.includes('500') || 
                 error.message.includes('502') ||
                 error.message.includes('503') ||
                 error.message.includes('504')) {
          shouldRetry = retryCount < maxRetries;
          errorMessage = shouldRetry 
            ? `Server error. Retrying... (${retryCount + 1}/${maxRetries})`
            : 'Server is temporarily unavailable. Please try again later.';
        }
        // Validation errors
        else if (error.message.includes('validation') || 
                 error.message.includes('invalid')) {
          errorMessage = 'Please check your input and try again.';
        }
      }
      
      // Show error message
      toast.error(errorMessage);
      
      // Retry logic for network and server errors
      if (shouldRetry) {
        const delay = baseDelay * Math.pow(2, retryCount); // Exponential backoff
        setTimeout(() => {
          handleCustomerCreated(customerData, retryCount + 1);
        }, delay);
        return; // Don't set loading to false yet
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CustomerForm
      onSubmit={handleCustomerCreated}
      onCancel={onClose}
      isLoading={isLoading}
      renderActionsInModal={true}
    >
      {(actions, formFields) => (
        <Modal 
          isOpen={isOpen} 
          onClose={onClose} 
          title="Add New Customer" 
          actions={actions}
          maxWidth="lg"
        >
          {formFields}
        </Modal>
      )}
    </CustomerForm>
  );
};

export default AddCustomerModal; 