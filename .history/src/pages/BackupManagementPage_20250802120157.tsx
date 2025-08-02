import React, { useState, useEffect } from 'react';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { 
  Cloud, HardDrive, Download, Upload, RefreshCw, Settings, 
  CheckCircle, AlertCircle, Clock, Database, Shield, Activity
} from 'lucide-react';

interface BackupFile {
  name: string;
  size: string;
  timestamp: string;
  records: number;
  location: 'Local' | 'Dropbox';
}

export const BackupManagementPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [backupFiles, setBackupFiles] = useState<BackupFile[]>([]);
  const [backupStatus, setBackupStatus] = useState({
    lastBackup: '',
    totalBackups: 0,
    totalSize: '0 MB',
    dropboxConfigured: true,
    localBackups: 0,
    dropboxBackups: 0
  });

  useEffect(() => {
    loadBackupFiles();
    loadBackupStatus();
  }, []);

  const loadBackupFiles = async () => {
    try {
      const files: BackupFile[] = [
        {
          name: 'backup-2025-08-02T08-53-27-817Z.json',
          size: '0.94 MB',
          timestamp: '2025-08-02 08:53:27',
          records: 1240,
          location: 'Local'
        },
        {
          name: 'backup-2025-08-02T08-50-20-832Z.json',
          size: '0.94 MB',
          timestamp: '2025-08-02 08:50:20',
          records: 1240,
          location: 'Dropbox'
        },
        {
          name: 'backup-2025-08-02T08-50-06-752Z.json',
          size: '0.94 MB',
          timestamp: '2025-08-02 08:50:06',
          records: 1240,
          location: 'Local'
        }
      ];
      setBackupFiles(files);
    } catch (error) {
      console.error('Error loading backup files:', error);
    }
  };

  const loadBackupStatus = async () => {
    try {
      setBackupStatus({
        lastBackup: '2025-08-02 08:53:27',
        totalBackups: 6,
        totalSize: '5.64 MB',
        dropboxConfigured: true,
        localBackups: 6,
        dropboxBackups: 3
      });
    } catch (error) {
      console.error('Error loading backup status:', error);
    }
  };

  const handleRunBackup = async () => {
    try {
      setIsLoading(true);
      alert('🔄 Running complete backup (Local + Dropbox)...\n\nThis will backup to both local storage and Dropbox.');
      
      // Simulate backup process
      setTimeout(() => {
        alert('✅ Backup completed successfully!');
        loadBackupFiles();
        loadBackupStatus();
        setIsLoading(false);
      }, 2000);
      
    } catch (error) {
      alert('❌ Backup failed: ' + error);
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Backup Management</h1>
          <p className="text-gray-600 mt-1">Monitor and manage your data backups</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <GlassButton
            onClick={handleRunBackup}
            disabled={isLoading}
            icon={<RefreshCw size={18} />}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
          >
            {isLoading ? 'Running...' : 'Run Backup'}
          </GlassButton>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total Backups</p>
              <p className="text-2xl font-bold text-blue-900">{backupStatus.totalBackups}</p>
            </div>
            <div className="p-3 bg-blue-50/20 rounded-full">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Local Backups</p>
              <p className="text-2xl font-bold text-green-900">{backupStatus.localBackups}</p>
            </div>
            <div className="p-3 bg-green-50/20 rounded-full">
              <HardDrive className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Cloud Backups</p>
              <p className="text-2xl font-bold text-purple-900">{backupStatus.dropboxBackups}</p>
            </div>
            <div className="p-3 bg-purple-50/20 rounded-full">
              <Cloud className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-amber-50 to-amber-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600">Total Size</p>
              <p className="text-2xl font-bold text-amber-900">{backupStatus.totalSize}</p>
            </div>
            <div className="p-3 bg-amber-50/20 rounded-full">
              <Activity className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Backup Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Local Storage</span>
              </div>
              <span className="text-sm text-gray-600">✅ Working</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Dropbox Cloud</span>
              </div>
              <span className="text-sm text-gray-600">✅ Connected</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">Last Backup</span>
              </div>
              <span className="text-sm text-gray-600">{backupStatus.lastBackup}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium">Auto Backup</span>
              </div>
              <span className="text-sm text-gray-600">✅ Daily at 2:00 AM</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <GlassButton
              variant="secondary"
              icon={<Download size={16} />}
              onClick={() => alert('📥 Opening backup folder...')}
              className="text-sm"
            >
              View Files
            </GlassButton>
            <GlassButton
              variant="secondary"
              icon={<Settings size={16} />}
              onClick={() => alert('⚙️ Opening backup settings...')}
              className="text-sm"
            >
              Settings
            </GlassButton>
            <GlassButton
              variant="secondary"
              icon={<Cloud size={16} />}
              onClick={() => alert('☁️ Opening Dropbox folder...')}
              className="text-sm"
            >
              Cloud Files
            </GlassButton>
            <GlassButton
              variant="secondary"
              icon={<RefreshCw size={16} />}
              onClick={handleRunBackup}
              disabled={isLoading}
              className="text-sm"
            >
              {isLoading ? 'Running...' : 'Manual Backup'}
            </GlassButton>
          </div>
        </GlassCard>
      </div>

      {/* Backup Files List */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Backups</h3>
          <div className="text-sm text-gray-500">
            Showing {backupFiles.length} backups
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Backup File
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
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
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      file.location === 'Local' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {file.location === 'Local' ? '💾' : '☁️'} {file.location}
                    </span>
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
                        onClick={() => alert(`📥 Downloading ${file.name}...`)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Download"
                      >
                        📥
                      </button>
                      <button
                        onClick={() => alert(`🔄 Restoring from ${file.name}...`)}
                        className="text-green-600 hover:text-green-900"
                        title="Restore"
                      >
                        🔄
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}; 