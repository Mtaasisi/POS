import React, { useState, useEffect } from 'react';
import GlassCard from './ui/GlassCard';
import GlassButton from './ui/GlassButton';
import StatusBadge from './ui/StatusBadge';
import { getBackupStatus, runManualBackup } from '../lib/backupApi';

interface BackupStatus {
  lastBackup: string;
  totalBackups: number;
  totalSize: string;
  dropboxConfigured: boolean;
  localBackups: number;
  dropboxBackups: number;
  systemStatus: 'healthy' | 'warning' | 'error';
}

export const BackupStatusWidget: React.FC = () => {
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunningBackup, setIsRunningBackup] = useState(false);

  useEffect(() => {
    loadBackupStatus();
  }, []);

  const loadBackupStatus = async () => {
    try {
      const backupStatus = await getBackupStatus();
      setStatus(backupStatus);
    } catch (error) {
      console.error('Error loading backup status:', error);
    }
  };

  const handleRunBackup = async () => {
    try {
      setIsRunningBackup(true);
      const result = await runManualBackup('local');
      
      if (result.success) {
        alert('✅ Backup completed successfully!');
        loadBackupStatus(); // Refresh status
      } else {
        alert('❌ Backup failed: ' + result.error);
      }
    } catch (error) {
      alert('❌ Backup failed: ' + error);
    } finally {
      setIsRunningBackup(false);
    }
  };

  if (!status) {
    return (
      <GlassCard className="p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Loading backup status...</p>
        </div>
      </GlassCard>
    );
  }

  const getStatusColor = (systemStatus: string) => {
    switch (systemStatus) {
      case 'healthy':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (systemStatus: string) => {
    switch (systemStatus) {
      case 'healthy':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return '❓';
    }
  };

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">🔄 Backup Status</h3>
        <StatusBadge 
          status={status.systemStatus === 'healthy' ? 'success' : status.systemStatus === 'warning' ? 'warning' : 'error'}
          text={`${getStatusIcon(status.systemStatus)} ${status.systemStatus}`}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{status.totalBackups}</div>
          <div className="text-xs text-gray-600">Total Backups</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{status.totalSize}</div>
          <div className="text-xs text-gray-600">Total Size</div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Last Backup:</span>
          <span className="font-medium">{status.lastBackup}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Local Backups:</span>
          <span className="font-medium text-green-600">{status.localBackups}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Dropbox Backups:</span>
          <span className={`font-medium ${status.dropboxConfigured ? 'text-blue-600' : 'text-gray-400'}`}>
            {status.dropboxBackups} {!status.dropboxConfigured && '(Not Setup)'}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <GlassButton
          onClick={handleRunBackup}
          disabled={isRunningBackup}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-sm"
        >
          {isRunningBackup ? '🔄 Running...' : '💾 Run Backup'}
        </GlassButton>
        
        <GlassButton
          onClick={() => window.location.href = '/backup-management'}
          className="flex-1 bg-gray-500 hover:bg-gray-600 text-sm"
        >
          📊 Details
        </GlassButton>
      </div>

      {!status.dropboxConfigured && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          💡 <strong>Tip:</strong> Setup Dropbox for cloud backup
          <button 
            onClick={() => window.location.href = '/backup-management'}
            className="ml-1 underline hover:no-underline"
          >
            Setup Now
          </button>
        </div>
      )}
    </GlassCard>
  );
}; 