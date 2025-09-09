import React, { useState, useMemo } from 'react';
import { 
  Smartphone, 
  Droplet, 
  Plug, 
  Key, 
  Volume2, 
  Camera, 
  Wifi, 
  Bluetooth, 
  Battery, 
  Mic, 
  Speaker, 
  Cpu, 
  HardDrive, 
  Shield, 
  Layers, 
  User, 
  AlertTriangle,
  Wrench,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Zap,
  Info,
  ThumbsUp,
  Clock,
  Star,
  X
} from 'lucide-react';
import Modal from '../../shared/components/ui/Modal';
import GlassButton from '../../shared/components/ui/GlassButton';

export interface ConditionAssessmentProps {
  isOpen: boolean;
  onClose: () => void;
  selectedConditions: string[];
  onConditionsChange: (conditions: string[]) => void;
  otherText: string;
  onOtherTextChange: (text: string) => void;
}

// Simplified condition list with most common issues
const COMMON_ISSUES = [
  { id: 'screen_cracked', label: 'Screen Cracked', icon: <Smartphone size={16} className="text-red-500" />, category: 'Physical' },
  { id: 'no_power', label: 'No Power', icon: <Battery size={16} className="text-red-500" />, category: 'Power' },
  { id: 'charging_issue', label: 'Charging Issue', icon: <Plug size={16} className="text-orange-500" />, category: 'Power' },
  { id: 'water_damage', label: 'Water Damage', icon: <Droplet size={16} className="text-blue-500" />, category: 'Physical' },
  { id: 'camera_issue', label: 'Camera Issue', icon: <Camera size={16} className="text-purple-500" />, category: 'Hardware' },
  { id: 'speaker_issue', label: 'Speaker Issue', icon: <Speaker size={16} className="text-yellow-500" />, category: 'Audio' },
  { id: 'wifi_issue', label: 'WiFi Issue', icon: <Wifi size={16} className="text-green-500" />, category: 'Connectivity' },
  { id: 'bluetooth_issue', label: 'Bluetooth Issue', icon: <Bluetooth size={16} className="text-blue-500" />, category: 'Connectivity' },
  { id: 'touch_issue', label: 'Touch Not Working', icon: <Smartphone size={16} className="text-red-500" />, category: 'Display' },
  { id: 'microphone_issue', label: 'Microphone Issue', icon: <Mic size={16} className="text-gray-500" />, category: 'Audio' },
  { id: 'button_issue', label: 'Buttons Not Working', icon: <Key size={16} className="text-gray-500" />, category: 'Hardware' },
  { id: 'performance_issue', label: 'Performance Issue', icon: <Cpu size={16} className="text-orange-500" />, category: 'Software' },
  { id: 'storage_issue', label: 'Storage Issue', icon: <HardDrive size={16} className="text-blue-500" />, category: 'Hardware' },
  { id: 'back_cover_damaged', label: 'Back Cover Damaged', icon: <Shield size={16} className="text-red-500" />, category: 'Physical' },
  { id: 'frame_bent', label: 'Frame Bent', icon: <Smartphone size={16} className="text-red-500" />, category: 'Physical' },
  { id: 'other', label: 'Other Issue', icon: <Info size={16} className="text-gray-500" />, category: 'Other' }
];

