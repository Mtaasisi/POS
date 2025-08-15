import React, { useState } from 'react';
import { X, Send, AlertTriangle, Wrench, RefreshCw, Eye, MessageSquare } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { submitAdminFeedback } from '../../../lib/diagnosticsApi';
import { DiagnosticDevice, NextAction, NEXT_ACTION } from '../../../types/diagnostics';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';

interface AdminFeedbackModalProps {
  device: DiagnosticDevice;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AdminFeedbackModal: React.FC<AdminFeedbackModalProps> = ({
  device,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [nextAction, setNextAction] = useState<NextAction | ''>('');
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Action-specific feedback templates
  const getActionTemplate = (action: NextAction) => {
    switch (action) {
      case NEXT_ACTION.REPAIR:
        return `Device requires repair work. Please assess the following issues:\n\n• ${device.device_name} has failed diagnostic tests\n• Technician should perform detailed repair assessment\n• Check for available parts and repair feasibility\n• Estimate repair time and cost`;
      
      case NEXT_ACTION.REPLACE:
        return `Device should be replaced due to diagnostic failures. Consider the following:\n\n• ${device.device_name} has multiple critical failures\n• Repair cost may exceed device value\n• Check warranty status and replacement options\n• Recommend suitable replacement model`;
      
      case NEXT_ACTION.IGNORE:
        return `No action required for this device. Reasoning:\n\n• ${device.device_name} has minor issues that don't affect functionality\n• Device is working within acceptable parameters\n• No immediate repair or replacement needed\n• Monitor for future issues`;
      
      case NEXT_ACTION.ESCALATE:
        return `Device requires escalation to senior technician or management. Issues:\n\n• ${device.device_name} has complex technical problems\n• Requires specialized expertise or equipment\n• May need manufacturer support or warranty claim\n• Decision needed on repair vs replacement`;
      
      default:
        return '';
    }
  };

  const handleActionChange = (action: NextAction) => {
    setNextAction(action);
    // Auto-fill feedback with template
    setFeedback(getActionTemplate(action));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nextAction) {
      toast.error('Please select a next action');
      return;
    }

    if (!feedback.trim()) {
      toast.error('Please provide feedback notes');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const success = await submitAdminFeedback({
        device_id: device.id,
        next_action: nextAction as NextAction,
        admin_feedback: feedback.trim()
      });

      if (success) {
        // Show action-specific success message
        const actionMessages = {
          [NEXT_ACTION.REPAIR]: 'Device status updated to "Repair Required"',
          [NEXT_ACTION.REPLACE]: 'Device status updated to "Replacement Required"',
          [NEXT_ACTION.IGNORE]: 'Device status updated to "No Action Required"',
          [NEXT_ACTION.ESCALATE]: 'Device status updated to "Escalated"'
        };
        
        toast.success(actionMessages[nextAction as NextAction] || 'Action assigned successfully');
        onSuccess();
        onClose();
        // Reset form
        setNextAction('');
        setFeedback('');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      // Reset form
      setNextAction('');
      setFeedback('');
    }
  };

  const getActionIcon = (action: NextAction) => {
    switch (action) {
      case NEXT_ACTION.REPAIR:
        return <Wrench className="h-4 w-4" />;
      case NEXT_ACTION.REPLACE:
        return <RefreshCw className="h-4 w-4" />;
      case NEXT_ACTION.IGNORE:
        return <Eye className="h-4 w-4" />;
      case NEXT_ACTION.ESCALATE:
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: NextAction) => {
    switch (action) {
      case NEXT_ACTION.REPAIR:
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case NEXT_ACTION.REPLACE:
        return 'text-red-600 bg-red-50 border-red-200';
      case NEXT_ACTION.IGNORE:
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case NEXT_ACTION.ESCALATE:
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Admin Feedback & Action</h2>
          <GlassButton
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1 text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </GlassButton>
        </div>

        {/* Device Info */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900">{device.device_name}</h3>
          {device.model && <p className="text-sm text-gray-600">{device.model}</p>}
          {device.serial_number && <p className="text-xs text-gray-500">S/N: {device.serial_number}</p>}
          <div className="mt-2">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
              device.result_status === 'failed' 
                ? 'text-red-600 bg-red-50 border border-red-200' 
                : 'text-orange-600 bg-orange-50 border border-orange-200'
            }`}>
              <AlertTriangle size={12} />
              {device.result_status.replace('_', ' ')}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Next Action */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Next Action *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(NEXT_ACTION).map(([key, value]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleActionChange(value as NextAction)}
                  className={`flex items-center gap-2 p-3 border rounded-lg transition-all duration-200 ${
                    nextAction === value
                      ? `${getActionColor(value as NextAction)} border-2`
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  {getActionIcon(value as NextAction)}
                  <span className="font-medium">{key.charAt(0).toUpperCase() + key.slice(1).toLowerCase()}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Descriptions */}
          <div className="text-xs text-gray-600 space-y-1 bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Wrench className="h-3 w-3 text-orange-500" />
              <span><strong>Repair:</strong> Device needs repair work by technician</span>
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-3 w-3 text-red-500" />
              <span><strong>Replace:</strong> Device should be replaced due to failures</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-3 w-3 text-gray-500" />
              <span><strong>Ignore:</strong> No action required, device is acceptable</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-3 w-3 text-purple-500" />
              <span><strong>Escalate:</strong> Requires senior technician or management review</span>
            </div>
          </div>

          {/* Feedback Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Feedback Notes *
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide detailed feedback and instructions for the technician..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={6}
              required
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <GlassButton
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              variant="secondary"
            >
              Cancel
            </GlassButton>
            <GlassButton
              type="submit"
              disabled={isSubmitting || !nextAction}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
              {isSubmitting ? 'Submitting...' : 'Submit Action'}
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};

export default AdminFeedbackModal;