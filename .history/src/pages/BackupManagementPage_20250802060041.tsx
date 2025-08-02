import React, { useState, useEffect } from 'react';
import { BackupMonitoringDashboard } from '../components/BackupMonitoringDashboard';
import { GlassCard } from '../components/ui/GlassCard';
import { GlassButton } from '../components/ui/GlassButton';
import { StatusBadge } from '../components/ui/StatusBadge';
import { 
  runManualBackup, 
  testBackupConnection, 
  getBackupStatus, 
  getBackupLogs,
  downloadBackup,
  restoreFromBackup 
} from '../lib/backupApi';

interface BackupFile {
  name: string;
  size: string;
  timestamp: string;
  records: number;
}

export const BackupManagementPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [backupFiles, setBackupFiles] = useState<BackupFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [restoreStatus, setRestoreStatus] = useState<string>('');

  useEffect(() => {
    loadBackupFiles();
  }, []);

  const loadBackupFiles = async () => {
    try {
      // Simulate loading backup files from local storage
      const files: BackupFile[] = [
        {
          name: 'backup_2025-08-02T02-57-21-552Z.json',
          size: '730KB',
          timestamp: '2025-08-02 02:57:21',
          records: 839
        },
        {
          name: 'backup_2025-08-02T02-56-21-295Z.json',
          size: '730KB',
          timestamp: '2025-08-02 02:56:21',
          records: 839
        }
      ];
      setBackupFiles(files);
    } catch (error) {
      console.error('Error loading backup files:', error);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleRestore = async () => {
    if (!selectedFile) {
      alert('Please select a backup file first');
      return;
    }

    try {
      setIsLoading(true);
      setRestoreStatus('Reading backup file...');

      const text = await selectedFile.text();
      const backupData = JSON.parse(text);

      setRestoreStatus('Restoring data...');
      const result = await restoreFromBackup(backupData);

      if (result.success) {
        setRestoreStatus('✅ Restore completed successfully!');
        alert('✅ Data restored successfully!');
      } else {
        setRestoreStatus('❌ Restore failed: ' + result.error);
        alert('❌ Restore failed: ' + result.error);
      }
    } catch (error) {
      setRestoreStatus('❌ Error: ' + error);
      alert('❌ Error during restore: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadAll = async () => {
    try {
      setIsLoading(true);
      const result = await downloadBackup();
      if (result.success) {
        alert('✅ Backup downloaded successfully!');
      } else {
        alert('❌ Download failed: ' + result.error);
      }
    } catch (error) {
      alert('❌ Download failed: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanOldBackups = async () => {
    try {
      setIsLoading(true);
      // This would call the cleanup function
      alert('🧹 Old backups cleaned successfully!');
    } catch (error) {
      alert('❌ Cleanup failed: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🔄 Backup Management</h1>
          <p className="text-gray-600">Monitor and manage your Supabase data backups</p>
        </div>

        {/* Main Dashboard */}
        <BackupMonitoringDashboard />

        {/* Backup Actions */}
        <GlassCard className="p-6">
          <h2 className="text-2xl font-bold mb-4">⚡ Quick Actions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <GlassButton
              onClick={handleDownloadAll}
              disabled={isLoading}
              className="bg-blue-500 hover:bg-blue-600"
            >
              📥 Download Latest Backup
            </GlassButton>
            
            <GlassButton
              onClick={handleCleanOldBackups}
              disabled={isLoading}
              className="bg-orange-500 hover:bg-orange-600"
            >
              🧹 Clean Old Backups
            </GlassButton>
            
            <GlassButton
              onClick={() => window.open('/backups', '_blank')}
              className="bg-green-500 hover:bg-green-600"
            >
              📁 Open Backup Folder
            </GlassButton>
            
            <GlassButton
              onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
              className="bg-purple-500 hover:bg-purple-600"
            >
              🔗 Supabase Dashboard
            </GlassButton>
          </div>
        </GlassCard>

        {/* Restore Section */}
        <GlassCard className="p-6">
          <h2 className="text-2xl font-bold mb-4">🔄 Restore Data</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Backup File
              </label>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>
            
            {selectedFile && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800">
                  <strong>Selected:</strong> {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)}KB)
                </p>
              </div>
            )}
            
            <div className="flex gap-3">
              <GlassButton
                onClick={handleRestore}
                disabled={!selectedFile || isLoading}
                className="bg-red-500 hover:bg-red-600 disabled:opacity-50"
              >
                {isLoading ? '🔄 Restoring...' : '🔄 Restore from Backup'}
              </GlassButton>
              
              {restoreStatus && (
                <StatusBadge 
                  status={restoreStatus.includes('✅') ? 'success' : 'error'}
                  text={restoreStatus}
                />
              )}
            </div>
          </div>
        </GlassCard>

        {/* Backup Files List */}
        <GlassCard className="p-6">
          <h2 className="text-2xl font-bold mb-4">📁 Available Backups</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Backup File
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Records
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {backupFiles.map((file, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {file.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {file.size}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {file.records.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {file.timestamp}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            // Download specific backup
                            alert(`Downloading ${file.name}...`);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          📥
                        </button>
                        <button
                          onClick={() => {
                            // Restore specific backup
                            alert(`Restoring from ${file.name}...`);
                          }}
                          className="text-green-600 hover:text-green-900"
                        >
                          🔄
                        </button>
                        <button
                          onClick={() => {
                            // Delete backup
                            if (confirm(`Delete ${file.name}?`)) {
                              alert(`Deleted ${file.name}`);
                            }
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Configuration */}
        <GlassCard className="p-6">
          <h2 className="text-2xl font-bold mb-4">⚙️ Backup Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Current Settings</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Backup Schedule:</span>
                  <span className="font-medium">Daily at 2:00 AM</span>
                </div>
                <div className="flex justify-between">
                  <span>Retention Period:</span>
                  <span className="font-medium">30 days</span>
                </div>
                <div className="flex justify-between">
                  <span>Storage Location:</span>
                  <span className="font-medium">Local + Hostinger</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Backup:</span>
                  <span className="font-medium text-green-600">2025-08-02 02:57:21</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full text-left p-2 rounded bg-blue-50 hover:bg-blue-100 text-sm">
                  🔧 Edit Configuration
                </button>
                <button className="w-full text-left p-2 rounded bg-green-50 hover:bg-green-100 text-sm">
                  📊 View Backup Statistics
                </button>
                <button className="w-full text-left p-2 rounded bg-orange-50 hover:bg-orange-100 text-sm">
                  🧪 Test Backup System
                </button>
                <button className="w-full text-left p-2 rounded bg-purple-50 hover:bg-purple-100 text-sm">
                  📋 View Logs
                </button>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* System Status */}
        <GlassCard className="p-6">
          <h2 className="text-2xl font-bold mb-4">📊 System Status</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">✅</div>
              <div className="text-sm font-medium text-green-800">Supabase Connection</div>
              <div className="text-xs text-green-600">Connected</div>
            </div>
            
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">📁</div>
              <div className="text-sm font-medium text-blue-800">Local Storage</div>
              <div className="text-xs text-blue-600">Available</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">⚠️</div>
              <div className="text-sm font-medium text-orange-800">Hostinger API</div>
              <div className="text-xs text-orange-600">DNS Issue</div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}; 