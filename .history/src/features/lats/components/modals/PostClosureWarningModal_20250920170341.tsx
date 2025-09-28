import React from 'react';
import { AlertTriangle, Clock, CheckCircle, X } from 'lucide-react';

interface PostClosureWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  closureTime?: string;
  closedBy?: string;
  userRole?: string;
}

const PostClosureWarningModal: React.FC<PostClosureWarningModalProps> = ({
  isOpen,
  onClose,
  onContinue,
  closureTime,
  closedBy,
  userRole
}) => {
  if (!isOpen) return null;

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'Unknown time';
    try {
      return new Date(timeString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'Unknown time';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Daily Sales Closed</h3>
              <p className="text-sm text-gray-600">Post-closure sale warning</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Warning Message */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-orange-800 font-medium">
                    Daily sales have been closed
                  </p>
                  <p className="text-sm text-orange-700 mt-1">
                    This sale will be recorded for tomorrow's report and may require special handling.
                  </p>
                </div>
              </div>
            </div>

            {/* Closure Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Closed at:</span>
                  <span className="font-medium text-gray-900">
                    {formatTime(closureTime)}
                  </span>
                </div>
                {closedBy && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Closed by:</span>
                    <span className="font-medium text-gray-900">{closedBy}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel Sale
              </button>
              <button
                onClick={onContinue}
                className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {userRole === 'admin' || userRole === 'manager' || userRole === 'owner' 
                  ? 'Override & Continue' 
                  : 'Continue Sale'
                }
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="px-6 pb-6">
          <p className="text-xs text-gray-500 text-center">
            Post-closure sales will be flagged in reports for review
          </p>
        </div>
      </div>
    </div>
  );
};

export default PostClosureWarningModal;
