import React, { createContext, useContext, useState, useEffect } from 'react';
import { Customer, CustomerNote, PromoMessage, LoyaltyLevel, CustomerTag } from '../types';
import { useAuth } from './AuthContext';
import { fetchAllCustomers, addCustomerToDb, updateCustomerInDb } from '../lib/customerApi';
import { addCustomerNote, addPromoMessage } from '../lib/customerExtrasApi';
import { supabase } from '../lib/supabaseClient';

interface CustomersContextType {
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'joinedDate' | 'promoHistory' | 'payments'>) => Promise<Customer>;
  updateCustomer: (customerId: string, updates: Partial<Customer>) => Promise<boolean>;
  markCustomerAsRead: (customerId: string) => Promise<boolean>;
  addNote: (customerId: string, content: string) => Promise<boolean>;
  sendPromo: (customerId: string, promo: Omit<PromoMessage, 'id' | 'sentAt' | 'status'>) => Promise<boolean>;
  addPoints: (customerId: string, points: number, reason: string) => boolean;
  getCustomerById: (id: string) => Customer | undefined;
  getCustomersByLoyalty: (level: Customer['loyaltyLevel']) => Customer[];
  getInactiveCustomers: (days: number) => Customer[];
}

const CustomersContext = createContext<CustomersContextType | undefined>(undefined);

export const useCustomers = () => {
  const context = useContext(CustomersContext);
  if (!context) {
    throw new Error('useCustomers must be used within a CustomersProvider');
  }
  return context;
};

// Export the context for debugging
export { CustomersContext };

// Helper to count visits (assuming notes with 'checked in' or similar)
function getVisitCount(customer: Customer) {
  if (!customer || !customer.id) return 0; // Ensure id exists
  if (!customer.notes) return 0;
  return customer.notes.filter(n => n.content && n.content.toLowerCase().includes('checked in')).length;
}
// Helper to detect complaints
function hasComplaint(notes: CustomerNote[]) {
  if (!notes) return false;
  return notes.some(n => n.content && (n.content.toLowerCase().includes('complaint') || n.content.toLowerCase().includes('complain')));
}

