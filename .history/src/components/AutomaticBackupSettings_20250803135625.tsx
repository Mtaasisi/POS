import React, { useState, useEffect } from 'react';
import GlassCard from './ui/GlassCard';
import GlassButton from './ui/GlassButton';
import { 
  Clock, Calendar, Cloud, Bell, Settings, ToggleLeft, ToggleRight,
  Trash2, Download, Upload, Shield, Zap, AlertCircle, CheckCircle, X
} from 'lucide-react';
import { 
  getAutomaticBackupConfig, 
  saveAutomaticBackupConfig, 
  toggleAutomaticBackup,
  getBackupSchedules,
  AutomaticBackupConfig,
  BackupSchedule
} from '../lib/backupApi';

interface AutomaticBackupSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AutomaticBackupSettings: React.FC<AutomaticBackupSettingsProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<AutomaticBackupConfig | null>(null);
  const [schedules, setSchedules] = useState<BackupSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadConfig();
      loadSchedules();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    try {
      const autoConfig = await getAutomaticBackupConfig();
      setConfig(autoConfig);
    } catch (error) {
      console.error('Error loading automatic backup config:', error);
    }
  };

  const loadSchedules = async () => {
    try {
      const backupSchedules = await getBackupSchedules();
      setSchedules(backupSchedules);
    } catch (error) {
      console.error('Error loading backup schedules:', error);
    }
  };

  const handleToggleAutomatic = async () => {
    if (!config) return;
    
    try {
      setIsLoading(true);
      const result = await toggleAutomaticBackup(!config.enabled);
      
      if (result.success) {
        await loadConfig();
        await loadSchedules();
        alert(result.message);
      } else {
        alert('❌ ' + result.error);
      }
    } catch (error) {
      alert('❌ Failed to toggle automatic backup');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;
    
    try {
      setIsSaving(true);
      const result = await saveAutomaticBackupConfig(config);
      
      if (result.success) {
        await loadSchedules();
        alert(result.message);
      } else {
        alert('❌ ' + result.error);
      }
    } catch (error) {
      alert('❌ Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfigChange = (key: keyof AutomaticBackupConfig, value: any) => {
    if (!config) return;
    setConfig({ ...config, [key]: value });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Automatic Backup Settings</h2>
              <p className="text-sm text-gray-600">Configure automated backup schedules</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!config ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-sm text-gray-600 mt-2">Loading automatic backup settings...</p>
            </div>
          ) : (
            <>
              {/* Main Toggle */}
              <GlassCard className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Settings className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">Automatic Backup</h3>
                      <p className="text-sm text-gray-600">
                        {config.enabled ? 'Enabled' : 'Disabled'} - {config.frequency} at {config.time}
                      </p>
                    </div>
                  </div>
                  <GlassButton
                    onClick={handleToggleAutomatic}
                    disabled={isLoading}
                    className={`flex items-center gap-2 px-4 py-2 ${
                      config.enabled 
                        ? 'bg-green-500 hover:bg-green-600 text-white' 
                        : 'bg-gray-500 hover:bg-gray-600 text-white'
                    }`}
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : config.enabled ? (
                      <>
                        <ToggleRight className="w-4 h-4" />
                        <span>Enabled</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4" />
                        <span>Disabled</span>
                      </>
                    )}
                  </GlassButton>
                </div>
              </GlassCard>

              {/* Configuration Options */}
              <GlassCard className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Backup Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Frequency */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Backup Frequency
                    </label>
                    <select
                      value={config.frequency}
                      onChange={(e) => handleConfigChange('frequency', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="hourly">Every Hour</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>

                  {/* Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="w-4 h-4 inline mr-2" />
                      Backup Time
                    </label>
                    <input
                      type="time"
                      value={config.time}
                      onChange={(e) => handleConfigChange('time', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Cloud Backup */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Cloud className="w-4 h-4 inline mr-2" />
                      Include Cloud Backup
                    </label>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.includeCloud}
                        onChange={(e) => handleConfigChange('includeCloud', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-600">Automatically sync to Dropbox</span>
                    </div>
                  </div>

                  {/* Max Backups */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Trash2 className="w-4 h-4 inline mr-2" />
                      Maximum Backups
                    </label>
                    <input
                      type="number"
                      value={config.maxBackups}
                      onChange={(e) => handleConfigChange('maxBackups', parseInt(e.target.value))}
                      min="1"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Advanced Options */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-md font-semibold text-gray-800 mb-3">Advanced Options</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.autoCleanup}
                        onChange={(e) => handleConfigChange('autoCleanup', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-600">Auto cleanup old backups</span>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.notifyOnSuccess}
                        onChange={(e) => handleConfigChange('notifyOnSuccess', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-600">Notify on successful backup</span>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.notifyOnFailure}
                        onChange={(e) => handleConfigChange('notifyOnFailure', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-600">Notify on backup failure</span>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.backupOnStartup}
                        onChange={(e) => handleConfigChange('backupOnStartup', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-600">Backup on system startup</span>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.backupOnShutdown}
                        onChange={(e) => handleConfigChange('backupOnShutdown', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-600">Backup on system shutdown</span>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="mt-6 flex justify-end">
                  <GlassButton
                    onClick={handleSaveConfig}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                  >
                    {isSaving ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </div>
                    ) : (
                      <span>Save Configuration</span>
                    )}
                  </GlassButton>
                </div>
              </GlassCard>

              {/* Schedule Information */}
              {schedules.length > 0 && (
                <GlassCard className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Backup Schedule</h3>
                  
                  {schedules.map((schedule) => (
                    <div key={schedule.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-800">{schedule.name}</h4>
                          <p className="text-sm text-gray-600">
                            {schedule.type === 'complete' ? 'Local + Cloud' : 'Local Only'}
                          </p>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs ${
                          schedule.enabled 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {schedule.enabled ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Next Run:</span>
                          <p className="font-medium">
                            {schedule.nextRun ? new Date(schedule.nextRun).toLocaleString() : 'Not scheduled'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-600">Last Run:</span>
                          <p className="font-medium">
                            {schedule.lastRun ? new Date(schedule.lastRun).toLocaleString() : 'Never'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </GlassCard>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}; 