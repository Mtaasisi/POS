import React, { useState } from 'react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { Shield, Save, Users, Lock, Activity } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface AdminSettingsProps {
  isActive?: boolean;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ isActive }) => {
  const [settings, setSettings] = useState({
    userRegistration: true,
    requireEmailVerification: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    enableAuditLog: true,
    backupFrequency: 'daily',
    dataRetention: 365
  });

  const handleSave = () => {
    localStorage.setItem('adminSettings', JSON.stringify(settings));
    toast.success('Admin settings saved');
  };

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
          <Shield className="w-5 h-5" />
          Administrative Settings
        </h3>

        <div className="space-y-6">
          {/* User Management */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-white flex items-center gap-2">
              <Users className="w-4 h-4" />
              User Management
            </h4>
            
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg bg-white/5 hover:bg-white/10">
                <input
                  type="checkbox"
                  checked={settings.userRegistration}
                  onChange={(e) => setSettings({ ...settings, userRegistration: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded"
                />
                <span className="text-white">Allow new user registration</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg bg-white/5 hover:bg-white/10">
                <input
                  type="checkbox"
                  checked={settings.requireEmailVerification}
                  onChange={(e) => setSettings({ ...settings, requireEmailVerification: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded"
                />
                <span className="text-white">Require email verification</span>
              </label>
            </div>
          </div>

          {/* Security Settings */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-white flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Security Settings
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Session Timeout (minutes)
                </label>
                <input
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => setSettings({ ...settings, sessionTimeout: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  min="5"
                  max="480"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Login Attempts
                </label>
                <input
                  type="number"
                  value={settings.maxLoginAttempts}
                  onChange={(e) => setSettings({ ...settings, maxLoginAttempts: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  min="3"
                  max="10"
                />
              </div>
            </div>
          </div>

          {/* System Settings */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-white flex items-center gap-2">
              <Activity className="w-4 h-4" />
              System Settings
            </h4>
            
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg bg-white/5 hover:bg-white/10">
                <input
                  type="checkbox"
                  checked={settings.enableAuditLog}
                  onChange={(e) => setSettings({ ...settings, enableAuditLog: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded"
                />
                <span className="text-white">Enable audit logging</span>
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Backup Frequency
                </label>
                <select
                  value={settings.backupFrequency}
                  onChange={(e) => setSettings({ ...settings, backupFrequency: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Data Retention (days)
                </label>
                <input
                  type="number"
                  value={settings.dataRetention}
                  onChange={(e) => setSettings({ ...settings, dataRetention: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  min="30"
                  max="1095"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <GlassButton
            onClick={handleSave}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Admin Settings
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
};

export default AdminSettings;
