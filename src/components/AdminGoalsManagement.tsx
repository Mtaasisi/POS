import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Modal from './ui/Modal';
import { Trophy, Target, Edit, Plus, X, CheckCircle, Users, ClipboardList, UserCheck, Wrench, Crown, User, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';
import { UserDailyGoal, createUserDailyGoal, updateUserDailyGoal, deleteUserDailyGoal, getAllUsers } from '../lib/userGoalsApi';

interface AdminGoalsManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

interface User {
  id: string;
  username: string;
  role: string;
  email?: string;
}

const AdminGoalsManagement: React.FC<AdminGoalsManagementProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userGoals, setUserGoals] = useState<UserDailyGoal[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [newGoalType, setNewGoalType] = useState<'new_customers' | 'devices_processed' | 'checkins' | 'repairs_completed'>('new_customers');
  const [newGoalValue, setNewGoalValue] = useState(5);
  const [editValue, setEditValue] = useState(5);

  const goalTypeLabels = {
    new_customers: 'New Customers',
    devices_processed: 'Devices Processed',
    checkins: 'Customer Check-ins',
    repairs_completed: 'Repairs Completed'
  };

  const goalTypeIcons = {
    new_customers: Users,
    devices_processed: ClipboardList,
    checkins: UserCheck,
    repairs_completed: Wrench
  };

  // Check if current user is admin
  const isAdmin = currentUser?.role === 'admin';

  // Load all users
  const loadUsers = async () => {
    try {
      const users = await getAllUsers();
      setUsers(users);
    } catch (error) {
      console.error('Unexpected error loading users:', error);
      toast.error('Failed to load users');
    }
  };

  // Load goals for selected user
  const loadUserGoals = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_daily_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('goal_type');

      if (error) {
        console.error('Error loading user goals:', error);
        toast.error('Failed to load user goals');
        return;
      }

      setUserGoals(data || []);
    } catch (error) {
      console.error('Unexpected error loading user goals:', error);
      toast.error('Failed to load user goals');
    } finally {
      setLoading(false);
    }
  };

  // Handle user selection
  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
    loadUserGoals(user.id);
  };

  // Handle goal editing
  const handleEditGoal = (goalId: string, currentValue: number) => {
    setEditingGoal(goalId);
    setEditValue(currentValue);
  };

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!editingGoal || !selectedUser) return;
    
    const success = await updateUserDailyGoal(editingGoal, { goal_value: editValue });
    if (success) {
      toast.success('Goal updated successfully!');
      setEditingGoal(null);
      loadUserGoals(selectedUser.id);
    } else {
      toast.error('Failed to update goal');
    }
  };

  // Handle create goal
  const handleCreateGoal = async () => {
    if (!selectedUser) return;

    const success = await createUserDailyGoal({
      user_id: selectedUser.id,
      goal_type: newGoalType,
      goal_value: newGoalValue
    });
    
    if (success) {
      toast.success('Goal created successfully!');
      setNewGoalType('new_customers');
      setNewGoalValue(5);
      loadUserGoals(selectedUser.id);
    } else {
      toast.error('Failed to create goal');
    }
  };

  // Handle delete goal
  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    
    const success = await deleteUserDailyGoal(goalId);
    if (success) {
      toast.success('Goal deleted successfully!');
      if (selectedUser) {
        loadUserGoals(selectedUser.id);
      }
    } else {
      toast.error('Failed to delete goal');
    }
  };

  // Filter users based on search
  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Load users on component mount
  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  // If not admin, show access denied
  if (!isAdmin) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Admin Access Required">
        <div className="text-center py-8">
          <Crown className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">Only administrators can manage user goals.</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Admin Goals Management">
      <div className="space-y-6 max-h-[80vh] overflow-y-auto">
        {/* User Selection */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-blue-500" />
            Select User
          </h3>
          
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-2 bg-gray-50 rounded-lg p-2">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className={`p-3 cursor-pointer transition-all duration-200 rounded-lg border ${
                  selectedUser?.id === user.id 
                    ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200' 
                    : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                }`}
                onClick={() => handleUserSelect(user)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{user.username}</p>
                    <p className="text-sm text-gray-500 capitalize">{user.role}</p>
                    {user.email && <p className="text-xs text-gray-400">{user.email}</p>}
                  </div>
                  {selectedUser?.id === user.id && (
                    <CheckCircle className="h-5 w-5 text-blue-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Selected User Goals */}
        {selectedUser && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              Goals for {selectedUser.username}
            </h3>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading goals...</p>
              </div>
            ) : userGoals.length === 0 ? (
              <div className="text-center py-8">
                <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No goals set for this user. Create goals below!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {userGoals.map((goal) => {
                  const IconComponent = goalTypeIcons[goal.goal_type];
                  return (
                    <div key={goal.id} className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <IconComponent className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{goalTypeLabels[goal.goal_type]}</p>
                            <p className="text-sm text-gray-500">Daily target: {goal.goal_value}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {editingGoal === goal.id ? (
                            <>
                              <input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                                className="w-20 px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                min="1"
                                max="100"
                              />
                              <button
                                onClick={handleSaveEdit}
                                className="px-3 py-1.5 text-xs bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors shadow-sm"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditGoal(goal.id, goal.goal_value)}
                                className="px-3 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors shadow-sm"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteGoal(goal.id)}
                                className="px-3 py-1.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow-sm"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Create New Goal */}
        {selectedUser && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-500" />
              Add New Goal for {selectedUser.username}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Goal Type
                </label>
                <select
                  value={newGoalType}
                  onChange={(e) => setNewGoalType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Object.keys(goalTypeLabels).map((type) => (
                    <option key={type} value={type}>
                      {goalTypeLabels[type as keyof typeof goalTypeLabels]}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Daily Target
                </label>
                <input
                  type="number"
                  value={newGoalValue}
                  onChange={(e) => setNewGoalValue(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="1"
                  max="100"
                  placeholder="Enter daily target"
                />
              </div>
              
              <button
                onClick={handleCreateGoal}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm font-medium"
                disabled={newGoalValue <= 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Goal
              </button>
            </div>
          </div>
        )}

        {/* Admin Tips */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Crown className="h-5 w-5 text-blue-600" />
            Admin Tips
          </h4>
          <ul className="text-sm text-blue-800 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Select a user to view and manage their goals</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>You can assign different goal types based on user roles</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Goals help motivate staff and track performance</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600 mt-1">•</span>
              <span>Regular goal reviews help maintain team productivity</span>
            </li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export default AdminGoalsManagement; 