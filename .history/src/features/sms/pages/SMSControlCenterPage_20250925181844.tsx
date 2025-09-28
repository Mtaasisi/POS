import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SMSSettingsPage } from './SMSSettingsPage';
import { SMSLogsPage } from './SMSLogsPage';

const SMSControlCenterPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'settings' | 'logs'>('settings');

  // Check URL parameters to set initial tab
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'logs') {
      setActiveTab('logs');
    } else if (tab === 'settings') {
      setActiveTab('settings');
    }
  }, [searchParams]);

  const tabs = [
    { id: 'settings', label: 'SMS Settings', icon: '⚙️' },
    { id: 'logs', label: 'SMS Logs', icon: '📊' }
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Tab Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchParams({ tab: tab.id });
                }}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1">
        {activeTab === 'settings' && <SMSSettingsPage />}
        {activeTab === 'logs' && <SMSLogsPage />}
      </div>
    </div>
  );
};

export default SMSControlCenterPage;
