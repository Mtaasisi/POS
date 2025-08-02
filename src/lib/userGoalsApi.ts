import { supabase } from './supabaseClient';

export interface UserDailyGoal {
  id: string;
  user_id: string;
  goal_type: 'new_customers' | 'devices_processed' | 'checkins' | 'repairs_completed';
  goal_value: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserGoalData {
  user_id: string;
  goal_type: UserDailyGoal['goal_type'];
  goal_value: number;
}

export interface UpdateUserGoalData {
  goal_value?: number;
  is_active?: boolean;
}

/**
 * Get all daily goals for a specific user
 */
export async function getUserDailyGoals(userId: string): Promise<UserDailyGoal[]> {
  try {
    const { data, error } = await supabase
      .from('user_daily_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('goal_type');

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('user_daily_goals table does not exist yet');
        return [];
      }
      // Handle 406 Not Acceptable error (RLS issue)
      if (error.code === '406' || error.message?.includes('Not Acceptable')) {
        console.warn('RLS policy issue with user_daily_goals table, returning empty array');
        return [];
      }
      console.error('Error fetching user daily goals:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching user daily goals:', error);
    return [];
  }
}

/**
 * Get a specific daily goal for a user
 */
export async function getUserDailyGoal(userId: string, goalType: UserDailyGoal['goal_type']): Promise<UserDailyGoal | null> {
  try {
    const { data, error } = await supabase
      .from('user_daily_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('goal_type', goalType)
      .eq('is_active', true)
      .single();

    if (error) {
      // If table doesn't exist, return null
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.warn('user_daily_goals table does not exist yet');
        return null;
      }
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      // Handle 406 Not Acceptable error (RLS issue)
      if (error.code === '406' || error.message?.includes('Not Acceptable')) {
        console.warn('RLS policy issue with user_daily_goals table, returning null');
        return null;
      }
      console.error('Error fetching user daily goal:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error fetching user daily goal:', error);
    return null;
  }
}

/**
 * Create a new daily goal for a user
 */
export async function createUserDailyGoal(goalData: CreateUserGoalData): Promise<UserDailyGoal | null> {
  try {
    // First check if a goal of this type already exists for this user
    const { data: existingGoal } = await supabase
      .from('user_daily_goals')
      .select('*')
      .eq('user_id', goalData.user_id)
      .eq('goal_type', goalData.goal_type)
      .eq('is_active', true)
      .single();

    if (existingGoal) {
      // Update existing goal instead of creating new one
      const { data, error } = await supabase
        .from('user_daily_goals')
        .update({ goal_value: goalData.goal_value })
        .eq('id', existingGoal.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating existing user daily goal:', error);
        return null;
      }

      return data;
    }

    // Create new goal
    const { data, error } = await supabase
      .from('user_daily_goals')
      .insert(goalData)
      .select()
      .single();

    if (error) {
      console.error('Error creating user daily goal:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error creating user daily goal:', error);
    return null;
  }
}

/**
 * Update an existing daily goal for a user
 */
export async function updateUserDailyGoal(goalId: string, updates: UpdateUserGoalData): Promise<UserDailyGoal | null> {
  try {
    const { data, error } = await supabase
      .from('user_daily_goals')
      .update(updates)
      .eq('id', goalId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user daily goal:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Unexpected error updating user daily goal:', error);
    return null;
  }
}

/**
 * Delete a daily goal for a user (soft delete by setting is_active to false)
 */
export async function deleteUserDailyGoal(goalId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_daily_goals')
      .update({ is_active: false })
      .eq('id', goalId);

    if (error) {
      console.error('Error deleting user daily goal:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Unexpected error deleting user daily goal:', error);
    return false;
  }
}

/**
 * Get or create default goals for a user based on their role
 */
export async function getOrCreateDefaultGoals(userId: string, userRole: string): Promise<UserDailyGoal[]> {
  try {
    // First, try to get existing goals
    const existingGoals = await getUserDailyGoals(userId);
    
    if (existingGoals.length > 0) {
      return existingGoals;
    }

    // If no goals exist, create default goals based on role
    const defaultGoals: CreateUserGoalData[] = [];
    
    if (userRole === 'customer-care') {
      defaultGoals.push(
        { user_id: userId, goal_type: 'new_customers', goal_value: 5 },
        { user_id: userId, goal_type: 'checkins', goal_value: 10 }
      );
    } else if (userRole === 'technician') {
      defaultGoals.push(
        { user_id: userId, goal_type: 'devices_processed', goal_value: 8 },
        { user_id: userId, goal_type: 'repairs_completed', goal_value: 6 }
      );
    } else {
      // Admin or other roles
      defaultGoals.push(
        { user_id: userId, goal_type: 'new_customers', goal_value: 3 },
        { user_id: userId, goal_type: 'devices_processed', goal_value: 5 }
      );
    }

    // Create all default goals (this will handle duplicates gracefully)
    const createdGoals: UserDailyGoal[] = [];
    for (const goalData of defaultGoals) {
      try {
        const createdGoal = await createUserDailyGoal(goalData);
        if (createdGoal) {
          createdGoals.push(createdGoal);
        }
      } catch (goalError) {
        console.warn('Error creating goal:', goalError);
        // Continue with other goals even if one fails
      }
    }

    // If no goals were created, try to get existing ones again
    if (createdGoals.length === 0) {
      return await getUserDailyGoals(userId);
    }

    return createdGoals;
  } catch (error) {
    console.error('Error getting or creating default goals:', error);
    return [];
  }
}

/**
 * Get all users for admin goals management
 */
export async function getAllUsers(): Promise<{ id: string; username: string; role: string; email?: string }[]> {
  try {
    const { data, error } = await supabase
      .from('auth_users')
      .select('id, username, role, email')
      .order('username');

    if (error) {
      console.error('Error fetching users:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching users:', error);
    return [];
  }
}

/**
 * Get user's progress for a specific goal type today
 */
export async function getUserGoalProgress(userId: string, goalType: UserDailyGoal['goal_type'], currentUser?: { username: string }): Promise<{ current: number; goal: number; progress: number }> {
  try {
    const goal = await getUserDailyGoal(userId, goalType);
    if (!goal) {
      // Return default values if no goal exists
      return { current: 0, goal: 5, progress: 0 };
    }

    const today = new Date().toISOString().slice(0, 10);
    let current = 0;

    try {
      switch (goalType) {
        case 'new_customers':
          // Count customers created today (since we don't track created_by, we'll count all new customers today)
          const { count: newCustomersCount } = await supabase
            .from('customers')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', `${today}T00:00:00`)
            .lt('created_at', `${today}T23:59:59`);
          current = newCustomersCount || 0;
          break;

        case 'devices_processed':
          // Count devices processed today by this user
          // Note: assigned_to stores user IDs, not usernames
          if (!userId) {
            current = 0;
            break;
          }
          const { count: devicesCount } = await supabase
            .from('devices')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', userId)
            .gte('created_at', `${today}T00:00:00`)
            .lt('created_at', `${today}T23:59:59`);
          current = devicesCount || 0;
          break;

        case 'checkins':
          // Count customer check-ins today by this user
          const { count: checkinsCount } = await supabase
            .from('customer_checkins')
            .select('*', { count: 'exact', head: true })
            .eq('staff_id', userId)
            .eq('checked_in_date', today);
          current = checkinsCount || 0;
          break;

        case 'repairs_completed':
          // Count repairs completed today by this user
          // Note: assigned_to stores user IDs, not usernames
          if (!userId) {
            current = 0;
            break;
          }
          const { count: repairsCount } = await supabase
            .from('devices')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', userId)
            .eq('status', 'done')
            .gte('updated_at', `${today}T00:00:00`)
            .lt('updated_at', `${today}T23:59:59`);
          current = repairsCount || 0;
          break;
      }
    } catch (progressError) {
      console.error('Error calculating progress:', progressError);
      current = 0;
    }

    const progress = Math.min(100, Math.round((current / goal.goal_value) * 100));
    return { current, goal: goal.goal_value, progress };
  } catch (error) {
    console.error('Error getting user goal progress:', error);
    return { current: 0, goal: 5, progress: 0 };
  }
} 