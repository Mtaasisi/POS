import React, { useState } from 'react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { Database, Save, HardDrive, Cloud, RefreshCw, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SystemSettingsProps {
  isActive?: boolean;
}

const SystemSettings: React.FC<SystemSettingsProps> = ({ isActive }) => {
  const [systemInfo, setSystemInfo] = useState({
    databaseSize: '2.4 GB',
    lastBackup: '2024-01-15 14:30',
    systemUptime: '15 days',
    activeUsers: 12,
    totalProducts: 1247,
    totalSales: 45678
  });

  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      // Simulate backup process
      await new Promise(resolve => setTimeout(resolve, 3000));
      toast.success('Database backup completed successfully');
      setSystemInfo(prev => ({
        ...prev,
        lastBackup: new Date().toISOString().slice(0, 16).replace('T', ' ')
      }));
    } catch (error) {
      toast.error('Backup failed');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      // Simulate optimization process
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Database optimized successfully');
    } catch (error) {
      toast.error('Optimization failed');
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
          <Database className="w-5 h-5" />
          System & Database Management
        </h3>

        <div className="space-y-6">
          {/* System Information */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-white">System Information</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-sm text-gray-300">Database Size</div>
                <div className="text-lg font-semibold text-white">{systemInfo.databaseSize}</div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-sm text-gray-300">Last Backup</div>
                <div className="text-lg font-semibold text-white">{systemInfo.lastBackup}</div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-sm text-gray-300">System Uptime</div>
                <div className="text-lg font-semibold text-white">{systemInfo.systemUptime}</div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-sm text-gray-300">Active Users</div>
                <div className="text-lg font-semibold text-white">{systemInfo.activeUsers}</div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-sm text-gray-300">Total Products</div>
                <div className="text-lg font-semibold text-white">{systemInfo.totalProducts}</div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-sm text-gray-300">Total Sales</div>
                <div className="text-lg font-semibold text-white">{systemInfo.totalSales}</div>
              </div>
            </div>
          </div>

          {/* Database Actions */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-white">Database Actions</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GlassButton
                onClick={handleBackup}
                className="flex items-center gap-2"
                loading={isBackingUp}
                disabled={isBackingUp || isOptimizing}
              >
                <Download className="w-4 h-4" />
                {isBackingUp ? 'Creating Backup...' : 'Create Backup'}
              </GlassButton>

              <GlassButton
                onClick={handleOptimize}
                className="flex items-center gap-2"
                loading={isOptimizing}
                disabled={isBackingUp || isOptimizing}
                variant="secondary"
              >
                <RefreshCw className="w-4 h-4" />
                {isOptimizing ? 'Optimizing...' : 'Optimize Database'}
              </GlassButton>
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-white">Performance Metrics</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-white">Database Response Time</span>
                <span className="text-green-400 font-semibold">45ms</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-white">Cache Hit Rate</span>
                <span className="text-blue-400 font-semibold">87%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-white">Disk Usage</span>
                <span className="text-yellow-400 font-semibold">68%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <span className="text-white">Memory Usage</span>
                <span className="text-green-400 font-semibold">42%</span>
              </div>
            </div>
          </div>

          {/* Maintenance Schedule */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-white">Maintenance Schedule</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <div>
                  <div className="text-white font-medium">Automatic Backups</div>
                  <div className="text-sm text-gray-300">Daily at 2:00 AM</div>
                </div>
                <span className="text-green-400 text-sm">Active</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <div>
                  <div className="text-white font-medium">Database Optimization</div>
                  <div className="text-sm text-gray-300">Weekly on Sundays</div>
                </div>
                <span className="text-green-400 text-sm">Active</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                <div>
                  <div className="text-white font-medium">Log Cleanup</div>
                  <div className="text-sm text-gray-300">Monthly</div>
                </div>
                <span className="text-yellow-400 text-sm">Pending</span>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default SystemSettings;
