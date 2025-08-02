import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

interface AuthContextType {
  currentUser: any;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  error: string | null;
  clearError: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

// Global flag to prevent multiple AuthProvider instances
let globalAuthProviderInitialized = false;

let authProviderMountCount = 0; // Static mount counter for debugging

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
        return;
      }

      // Map the user data from Supabase to our app format
      const mappedUser = mapUserFromSupabase(profileData);
      console.log('✅ User profile loaded successfully:', mappedUser.name || mappedUser.email);
      console.log('🔍 User profile data:', profileData);
      console.log('🔍 Mapped user data:', mappedUser);
      setCurrentUser(mappedUser);
      setLoading(false);
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
    }
  };

  // On mount, check for Supabase session and fetch profile
  useEffect(() => {
    // Prevent multiple initializations
    if (initializedRef.current || globalAuthProviderInitialized) {
      console.log('⚠️ AuthProvider already initialized, skipping...');
      return;
    }
    
    globalAuthProviderInitialized = true;
    authProviderMountCount.current++;
    console.log('🚀 Initializing AuthProvider (mount #', authProviderMountCount.current, ')');
    
    const initializeAuth = async () => {
      try {
        setLoading(true);
        console.log('🔐 Checking for existing session...');
        
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError);
          setCurrentUser(null);
          setLoading(false);
          return;
        }
        
        if (session?.user) {
          console.log('✅ Found existing session for user:', session.user.email);
          await fetchAndSetUserProfile(session.user);
        } else {
          console.log('ℹ️ No existing session found');
          setCurrentUser(null);
        }
        
        setLoading(false);
        initializedRef.current = true;
        console.log('✅ Auth initialization complete');
      } catch (err) {
        console.error('❌ Error initializing auth:', err);
        setCurrentUser(null);
        setLoading(false);
        initializedRef.current = true;
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state change:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('👤 User signed in:', session.user.email);
        fetchAndSetUserProfile(session.user);
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        setCurrentUser(null);
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('🔄 Token refreshed for user:', session.user.email);
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
      console.log('🧹 Cleaning up AuthProvider');
      subscription.unsubscribe();
      authProviderMountCount.current--;
      // Don't reset globalAuthProviderInitialized on cleanup to prevent re-initialization
    };
  }, []); // Empty dependency array to run only once

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
      await supabase.auth.signOut();
      setCurrentUser(null);
      setError(null);
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
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};