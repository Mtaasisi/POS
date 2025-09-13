import React, { useState } from 'react';
import { useUserGoals } from '../../../context/UserGoalsContext';
import { useAuth } from '../../../context/AuthContext';
import Modal from '../../shared/components/ui/Modal';
import { Trophy, Target, Edit, Plus, X, CheckCircle, Users, ClipboardList, UserCheck, Wrench, Crown, Eye } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface UserGoalsManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserGoalsManagement: React.FC<UserGoalsManagementProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const { userGoals, loading, updateGoal, createGoal, deleteGoal } = useUserGoals();
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

  const handleEditGoal = (goalId: string, currentValue: number) => {
    if (!isAdmin) return; // Only admins can edit
    setEditingGoal(goalId);
    setEditValue(currentValue);
  };

  const handleSaveEdit = async () => {
    if (!editingGoal || !isAdmin) return;
    
    const success = await updateGoal(editingGoal, { goal_value: editValue });
    if (success) {
      toast.success('Goal updated successfully!');
      setEditingGoal(null);
    } else {
      toast.error('Failed to update goal');
    }
  };

  const handleCreateGoal = async () => {
    if (!isAdmin) {
      toast.error('Only administrators can create goals');
      return;
    }
    
    const success = await createGoal({
      goal_type: newGoalType,
      goal_value: newGoalValue
    });
    
    if (success) {
      toast.success('Goal created successfully!');
      setNewGoalType('new_customers');
      setNewGoalValue(5);
    } else {
      toast.error('Failed to create goal');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!isAdmin) {
      toast.error('Only administrators can delete goals');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this goal?')) return;
    
    const success = await deleteGoal(goalId);
    if (success) {
      toast.success('Goal deleted successfully!');
    } else {
      toast.error('Failed to delete goal');
    }
  };

  const getRoleSpecificGoals = () => {
    if (currentUser?.role === 'customer-care') {
      return ['new_customers', 'checkins'];
    } else if (currentUser?.role === 'technician') {
      return ['devices_processed', 'repairs_completed'];
    } else {
      return ['new_customers', 'devices_processed'];
    }
  };

  const availableGoalTypes = getRoleSpecificGoals();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isAdmin ? "Manage Daily Goals" : "View Daily Goals"}>
      <div className="space-y-6 max-h-[80vh] overflow-y-auto">
        {/* Admin Notice */}
        {!isAdmin && (
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-5 w-5 text-blue-600" />
              <h4 className="font-semibold text-blue-900">Admin Only</h4>
            </div>
            <p className="text-sm text-blue-800">
              Only administrators can create, edit, or delete goals. Contact your administrator to manage your goals.
            </p>
          </div>
        )}

        {/* Current Goals */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            {isAdmin ? "Your Current Goals" : "Your Assigned Goals"}
          </h3>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading goals...</p>
            </div>
          ) : userGoals.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No goals set yet. Create your first goal below!</p>
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
                      
                      {isAdmin && (
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
                                className="px-3 py-1.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded transition-colors shadow-sm"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                      {!isAdmin && (
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-gray-400" />
                          <span className="text-xs text-gray-500">Read Only</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create New Goal - Admin Only */}
        {isAdmin && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-500" />
              Add New Goal
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
                {availableGoalTypes.map((type) => (
                  <option key={type} value={type}>
                    {goalTypeLabels[type]}
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

        {/* Tips */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-blue-600" />
            {isAdmin ? "Tips" : "Goal Tips"}
          </h4>
          <ul className="text-sm text-blue-800 space-y-2">
            {isAdmin ? (
              <>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Set realistic goals based on your role and experience</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>You can have multiple goals of different types</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Goals help track your daily progress and motivation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Adjust goals as you improve and grow</span>
                </li>
              </>
            ) : (
              <>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>View your assigned goals and daily targets</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Contact your administrator to modify goals</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Goals help track your daily progress and motivation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Focus on achieving your assigned targets</span>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export default UserGoalsManagement; 