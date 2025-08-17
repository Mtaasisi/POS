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
  const authContext = useContext(AuthContext);
  const currentUser = authContext?.currentUser || null;

  const refreshGoals = useCallback(async () => {
    if (!currentUser?.id) {
      setUserGoals([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
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
  }, [currentUser?.id, currentUser?.role]);

  const getGoalProgress = useCallback(async (goalType: UserDailyGoal['goal_type']) => {
    if (!currentUser?.id) {
      return { current: 0, goal: 5, progress: 0 };
    }

    try {
      return await getUserGoalProgress(currentUser.id, goalType, currentUser);
    } catch (err) {
      console.error('Error getting goal progress:', err);
      return { current: 0, goal: 5, progress: 0 };
    }
  }, [currentUser?.id, currentUser]);

  const updateGoal = useCallback(async (goalId: string, updates: { goal_value?: number; is_active?: boolean }) => {
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
  }, []);

  const createGoal = useCallback(async (goalData: { goal_type: UserDailyGoal['goal_type']; goal_value: number }) => {
    if (!currentUser?.id) return false;

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
  }, [currentUser?.id]);

  const deleteGoal = useCallback(async (goalId: string) => {
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
  }, []);

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