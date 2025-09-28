import React, { useState } from 'react';
import { 
  Unlock, 
  X, 
  Eye,
  EyeOff,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import VirtualKeyboard from '../shared/VirtualKeyboard';

interface DayOpeningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDay: () => void;
  currentUser: any;
  lastClosureInfo?: {
    closedAt?: string;
    closedBy?: string;
  } | null;
}

const DayOpeningModal: React.FC<DayOpeningModalProps> = ({
  isOpen,
  onClose,
  onOpenDay,
  currentUser,
  lastClosureInfo
}) => {
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleKeyPress = (key: string) => {
    if (passcode.length < 4) {
      setPasscode(prev => prev + key);
    }
  };

  const handleBackspace = () => {
    setPasscode(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPasscode('');
  };

  const handleOpenDay = async () => {
    try {
      setLoading(true);
      
      // Verify passcode (same as closing passcode)
      if (passcode !== '1234') { // Default passcode - should match closing passcode
        toast.error('Invalid passcode');
        return;
      }

      // Clear any existing closure record for today
      // This allows the day to be "opened" again
      const today = new Date().toISOString().split('T')[0];
      
      // You can add logic here to clear the closure record if needed
      // For now, we'll just proceed with opening the day
      
      toast.success('Day opened successfully! 🎉');
      onOpenDay();
      onClose();
    } catch (error) {
      console.error('Error opening day:', error);
      toast.error('Failed to open day');
    } finally {
      setLoading(false);
    }
  };

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

  const formatDate = (timeString?: string) => {
    if (!timeString) return 'Unknown date';
    try {
      return new Date(timeString).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Unknown date';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Unlock className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Open New Day</h3>
              <p className="text-sm text-gray-600">Enter passcode to start new day</p>
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
          <div className="space-y-6">
            {/* Last Closure Info */}
            {lastClosureInfo && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Last Day Closed
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium text-gray-900">
                      {formatDate(lastClosureInfo.closedAt)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time:</span>
                    <span className="font-medium text-gray-900">
                      {formatTime(lastClosureInfo.closedAt)}
                    </span>
                  </div>
                  {lastClosureInfo.closedBy && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Closed by:</span>
                      <span className="font-medium text-gray-900">
                        {lastClosureInfo.closedBy}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Warning */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-orange-800 font-medium">
                    Daily sales are currently closed
                  </p>
                  <p className="text-sm text-orange-700 mt-1">
                    Enter the passcode to open a new day and allow sales to continue.
                  </p>
                </div>
              </div>
            </div>

            {/* Passcode Input */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Passcode
                </label>
                <div className="relative">
                  <input
                    type={showPasscode ? 'text' : 'password'}
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="Enter 4-digit passcode"
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-center text-lg tracking-widest"
                    maxLength={4}
                    readOnly
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasscode(!showPasscode)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasscode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Same passcode used for closing the day
                </p>
              </div>

              {/* Virtual Keyboard */}
              <div>
                <VirtualKeyboard
                  onKeyPress={handleKeyPress}
                  onBackspace={handleBackspace}
                  onClear={handleClear}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Current User Info */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Opening day as: {currentUser?.name || currentUser?.email || 'Unknown User'}
                  </p>
                  <p className="text-xs text-blue-700">
                    Role: {currentUser?.role || 'Unknown'}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleOpenDay}
                disabled={passcode.length !== 4 || loading}
                className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4" />
                {loading ? 'Opening...' : 'Open Day'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="px-6 pb-6">
          <p className="text-xs text-gray-500 text-center">
            Opening a new day will allow sales to continue normally
          </p>
        </div>
      </div>
    </div>
  );
};

export default DayOpeningModal;
