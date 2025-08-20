import React from 'react';
import { Save, Settings, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { useUnifiedSettings } from './UnifiedSettingsContext';

const UnifiedSettingsSaveButton: React.FC = () => {
  const { 
    hasChanges, 
    isSaving, 
    lastSaved, 
    saveAllSettings, 
    resetAllSettings 
  } = useUnifiedSettings();

  return (
    <div className="sticky bottom-4 z-50">
      <div className="bg-white/80 backdrop-blur-md border border-gray-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-gray-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                {hasChanges ? 'Unsaved Changes' : 'All Settings Saved'}
              </p>
              {lastSaved && (
                <p className="text-xs text-gray-500">
                  Last saved: {lastSaved.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {hasChanges && (
              <button
                onClick={resetAllSettings}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="h-4 w-4" />
                Reset
              </button>
            )}
            
            <button
              onClick={saveAllSettings}
              disabled={isSaving || !hasChanges}
              className="
                flex items-center justify-center gap-2 backdrop-blur-md rounded-lg border transition-all duration-300
                bg-gradient-to-r from-blue-500/80 to-indigo-500/80 hover:from-blue-600/90 hover:to-indigo-600/90 text-white border-white/20
                py-2 px-4 text-base
                hover:shadow-lg active:scale-[0.98] focus:ring-2 focus:ring-white/30 hover:border-white/40 backdrop-blur-xl
                flex-1 py-4 text-lg font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 text-white
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : hasChanges ? (
                <>
                  <Save className="h-5 w-5" />
                  Save Settings
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  All Settings Saved
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedSettingsSaveButton;
