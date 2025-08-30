import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import { 
  UserDailyGoal, 
  getUserDailyGoals, 
  getUserDailyGoal, 
  createUserDailyGoal, 
  updateUserDailyGoal, 
  deleteUserDailyGoal,
  getOrCreateDefaultGoals,
  getUserGoalProgress
} from '../lib/userGoalsApi';
import { supabase } from '../lib/supabaseClient';

interface UserGoalsContextType {
  userGoals: UserDailyGoal[];
  loading: boolean;
  error: string | null;
  refreshGoals: () => Promise<void>;
  getGoalProgress: (goalType: UserDailyGoal['goal_type']) => Promise<{ current: number; goal: number; progress: number }>;
  updateGoal: (goalId: string, updates: { goal_value?: number; is_active?: boolean }) => Promise<boolean>;
  createGoal: (goalData: { goal_type: UserDailyGoal['goal_type']; goal_value: number }) => Promise<boolean>;
  deleteGoal: (goalId: string) => Promise<boolean>;
}

const UserGoalsContext = createContext<UserGoalsContextType | undefined>(undefined);

export const useUserGoals = () => {
  const context = useContext(UserGoalsContext);
  if (!context) {
    throw new Error('useUserGoals must be used within a UserGoalsProvider');
  }
  return context;
};

export const UserGoalsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userGoals, setUserGoals] = useState<UserDailyGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tableExists, setTableExists] = useState<boolean | null>(null);
  const authContext = useContext(AuthContext);
  const currentUser = authContext?.currentUser || null;

  // Check if user_daily_goals table exists
  const checkTableExists = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_daily_goals')
        .select('id')
        .limit(1);
      
      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('user_daily_goals table does not exist');
          setTableExists(false);
          return false;
        }
        if (error.code === '406' || error.message?.includes('Not Acceptable')) {
          console.warn('RLS policy issue with user_daily_goals table');
          setTableExists(false);
          return false;
        }
      }
      
      setTableExists(true);
      return true;
    } catch (error) {
      console.error('Error checking if user_daily_goals table exists:', error);
      setTableExists(false);
      return false;
    }
  }, []);

  const refreshGoals = useCallback(async () => {
    if (!currentUser?.id) {
      setUserGoals([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Check if table exists first
      const tableExists = await checkTableExists();
      if (!tableExists) {
        console.log('user_daily_goals table not available, skipping goals loading');
        setUserGoals([]);
        setLoading(false);
        return;
      }
      
      // Get or create default goals for the user
      const goals = await getOrCreateDefaultGoals(currentUser.id, currentUser.role);
      setUserGoals(goals);
    } catch (err) {
      console.error('Error refreshing user goals:', err);
      setError('Failed to load user goals');
      // Set empty goals array to prevent crashes
      setUserGoals([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, currentUser?.role, checkTableExists]);

  const getGoalProgress = useCallback(async (goalType: UserDailyGoal['goal_type']) => {
    if (!currentUser?.id || !tableExists) {
      return { current: 0, goal: 5, progress: 0 };
    }

    try {
      return await getUserGoalProgress(currentUser.id, goalType, currentUser);
    } catch (err) {
      console.error('Error getting goal progress:', err);
      return { current: 0, goal: 5, progress: 0 };
    }
  }, [currentUser?.id, currentUser, tableExists]);

  const updateGoal = useCallback(async (goalId: string, updates: { goal_value?: number; is_active?: boolean }) => {
    if (!tableExists) {
      console.warn('Cannot update goal: user_daily_goals table not available');
      return false;
    }
    
    try {
      const updatedGoal = await updateUserDailyGoal(goalId, updates);
      if (updatedGoal) {
        setUserGoals(prev => prev.map(goal => 
          goal.id === goalId ? updatedGoal : goal
        ));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating goal:', err);
      return false;
    }
  }, [tableExists]);

  const createGoal = useCallback(async (goalData: { goal_type: UserDailyGoal['goal_type']; goal_value: number }) => {
    if (!currentUser?.id || !tableExists) return false;

    try {
      const newGoal = await createUserDailyGoal({
        user_id: currentUser.id,
        ...goalData
      });
      
      if (newGoal) {
        setUserGoals(prev => [...prev, newGoal]);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error creating goal:', err);
      return false;
    }
  }, [currentUser?.id, tableExists]);

  const deleteGoal = useCallback(async (goalId: string) => {
    if (!tableExists) {
      console.warn('Cannot delete goal: user_daily_goals table not available');
      return false;
    }
    
    try {
      const success = await deleteUserDailyGoal(goalId);
      if (success) {
        setUserGoals(prev => prev.filter(goal => goal.id !== goalId));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error deleting goal:', err);
      return false;
    }
  }, [tableExists]);

  // Load goals when user changes
  useEffect(() => {
    refreshGoals();
  }, [refreshGoals]);

  const value: UserGoalsContextType = {
    userGoals,
    loading,
    error,
    refreshGoals,
    getGoalProgress,
    updateGoal,
    createGoal,
    deleteGoal
  };

  return (
    <UserGoalsContext.Provider value={value}>
      {children}
    </UserGoalsContext.Provider>
  );
}; 