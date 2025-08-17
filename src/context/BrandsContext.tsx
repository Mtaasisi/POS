import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Brand, getActiveBrands, searchBrands, getBrandsByCategory } from '../lib/brandApi';
import { toast } from 'react-hot-toast';

interface BrandsContextType {
  brands: Brand[];
  loading: boolean;
  error: string | null;
  refreshBrands: () => Promise<void>;
  searchBrandsByName: (query: string) => Promise<Brand[]>;
  getBrandsByCategory: (category: string) => Promise<Brand[]>;
  getBrandById: (id: string) => Brand | undefined;
  getBrandByName: (name: string) => Brand | undefined;
}

const BrandsContext = createContext<BrandsContextType | undefined>(undefined);

interface BrandsProviderProps {
  children: ReactNode;
}

export const BrandsProvider: React.FC<BrandsProviderProps> = ({ children }) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshBrands = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getActiveBrands();
      setBrands(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch brands');
      toast.error('Failed to load brands');
      console.error('Error fetching brands:', err);
    } finally {
      setLoading(false);
    }
  };

  const searchBrandsByName = async (query: string): Promise<Brand[]> => {
    try {
      if (query.trim().length < 2) {
        return brands;
      }
      return await searchBrands(query);
    } catch (err: any) {
      console.error('Error searching brands:', err);
      // Fallback to local search
      return brands.filter(brand => 
        brand.name.toLowerCase().includes(query.toLowerCase())
      );
    }
  };

  const getBrandsByCategory = async (category: string): Promise<Brand[]> => {
    try {
      return await getBrandsByCategory(category);
    } catch (err: any) {
      console.error('Error fetching brands by category:', err);
      // Fallback to local filter
      return brands.filter(brand => 
        brand.category?.includes(category)
      );
    }
  };

  const getBrandById = (id: string): Brand | undefined => {
    return brands.find(brand => brand.id === id);
  };

  const getBrandByName = (name: string): Brand | undefined => {
    return brands.find(brand => brand.name.toLowerCase() === name.toLowerCase());
  };

  useEffect(() => {
    refreshBrands();
  }, []);

  const value: BrandsContextType = {
    brands,
    loading,
    error,
    refreshBrands,
    searchBrandsByName,
    getBrandsByCategory,
    getBrandById,
    getBrandByName,
  };

  return (
    <BrandsContext.Provider value={value}>
      {children}
    </BrandsContext.Provider>
  );
};

export const useBrands = (): BrandsContextType => {
  const context = useContext(BrandsContext);
  if (context === undefined) {
    throw new Error('useBrands must be used within a BrandsProvider');
  }
  return context;
};