const ConditionAssessment: React.FC<ConditionAssessmentProps> = ({
  isOpen,
  onClose,
  selectedConditions,
  onConditionsChange,
  otherText,
  onOtherTextChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(false);

  const handleConditionToggle = (conditionId: string) => {
    if (conditionId === 'other') {
      if (selectedConditions.includes('other')) {
        onConditionsChange(selectedConditions.filter(c => c !== 'other'));
        setShowOtherInput(false);
      } else {
        onConditionsChange([...selectedConditions, 'other']);
        setShowOtherInput(true);
      }
    } else {
      if (selectedConditions.includes(conditionId)) {
        onConditionsChange(selectedConditions.filter(c => c !== conditionId));
      } else {
        onConditionsChange([...selectedConditions, conditionId]);
      }
    }
  };

  const handleNoIssuesToggle = () => {
    if (selectedConditions.length === 0) {
      // If no issues selected, select "no issues"
      onConditionsChange(['no_issues']);
    } else {
      // Clear all issues
      onConditionsChange([]);
      setShowOtherInput(false);
      onOtherTextChange('');
    }
  };

  const handleClearAll = () => {
    onConditionsChange([]);
    setShowOtherInput(false);
    onOtherTextChange('');
    setSearchQuery('');
  };

  const handleSave = () => {
    onClose();
  };

  const noIssuesSelected = selectedConditions.includes('no_issues');
  const hasOtherIssue = selectedConditions.includes('other');

  const filteredIssues = COMMON_ISSUES.filter(issue => 
    issue.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (issue.category && issue.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getSelectedCount = () => {
    const count = selectedConditions.filter(c => c !== 'no_issues').length;
    return count + (hasOtherIssue && otherText.trim() ? 1 : 0);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <AlertTriangle size={24} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Device Issues</h2>
            <p className="text-sm text-gray-600">Quick select all issues found</p>
          </div>
        </div>
      } 
      maxWidth="800px"
    >
      <div className="p-6 space-y-6">
        {/* No Issues Option */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={noIssuesSelected}
              onChange={handleNoIssuesToggle}
              className="w-5 h-5 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
            />
            <div className="flex items-center gap-2">
              <ThumbsUp size={20} className="text-green-600" />
              <span className="font-semibold text-green-800">No Issues Found</span>
            </div>
            <span className="text-sm text-green-700 ml-2">
              (Device is in perfect condition)
            </span>
          </label>
        </div>

        {/* Search Bar */}
        {!noIssuesSelected && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}

        {/* Selected Issues Summary */}
        {getSelectedCount() > 0 && !noIssuesSelected && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <CheckCircle size={16} />
              Selected Issues ({getSelectedCount()})
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedConditions.filter(c => c !== 'no_issues').map((conditionId) => {
                const issue = COMMON_ISSUES.find(i => i.id === conditionId);
                return (
                <span
                    key={conditionId}
                  className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold flex items-center gap-1 hover:bg-blue-200 transition-colors"
                >
                    {issue?.icon}
                    {issue?.label || conditionId}
                  <button
                      onClick={() => handleConditionToggle(conditionId)}
                    className="ml-1 hover:text-blue-600"
                      title="Remove this issue"
                  >
                      <X size={12} />
                  </button>
                  </span>
                );
              })}
              {hasOtherIssue && otherText.trim() && (
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold flex items-center gap-1">
                  <Info size={12} />
                  Other: {otherText.trim().substring(0, 20)}...
                </span>
              )}
            </div>
          </div>
        )}

        {/* Issues Grid */}
        {!noIssuesSelected && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredIssues.map((issue) => (
              <button
                key={issue.id}
                onClick={() => handleConditionToggle(issue.id)}
                className={`p-3 rounded-lg border-2 transition-all duration-200 flex items-center gap-2 text-left ${
                  selectedConditions.includes(issue.id)
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                <div className="flex-shrink-0">
                  {issue.icon}
                </div>
                <span className="text-sm font-medium text-gray-700 truncate">
                  {issue.label}
                </span>
                {selectedConditions.includes(issue.id) && (
                  <CheckCircle size={14} className="text-blue-500 ml-auto flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* No Results Message */}
        {searchQuery && filteredIssues.length === 0 && !noIssuesSelected && (
          <div className="text-center py-8">
            <Search size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No issues found matching "{searchQuery}"</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-2 text-blue-600 hover:text-blue-700 underline"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Other Issues Input */}
        {showOtherInput && !noIssuesSelected && (
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <Info size={16} className="text-gray-500" />
              Describe Other Issue
            </label>
            <textarea
              value={otherText}
              onChange={(e) => onOtherTextChange(e.target.value)}
              placeholder="Describe the issue in detail..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              rows={3}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex gap-2">
            <button
              onClick={handleClearAll}
              className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
            >
              <XCircle size={16} />
              Clear All
            </button>
          </div>
          <div className="text-sm text-gray-600">
            {noIssuesSelected ? (
              <span className="text-green-600 font-medium">✓ No issues reported</span>
            ) : (
              `${getSelectedCount()} issue(s) selected`
            )}
          </div>
          <div className="flex gap-3">
            <GlassButton
              variant="secondary"
              onClick={onClose}
            >
              Cancel
            </GlassButton>
            <GlassButton
              variant="primary"
              onClick={handleSave}
            >
              Save Issues
            </GlassButton>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ConditionAssessment; 