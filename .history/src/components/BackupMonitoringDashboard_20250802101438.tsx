import React, { useState, useEffect } from 'react';
import GlassCard from './ui/GlassCard';
import GlassButton from './ui/GlassButton';
import StatusBadge from './ui/StatusBadge';
import { 
  runManualBackup, 
  testBackupConnection, 
  getBackupStatus, 
  getBackupLogs,
  downloadBackup 
} from '../lib/backupApi';

interface BackupLog {
  timestamp: string;
  duration: number;
  success: boolean;
  summary?: {
    totalTables: number;
    totalRecords: number;
    tablesWithData: number;
    errors: any[];
  };
  error?: string;
}

interface BackupStatus {
  lastBackup?: BackupLog;
  nextBackup?: string;
  totalBackups: number;
  successRate: number;
  averageDuration: number;
}

export const BackupMonitoringDashboard: React.FC = () => {
  const [backupStatus, setBackupStatus] = useState<BackupStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningBackup, setIsRunningBackup] = useState(false);
  const [logs, setLogs] = useState<BackupLog[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadBackupStatus();
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      setConnectionStatus('checking');
      setError(null);
      const result = await testBackupConnection();
      setConnectionStatus(result.success ? 'connected' : 'disconnected');
      if (!result.success) {
        setError(`Connection failed: ${result.error}`);
      }
    } catch (error) {
      setConnectionStatus('disconnected');
      setError(`Connection error: ${error}`);
    }
  };

  const loadBackupStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const status = await getBackupStatus();
      const backupLogs = await getBackupLogs();
      
      setLogs(backupLogs);
      
      if (status.hasBackups) {
        // Calculate next backup time (daily at 2 AM)
        const now = new Date();
        const nextBackup = new Date(now);
        nextBackup.setHours(2, 0, 0, 0);
        if (nextBackup <= now) {
          nextBackup.setDate(nextBackup.getDate() + 1);
        }
        
        setBackupStatus({
          lastBackup: status.lastBackup,
          nextBackup: nextBackup.toISOString(),
          totalBackups: status.totalBackups,
          successRate: status.successRate,
          averageDuration: status.averageDuration
        });
      } else {
        // Initialize with default values if no backups exist
        setBackupStatus({
          lastBackup: undefined,
          nextBackup: new Date().toISOString(),
          totalBackups: 0,
          successRate: 0,
          averageDuration: 0
        });
      }
    } catch (error) {
      console.error('Error loading backup status:', error);
      setError(`Failed to load backup status: ${error}`);
      // Set default status on error
      setBackupStatus({
        lastBackup: undefined,
        nextBackup: new Date().toISOString(),
        totalBackups: 0,
        successRate: 0,
        averageDuration: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runManualBackup = async () => {
    try {
      setIsRunningBackup(true);
      setError(null);
      
      const result = await runManualBackup();
      
      if (result.success) {
        // Reload status
        await loadBackupStatus();
        setTestResult({ success: true, message: 'Backup completed successfully!' });
      } else {
        setError(`Backup failed: ${result.error}`);
        setTestResult({ success: false, message: `Backup failed: ${result.error}` });
      }
      
    } catch (error) {
      console.error('Manual backup failed:', error);
      setError(`Backup failed: ${error}`);
      setTestResult({ success: false, message: `Backup failed: ${error}` });
    } finally {
      setIsRunningBackup(false);
    }
  };

  const testBackupConnection = async () => {
    try {
      const result = await testBackupConnection();
      
      if (result.success) {
        alert('✅ Backup connection test successful!\n\nDatabase connection is working properly.');
      } else {
        alert('❌ Backup connection test failed:\n\n' + result.error + '\n\nPlease check your internet connection and try again.');
      }
    } catch (error) {
      alert('❌ Backup connection test failed:\n\n' + error + '\n\nPlease check your internet connection and try again.');
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <GlassCard className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading backup status...</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">🔄 Backup Monitoring</h2>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' :
              connectionStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
            }`}></div>
            <span className="text-sm text-gray-600">
              {connectionStatus === 'connected' ? 'Connected' :
               connectionStatus === 'disconnected' ? 'Disconnected' : 'Checking...'}
            </span>
          </div>
        </div>
        
        {backupStatus ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {backupStatus.totalBackups}
              </div>
              <div className="text-sm text-gray-600">Total Backups</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {backupStatus.successRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {formatDuration(backupStatus.averageDuration)}
              </div>
              <div className="text-sm text-gray-600">Avg Duration</div>
            </div>
            
            <div className="text-center">
              <StatusBadge 
                status={backupStatus.lastBackup?.success ? 'success' : 'error'}
                text={backupStatus.lastBackup?.success ? 'Last: Success' : 'Last: Failed'}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No backup history found</p>
            <StatusBadge status="warning" text="No backups yet" />
          </div>
        )}
        
        <div className="flex flex-wrap gap-3">
          <GlassButton
            onClick={runManualBackup}
            disabled={isRunningBackup}
            className="bg-blue-500 hover:bg-blue-600"
          >
            {isRunningBackup ? '🔄 Running...' : '🚀 Run Manual Backup'}
          </GlassButton>
          
          <GlassButton
            onClick={testBackupConnection}
            className="bg-green-500 hover:bg-green-600"
          >
            🧪 Test Connection
          </GlassButton>
          
          <GlassButton
            onClick={loadBackupStatus}
            className="bg-purple-500 hover:bg-purple-600"
          >
            🔄 Refresh Status
          </GlassButton>
          
          <GlassButton
            onClick={async () => {
              try {
                const result = await downloadBackup();
                if (result.success) {
                  alert('✅ Backup downloaded successfully!');
                } else {
                  alert('❌ Download failed: ' + result.error);
                }
              } catch (error) {
                alert('❌ Download failed: ' + error);
              }
            }}
            className="bg-orange-500 hover:bg-orange-600"
          >
            📥 Download Latest Backup
          </GlassButton>
        </div>
      </GlassCard>

      {backupStatus?.lastBackup && (
        <GlassCard className="p-6">
          <h3 className="text-xl font-semibold mb-4">📊 Last Backup Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <strong>Timestamp:</strong> {formatDate(backupStatus.lastBackup.timestamp)}
            </div>
            <div>
              <strong>Duration:</strong> {formatDuration(backupStatus.lastBackup.duration)}
            </div>
            <div>
              <strong>Status:</strong> 
              <StatusBadge 
                status={backupStatus.lastBackup.success ? 'success' : 'error'}
                text={backupStatus.lastBackup.success ? 'Success' : 'Failed'}
                className="ml-2"
              />
            </div>
            {backupStatus.lastBackup.summary && (
              <div>
                <strong>Records:</strong> {backupStatus.lastBackup.summary.totalRecords.toLocaleString()}
              </div>
            )}
          </div>
          
          {backupStatus.lastBackup.summary && (
            <div className="mt-4">
              <strong>Tables with data:</strong> {backupStatus.lastBackup.summary.tablesWithData} / {backupStatus.lastBackup.summary.totalTables}
            </div>
          )}
          
          {backupStatus.lastBackup.error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded">
              <strong>Error:</strong> {backupStatus.lastBackup.error}
            </div>
          )}
        </GlassCard>
      )}

      {backupStatus?.nextBackup && (
        <GlassCard className="p-6">
          <h3 className="text-xl font-semibold mb-4">⏰ Next Scheduled Backup</h3>
          <p className="text-lg">
            {formatDate(backupStatus.nextBackup)}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Daily at 2:00 AM (configured via cron job)
          </p>
        </GlassCard>
      )}

      {logs.length > 0 && (
        <GlassCard className="p-6">
          <h3 className="text-xl font-semibold mb-4">📋 Recent Backup Logs</h3>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {logs.slice(-10).reverse().map((log, index) => (
              <div key={index} className="border-b border-gray-200 pb-3">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">{formatDate(log.timestamp)}</span>
                    <span className="ml-2 text-sm text-gray-600">
                      ({formatDuration(log.duration)})
                    </span>
                  </div>
                  <StatusBadge 
                    status={log.success ? 'success' : 'error'}
                    text={log.success ? 'Success' : 'Failed'}
                  />
                </div>
                
                {log.summary && (
                  <div className="text-sm text-gray-600 mt-1">
                    {log.summary.totalRecords.toLocaleString()} records from {log.summary.tablesWithData} tables
                  </div>
                )}
                
                {log.error && (
                  <div className="text-sm text-red-600 mt-1">
                    Error: {log.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}; 