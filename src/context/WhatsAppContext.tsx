import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

interface WhatsAppInstance {
  id: string;
  user_id: string;
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
  refreshInstances: () => Promise<void>;
  updateStatusesDebounced: () => void;
}

const WhatsAppContext = createContext<WhatsAppContextType | undefined>(undefined);

export const useWhatsApp = () => {
  const context = useContext(WhatsAppContext);
  if (context === undefined) {
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

  const fetchInstances = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check database connection first
      if (!supabase) {
        throw new Error('Database connection not available. Please check your internet connection and try again.');
      }

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Authentication error:', userError);
        throw new Error(`Authentication error: ${userError.message}. Please log in again.`);
      }
      
      if (!user) {
        throw new Error('User not authenticated. Please log in again.');
      }

      console.log(`🔍 Fetching WhatsApp instances for user: ${user.id}`);

      const { data, error } = await supabase
        .from('whatsapp_instances_comprehensive')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        throw new Error(`Database error: ${error.message}. Please try again or contact support.`);
      }

      console.log(`✅ Successfully fetched ${data?.length || 0} WhatsApp instances`);
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
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Authentication error. Please log in again.');
      }

      const { error } = await supabase
        .from('whatsapp_instances_comprehensive')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('instance_id', instanceId)
        .eq('user_id', user.id);

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
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Authentication error. Please log in again.');
      }

      const { error } = await supabase
        .from('whatsapp_instances_comprehensive')
        .insert({
          ...instance,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw new Error(`Failed to add instance: ${error.message}`);
      }

      // Refresh instances to get new data
      await fetchInstances();
    } catch (err: any) {
      setError(err.message);
      console.error('Error adding WhatsApp instance:', err);
      throw err;
    }
  };

  const deleteInstance = async (instanceId: string) => {
    try {
      setError(null);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Authentication error. Please log in again.');
      }

      const { error } = await supabase
        .from('whatsapp_instances_comprehensive')
        .delete()
        .eq('instance_id', instanceId)
        .eq('user_id', user.id);

      if (error) {
        throw new Error(`Failed to delete instance: ${error.message}`);
      }

      // Refresh instances to get updated data
      await fetchInstances();
    } catch (err: any) {
      setError(err.message);
      console.error('Error deleting WhatsApp instance:', err);
      throw err;
    }
  };

  const refreshInstances = async () => {
    await fetchInstances();
  };

  // Update instance statuses by checking their actual connection status
  const updateInstanceStatuses = async (instances: WhatsAppInstance[]) => {
    try {
      console.log('🔄 Updating instance statuses in background...');
      
      for (const instance of instances) {
        try {
          // Simple status check - we'll implement this when we have the API service ready
          console.log(`⏱️ Checking status for instance: ${instance.instance_id}`);
          
          // For now, we'll just update the last_activity_at timestamp
          // Use skipRefresh=true to prevent infinite loop
          await updateInstance(instance.instance_id, {
            last_activity_at: new Date().toISOString()
          }, true);
          
        } catch (instanceError) {
          console.warn(`⚠️ Failed to update status for instance ${instance.instance_id}:`, instanceError);
          // Continue with other instances even if one fails
        }
      }
      
      console.log('✅ Instance status update completed');
    } catch (error) {
      console.error('❌ Error updating instance statuses:', error);
    }
  };

  // Debounced status update to prevent excessive calls
  const statusUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const updateStatusesDebounced = useCallback(() => {
    // Clear any existing timeout
    if (statusUpdateTimeoutRef.current) {
      clearTimeout(statusUpdateTimeoutRef.current);
    }
    
    // Set a new timeout for 2 seconds
    statusUpdateTimeoutRef.current = setTimeout(() => {
      if (instances.length > 0) {
        console.log('🚀 Running debounced status update...');
        updateInstanceStatuses(instances);
      }
    }, 2000);
  }, [instances]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (statusUpdateTimeoutRef.current) {
        clearTimeout(statusUpdateTimeoutRef.current);
      }
    };
  }, []);

  // Load instances on mount
  useEffect(() => {
    fetchInstances();
  }, []);

  const value: WhatsAppContextType = {
    instances,
    loading,
    error,
    fetchInstances,
    updateInstance,
    addInstance,
    deleteInstance,
    refreshInstances,
    updateStatusesDebounced
  };

  return (
    <WhatsAppContext.Provider value={value}>
      {children}
    </WhatsAppContext.Provider>
  );
};
