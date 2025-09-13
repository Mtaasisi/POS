import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';

export interface WhatsAppInstance {
  id: string;
  user_id?: string;
  instance_id: string;
  api_token: string;
  instance_name?: string;
  description?: string;
  green_api_host: string;
  green_api_url?: string;
  state_instance: string;
  status: string;
  phone_number?: string;
  wid?: string;
  country_instance?: string;
  type_account?: string;
  is_active: boolean;
  last_connected_at?: string;
  last_activity_at?: string;
  profile_name?: string;
  profile_picture_url?: string;
  created_at: string;
  updated_at: string;
}

interface WhatsAppContextType {
  instances: WhatsAppInstance[];
  loading: boolean;
  error: string | null;
  fetchInstances: () => Promise<void>;
  updateInstance: (instanceId: string, updates: Partial<WhatsAppInstance>, skipRefresh?: boolean) => Promise<void>;
  addInstance: (instance: Omit<WhatsAppInstance, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  deleteInstance: (instanceId: string) => Promise<void>;
  clearError: () => void;
  isAuthenticated: boolean;
}

const WhatsAppContext = createContext<WhatsAppContextType | undefined>(undefined);

export const useWhatsApp = () => {
  const context = useContext(WhatsAppContext);
  if (!context) {
    throw new Error('useWhatsApp must be used within a WhatsAppProvider');
  }
  return context;
};

interface WhatsAppProviderProps {
  children: ReactNode;
}

export const WhatsAppProvider: React.FC<WhatsAppProviderProps> = ({ children }) => {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get authentication state from AuthContext with safety check
  let authContext;
  try {
    authContext = useAuth();
  } catch (error) {
    // If AuthContext is not available, provide fallback values
    console.warn('AuthContext not available, using fallback values');
    authContext = {
      isAuthenticated: false,
      currentUser: null,
      loading: true
    };
  }
  
  const { isAuthenticated, currentUser, loading: authLoading } = authContext;

  // Fetch instances when auth loading completes and user is authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated && currentUser) {
      fetchInstances();
    }
  }, [authLoading, isAuthenticated, currentUser]);

  const fetchInstances = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if auth is still loading
      if (authLoading) {
        console.log('🔄 Auth still loading, skipping instance fetch');
        return;
      }
      
      // Check if user is authenticated
      if (!isAuthenticated || !currentUser) {
        setError('Please log in to access WhatsApp features');
        setInstances([]);
        return;
      }
      
      // Check database connection first
      if (!supabase) {
        throw new Error('Database connection not available. Please check your internet connection and try again.');
      }


      const { data, error } = await supabase
        .from('whatsapp_instances_comprehensive')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        throw new Error(`Database error: ${error.message}. Please try again or contact support.`);
      }

      setInstances(data || []);
      
    } catch (err: any) {
      console.error('❌ Error fetching WhatsApp instances:', err);
      setError(err.message);
      setInstances([]); // Clear instances on error
    } finally {
      setLoading(false);
    }
  };

  const updateInstance = async (instanceId: string, updates: Partial<WhatsAppInstance>, skipRefresh: boolean = false) => {
    try {
      setError(null);
      
      if (!isAuthenticated || !currentUser) {
        throw new Error('Please log in to update WhatsApp instances');
      }

      const { error } = await supabase
        .from('whatsapp_instances_comprehensive')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('instance_id', instanceId)
        .eq('user_id', currentUser.id);

      if (error) {
        throw new Error(`Failed to update instance: ${error.message}`);
      }

      // Update local state immediately for better performance
      setInstances(prevInstances => 
        prevInstances.map(inst => 
          inst.instance_id === instanceId 
            ? { ...inst, ...updates, updated_at: new Date().toISOString() }
            : inst
        )
      );

      // Only refresh if not skipped (to prevent infinite loops)
      if (!skipRefresh) {
        await fetchInstances();
      }
    } catch (err: any) {
      setError(err.message);
      console.error('Error updating WhatsApp instance:', err);
      throw err;
    }
  };

  const addInstance = async (instance: Omit<WhatsAppInstance, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null);
      
      if (!isAuthenticated || !currentUser) {
        throw new Error('Please log in to create WhatsApp instances');
      }

      const { data, error } = await supabase
        .from('whatsapp_instances_comprehensive')
        .insert({
          ...instance,
          user_id: currentUser.id
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create instance: ${error.message}`);
      }

      setInstances(prevInstances => [data, ...prevInstances]);
    } catch (err: any) {
      setError(err.message);
      console.error('Error creating WhatsApp instance:', err);
      throw err;
    }
  };

  const deleteInstance = async (instanceId: string) => {
    try {
      setError(null);
      
      if (!isAuthenticated || !currentUser) {
        throw new Error('Please log in to delete WhatsApp instances');
      }

      const { error } = await supabase
        .from('whatsapp_instances_comprehensive')
        .delete()
        .eq('instance_id', instanceId)
        .eq('user_id', currentUser.id);

      if (error) {
        throw new Error(`Failed to delete instance: ${error.message}`);
      }

      setInstances(prevInstances => 
        prevInstances.filter(inst => inst.instance_id !== instanceId)
      );
    } catch (err: any) {
      setError(err.message);
      console.error('Error deleting WhatsApp instance:', err);
      throw err;
    }
  };

  const clearError = () => {
    setError(null);
  };

  // Fetch instances when authentication state changes
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      fetchInstances();
    } else {
      // Clear instances when not authenticated
      setInstances([]);
      setError(null);
    }
  }, [isAuthenticated, currentUser?.id]);

  const value: WhatsAppContextType = {
    instances,
    loading,
    error,
    fetchInstances,
    updateInstance,
    addInstance,
    deleteInstance,
    clearError,
    isAuthenticated
  };

  return (
    <WhatsAppContext.Provider value={value}>
      {children}
    </WhatsAppContext.Provider>
  );
};
