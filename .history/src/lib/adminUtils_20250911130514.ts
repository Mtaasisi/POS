import { supabase } from './supabaseClient';
import { toast } from 'react-hot-toast';

/**
 * Update user role in the database
 */
export const updateUserRole = async (email: string, newRole: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('auth_users')
      .update({ 
        role: newRole,
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .select();

    if (error) {
      console.error('Error updating user role:', error);
      toast.error(`Failed to update user role: ${error.message}`);
      return false;
    }

    if (data && data.length > 0) {
      toast.success(`User role updated to ${newRole} for ${email}`);
      return true;
    } else {
      toast.error('User not found');
      return false;
    }
  } catch (error) {
    console.error('Unexpected error updating user role:', error);
    toast.error('Failed to update user role');
    return false;
  }
};

/**
 * Get all users from the database
 */
export const getAllUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('auth_users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching users:', error);
    throw error;
  }
};

/**
 * Create a new user in the database
 */
export const createUser = async (userData: {
  email: string;
  name?: string;
  role?: string;
  is_active?: boolean;
}) => {
  try {
    const { data, error } = await supabase
      .from('auth_users')
      .insert([{
        email: userData.email,
        name: userData.name || userData.email.split('@')[0],
        role: userData.role || 'technician',
        is_active: userData.is_active !== false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select();

    if (error) {
      console.error('Error creating user:', error);
      throw error;
    }

    return data?.[0];
  } catch (error) {
    console.error('Unexpected error creating user:', error);
    throw error;
  }
};

/**
 * Update user status (active/inactive)
 */
export const updateUserStatus = async (email: string, isActive: boolean): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('auth_users')
      .update({ 
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .select();

    if (error) {
      console.error('Error updating user status:', error);
      toast.error(`Failed to update user status: ${error.message}`);
      return false;
    }

    if (data && data.length > 0) {
      toast.success(`User status updated for ${email}`);
      return true;
    } else {
      toast.error('User not found');
      return false;
    }
  } catch (error) {
    console.error('Unexpected error updating user status:', error);
    toast.error('Failed to update user status');
    return false;
  }
};
