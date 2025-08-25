import * as React from 'react';
import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { retryWithBackoff } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';
// Removed POSSettingsAPI import to avoid circular dependency
import { logInfo, logError, logWarn, trackInit } from '../lib/debugUtils';

// Import the inventory store for automatic product loading
import { useInventoryStore } from '../features/lats/stores/useInventoryStore';

interface AuthContextType {
  currentUser: any;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  error: string | null;
  clearError: () => void;
  loading: boolean;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export { AuthContext };

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

// Global flag to prevent multiple AuthProvider instances
let globalAuthProviderInitialized = false;

const authProviderMountCount = 0; // Static mount counter for debugging

// Helper to map Supabase user (is_active) to app User (isActive)
function mapUserFromSupabase(user: any): any {
  // Get role-based permissions
  const getRolePermissions = (role: string): string[] => {
    switch (role) {
      case 'admin':
        return ['all'];
      case 'technician':
        return ['view_devices', 'update_device_status', 'view_customers'];
      case 'customer-care':
        return ['view_customers', 'create_customers', 'edit_customers', 'view_devices', 'assign_devices'];
      default:
        return ['view_devices', 'update_device_status', 'view_customers'];
    }
  };

  return {
    ...user,
    isActive: user.is_active,
    maxDevicesAllowed: user.max_devices_allowed || 10,
    requireApproval: user.require_approval || false,
    failedLoginAttempts: user.failed_login_attempts || 0,
    twoFactorEnabled: user.two_factor_enabled || false,
    twoFactorSecret: user.two_factor_secret,
    lastLogin: user.last_login,
    permissions: user.permissions && Array.isArray(user.permissions) && user.permissions.length > 0 
      ? user.permissions 
      : getRolePermissions(user.role),
    assignedDevices: [],
    assignedCustomers: [],
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);
  const authProviderMountCount = useRef(0);
  const dataLoadedRef = useRef(false);
  
  // Expose data loaded flag globally for cache manager
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__AUTH_DATA_LOADED_FLAG__ = dataLoadedRef.current;
    }
  }, []);

  // Function to load products and other data automatically in background
  const loadInitialDataInBackground = async () => {
    // Prevent multiple data loads
    if (dataLoadedRef.current) {
      console.log('📦 Data already loaded, skipping...');
      return;
    }
    
    try {
      console.log('🚀 Starting automatic data loading in background...');
      dataLoadedRef.current = true;
      
      // Small delay to ensure UI is fully loaded first
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Load other data sources first (avoid store calls during initialization)
      const otherDataPromises = [
        loadCustomersData(),
        loadDevicesData(),
        loadSettingsData()
      ];
      
      console.log('🚀 Starting other data loading...');
      const otherResults = await Promise.allSettled(otherDataPromises);
      
      // Load inventory data after other data (to avoid initialization issues)
      try {
        const inventoryStore = useInventoryStore.getState();
        const inventoryPromises = [
          inventoryStore.loadProducts({ page: 1, limit: 50 }),
          inventoryStore.loadCategories(),
          inventoryStore.loadBrands(),
          inventoryStore.loadSuppliers()
        ];
        
        console.log('🚀 Starting inventory data loading...');
        const inventoryResults = await Promise.allSettled(inventoryPromises);
        
        // Combine results
        const results = [...otherResults, ...inventoryResults];
        
        // Count successful loads
        const successfulLoads = results.filter(result => result.status === 'fulfilled').length;
        const totalLoads = results.length;
        
        console.log(`✅ Background data loading completed: ${successfulLoads}/${totalLoads} successful`);
        
        // Background data loading completed silently
        if (successfulLoads > 0) {
          console.log(`✅ Background data loading completed: ${successfulLoads}/${totalLoads} successful`);
        }
      } catch (inventoryError) {
        console.error('❌ Error loading inventory data:', inventoryError);
        // Continue with other results even if inventory fails
        const successfulLoads = otherResults.filter(result => result.status === 'fulfilled').length;
        if (successfulLoads > 0) {
          console.log(`✅ Background data loading completed (partial): ${successfulLoads}/${otherResults.length} successful`);
        }
      }
    } catch (error) {
      console.error('❌ Error in background data loading:', error);
      // Don't throw error - this is background loading, shouldn't affect login
    }
  };

  // Helper function to load customer data
  const loadCustomersData = async () => {
    try {
      console.log('👥 Loading customer data...');
      
      // Add retry logic for customer loading
      let retryCount = 0;
      const maxRetries = 3;
      
      while (retryCount < maxRetries) {
        try {
          // Import dynamically to avoid circular dependencies
          const { fetchAllCustomers } = await import('../lib/customerApi');
          const customers = await fetchAllCustomers();
          console.log(`✅ Loaded ${customers.length} customers successfully`);
          
          return customers;
        } catch (error) {
          retryCount++;
          console.warn(`⚠️ Customer loading attempt ${retryCount} failed:`, error);
          
          if (retryCount < maxRetries) {
            console.log(`⏳ Retrying customer loading in 1 second... (${retryCount}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          } else {
            console.error('❌ All customer loading attempts failed');
            throw error;
          }
        }
      }
      
      return [];
    } catch (error) {
      console.error('❌ Error loading customers:', error);
      return [];
    }
  };

  // Helper function to load device data
  const loadDevicesData = async () => {
    try {
      console.log('📱 Loading device data...');
      // Import dynamically to avoid circular dependencies
      const { fetchAllDevices } = await import('../lib/deviceApi');
      const devices = await fetchAllDevices();
      console.log(`✅ Loaded ${devices.length} devices`);
      return devices;
    } catch (error) {
      console.error('❌ Error loading devices:', error);
      return [];
    }
  };

  // Helper function to load settings data
  const loadSettingsData = async () => {
    try {
      console.log('⚙️ Loading settings data...');
      // Import dynamically to avoid circular dependencies
      const { POSSettingsService } = await import('../lib/posSettingsApi');
      const generalSettings = await POSSettingsService.loadGeneralSettings();
      console.log('✅ Loaded general settings');
      return generalSettings;
    } catch (error) {
      console.error('❌ Error loading settings:', error);
      return null;
    }
  };

  const fetchAndSetUserProfile = async (user: any) => {
    try {
      console.log('🔍 Fetching user profile for:', user.id);
      
      // First try to fetch from auth_users table (our main table)
      let { data: profileData, error: profileError } = await supabase
        .from('auth_users')
        .select('*')
        .eq('id', user.id)
        .single();

      // If not found in auth_users table, try auth.users table
      if (profileError || !profileData) {
        console.log('User not found in auth_users table, trying auth.users table...');
        const { data: authProfileData, error: authProfileError } = await supabase
          .from('auth_users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (authProfileError || !authProfileData) {
          console.log('User not found in either table, creating default profile...');
          // Create a default user profile in the auth_users table
          const defaultProfile = {
            id: user.id,
            email: user.email,
            username: (user.email as string)?.split('@')[0] || 'user',
            name: (user.email as string)?.split('@')[0] || 'User',
            role: 'technician',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { error: insertError } = await supabase
            .from('auth_users')
            .insert([defaultProfile]);

          if (insertError) {
            console.error('Error creating default profile:', insertError);
          } else {
            console.log('Default user profile created successfully');
            profileData = defaultProfile;
          }
        } else {
          // Use the auth_users data directly
          profileData = authProfileData;
        }
      }

      if (!profileData) {
        console.log('No profile data found, setting default user');
        // Set user with default technician role if profile not found
        const defaultUser = {
          ...user,
          role: 'technician',
          name: (user.email as string)?.split('@')[0] || 'User',
          is_active: true,
          permissions: ['view_devices', 'update_device_status', 'view_customers']
        };
        setCurrentUser(defaultUser);
        setLoading(false);
        
        // Start background data loading after successful authentication
        loadInitialDataInBackground();
        return;
      }

      // Map the user data from Supabase to our app format
      const mappedUser = mapUserFromSupabase(profileData);
      console.log('✅ User profile loaded successfully:', mappedUser.name || mappedUser.email);
      console.log('🔍 User profile data:', profileData);
      console.log('🔍 Mapped user data:', mappedUser);
      setCurrentUser(mappedUser);
      setLoading(false);
      
      // Start background data loading after successful authentication
      // Moved to separate useEffect to avoid initialization issues
    } catch (err) {
      console.error('Error in fetchAndSetUserProfile:', err);
      // Set user with default technician role if there's an error
      const fallbackUser = {
        ...user,
        role: 'technician',
        name: (user.email as string)?.split('@')[0] || 'User',
        is_active: true,
        permissions: ['view_devices', 'update_device_status', 'view_customers']
      };
      setCurrentUser(fallbackUser);
      setLoading(false);
      
      // Start background data loading after successful authentication
      // Moved to separate useEffect to avoid initialization issues
    }
  };

  // Add a session refresh function
  const refreshSession = async () => {
    try {
      console.log('🔄 Attempting to refresh session...');
      
      const result = await retryWithBackoff(async () => {
        return await supabase.auth.refreshSession();
      });
      
      const { data, error } = result;
      
      if (error) {
        console.error('❌ Session refresh failed:', error);
        return false;
      }
      
      if (data.session) {
        console.log('✅ Session refreshed successfully');
        await fetchAndSetUserProfile(data.session.user);
        return true;
      } else {
        console.log('❌ No session after refresh');
        return false;
      }
    } catch (err) {
      console.error('❌ Error refreshing session:', err);
      return false;
    }
  };

  // On mount, check for Supabase session and fetch profile
  useEffect(() => {
    // Prevent multiple initializations
    if (initializedRef.current || globalAuthProviderInitialized) {
      logWarn('AuthProvider', 'Already initialized, skipping...');
      return;
    }
    
    if (!trackInit('AuthProvider')) {
      return;
    }
    
    globalAuthProviderInitialized = true;
    authProviderMountCount.current++;
    logInfo('AuthProvider', `Initializing (mount #${authProviderMountCount.current})`);
    
    const initializeAuth = async () => {
        try {
          setLoading(true);
          logInfo('AuthProvider', 'Checking for existing session...');
          
          // Get current session
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            logError('AuthProvider', 'Session error:', sessionError);
            setCurrentUser(null);
            setLoading(false);
            return;
          }
          
          if (session?.user) {
            logInfo('AuthProvider', `Found existing session for user: ${session.user.email}`);
            await fetchAndSetUserProfile(session.user);
          } else {
            logInfo('AuthProvider', 'No existing session found');
            setCurrentUser(null);
          }
          
          setLoading(false);
          initializedRef.current = true;
          logInfo('AuthProvider', 'Auth initialization complete');
        } catch (err) {
          logError('AuthProvider', 'Error initializing auth:', err);
          setCurrentUser(null);
          setLoading(false);
          initializedRef.current = true;
        }
      };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      logInfo('AuthProvider', `Auth state change: ${event}`, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session?.user) {
        logInfo('AuthProvider', `User signed in: ${session.user.email}`);
        fetchAndSetUserProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        logInfo('AuthProvider', 'User signed out');
        
        // Clear POS settings user cache
        POSSettingsAPI.clearUserCache();
        
        setCurrentUser(null);
        setLoading(false);
        dataLoadedRef.current = false; // Reset data loaded flag
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        logInfo('AuthProvider', `Token refreshed for user: ${session.user.email}`);
        // Don't refetch profile on token refresh, just ensure user is still set
        if (!currentUser) {
          fetchAndSetUserProfile(session.user);
        }
      }
    });

    // Initialize auth
    initializeAuth();

    // Cleanup function
    return () => {
      logInfo('AuthProvider', 'Cleaning up AuthProvider');
      subscription.unsubscribe();
      authProviderMountCount.current--;
      // Don't reset globalAuthProviderInitialized on cleanup to prevent re-initialization
    };
  }, []); // Empty dependency array to run only once

  // Separate useEffect for data loading to avoid initialization issues
  useEffect(() => {
    if (currentUser && !dataLoadedRef.current) {
      loadInitialDataInBackground();
    }
  }, [currentUser]);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setError(null);
      setLoading(true);
      console.log('🔐 Attempting login for:', email);

      // Use Supabase auth for login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ Login error:', error);
        setError(error.message || 'Invalid email or password');
        setLoading(false);
        return false;
      }

      if (data.user) {
        console.log('✅ Login successful for:', data.user.email);
        await fetchAndSetUserProfile(data.user);
        setLoading(false);
        return true;
      }

      setError('Login failed');
      setLoading(false);
      return false;
    } catch (err) {
      console.error('❌ Login error:', err);
      setError('An unexpected error occurred during login');
      setLoading(false);
      return false;
    }
  };

  const logout = async () => {
    try {
      console.log('👋 Logging out user');
      setLoading(true);
      
      // Clear POS settings user cache (handled by the hook itself)
      // POSSettingsAPI.clearUserCache(); // Removed to avoid circular dependency
      
      await supabase.auth.signOut();
      setCurrentUser(null);
      setError(null);
      dataLoadedRef.current = false; // Reset data loaded flag
      console.log('✅ Logout successful');
    } catch (err) {
      console.error('❌ Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ 
      currentUser,
      login,
      logout,
      isAuthenticated: !!currentUser,
      error,
      clearError,
      loading,
      refreshSession
    }}>
      {children}
    </AuthContext.Provider>
  );
};