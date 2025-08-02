import React, { useState, useEffect } from 'react';
import GlassCard from './ui/GlassCard';
import GlassButton from './ui/GlassButton';
import { getBackupStatus } from '../lib/backupApi';

interface BackupStatus {
  lastBackup: string;
  totalBackups: number;
  totalSize: string;
  dropboxConfigured: boolean;
  localBackups: number;
  dropboxBackups: number;
  systemStatus: 'healthy' | 'warning' | 'error';
}

export const BackupNotification: React.FC = () => {
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [isVisible, setIsVisible] = useState(true);

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

  if (!status || !isVisible) {
    return null;
  }

  // Show notification if no backups exist or if Dropbox is not configured
  const shouldShowNotification = status.totalBackups === 0 || !status.dropboxConfigured;

  if (!shouldShowNotification) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <GlassCard className="p-4 shadow-lg">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🔄</span>
              <h4 className="font-semibold text-sm">Backup Status</h4>
            </div>
            
            {status.totalBackups === 0 ? (
              <p className="text-xs text-gray-600 mb-3">
                No backups found. Setup backup system to protect your data.
              </p>
            ) : (
              <p className="text-xs text-gray-600 mb-3">
                Dropbox not configured. Add cloud backup for extra protection.
              </p>
            )}
            
            <div className="flex gap-2">
              <GlassButton
                onClick={() => window.location.href = '/backup-management'}
                className="bg-blue-500 hover:bg-blue-600 text-xs px-3 py-1"
              >
                Setup Backup
              </GlassButton>
              
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-400 hover:text-gray-600 text-xs"
              >
                Dismiss
              </button>
            </div>
          </div>
          
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600 ml-2"
          >
            ✕
          </button>
        </div>
      </GlassCard>
    </div>
  );
}; 