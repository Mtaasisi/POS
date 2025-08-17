// Universal Settings Tab Component
import React from 'react';
import { Save, X, RefreshCw } from 'lucide-react';
import GlassButton from '../../../shared/components/ui/GlassButton';

interface UniversalSettingsTabProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  onSave: () => void;
  onReset: () => void;
  onCancel: () => void;
  isSaving?: boolean;
  isDirty?: boolean;
  isLoading?: boolean;
}

const UniversalSettingsTab: React.FC<UniversalSettingsTabProps> = ({
  title,
  description,
  icon,
  children,
  onSave,
  onReset,
  onCancel,
  isSaving = false,
  isDirty = false,
  isLoading = false
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 rounded-lg">
          {icon}
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>

      {/* Settings Content */}
      <div className="space-y-6">
        {children}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <GlassButton
            type="button"
            onClick={onReset}
            variant="secondary"
            disabled={isSaving}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </GlassButton>
        </div>
        <div className="flex items-center gap-3">
          <GlassButton
            type="button"
            onClick={onCancel}
            variant="secondary"
            disabled={isSaving}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </GlassButton>
          <GlassButton
            type="button"
            onClick={onSave}
            disabled={!isDirty || isSaving}
            loading={isSaving}
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Settings'}
          </GlassButton>
        </div>
      </div>
    </div>
  );
};

export default UniversalSettingsTab;