export const CustomersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchAllCustomers()
      .then(async (fetched) => {
        // Auto-mark inactive/active
        const now = Date.now();
        const updatedCustomers = await Promise.all(fetched.map(async (customer) => {
          const lastVisit = new Date(customer.lastVisit).getTime();
          const shouldBeActive = (now - lastVisit) < 90 * 24 * 60 * 60 * 1000;
          if (customer.isActive !== shouldBeActive) {
            await updateCustomerInDb(customer.id, { isActive: shouldBeActive });
            return { ...customer, isActive: shouldBeActive, notes: customer.notes || [], promoHistory: customer.promoHistory || [], payments: customer.payments || [], devices: customer.devices || [] };
          }
          return { ...customer, notes: customer.notes || [], promoHistory: customer.promoHistory || [], payments: customer.payments || [], devices: customer.devices || [] };
        }));
        setCustomers(updatedCustomers);
      })
      .catch(console.error);
  }, []);

  const addCustomer = async (customerData: Omit<Customer, 'id' | 'joinedDate' | 'promoHistory' | 'payments'>): Promise<Customer> => {
    try {
      if (!currentUser) throw new Error('User not authenticated');
      const newCustomerId = crypto.randomUUID();
      const timestamp = new Date().toISOString();
      // Always set colorTag to 'normal' for new customers
      const newCustomer = {
        id: newCustomerId,
        name: customerData.name,
        email: customerData.email || '',
        phone: customerData.phone,
        gender: customerData.gender || 'other',
        city: customerData.city || '',
        joinedDate: timestamp,
        loyaltyLevel: 'bronze' as LoyaltyLevel,
        colorTag: 'normal' as CustomerTag, // always normal
        referredBy: customerData.referredBy || undefined,
        referrals: [],
        totalSpent: 0,
        points: 0,
        lastVisit: timestamp,
        isActive: true,
        whatsapp: customerData.whatsapp || undefined,
        referralSource: customerData.referralSource || undefined,
        birthMonth: customerData.birthMonth || undefined,
        birthDay: customerData.birthDay || undefined,
        initialNotes: typeof customerData.notes === 'string' ? customerData.notes : '',
        notes: [],
        promoHistory: [],
        payments: [],
        devices: [],
        createdBy: currentUser.id,
      };
      const dbCustomer = await addCustomerToDb(newCustomer);
      if (!dbCustomer) throw new Error('Failed to add customer to database');
      
      // Add a note about the welcome points
      try {
        const noteContent = `Welcome! 10 points awarded for new customer registration.`;
        const noteData = {
          id: crypto.randomUUID(),
          content: noteContent,
          created_by: currentUser.id,
          created_at: new Date().toISOString(),
          customer_id: newCustomerId
        };
        await supabase.from('customer_notes').insert(noteData);
      } catch (noteError) {
        console.warn('Could not add welcome note:', noteError);
      }
      
      setCustomers(prev => [
        ...prev,
        {
          ...(dbCustomer as any),
          notes: (dbCustomer as any).notes || [],
          promoHistory: (dbCustomer as any).promoHistory || [],
          payments: (dbCustomer as any).payments || [],
          devices: (dbCustomer as any).devices || []
        } as Customer
      ]);
      return {
        ...(dbCustomer as any),
        notes: (dbCustomer as any).notes || [],
        promoHistory: (dbCustomer as any).promoHistory || [],
        payments: (dbCustomer as any).payments || [],
        devices: (dbCustomer as any).devices || []
      } as Customer;
    } catch (error) {
      console.error('Error adding customer:', error);
      throw error;
    }
  };

  // Also auto-update after any updateCustomer call
  const updateCustomer = async (customerId: string, updates: Partial<Customer>): Promise<boolean> => {
    try {
      if (!currentUser) return false;
      // Fetch current customer for logic
      const current = customers.find(c => c.id === customerId);
      let newColorTag = current?.colorTag || 'normal';
      let newIsActive = current?.isActive ?? true;
      let notes = updates.notes || current?.notes || [];
      // Check for complaints
      if (hasComplaint(notes)) {
        newColorTag = 'complainer';
      } else {
        // Check visit count for VIP
        // Always pass a valid Customer object with id
        const visitCount = getVisitCount({ ...current, ...updates, notes, id: customerId } as Customer);
        if (visitCount >= 10) {
          newColorTag = 'vip';
        } else {
          newColorTag = 'normal';
        }
      }
      // Check inactivity (12 months)
      let lastVisit = updates.lastVisit || current?.lastVisit;
      if (lastVisit) {
        const lastVisitDate = new Date(lastVisit).getTime();
        const now = Date.now();
        if (now - lastVisitDate > 365 * 24 * 60 * 60 * 1000) {
          newIsActive = false;
        } else {
          newIsActive = true;
        }
      }
      // Always enforce colorTag and isActive
      const updated = await updateCustomerInDb(customerId, { ...updates, colorTag: newColorTag, isActive: newIsActive });
      if (!updated) return false;
      // Auto-mark active/inactive after update
      const now = Date.now();
      const lastVisitMs = new Date(updated.lastVisit).getTime();
      const shouldBeActive = (now - lastVisitMs) < 90 * 24 * 60 * 60 * 1000;
      let final = updated;
      if (updated.isActive !== shouldBeActive) {
        const fixed = await updateCustomerInDb(customerId, { isActive: shouldBeActive });
        final = fixed
          ? {
              ...(fixed as any),
              notes: (fixed as any).notes || [],
              promoHistory: (fixed as any).promoHistory || [],
              payments: (fixed as any).payments || [],
              devices: (fixed as any).devices || []
            }
          : {
              ...(updated as any),
              notes: (updated as any).notes || [],
              promoHistory: (updated as any).promoHistory || [],
              payments: (updated as any).payments || [],
              devices: (updated as any).devices || []
            };
      } else {
        final = {
          ...(updated as any),
          notes: (updated as any).notes || [],
          promoHistory: (updated as any).promoHistory || [],
          payments: (updated as any).payments || [],
          devices: (updated as any).devices || []
        };
      }
      setCustomers(prev => prev.map(customer => 
        customer.id === customerId 
          ? { ...customer, ...final }
          : customer
      ));
      return true;
    } catch (error) {
      console.error('Error updating customer:', error);
      return false;
    }
  };

  const markCustomerAsRead = async (customerId: string) => {
    try {
      if (!currentUser) return false;
      
      // Update the customer's read status in the database
      const success = await updateCustomerInDb(customerId, { isRead: true });
      
      if (success) {
        // Update the local state
        setCustomers(prev => prev.map(customer => 
          customer.id === customerId 
            ? { ...customer, isRead: true }
            : customer
        ));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error marking customer as read:', error);
      return false;
    }
  };

  const addNote = async (customerId: string, content: string) => {
    if (!currentUser) return false;
    const newNote: CustomerNote = {
      id: `note-${Date.now()}`,
      content,
      createdBy: currentUser.id,
      createdAt: new Date().toISOString()
    };
    const dbNote = await addCustomerNote(newNote, customerId);
    if (!dbNote) return false;
    setCustomers(prev => prev.map(customer => 
      customer.id === customerId 
        ? { ...customer, notes: [...customer.notes, dbNote] }
        : customer
    ));
    return true;
  };

  const sendPromo = async (customerId: string, promo: Omit<PromoMessage, 'id' | 'sentAt' | 'status'>) => {
    if (!currentUser) return false;
    const newPromo: PromoMessage = {
      ...promo,
      id: `promo-${Date.now()}`,
      sentAt: new Date().toISOString(),
      status: 'sent'
    };
    const dbPromo = await addPromoMessage(newPromo, customerId);
    if (!dbPromo) return false;
    setCustomers(prev => prev.map(customer => 
      customer.id === customerId 
        ? { ...customer, promoHistory: [...customer.promoHistory, dbPromo] }
        : customer
    ));
    return true;
  };

  const addPoints = (customerId: string, points: number, reason: string) => {
    if (!currentUser) return false;
    
    setCustomers(prev => prev.map(customer => 
      customer.id === customerId 
        ? { ...customer, points: customer.points + points }
        : customer
    ));

    // Add note about points
    addNote(customerId, `Added ${points} points - ${reason}`);
    
    return true;
  };

  const getCustomerById = (id: string) => {
    return customers.find(customer => customer.id === id);
  };

  const getCustomersByLoyalty = (level: Customer['loyaltyLevel']) => {
    return customers.filter(customer => customer.loyaltyLevel === level);
  };

  const getInactiveCustomers = (days: number) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return customers.filter(customer => {
      const lastVisitDate = new Date(customer.lastVisit);
      return lastVisitDate < cutoffDate;
    });
  };

  return (
    <CustomersContext.Provider value={{
      customers,
      addCustomer,
      updateCustomer,
      markCustomerAsRead,
      addNote,
      sendPromo,
      addPoints,
      getCustomerById,
      getCustomersByLoyalty,
      getInactiveCustomers
    }}>
      {children}
    </CustomersContext.Provider>
  );
};

// Add default export for better HMR support
export default CustomersProvider;