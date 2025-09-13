import React from 'react';
import { Clock, Download, X } from 'lucide-react';
import GlassCard from '../../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../../features/shared/components/ui/GlassButton';

interface DraftNotificationProps {
  draftCount: number;
  onViewDrafts: () => void;
  onDismiss: () => void;
  isVisible: boolean;
}

const DraftNotification: React.FC<DraftNotificationProps> = ({
  draftCount,
  onViewDrafts,
  onDismiss,
  isVisible
}) => {
  if (!isVisible || draftCount === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-40 animate-in slide-in-from-right duration-300">
      <GlassCard className="p-4 shadow-lg border-l-4 border-blue-500">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800">
              {draftCount} saved draft{draftCount !== 1 ? 's' : ''} available
            </p>
            <p className="text-xs text-gray-500 mt-1">
              You can continue from where you left off
            </p>
          </div>

          <div className="flex items-center gap-2">
            <GlassButton
              size="sm"
              onClick={onViewDrafts}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="w-4 h-4 mr-1" />
              View
            </GlassButton>
            
            <button
              onClick={onDismiss}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default DraftNotification;
