import React, { useState } from 'react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { Bell, Mail, Phone, MessageCircle, Save } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface NotificationSettingsProps {
  isActive?: boolean;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ isActive }) => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    whatsappNotifications: true,
    lowStockAlerts: true,
    salesReports: true,
    systemUpdates: false,
    marketingEmails: false
  });

  const handleSave = () => {
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
    toast.success('Notification settings saved');
  };

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
          <Bell className="w-5 h-5" />
          Notification Preferences
        </h3>

        <div className="space-y-6">
          {/* Notification Channels */}
          <div>
            <h4 className="text-lg font-medium text-white mb-4">Notification Channels</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg bg-white/5 hover:bg-white/10">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded"
                />
                <Mail className="w-5 h-5 text-white" />
                <span className="text-white">Email Notifications</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg bg-white/5 hover:bg-white/10">
                <input
                  type="checkbox"
                  checked={settings.smsNotifications}
                  onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded"
                />
                <Phone className="w-5 h-5 text-white" />
                <span className="text-white">SMS Notifications</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg bg-white/5 hover:bg-white/10">
                <input
                  type="checkbox"
                  checked={settings.pushNotifications}
                  onChange={(e) => setSettings({ ...settings, pushNotifications: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded"
                />
                <Bell className="w-5 h-5 text-white" />
                <span className="text-white">Push Notifications</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg bg-white/5 hover:bg-white/10">
                <input
                  type="checkbox"
                  checked={settings.whatsappNotifications}
                  onChange={(e) => setSettings({ ...settings, whatsappNotifications: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded"
                />
                <MessageCircle className="w-5 h-5 text-white" />
                <span className="text-white">WhatsApp Notifications</span>
              </label>
            </div>
          </div>

          {/* Notification Types */}
          <div>
            <h4 className="text-lg font-medium text-white mb-4">Notification Types</h4>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg bg-white/5 hover:bg-white/10">
                <input
                  type="checkbox"
                  checked={settings.lowStockAlerts}
                  onChange={(e) => setSettings({ ...settings, lowStockAlerts: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded"
                />
                <span className="text-white">Low Stock Alerts</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg bg-white/5 hover:bg-white/10">
                <input
                  type="checkbox"
                  checked={settings.salesReports}
                  onChange={(e) => setSettings({ ...settings, salesReports: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded"
                />
                <span className="text-white">Daily Sales Reports</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg bg-white/5 hover:bg-white/10">
                <input
                  type="checkbox"
                  checked={settings.systemUpdates}
                  onChange={(e) => setSettings({ ...settings, systemUpdates: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded"
                />
                <span className="text-white">System Updates</span>
              </label>

              <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg bg-white/5 hover:bg-white/10">
                <input
                  type="checkbox"
                  checked={settings.marketingEmails}
                  onChange={(e) => setSettings({ ...settings, marketingEmails: e.target.checked })}
                  className="w-4 h-4 text-blue-600 bg-white/10 border-white/20 rounded"
                />
                <span className="text-white">Marketing Emails</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <GlassButton
            onClick={handleSave}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Notification Settings
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
};

export default NotificationSettings;
