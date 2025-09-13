import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Bell, Shield, Cloud, HardDrive, Settings, Save } from 'lucide-react';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import { 
  getAutomaticBackupConfig, 
  saveAutomaticBackupConfig, 
  toggleAutomaticBackup,
  AutomaticBackupConfig 
} from '../../../lib/backupApi';

interface AutomaticBackupSettingsProps {
  onConfigChange?: (config: AutomaticBackupConfig) => void;
}

export const AutomaticBackupSettings: React.FC<AutomaticBackupSettingsProps> = ({ onConfigChange }) => {
  const [config, setConfig] = useState<AutomaticBackupConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoading(true);
      const backupConfig = await getAutomaticBackupConfig();
      setConfig(backupConfig);
    } catch (error) {
      console.error('Error loading automatic backup config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleEnabled = async () => {
    if (!config) return;
    
    try {
      const result = await toggleAutomaticBackup(!config.enabled);
      if (result.success) {
        const newConfig = { ...config, enabled: !config.enabled };
        setConfig(newConfig);
        setHasChanges(true);
        onConfigChange?.(newConfig);
      }
    } catch (error) {
      console.error('Error toggling automatic backup:', error);
    }
  };

  const handleConfigChange = (field: keyof AutomaticBackupConfig, value: any) => {
    if (!config) return;
    
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!config) return;
    
    try {
      setIsSaving(true);
      const result = await saveAutomaticBackupConfig(config);
      if (result.success) {
        setHasChanges(false);
        onConfigChange?.(config);
      }
    } catch (error) {
      console.error('Error saving automatic backup config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <GlassCard className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading backup settings...</p>
        </div>
      </GlassCard>
    );
  }

  if (!config) {
    return (
      <GlassCard className="p-6">
        <div className="text-center">
          <p className="text-gray-600">Failed to load backup settings</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Automatic Backup Settings</h3>
          <p className="text-gray-600">Configure automatic backup schedules and preferences</p>
        </div>
        <Calendar className="w-8 h-8 text-purple-600" />
      </div>

      <div className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Enable Automatic Backup</h4>
              <p className="text-sm text-gray-600">Automatically backup data at scheduled intervals</p>
            </div>
          </div>
          <button
            onClick={handleToggleEnabled}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              config.enabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                config.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Schedule Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Frequency
            </label>
            <select
              value={config.frequency}
              onChange={(e) => handleConfigChange('frequency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Time
            </label>
            <input
              type="time"
              value={config.time}
              onChange={(e) => handleConfigChange('time', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Shield className="w-4 h-4 inline mr-1" />
              Max Backups
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={config.maxBackups}
              onChange={(e) => handleConfigChange('maxBackups', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Cloud Settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center">
            <Cloud className="w-5 h-5 mr-2 text-blue-600" />
            Cloud Backup Settings
          </h4>
          
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div>
              <h5 className="font-medium text-gray-900">Include Cloud Storage</h5>
              <p className="text-sm text-gray-600">Automatically sync backups to cloud storage</p>
            </div>
            <input
              type="checkbox"
              checked={config.includeCloud}
              onChange={(e) => handleConfigChange('includeCloud', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
        </div>

        {/* Cleanup Settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center">
            <HardDrive className="w-5 h-5 mr-2 text-green-600" />
            Cleanup Settings
          </h4>
          
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div>
              <h5 className="font-medium text-gray-900">Auto Cleanup</h5>
              <p className="text-sm text-gray-600">Automatically remove old backups when limit is reached</p>
            </div>
            <input
              type="checkbox"
              checked={config.autoCleanup}
              onChange={(e) => handleConfigChange('autoCleanup', e.target.checked)}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
          </div>
        </div>

        {/* Notification Settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center">
            <Bell className="w-5 h-5 mr-2 text-purple-600" />
            Notification Settings
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div>
                <h5 className="font-medium text-gray-900">Notify on Success</h5>
                <p className="text-sm text-gray-600">Send notification when backup completes successfully</p>
              </div>
              <input
                type="checkbox"
                checked={config.notifyOnSuccess}
                onChange={(e) => handleConfigChange('notifyOnSuccess', e.target.checked)}
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div>
                <h5 className="font-medium text-gray-900">Notify on Failure</h5>
                <p className="text-sm text-gray-600">Send notification when backup fails</p>
              </div>
              <input
                type="checkbox"
                checked={config.notifyOnFailure}
                onChange={(e) => handleConfigChange('notifyOnFailure', e.target.checked)}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </div>

        {/* Startup/Shutdown Settings */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 flex items-center">
            <Settings className="w-5 h-5 mr-2 text-orange-600" />
            Application Settings
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div>
                <h5 className="font-medium text-gray-900">Backup on Startup</h5>
                <p className="text-sm text-gray-600">Create backup when application starts</p>
              </div>
              <input
                type="checkbox"
                checked={config.backupOnStartup}
                onChange={(e) => handleConfigChange('backupOnStartup', e.target.checked)}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div>
                <h5 className="font-medium text-gray-900">Backup on Shutdown</h5>
                <p className="text-sm text-gray-600">Create backup when application closes</p>
              </div>
              <input
                type="checkbox"
                checked={config.backupOnShutdown}
                onChange={(e) => handleConfigChange('backupOnShutdown', e.target.checked)}
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div className="flex justify-end pt-4 border-t">
            <GlassButton
              onClick={handleSave}
              disabled={isSaving}
              icon={<Save size={16} />}
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </GlassButton>
          </div>
        )}
      </div>
    </GlassCard>
  );
};

export default AutomaticBackupSettings;
