import React, { useState, useEffect } from 'react';
import Modal from '../../shared/components/ui/Modal';
import GlassButton from '../../shared/components/ui/GlassButton';
import { Star, Plus, Minus, History, TrendingUp, TrendingDown, Gift } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../lib/supabaseClient';
import { saveActionOffline } from '../../../lib/offlineSync';

interface PointsManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  currentPoints: number;
  loyaltyLevel: string;
  onPointsUpdated: (newPoints: number) => void;
}

interface PointsHistoryEntry {
  id: string;
  points: number;
  reason: string;
  type: 'added' | 'subtracted' | 'redeemed' | 'auto';
  createdBy: string;
  createdByUser?: string; // User name who added the points
  createdAt: string;
}

const PointsManagementModal: React.FC<PointsManagementModalProps> = ({
  isOpen,
  onClose,
  customerId,
  customerName,
  currentPoints,
  loyaltyLevel,
  onPointsUpdated
}) => {
  const [pointsToAdjust, setPointsToAdjust] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pointsHistory, setPointsHistory] = useState<PointsHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load points history
  useEffect(() => {
    if (isOpen) {
      loadPointsHistory();
    }
  }, [isOpen, customerId]);

  const loadPointsHistory = async () => {
    setLoadingHistory(true);
    try {
      // First try to fetch from points_transactions table
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('points_transactions')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (!transactionsError && transactionsData && transactionsData.length > 0) {
        // Get unique user IDs from the transactions
        const userIds = [...new Set(transactionsData.map(t => t.created_by))];
        
        // Fetch user information for all unique users
        const { data: usersData, error: usersError } = await supabase
          .from('auth_users')
          .select('id, name')
          .in('id', userIds);

        const usersMap = new Map();
        if (!usersError && usersData) {
          usersData.forEach(user => {
            usersMap.set(user.id, user.name);
          });
        }

        const history: PointsHistoryEntry[] = transactionsData.map(transaction => {
          const isSubtracted = transaction.points_change < 0;
          const isRedeemed = transaction.transaction_type === 'redeemed';
          const isAuto = transaction.transaction_type === 'earned';
          
          return {
            id: transaction.id,
            points: transaction.points_change,
            reason: transaction.reason,
            type: isRedeemed ? 'redeemed' : isAuto ? 'auto' : isSubtracted ? 'subtracted' : 'added',
            createdBy: transaction.created_by,
            createdByUser: usersMap.get(transaction.created_by) || 'Unknown User',
            createdAt: transaction.created_at
          };
        });
        setPointsHistory(history);
      } else {
        // Fallback to customer_notes if points_transactions table doesn't exist or is empty
        const { data, error } = await supabase
          .from('customer_notes')
          .select('*')
          .eq('customer_id', customerId)
          .or('content.ilike.%points%')
          .order('created_at', { ascending: false })
          .limit(20);

        if (!error && data) {
          // Get unique user IDs from the notes
          const userIds = [...new Set(data.map(note => note.created_by))];
          
          // Fetch user information for all unique users
          const { data: usersData, error: usersError } = await supabase
            .from('auth_users')
            .select('id, name')
            .in('id', userIds);

          const usersMap = new Map();
          if (!usersError && usersData) {
            usersData.forEach(user => {
              usersMap.set(user.id, user.name);
            });
          }

          const history: PointsHistoryEntry[] = data
            .filter(note => note.content.includes('points'))
            .map(note => {
              const pointsMatch = note.content.match(/(\d+)\s+points?/i);
              const points = pointsMatch ? parseInt(pointsMatch[1]) : 0;
              const isSubtracted = note.content.includes('subtracted') || note.content.includes('deducted');
              const isRedeemed = note.content.includes('redeemed');
              const isAuto = note.content.includes('loyalty points for new device');
              
              return {
                id: note.id,
                points: isSubtracted ? -points : points,
                reason: note.content,
                type: isRedeemed ? 'redeemed' : isAuto ? 'auto' : isSubtracted ? 'subtracted' : 'added',
                createdBy: note.created_by,
                createdByUser: usersMap.get(note.created_by) || 'Unknown User',
                createdAt: note.created_at
              };
            });
          setPointsHistory(history);
        }
      }
    } catch (error) {
      console.error('Error loading points history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handlePointsAdjustment = async (operation: 'add' | 'subtract') => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for the points adjustment');
      return;
    }

    if (!navigator.onLine) {
      await saveActionOffline({ type: 'adjustPoints', payload: { operation, pointsToAdjust, reason, customerId } });
      toast('You are offline. Points adjustment will be synced when you are back online.');
      setPointsToAdjust(0);
      setReason('');
      return;
    }

    setIsLoading(true);
    try {
      const adjustment = operation === 'add' ? Math.abs(pointsToAdjust) : -Math.abs(pointsToAdjust);
      const newPoints = Math.max(0, currentPoints + adjustment); // Ensure points don't go negative
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || 'system';
      
      // Update customer points in database
      const { error: updateError } = await supabase
        .from('customers')
        .update({ points: newPoints })
        .eq('id', customerId);

      if (updateError) throw updateError;

      // Log points transaction
      const transactionType = operation === 'add' ? 'adjusted' : 'adjusted';
      const { error: transactionError } = await supabase
        .from('points_transactions')
        .insert({
          customer_id: customerId,
          points_change: adjustment,
          transaction_type: transactionType,
          reason: reason.trim(),
          created_by: userId,
          metadata: { 
            operation: operation,
            previous_points: currentPoints,
            new_points: newPoints,
            adjustment_amount: Math.abs(pointsToAdjust)
          }
        });

      if (transactionError) {
        console.error('Error logging points transaction:', transactionError);
        // Don't fail the operation if transaction logging fails
      }

      // Add note about points adjustment
      const noteContent = `${operation === 'add' ? 'Added' : 'Subtracted'} ${Math.abs(pointsToAdjust)} points - ${reason}`;
      const { error: noteError } = await supabase
        .from('customer_notes')
        .insert({
          id: `note-${Date.now()}`,
          content: noteContent,
          created_by: userId,
          created_at: new Date().toISOString(),
          customer_id: customerId
        });

      if (noteError) console.warn('Could not add note:', noteError);

      // Update local state
      onPointsUpdated(newPoints);
      
      // Show success message
      toast.success(`${operation === 'add' ? 'Added' : 'Subtracted'} ${Math.abs(pointsToAdjust)} points successfully!`);
      
      // Reset form
      setPointsToAdjust(0);
      setReason('');
      
      // Reload history
      await loadPointsHistory();
      
    } catch (error) {
      console.error('Error adjusting points:', error);
      toast.error('Failed to adjust points. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getLoyaltyProgress = () => {
    const levels = { bronze: 0, silver: 100, gold: 500, platinum: 1000 };
    const currentLevel = loyaltyLevel?.toLowerCase() || 'bronze';
    const nextLevel = currentLevel === 'bronze' ? 'silver' : 
                     currentLevel === 'silver' ? 'gold' : 
                     currentLevel === 'gold' ? 'platinum' : null;
    
    if (!nextLevel) return { progress: 100, nextLevel: null, pointsNeeded: 0 };
    
    const currentThreshold = levels[currentLevel as keyof typeof levels];
    const nextThreshold = levels[nextLevel as keyof typeof levels];
    const progress = Math.min(100, ((currentPoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100);
    const pointsNeeded = Math.max(0, nextThreshold - currentPoints);
    
    return { progress, nextLevel, pointsNeeded };
  };

  const { progress, nextLevel, pointsNeeded } = getLoyaltyProgress();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Points Management" maxWidth="lg">
      <div className="space-y-6">
        {/* Current Points Display */}
        <div className="bg-gradient-to-r from-amber-500/20 to-yellow-500/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{customerName}</h3>
              <p className="text-2xl font-bold text-amber-600 flex items-center gap-2">
                <Star className="w-6 h-6" />
                {currentPoints} Points
              </p>
              <p className="text-sm text-gray-600 capitalize">{loyaltyLevel || 'Bronze'} Level</p>
            </div>
            <div className="text-right">
              {nextLevel && (
                <div className="text-sm text-gray-600">
                  <p>Next: {nextLevel}</p>
                  <p>{pointsNeeded} points needed</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Progress Bar */}
          {nextLevel && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{Math.round(progress)}% to {nextLevel}</p>
            </div>
          )}
        </div>

        {/* Points Adjustment */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900">Adjust Points</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Points to Adjust</label>
              <input
                type="number"
                value={pointsToAdjust}
                onChange={(e) => setPointsToAdjust(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter points amount"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Reason for adjustment"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <GlassButton
              onClick={() => handlePointsAdjustment('add')}
              disabled={isLoading || pointsToAdjust <= 0 || !reason.trim()}
              icon={<Plus size={16} />}
              variant="success"
            >
              Add Points
            </GlassButton>
            <GlassButton
              onClick={() => handlePointsAdjustment('subtract')}
              disabled={isLoading || pointsToAdjust <= 0 || !reason.trim()}
              icon={<Minus size={16} />}
              variant="danger"
            >
              Subtract Points
            </GlassButton>
          </div>
        </div>

        {/* Points History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <History size={16} />
              Points History
            </h4>
            {loadingHistory && <div className="text-sm text-gray-500">Loading...</div>}
          </div>
          
          <div className="max-h-60 overflow-y-auto space-y-2">
            {pointsHistory.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-3 bg-white/30 rounded-lg">
                <div className="flex items-center gap-3">
                  {entry.type === 'added' && <TrendingUp size={16} className="text-green-500" />}
                  {entry.type === 'subtracted' && <TrendingDown size={16} className="text-red-500" />}
                  {entry.type === 'redeemed' && <Gift size={16} className="text-purple-500" />}
                  {entry.type === 'auto' && <Star size={16} className="text-amber-500" />}
                  
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {entry.type === 'added' ? '+' : ''}{entry.points} points
                    </p>
                    <p className="text-xs text-gray-600">{entry.reason}</p>
                    <p className="text-xs text-blue-600 font-medium">
                      Added by: {entry.createdByUser}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(entry.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
            
            {pointsHistory.length === 0 && !loadingHistory && (
              <div className="text-center text-gray-500 py-4">
                No points history found
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <GlassButton variant="secondary" onClick={onClose}>
            Close
          </GlassButton>
        </div>
      </div>
    </Modal>
  );
};

export default PointsManagementModal; 