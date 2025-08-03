import React, { useState, useEffect } from 'react';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { 
  Cloud, HardDrive, Download, Upload, RefreshCw, Settings, 
  CheckCircle, AlertCircle, Clock, Database, Shield, Activity,
  Archive, Zap, Globe, Lock, Calendar, TrendingUp
} from 'lucide-react';
import { getBackupFiles, getBackupStatus, runManualBackup } from '../lib/backupApi';
import { AutomaticBackupSettings } from '../components/AutomaticBackupSettings';

interface BackupFile {
  name: string;
  size: string;
  timestamp: string;
  records: number;
  location: 'Local' | 'Dropbox' | 'Google Drive';
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
      const files = await getBackupFiles();
      setBackupFiles(files);
    } catch (error) {
      console.error('Error loading backup files:', error);
    }
  };

  const loadBackupStatus = async () => {
    try {
      const status = await getBackupStatus();
      setBackupStatus(status);
    } catch (error) {
      console.error('Error loading backup status:', error);
    }
  };

  const handleRunBackup = async () => {
    try {
      setIsLoading(true);
      alert('🔄 Running complete backup (Local + Dropbox)...\n\nThis will backup to both local storage and Dropbox.');
      
      const result = await runManualBackup('complete');
      
      if (result.success) {
        alert('✅ Backup completed successfully!');
        loadBackupFiles();
        loadBackupStatus();
      } else {
        alert('❌ Backup failed: ' + result.error);
      }
    } catch (error) {
      alert('❌ Backup failed: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-8">
      {/* Hero Header */}
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
          <Archive className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Data Protection Center
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Secure your business data with automated local and cloud backups
        </p>
      </div>

      {/* Main Action Card */}
      <GlassCard className="p-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200/50">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Ready to Backup?</h2>
            <p className="text-gray-600 mb-4">
              Your data will be automatically backed up to both local storage and Dropbox cloud
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Local Storage</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Auto Cloud Sync</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Auto Cleanup</span>
              </div>
            </div>
          </div>
          <GlassButton
            onClick={handleRunBackup}
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold shadow-lg"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Creating Backup...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                <span>Start Backup Now</span>
              </div>
            )}
          </GlassButton>
        </div>
      </GlassCard>

      {/* Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlassCard className="relative overflow-hidden bg-gradient-to-br from-emerald-50 to-green-100 border border-emerald-200">
          <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-200/30 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <Database className="w-8 h-8 text-emerald-600" />
              <span className="text-2xl font-bold text-emerald-700">{backupStatus.totalBackups}</span>
            </div>
            <h3 className="text-sm font-semibold text-emerald-800">Total Backups</h3>
            <p className="text-xs text-emerald-600 mt-1">All time backups</p>
          </div>
        </GlassCard>

        <GlassCard className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-100 border border-blue-200">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200/30 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <HardDrive className="w-8 h-8 text-blue-600" />
              <span className="text-2xl font-bold text-blue-700">{backupStatus.localBackups}</span>
            </div>
            <h3 className="text-sm font-semibold text-blue-800">Local Storage</h3>
            <p className="text-xs text-blue-600 mt-1">On your machine</p>
          </div>
        </GlassCard>

        <GlassCard className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-indigo-100 border border-purple-200">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200/30 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <Cloud className="w-8 h-8 text-purple-600" />
              <span className="text-2xl font-bold text-purple-700">{backupStatus.dropboxBackups}</span>
            </div>
            <h3 className="text-sm font-semibold text-purple-800">Cloud Storage</h3>
            <p className="text-xs text-purple-600 mt-1">Dropbox secure</p>
          </div>
        </GlassCard>

        <GlassCard className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-100 border border-amber-200">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-200/30 rounded-full -translate-y-10 translate-x-10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <Activity className="w-8 h-8 text-amber-600" />
              <span className="text-2xl font-bold text-amber-700">{backupStatus.totalSize}</span>
            </div>
            <h3 className="text-sm font-semibold text-amber-800">Total Size</h3>
            <p className="text-xs text-amber-600 mt-1">Compressed data</p>
          </div>
        </GlassCard>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="bg-gradient-to-br from-green-50 to-emerald-100 border border-green-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-green-800">System Health</h3>
              <p className="text-sm text-green-600">All systems operational</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-700">Local Storage</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-600">Online</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-700">Cloud Connection</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-600">Connected</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-700">Auto Backup</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-600">Active</span>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-blue-50 to-cyan-100 border border-blue-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-800">Last Backup</h3>
              <p className="text-sm text-blue-600">Recent activity</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">Date & Time</span>
              <span className="text-xs text-blue-600">{backupStatus.lastBackup}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">Next Backup</span>
              <span className="text-xs text-blue-600">Tomorrow 2:00 AM</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700">Schedule</span>
              <span className="text-xs text-blue-600">Daily</span>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-purple-50 to-indigo-100 border border-purple-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-purple-800">Quick Actions</h3>
              <p className="text-sm text-purple-600">Manage your backups</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <GlassButton
              variant="secondary"
              icon={<Download size={14} />}
              onClick={() => alert('📥 Opening backup folder...')}
              className="text-xs h-8"
            >
              View Files
            </GlassButton>
            <GlassButton
              variant="secondary"
              icon={<Globe size={14} />}
              onClick={() => alert('☁️ Opening Dropbox...')}
              className="text-xs h-8"
            >
              Cloud Files
            </GlassButton>
            <GlassButton
              variant="secondary"
              icon={<Settings size={14} />}
              onClick={() => alert('⚙️ Opening settings...')}
              className="text-xs h-8"
            >
              Settings
            </GlassButton>
            <GlassButton
              variant="secondary"
              icon={<Calendar size={14} />}
              onClick={() => alert('📅 Opening schedule...')}
              className="text-xs h-8"
            >
              Schedule
            </GlassButton>
          </div>
        </GlassCard>
      </div>

      {/* Automatic Backup Settings */}
      <GlassCard className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Automatic Backup Settings</h3>
              <p className="text-sm text-gray-600">Configure automated backup schedules</p>
            </div>
          </div>
          <GlassButton
            onClick={() => setShowSettings(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </GlassButton>
        </div>
      </GlassCard>

      {/* Backup History */}
      <GlassCard className="bg-white/80 backdrop-blur-sm border border-gray-200/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Archive className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Backup History</h3>
              <p className="text-sm text-gray-600">Recent backup files</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {backupFiles.length} backups available
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Backup File
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Records
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {backupFiles.map((file, index) => (
                <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-full ${
                        file.location === 'Local' ? 'bg-green-100' : 'bg-blue-100'
                      }`}>
                        {file.location === 'Local' ? (
                          <HardDrive className="w-4 h-4 text-green-600" />
                        ) : (
                          <Cloud className="w-4 h-4 text-blue-600" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{file.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      file.location === 'Local' 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                      {file.location === 'Local' ? '💾 Local' : '☁️ Dropbox'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">
                    {file.size}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">
                    {file.records.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">
                    {file.timestamp}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => alert(`📥 Downloading ${file.name}...`)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => alert(`🔄 Restoring from ${file.name}...`)}
                        className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors"
                        title="Restore"
                      >
                        <RefreshCw className="w-4 h-4" />
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