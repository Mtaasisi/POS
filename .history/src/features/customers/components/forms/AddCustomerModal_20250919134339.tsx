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
        SoundManager.playSuccessSound();
        toast.success('Customer created successfully!');
        if (onCustomerCreated) {
          onCustomerCreated(customer);
        }
        onClose();
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