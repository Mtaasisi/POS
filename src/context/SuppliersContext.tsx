import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Supplier, getActiveSuppliers, searchSuppliers, getSuppliersByCountry } from '../lib/supplierApi';
import { toast } from 'react-hot-toast';

interface SuppliersContextType {
  suppliers: Supplier[];
  loading: boolean;
  error: string | null;
  refreshSuppliers: () => Promise<void>;
  searchSuppliersByName: (query: string) => Promise<Supplier[]>;
  getSuppliersByCountry: (country: string) => Promise<Supplier[]>;
  getSupplierById: (id: string) => Supplier | undefined;
  getSupplierByName: (name: string) => Supplier | undefined;
}

const SuppliersContext = createContext<SuppliersContextType | undefined>(undefined);

interface SuppliersProviderProps {
  children: ReactNode;
}

export const SuppliersProvider: React.FC<SuppliersProviderProps> = ({ children }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getActiveSuppliers();
      setSuppliers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch suppliers');
      toast.error('Failed to load suppliers');
      console.error('Error fetching suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchSuppliersByName = async (query: string): Promise<Supplier[]> => {
    try {
      if (query.trim().length < 2) {
        return suppliers;
      }
      return await searchSuppliers(query);
    } catch (err: any) {
      console.error('Error searching suppliers:', err);
      // Fallback to local search
      return suppliers.filter(supplier => 
        supplier.name.toLowerCase().includes(query.toLowerCase()) ||
        supplier.company_name?.toLowerCase().includes(query.toLowerCase()) ||
        supplier.contact_person?.toLowerCase().includes(query.toLowerCase())
      );
    }
  };

  const getSuppliersByCountry = async (country: string): Promise<Supplier[]> => {
    try {
      return await getSuppliersByCountry(country);
    } catch (err: any) {
      console.error('Error fetching suppliers by country:', err);
      // Fallback to local filter
      return suppliers.filter(supplier => 
        supplier.country === country
      );
    }
  };

  const getSupplierById = (id: string): Supplier | undefined => {
    return suppliers.find(supplier => supplier.id === id);
  };

  const getSupplierByName = (name: string): Supplier | undefined => {
    return suppliers.find(supplier => supplier.name.toLowerCase() === name.toLowerCase());
  };

  useEffect(() => {
    refreshSuppliers();
  }, []);

  const value: SuppliersContextType = {
    suppliers,
    loading,
    error,
    refreshSuppliers,
    searchSuppliersByName,
    getSuppliersByCountry,
    getSupplierById,
    getSupplierByName,
  };

  return (
    <SuppliersContext.Provider value={value}>
      {children}
    </SuppliersContext.Provider>
  );
};

export const useSuppliers = (): SuppliersContextType => {
  const context = useContext(SuppliersContext);
  if (context === undefined) {
    throw new Error('useSuppliers must be used within a SuppliersProvider');
  }
  return context;
};
