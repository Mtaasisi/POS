import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { 
  Palette, 
  Sun, 
  Moon, 
  Settings as SettingsIcon,
  User,
  Shield,
  Bell,
  Database,
  Globe,
  Monitor,
  Smartphone,
  Wifi,
  Lock,
  Key,
  Eye,
  EyeOff
} from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleThemeChange = (newTheme: 'original' | 'dark') => {
    setTheme(newTheme);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold original-theme:text-gray-900 dark-theme:text-white mb-2">
          Settings
        </h1>
        <p className="original-theme:text-gray-600 dark-theme:text-gray-300">
          Manage your application preferences and appearance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Theme Settings */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              <Palette size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold original-theme:text-gray-900 dark-theme:text-white">
                Appearance
              </h2>
              <p className="original-theme:text-gray-600 dark-theme:text-gray-300 text-sm">
                Choose your preferred theme
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Original Theme Option */}
              <div 
                className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                  theme === 'original' 
                    ? 'original-theme:border-blue-500 original-theme:bg-blue-50 dark-theme:border-blue-400 dark-theme:bg-blue-500/20' 
                    : 'original-theme:border-gray-200 original-theme:bg-white dark-theme:border-white/20 dark-theme:bg-white/5'
                }`}
                onClick={() => handleThemeChange('original')}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Sun size={20} className="original-theme:text-yellow-500 dark-theme:text-yellow-400" />
                  <span className="font-medium original-theme:text-gray-900 dark-theme:text-white">
                    Original UI
                  </span>
                </div>
                <div className="h-16 rounded bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 mb-2"></div>
                <p className="text-xs original-theme:text-gray-600 dark-theme:text-gray-300">
                  Light theme with blue gradients
                </p>
                {theme === 'original' && (
                  <div className="absolute top-2 right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>

              {/* Dark Theme Option */}
              <div 
                className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 ${
                  theme === 'dark' 
                    ? 'original-theme:border-blue-500 original-theme:bg-blue-50 dark-theme:border-blue-400 dark-theme:bg-blue-500/20' 
                    : 'original-theme:border-gray-200 original-theme:bg-white dark-theme:border-white/20 dark-theme:bg-white/5'
                }`}
                onClick={() => handleThemeChange('dark')}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Moon size={20} className="original-theme:text-gray-700 dark-theme:text-blue-400" />
                  <span className="font-medium original-theme:text-gray-900 dark-theme:text-white">
                    Dark UI
                  </span>
                </div>
                <div className="h-16 rounded bg-gradient-to-br from-gray-800 to-slate-900 mb-2"></div>
                <p className="text-xs original-theme:text-gray-600 dark-theme:text-gray-300">
                  Dark theme with modern styling
                </p>
                {theme === 'dark' && (
                  <div className="absolute top-2 right-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t original-theme:border-gray-200 dark-theme:border-white/20">
              <p className="text-sm original-theme:text-gray-500 dark-theme:text-gray-400">
                Your theme preference will be saved and applied across all devices.
              </p>
            </div>
          </div>
        </GlassCard>

        {/* User Profile */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold original-theme:text-gray-900 dark-theme:text-white">
                Profile
              </h2>
              <p className="original-theme:text-gray-600 dark-theme:text-gray-300 text-sm">
                Your account information
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg original-theme:bg-gray-50 dark-theme:bg-white/5">
              <div>
                <p className="font-medium original-theme:text-gray-900 dark-theme:text-white">
                  Name
                </p>
                <p className="text-sm original-theme:text-gray-600 dark-theme:text-gray-300">
                  {currentUser.name}
                </p>
              </div>
              <User size={16} className="original-theme:text-gray-400 dark-theme:text-gray-500" />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg original-theme:bg-gray-50 dark-theme:bg-white/5">
              <div>
                <p className="font-medium original-theme:text-gray-900 dark-theme:text-white">
                  Email
                </p>
                <p className="text-sm original-theme:text-gray-600 dark-theme:text-gray-300">
                  {currentUser.email}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                {currentUser.email?.charAt(0).toUpperCase()}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg original-theme:bg-gray-50 dark-theme:bg-white/5">
              <div>
                <p className="font-medium original-theme:text-gray-900 dark-theme:text-white">
                  Role
                </p>
                <p className="text-sm original-theme:text-gray-600 dark-theme:text-gray-300 capitalize">
                  {currentUser.role.replace('-', ' ')}
                </p>
              </div>
              <Shield size={16} className="original-theme:text-gray-400 dark-theme:text-gray-500" />
            </div>
          </div>
        </GlassCard>

        {/* System Information */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white">
              <Monitor size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold original-theme:text-gray-900 dark-theme:text-white">
                System
              </h2>
              <p className="original-theme:text-gray-600 dark-theme:text-gray-300 text-sm">
                Application information
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg original-theme:bg-gray-50 dark-theme:bg-white/5">
              <div className="flex items-center gap-3">
                <Database size={16} className="original-theme:text-gray-400 dark-theme:text-gray-500" />
                <span className="original-theme:text-gray-900 dark-theme:text-white">Version</span>
              </div>
              <span className="text-sm original-theme:text-gray-600 dark-theme:text-gray-300">1.0.0</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg original-theme:bg-gray-50 dark-theme:bg-white/5">
              <div className="flex items-center gap-3">
                <Globe size={16} className="original-theme:text-gray-400 dark-theme:text-gray-500" />
                <span className="original-theme:text-gray-900 dark-theme:text-white">Environment</span>
              </div>
              <span className="text-sm original-theme:text-gray-600 dark-theme:text-gray-300">Production</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg original-theme:bg-gray-50 dark-theme:bg-white/5">
              <div className="flex items-center gap-3">
                <Wifi size={16} className="original-theme:text-gray-400 dark-theme:text-gray-500" />
                <span className="original-theme:text-gray-900 dark-theme:text-white">Connection</span>
              </div>
              <span className="text-sm original-theme:text-green-600 dark-theme:text-green-400">Online</span>
            </div>
          </div>
        </GlassCard>

        {/* Security Settings */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white">
              <Lock size={24} />
            </div>
            <div>
              <h2 className="text-xl font-semibold original-theme:text-gray-900 dark-theme:text-white">
                Security
              </h2>
              <p className="original-theme:text-gray-600 dark-theme:text-gray-300 text-sm">
                Account security settings
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <GlassButton
              variant="outline"
              className="w-full justify-start"
              onClick={() => {/* TODO: Implement password change */}}
            >
              <Key size={16} />
              Change Password
            </GlassButton>

            <GlassButton
              variant="outline"
              className="w-full justify-start"
              onClick={() => {/* TODO: Implement 2FA */}}
            >
              <Shield size={16} />
              Two-Factor Authentication
            </GlassButton>

            <GlassButton
              variant="outline"
              className="w-full justify-start"
              onClick={() => {/* TODO: Implement session management */}}
            >
              <Eye size={16} />
              Active Sessions
            </GlassButton>
          </div>
        </GlassCard>
      </div>

      {/* Advanced Settings Toggle */}
      <div className="mt-8">
        <GlassButton
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full"
        >
          <SettingsIcon size={16} />
          {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
        </GlassButton>
      </div>

      {/* Advanced Settings */}
      {showAdvanced && (
        <GlassCard className="mt-6 p-6">
          <h3 className="text-lg font-semibold original-theme:text-gray-900 dark-theme:text-white mb-4">
            Advanced Settings
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium original-theme:text-gray-900 dark-theme:text-white">
                  Debug Mode
                </p>
                <p className="text-sm original-theme:text-gray-600 dark-theme:text-gray-300">
                  Enable detailed logging
                </p>
              </div>
              <div className="w-12 h-6 bg-gray-200 rounded-full relative cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 transition-transform"></div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium original-theme:text-gray-900 dark-theme:text-white">
                  Auto-save
                </p>
                <p className="text-sm original-theme:text-gray-600 dark-theme:text-gray-300">
                  Automatically save changes
                </p>
              </div>
              <div className="w-12 h-6 bg-blue-500 rounded-full relative cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 transition-transform"></div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium original-theme:text-gray-900 dark-theme:text-white">
                  Notifications
                </p>
                <p className="text-sm original-theme:text-gray-600 dark-theme:text-gray-300">
                  Show system notifications
                </p>
              </div>
              <div className="w-12 h-6 bg-blue-500 rounded-full relative cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 transition-transform"></div>
              </div>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default SettingsPage; 