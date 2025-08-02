import React, { useState, useEffect } from 'react';
import { getBackupStatus } from '../lib/backupApi';

interface BackupNotificationProps {
  showNotification?: boolean;
}

export const BackupNotification: React.FC<BackupNotificationProps> = ({ showNotification = true }) => {
  const [status, setStatus] = useState<any>(null);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    loadBackupStatus();
  }, []);

  const loadBackupStatus = async () => {
    try {
      const backupStatus = await getBackupStatus();
      setStatus(backupStatus);
      
      // Show alert if no backups exist
      if (!backupStatus.hasBackups && showNotification) {
        setShowAlert(true);
      }
    } catch (error) {
      console.error('Error loading backup status:', error);
    }
  };

  if (!showAlert || !status) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 shadow-lg max-w-sm">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="text-2xl">⚠️</div>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-orange-800">
              Backup System Not Configured
            </h3>
            <p className="text-sm text-orange-700 mt-1">
              Your data is not being backed up automatically. Set up the backup system to protect your data.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => window.location.href = '/backup-management'}
                className="bg-orange-500 hover:bg-orange-600 text-white text-xs px-3 py-1 rounded"
              >
                Setup Now
              </button>
              <button
                onClick={() => setShowAlert(false)}
                className="text-orange-600 hover:text-orange-800 text-xs px-3 py-1"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowAlert(false)}
            className="ml-2 text-orange-400 hover:text-orange-600"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}; 