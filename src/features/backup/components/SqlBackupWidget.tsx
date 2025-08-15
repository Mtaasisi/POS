import React, { useState, useEffect } from 'react';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import { 
  Database, Download, Upload, Settings, CheckCircle, AlertCircle, 
  Clock, FileText, HardDrive, Cloud, RefreshCw, Play, Square
} from 'lucide-react';
import { 
  runSqlBackup, 
  getSqlBackupStatus, 
  downloadSqlBackup, 
  testSqlBackupConnection,
  SqlBackupResult 
} from '../../../lib/backupApi';

interface SqlBackupStatus {
  availableFiles: any[];
  lastSqlBackup: string;
  totalSqlBackups: number;
  totalSqlSize: string;
}

export const SqlBackupWidget: React.FC = () => {
  const [status, setStatus] = useState<SqlBackupStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunningBackup, setIsRunningBackup] = useState(false);
  const [backupType, setBackupType] = useState<'full' | 'schema' | 'data'>('full');
  const [backupFormat, setBackupFormat] = useState<'sql' | 'custom'>('sql');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    loadSqlBackupStatus();
  }, []);

  const loadSqlBackupStatus = async () => {
    try {
      setIsLoading(true);
      const sqlStatus = await getSqlBackupStatus();
      setStatus(sqlStatus);
    } catch (error) {
      console.error('Error loading SQL backup status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunSqlBackup = async () => {
    try {
      setIsRunningBackup(true);
      
      const result: SqlBackupResult = await runSqlBackup({
        type: backupType,
        format: backupFormat,
        outputDir: '~/Desktop/SQL'
      });
      
      if (result.success) {
        alert(`✅ SQL backup completed successfully!\n\nFile: ${result.filePath}\nSize: ${result.fileSize}\nTables: ${result.tablesCount}\nRecords: ${result.recordsCount}`);
        loadSqlBackupStatus(); // Refresh status
      } else {
        alert(`❌ SQL backup failed: ${result.error}`);
      }
    } catch (error) {
      alert(`❌ SQL backup failed: ${error}`);
    } finally {
      setIsRunningBackup(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setIsLoading(true);
      const result = await testSqlBackupConnection();
      
      if (result.success) {
        alert('✅ SQL backup connection test successful!');
      } else {
        alert(`❌ Connection test failed: ${result.error}`);
      }
    } catch (error) {
      alert(`❌ Connection test failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadLatest = async () => {
    if (!status?.availableFiles?.length) {
      alert('❌ No SQL backup files available');
      return;
    }

    try {
      const latestFile = status.availableFiles[0]; // Assuming sorted by date
      const result = await downloadSqlBackup(latestFile.name);
      
      if (result.success) {
        alert('✅ SQL backup downloaded successfully!');
      } else {
        alert(`❌ Download failed: ${result.error}`);
      }
    } catch (error) {
      alert(`❌ Download failed: ${error}`);
    }
  };

  if (isLoading && !status) {
    return (
      <GlassCard className="p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Loading SQL backup status...</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 border border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Database className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-800">SQL Database Backup</h3>
            <p className="text-sm text-blue-600">Full database export with pg_dump</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-sm text-blue-600">
            {status?.totalSqlBackups || 0} backups
          </div>
          <GlassButton
            variant="secondary"
            icon={<RefreshCw size={14} />}
            onClick={loadSqlBackupStatus}
            disabled={isLoading}
            className="text-xs h-8"
          >
            Refresh
          </GlassButton>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/60 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Total Backups</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {status?.totalSqlBackups || 0}
          </div>
        </div>
        
        <div className="bg-white/60 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Total Size</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {status?.totalSqlSize || '0 MB'}
          </div>
        </div>
      </div>

      {/* Last Backup Info */}
      {status?.lastSqlBackup && (
        <div className="mb-4 p-3 bg-white/60 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <Clock className="w-4 h-4" />
            <span>Last backup: {new Date(status.lastSqlBackup).toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Backup Options */}
      <div className="mb-4">
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-blue-800">Type:</span>
            <select
              value={backupType}
              onChange={(e) => setBackupType(e.target.value as any)}
              className="text-sm border border-blue-200 rounded px-2 py-1 bg-white/80"
            >
              <option value="full">Full Database</option>
              <option value="schema">Schema Only</option>
              <option value="data">Data Only</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-blue-800">Format:</span>
            <select
              value={backupFormat}
              onChange={(e) => setBackupFormat(e.target.value as any)}
              className="text-sm border border-blue-200 rounded px-2 py-1 bg-white/80"
            >
              <option value="sql">Plain SQL</option>
              <option value="custom">Custom (.dump)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <GlassButton
          onClick={handleRunSqlBackup}
          disabled={isRunningBackup}
          className="bg-blue-500 hover:bg-blue-600 text-white"
          icon={isRunningBackup ? <Square size={16} /> : <Play size={16} />}
        >
          {isRunningBackup ? 'Running...' : 'Run SQL Backup'}
        </GlassButton>
        
        <GlassButton
          onClick={handleTestConnection}
          disabled={isLoading}
          className="bg-green-500 hover:bg-green-600 text-white"
          icon={<CheckCircle size={16} />}
        >
          Test Connection
        </GlassButton>
        
        <GlassButton
          onClick={handleDownloadLatest}
          disabled={!status?.availableFiles?.length}
          className="bg-orange-500 hover:bg-orange-600 text-white"
          icon={<Download size={16} />}
        >
          Download Latest
        </GlassButton>
        
        <GlassButton
          onClick={() => setShowAdvanced(!showAdvanced)}
          variant="secondary"
          icon={<Settings size={16} />}
        >
          Advanced
        </GlassButton>
      </div>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="mt-4 p-4 bg-white/60 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Advanced Options</h4>
          <div className="text-sm text-blue-700 space-y-2">
            <div>• <strong>Full Database:</strong> Complete schema + data</div>
            <div>• <strong>Schema Only:</strong> Table structures only</div>
            <div>• <strong>Data Only:</strong> Data without schema</div>
            <div>• <strong>Plain SQL:</strong> Human-readable .sql file</div>
            <div>• <strong>Custom:</strong> Binary .dump for fast restore</div>
          </div>
        </div>
      )}

      {/* Recent Files */}
      {status?.availableFiles?.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium text-blue-800 mb-2">Recent SQL Backups</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {status.availableFiles.slice(0, 3).map((file: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-2 bg-white/60 rounded text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-800">{file.name}</span>
                </div>
                <span className="text-blue-600">{file.size}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
};
