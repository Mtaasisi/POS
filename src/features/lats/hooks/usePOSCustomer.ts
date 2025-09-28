import { useState, useCallback, useMemo } from 'react';
import { useCustomers } from '../../../context/CustomersContext';
import { matchesPhoneSearch } from '../../../lib/phoneUtils';

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  points?: number;
  totalSpent?: number;
  lastVisit?: Date;
}

interface CustomerSearchResult {
  customer: Customer;
  relevance: number;
  matchType: 'exact' | 'partial' | 'fuzzy';
}

interface LoyaltyTransaction {
  id: string;
  customerId: string;
  type: 'earned' | 'redeemed' | 'expired' | 'adjusted';
  points: number;
  reason: string;
  timestamp: Date;
  orderId?: string;
}

export const usePOSCustomer = () => {
  const { customers } = useCustomers();
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showCustomerSearchModal, setShowCustomerSearchModal] = useState(false);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [selectedCustomerForDetails, setSelectedCustomerForDetails] = useState<Customer | null>(null);
  
  // Customer loyalty state
  const [customerLoyaltyPoints, setCustomerLoyaltyPoints] = useState<{[key: string]: number}>({});
  const [customerPurchaseHistory, setCustomerPurchaseHistory] = useState<{[key: string]: any[]}>({});
  const [customerNotes, setCustomerNotes] = useState<{[key: string]: string}>({});
  const [showLoyaltyPoints, setShowLoyaltyPoints] = useState(false);
  const [pointsToAdd, setPointsToAdd] = useState('');
  const [pointsReason, setPointsReason] = useState('');

  // Search customers
  const searchCustomers = useCallback((query: string): CustomerSearchResult[] => {
    if (!query.trim()) return [];

    const searchTerm = query.toLowerCase();
    const results: CustomerSearchResult[] = [];

    customers.forEach(customer => {
      let relevance = 0;
      let matchType: 'exact' | 'partial' | 'fuzzy' = 'fuzzy';

      // Check name
      if (customer.name.toLowerCase().includes(searchTerm)) {
        relevance += 10;
        if (customer.name.toLowerCase() === searchTerm) {
          relevance += 5;
          matchType = 'exact';
        } else {
          matchType = 'partial';
        }
      }

      // Check phone with enhanced conversion logic using utility
      if (customer.phone && matchesPhoneSearch(customer.phone, searchTerm)) {
        relevance += 8;
        const cleanSearchTerm = searchTerm.replace(/[\s\-\(\)]/g, '');
        const cleanCustomerPhone = customer.phone.replace(/[\s\-\(\)]/g, '');
        if (cleanCustomerPhone === cleanSearchTerm) {
          relevance += 5;
          matchType = 'exact';
        }
      }

      // Check email
      if (customer.email && customer.email.toLowerCase().includes(searchTerm)) {
        relevance += 6;
        if (customer.email.toLowerCase() === searchTerm) {
          relevance += 5;
          matchType = 'exact';
        }
      }

      if (relevance > 0) {
        results.push({
          customer,
          relevance,
          matchType
        });
      }
    });

    // Sort by relevance
    return results.sort((a, b) => b.relevance - a.relevance);
  }, [customers]);

  // Filtered customers based on search
  const filteredCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) return customers;
    return searchCustomers(customerSearchQuery).map(result => result.customer);
  }, [customers, customerSearchQuery, searchCustomers]);

  // Select customer
  const selectCustomer = useCallback((customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCustomerSearch(false);
    setShowCustomerSearchModal(false);
    
    // Load customer data
    loadCustomerData(customer.id);
  }, []);

  // Remove selected customer
  const removeSelectedCustomer = useCallback(() => {
    setSelectedCustomer(null);
  }, []);

  // Load customer data
  const loadCustomerData = useCallback(async (customerId: string) => {
    try {
      // Load loyalty points
      const points = customerLoyaltyPoints[customerId] || 0;
      
      // Load purchase history (simulated)
      const history = customerPurchaseHistory[customerId] || [];
      
      // Load customer notes
      const notes = customerNotes[customerId] || '';
      
      console.log(`Loaded customer data for ${customerId}:`, { points, history, notes });
    } catch (error) {
      console.error('Error loading customer data:', error);
    }
  }, [customerLoyaltyPoints, customerPurchaseHistory, customerNotes]);

  // Add loyalty points
  const addLoyaltyPoints = useCallback(async (customerId: string, points: number, reason: string) => {
    try {
      const currentPoints = customerLoyaltyPoints[customerId] || 0;
      const newPoints = currentPoints + points;
      
      setCustomerLoyaltyPoints(prev => ({
        ...prev,
        [customerId]: newPoints
      }));

      // Create loyalty transaction
      const transaction: LoyaltyTransaction = {
        id: `loyalty-${Date.now()}`,
        customerId,
        type: 'earned',
        points,
        reason,
        timestamp: new Date()
      };

      console.log('Loyalty transaction created:', transaction);
      
      return { success: true, newPoints };
    } catch (error) {
      console.error('Error adding loyalty points:', error);
      return { success: false, error: 'Failed to add points' };
    }
  }, [customerLoyaltyPoints]);

  // Redeem loyalty points
  const redeemLoyaltyPoints = useCallback(async (customerId: string, points: number, reason: string) => {
    try {
      const currentPoints = customerLoyaltyPoints[customerId] || 0;
      
      if (currentPoints < points) {
        return { success: false, error: 'Insufficient points' };
      }
      
      const newPoints = currentPoints - points;
      
      setCustomerLoyaltyPoints(prev => ({
        ...prev,
        [customerId]: newPoints
      }));

      // Create loyalty transaction
      const transaction: LoyaltyTransaction = {
        id: `loyalty-${Date.now()}`,
        customerId,
        type: 'redeemed',
        points: -points,
        reason,
        timestamp: new Date()
      };

      console.log('Loyalty redemption created:', transaction);
      
      return { success: true, newPoints };
    } catch (error) {
      console.error('Error redeeming loyalty points:', error);
      return { success: false, error: 'Failed to redeem points' };
    }
  }, [customerLoyaltyPoints]);

  // Add customer note
  const addCustomerNote = useCallback((customerId: string, note: string) => {
    const currentNotes = customerNotes[customerId] || '';
    const newNotes = currentNotes ? `${currentNotes}\n${note}` : note;
    
    setCustomerNotes(prev => ({
      ...prev,
      [customerId]: newNotes
    }));
  }, [customerNotes]);

  // Get customer statistics
  const getCustomerStats = useCallback((customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    const points = customerLoyaltyPoints[customerId] || 0;
    const history = customerPurchaseHistory[customerId] || [];
    const notes = customerNotes[customerId] || '';

    return {
      customer,
      points,
      totalPurchases: history.length,
      totalSpent: history.reduce((sum, purchase) => sum + (purchase.total || 0), 0),
      notes,
      lastVisit: customer?.lastVisit
    };
  }, [customers, customerLoyaltyPoints, customerPurchaseHistory, customerNotes]);

  // Calculate points for purchase
  const calculatePointsForPurchase = useCallback((amount: number) => {
    // 1 point per 1000 TZS spent
    return Math.floor(amount / 1000);
  }, []);

  // Get customer suggestions
  const getCustomerSuggestions = useCallback((query: string, limit: number = 5) => {
    if (!query.trim()) return [];
    
    const results = searchCustomers(query);
    return results.slice(0, limit).map(result => ({
      ...result.customer,
      matchType: result.matchType,
      relevance: result.relevance
    }));
  }, [searchCustomers]);

  return {
    // State
    selectedCustomer,
    customerSearchQuery,
    showCustomerSearch,
    showCustomerSearchModal,
    showCustomerDetails,
    selectedCustomerForDetails,
    customerLoyaltyPoints,
    customerPurchaseHistory,
    customerNotes,
    showLoyaltyPoints,
    pointsToAdd,
    pointsReason,
    
    // Data
    filteredCustomers,
    
    // Actions
    setCustomerSearchQuery,
    setShowCustomerSearch,
    setShowCustomerSearchModal,
    setShowCustomerDetails,
    setSelectedCustomerForDetails,
    setShowLoyaltyPoints,
    setPointsToAdd,
    setPointsReason,
    selectCustomer,
    removeSelectedCustomer,
    addLoyaltyPoints,
    redeemLoyaltyPoints,
    addCustomerNote,
    
    // Utilities
    searchCustomers,
    getCustomerStats,
    calculatePointsForPurchase,
    getCustomerSuggestions
  };
};
