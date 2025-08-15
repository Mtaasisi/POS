import React, { useState, useEffect } from 'react';
import { 
  Database, Download, Upload, Settings, CheckCircle, AlertCircle, 
  Clock, FileText, HardDrive, Cloud, RefreshCw, Play, Square,
  Calendar, Bell, Shield, Trash2, Plus, Eye, Download as DownloadIcon
} from 'lucide-react';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import { 
  getBackupStatus, 
  getBackupFiles, 
  runManualBackup, 
  downloadBackup,
  restoreFromBackup,
  getAutomaticBackupConfig,
  saveAutomaticBackupConfig,
  toggleAutomaticBackup,
  cleanOldBackups,
  getBackupLogs,
  runSqlBackup,
  getSqlBackupStatus,
  downloadSqlBackup,
  testSqlBackupConnection,
  BackupStatus,
  BackupFile,
  BackupResult,
  AutomaticBackupConfig,
  SqlBackupResult
} from '../../../lib/backupApi';

interface BackupManagementPageProps {}

export const BackupManagementPage: React.FC<BackupManagementPageProps> = () => {
  const [backupStatus, setBackupStatus] = useState<BackupStatus | null>(null);
  const [backupFiles, setBackupFiles] = useState<BackupFile[]>([]);
  const [autoConfig, setAutoConfig] = useState<AutomaticBackupConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningBackup, setIsRunningBackup] = useState(false);
  const [isRunningSqlBackup, setIsRunningSqlBackup] = useState(false);
  const [backupType, setBackupType] = useState<'local' | 'dropbox' | 'complete'>('complete');
  const [sqlBackupType, setSqlBackupType] = useState<'full' | 'schema' | 'data'>('full');
  const [sqlBackupFormat, setSqlBackupFormat] = useState<'sql' | 'custom'>('sql');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [backupLogs, setBackupLogs] = useState<string[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<BackupFile | null>(null);

  useEffect(() => {
    loadBackupData();
  }, []);

  const loadBackupData = async () => {
    try {
      setIsLoading(true);
      const [status, files, config, logs] = await Promise.all([
        getBackupStatus(),
        getBackupFiles(),
        getAutomaticBackupConfig(),
        getBackupLogs()
      ]);
      
      setBackupStatus(status);
      setBackupFiles(files);
      setAutoConfig(config);
      setBackupLogs(logs);
    } catch (error) {
      console.error('Error loading backup data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunBackup = async () => {
    try {
      setIsRunningBackup(true);
      const result = await runManualBackup(backupType);
      
      if (result.success) {
        alert(`✅ ${result.message}`);
        loadBackupData(); // Refresh data
      } else {
        alert(`❌ Backup failed: ${result.error}`);
      }
    } catch (error) {
      alert(`❌ Backup failed: ${error}`);
    } finally {
      setIsRunningBackup(false);
    }
  };

  const handleRunSqlBackup = async () => {
    try {
      setIsRunningSqlBackup(true);
      const result = await runSqlBackup({
        type: sqlBackupType,
        format: sqlBackupFormat,
        outputDir: '~/Desktop/SQL'
      });
      
      if (result.success) {
        alert(`✅ SQL backup completed successfully!\n\nFile: ${result.filePath}\nSize: ${result.fileSize}\nTables: ${result.tablesCount}\nRecords: ${result.recordsCount}`);
        loadBackupData();
      } else {
        // Don't show alert for expected conditions (like local server not available)
        if (!result.isExpected) {
          alert(`❌ SQL backup failed: ${result.error}`);
        } else {
          console.log('SQL backup not available:', result.message);
        }
      }
    } catch (error) {
      alert(`❌ SQL backup failed: ${error}`);
    } finally {
      setIsRunningSqlBackup(false);
    }
  };

  const handleDownloadBackup = async (file: BackupFile) => {
    try {
      const result = await downloadBackup(file.name);
      if (result.success) {
        alert('✅ Backup downloaded successfully!');
      } else {
        alert(`❌ Download failed: ${result.error}`);
      }
    } catch (error) {
      alert(`❌ Download failed: ${error}`);
    }
  };

  const handleRestoreBackup = async (file: BackupFile) => {
    if (!confirm(`Are you sure you want to restore from backup "${file.name}"? This will overwrite current data.`)) {
      return;
    }

    try {
      // This would normally load the backup data first
      const result = await restoreFromBackup({ timestamp: file.timestamp, tables: {} });
      if (result.success) {
        alert('✅ Restore completed successfully!');
      } else {
        alert(`❌ Restore failed: ${result.error}`);
      }
    } catch (error) {
      alert(`❌ Restore failed: ${error}`);
    }
  };

  const handleToggleAutoBackup = async () => {
    if (!autoConfig) return;
    
    try {
      const result = await toggleAutomaticBackup(!autoConfig.enabled);
      if (result.success) {
        setAutoConfig(prev => prev ? { ...prev, enabled: !prev.enabled } : null);
        alert(`✅ Automatic backup ${!autoConfig.enabled ? 'enabled' : 'disabled'}`);
      } else {
        alert(`❌ Failed to toggle automatic backup: ${result.error}`);
      }
    } catch (error) {
      alert(`❌ Failed to toggle automatic backup: ${error}`);
    }
  };

  const handleCleanOldBackups = async () => {
    if (!confirm('Are you sure you want to clean old backups? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await cleanOldBackups();
      if (result.success) {
        alert('✅ Old backups cleaned successfully!');
        loadBackupData();
      } else {
        alert(`❌ Failed to clean old backups: ${result.error}`);
      }
    } catch (error) {
      alert(`❌ Failed to clean old backups: ${error}`);
    }
  };

  const handleTestSqlConnection = async () => {
    try {
      const result = await testSqlBackupConnection();
      if (result.success) {
        alert('✅ SQL backup connection test successful!');
      } else {
        alert(`❌ Connection test failed: ${result.error}`);
      }
    } catch (error) {
      alert(`❌ Connection test failed: ${error}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading backup system...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Backup Management</h1>
            <p className="text-gray-600 mt-2">Manage data backups and restore points</p>
          </div>
          <GlassButton
            onClick={loadBackupData}
            icon={<RefreshCw size={20} />}
            variant="secondary"
          >
            Refresh
          </GlassButton>
        </div>

        {/* Backup Status Overview */}
        {backupStatus && (
          <GlassCard className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-3">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Last Backup</h3>
                <p className="text-sm text-gray-600">{backupStatus.lastBackup}</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-3">
                  <FileText className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Total Backups</h3>
                <p className="text-sm text-gray-600">{backupStatus.totalBackups}</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-3">
                  <HardDrive className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Total Size</h3>
                <p className="text-sm text-gray-600">{backupStatus.totalSize}</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mx-auto mb-3">
                  <Cloud className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Cloud Sync</h3>
                <p className="text-sm text-gray-600">
                  {backupStatus.dropboxConfigured ? 'Configured' : 'Not configured'}
                </p>
              </div>
            </div>
          </GlassCard>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Manual Backup Section */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Manual Backup</h3>
                <p className="text-gray-600">Create a backup of your data</p>
              </div>
              <Database className="w-8 h-8 text-blue-600" />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Backup Type
                </label>
                <select
                  value={backupType}
                  onChange={(e) => setBackupType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="complete">Complete (Local + Cloud)</option>
                  <option value="local">Local Only</option>
                  <option value="dropbox">Dropbox Only</option>
                </select>
              </div>

              <GlassButton
                onClick={handleRunBackup}
                disabled={isRunningBackup}
                icon={isRunningBackup ? <Square size={16} /> : <Play size={16} />}
                className="w-full"
              >
                {isRunningBackup ? 'Running Backup...' : 'Run Backup'}
              </GlassButton>
            </div>
          </GlassCard>

          {/* SQL Backup Section */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">SQL Database Backup</h3>
                <p className="text-gray-600">Create SQL database dumps</p>
              </div>
              <Database className="w-8 h-8 text-green-600" />
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={sqlBackupType}
                    onChange={(e) => setSqlBackupType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="full">Full Database</option>
                    <option value="schema">Schema Only</option>
                    <option value="data">Data Only</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Format
                  </label>
                  <select
                    value={sqlBackupFormat}
                    onChange={(e) => setSqlBackupFormat(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="sql">SQL</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-2">
                <GlassButton
                  onClick={handleRunSqlBackup}
                  disabled={isRunningSqlBackup}
                  icon={isRunningSqlBackup ? <Square size={16} /> : <Play size={16} />}
                  className="flex-1"
                >
                  {isRunningSqlBackup ? 'Running...' : 'Run SQL Backup'}
                </GlassButton>
                
                <GlassButton
                  onClick={handleTestSqlConnection}
                  icon={<CheckCircle size={16} />}
                  variant="secondary"
                >
                  Test
                </GlassButton>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Automatic Backup Settings */}
        {autoConfig && (
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Automatic Backup</h3>
                <p className="text-gray-600">Configure automatic backup schedules</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Enable Automatic Backup</h4>
                  <p className="text-sm text-gray-600">Automatically backup data at scheduled intervals</p>
                </div>
                <button
                  onClick={handleToggleAutoBackup}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoConfig.enabled ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoConfig.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {autoConfig.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Frequency
                    </label>
                    <select
                      value={autoConfig.frequency}
                      onChange={(e) => setAutoConfig(prev => prev ? { ...prev, frequency: e.target.value as any } : null)}
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
                      Time
                    </label>
                    <input
                      type="time"
                      value={autoConfig.time}
                      onChange={(e) => setAutoConfig(prev => prev ? { ...prev, time: e.target.value } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Backups
                    </label>
                    <input
                      type="number"
                      value={autoConfig.maxBackups}
                      onChange={(e) => setAutoConfig(prev => prev ? { ...prev, maxBackups: parseInt(e.target.value) } : null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        )}

        {/* Backup Files List */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Backup Files</h3>
              <p className="text-gray-600">Manage your backup files</p>
            </div>
            <GlassButton
              onClick={handleCleanOldBackups}
              icon={<Trash2 size={16} />}
              variant="secondary"
            >
              Clean Old
            </GlassButton>
          </div>

          {backupFiles.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No backup files found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {backupFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{file.name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{file.size}</span>
                        <span>{file.records} records</span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {file.timestamp}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          file.location === 'Local' ? 'bg-blue-100 text-blue-800' :
                          file.location === 'Dropbox' ? 'bg-green-100 text-green-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {file.location}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <GlassButton
                      onClick={() => handleDownloadBackup(file)}
                      icon={<DownloadIcon size={16} />}
                      variant="secondary"
                      size="sm"
                    >
                      Download
                    </GlassButton>
                    
                    <GlassButton
                      onClick={() => handleRestoreBackup(file)}
                      icon={<Upload size={16} />}
                      variant="secondary"
                      size="sm"
                    >
                      Restore
                    </GlassButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Backup Logs */}
        {backupLogs.length > 0 && (
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Backup Logs</h3>
                <p className="text-gray-600">Recent backup activity</p>
              </div>
              <Eye className="w-8 h-8 text-gray-600" />
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {backupLogs.map((log, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-md text-sm text-gray-700">
                  {log}
                </div>
              ))}
            </div>
          </GlassCard>
        )}
      </div>
    </div>
  );
};

export default BackupManagementPage;
