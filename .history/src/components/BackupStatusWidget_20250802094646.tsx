import React, { useState, useEffect } from 'react';
import GlassCard from './ui/GlassCard';
import GlassButton from './ui/GlassButton';
import StatusBadge from './ui/StatusBadge';
import { getBackupStatus } from '../lib/backupApi';

interface BackupStatusWidgetProps {
  compact?: boolean;
}

export const BackupStatusWidget: React.FC<BackupStatusWidgetProps> = ({ compact = false }) => {
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBackupStatus();
  }, []);

  const loadBackupStatus = async () => {
    try {
      setIsLoading(true);
      const backupStatus = await getBackupStatus();
      setStatus(backupStatus);
    } catch (error) {
      console.error('Error loading backup status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <GlassCard className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </GlassCard>
    );
  }

  if (compact) {
    return (
      <GlassCard className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-2xl">🔄</div>
            <div>
              <div className="font-semibold text-sm">Backup Status</div>
              <div className="text-xs text-gray-600">
                {status?.hasBackups ? `${status.totalBackups} backups` : 'No backups yet'}
              </div>
            </div>
          </div>
          <StatusBadge 
            status={status?.hasBackups ? 'success' : 'warning'}
            text={status?.hasBackups ? 'Active' : 'Setup'}
          />
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">🔄 Backup System</h3>
        <GlassButton
          onClick={() => window.location.href = '/backup-management'}
          className="bg-blue-500 hover:bg-blue-600 text-sm"
        >
          Manage
        </GlassButton>
      </div>

      {status?.hasBackups ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{status.totalBackups}</div>
              <div className="text-xs text-gray-600">Total Backups</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{status.successRate.toFixed(1)}%</div>
              <div className="text-xs text-gray-600">Success Rate</div>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Last Backup:</span>
              <span className="font-medium">
                {status.lastBackup?.timestamp ? 
                  new Date(status.lastBackup.timestamp).toLocaleDateString() : 
                  'Never'
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span>Avg Duration:</span>
              <span className="font-medium">
                {status.averageDuration ? 
                  `${status.averageDuration.toFixed(1)}s` : 
                  'N/A'
                }
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="text-3xl mb-2">📁</div>
          <div className="text-sm text-gray-600 mb-3">No backups yet</div>
          <GlassButton
            onClick={() => window.location.href = '/backup-management'}
            className="bg-blue-500 hover:bg-blue-600 text-sm"
          >
            Setup Backup
          </GlassButton>
        </div>
      )}
    </GlassCard>
  );
}; 