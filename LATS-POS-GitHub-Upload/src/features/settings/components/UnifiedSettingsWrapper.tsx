import React from 'react';
import UnifiedSettingsProvider from './UnifiedSettingsProvider';
import UnifiedSettingsSaveButton from './UnifiedSettingsSaveButton';

interface UnifiedSettingsWrapperProps {
  children: React.ReactNode;
  onSettingsChange?: (settings: any) => void;
}

const UnifiedSettingsWrapper: React.FC<UnifiedSettingsWrapperProps> = ({ 
  children, 
  onSettingsChange 
}) => {
  return (
    <UnifiedSettingsProvider onSettingsChange={onSettingsChange}>
      <div className="space-y-6">
        {/* Settings Content */}
        <div className="flex-1">
          {children}
        </div>

        {/* Unified Save Button */}
        <UnifiedSettingsSaveButton />
      </div>
    </UnifiedSettingsProvider>
  );
};

export default UnifiedSettingsWrapper;
