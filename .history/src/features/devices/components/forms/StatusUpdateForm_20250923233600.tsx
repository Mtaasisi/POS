import React, { useState, useEffect } from 'react';
import { Device, DeviceStatus, User } from '../../../../types';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { CheckCircle, Send, PenTool, ShieldCheck, PackageCheck, UserCheck, Hammer, Wrench, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '../../../../lib/supabaseClient';
import Modal from '../../../shared/components/ui/Modal';
import { formatCurrency } from '../../../../lib/customerApi';
import { toast } from 'react-hot-toast';

interface StatusUpdateFormProps {
  device: Device;
  currentUser: User;
  onUpdateStatus: (status: DeviceStatus, fingerprint: string) => void;
  onAddRemark: (remark: string) => void;
  onAddRating?: (score: number, comment: string) => void;
  outstanding?: number;
}

const StatusUpdateForm: React.FC<StatusUpdateFormProps> = ({
  device,
  currentUser,
  onUpdateStatus,
  onAddRemark,
  onAddRating,
  outstanding = 0
}) => {
  const [selectedStatus, setSelectedStatus] = useState<DeviceStatus | null>(null);
  const [remark, setRemark] = useState('');
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [hasCompletedPayment, setHasCompletedPayment] = useState(false);

  // Fetch payments for this device on mount
  useEffect(() => {
    async function fetchPayments() {
      if (!device?.id) return;
      const { data, error } = await supabase
        .from('customer_payments')
        .select('id, status, device_id')
        .eq('device_id', device.id)
        .eq('status', 'completed');
      if (!error && data && data.length > 0) {
        setHasCompletedPayment(true);
      } else {
        setHasCompletedPayment(false);
      }
    }

    fetchPayments();
  }, [device?.id]);

  const getStatusTransitions = (): Array<{ status: DeviceStatus; label: string; icon: React.ReactNode; disabled?: boolean }> => {
    const role = currentUser?.role;
    const isAssignedTechnician = device.assignedTo === currentUser?.id;

    switch (device.status) {
      case 'assigned':
        const transitions = [
          { status: 'diagnosis-started' as DeviceStatus, label: 'Start Diagnosis', icon: <PenTool size={18} /> }
        ];
        
        if (role === 'technician' && isAssignedTechnician) {
          return transitions;
        }
        if (role === 'admin' || role === 'customer-care') {
          return transitions;
        }
        return [];

      case 'diagnosis-started':
        if (role === 'technician' && isAssignedTechnician) {
          return [
            { status: 'done' as DeviceStatus, label: 'Complete', icon: <CheckCircle size={18} /> }
          ];
        }
        if (role === 'admin' || role === 'customer-care') {
          return [
            { status: 'done' as DeviceStatus, label: 'Complete', icon: <CheckCircle size={18} /> }
          ];
        }
        return [];

      default:
        return [];
    }
  };

  const handleStatusUpdate = async (status: DeviceStatus) => {
    setIsLoading(true);
    try {
      await onUpdateStatus(status, '');
      setShowModal(false);
      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRemark = async () => {
    if (!remark.trim()) return;
    
    setIsLoading(true);
    try {
      await onAddRemark(remark);
      setRemark('');
      toast.success('Remark added successfully');
    } catch (error) {
      console.error('Error adding remark:', error);
      toast.error('Failed to add remark');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRating = async () => {
    if (rating === 0 || !onAddRating) return;
    
    setIsLoading(true);
    try {
      await onAddRating(rating, ratingComment);
      setRating(0);
      setRatingComment('');
      setShowRatingModal(false);
      toast.success('Rating added successfully');
    } catch (error) {
      console.error('Error adding rating:', error);
      toast.error('Failed to add rating');
    } finally {
      setIsLoading(false);
    }
  };

  const transitions = getStatusTransitions();

  return (
    <div className="space-y-4">
      {/* Status Update Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Update Status</h3>
        
        {transitions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {transitions.map((transition) => (
              <GlassButton
                key={transition.status}
                onClick={() => {
                  setSelectedStatus(transition.status);
                  setShowModal(true);
                }}
                disabled={transition.disabled || isLoading}
                className="flex items-center justify-center gap-2 p-3"
              >
                {transition.icon}
                <span>{transition.label}</span>
                {isLoading && <Loader2 size={16} className="animate-spin" />}
              </GlassButton>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No status transitions available for current user role.</p>
        )}
      </div>

      {/* Remark Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Add Remark</h3>
        <div className="space-y-3">
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="Add a remark about this device..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={3}
          />
          <GlassButton
            onClick={handleAddRemark}
            disabled={!remark.trim() || isLoading}
            className="flex items-center gap-2"
          >
            <Send size={16} />
            Add Remark
            {isLoading && <Loader2 size={16} className="animate-spin" />}
          </GlassButton>
        </div>
      </div>

      {/* Rating Section */}
      {onAddRating && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Add Rating</h3>
          <GlassButton
            onClick={() => setShowRatingModal(true)}
            className="flex items-center gap-2"
          >
            <Star size={16} />
            Rate Service
          </GlassButton>
        </div>
      )}

      {/* Status Update Confirmation Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Confirm Status Update"
      >
        <div className="p-4">
          <p className="text-gray-600 mb-4">
            Are you sure you want to update the device status to "{transitions.find(t => t.status === selectedStatus)?.label}"?
          </p>
          <div className="flex gap-3 justify-end">
            <GlassButton
              onClick={() => setShowModal(false)}
              variant="secondary"
            >
              Cancel
            </GlassButton>
            <GlassButton
              onClick={() => selectedStatus && handleStatusUpdate(selectedStatus)}
              disabled={isLoading}
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Confirm'}
            </GlassButton>
          </div>
        </div>
      </Modal>

      {/* Rating Modal */}
      <Modal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        title="Rate Service"
      >
        <div className="p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
              <textarea
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Add a comment about the service..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <GlassButton
                onClick={() => setShowRatingModal(false)}
                variant="secondary"
              >
                Cancel
              </GlassButton>
              <GlassButton
                onClick={handleAddRating}
                disabled={rating === 0 || isLoading}
              >
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : 'Submit Rating'}
              </GlassButton>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StatusUpdateForm;
