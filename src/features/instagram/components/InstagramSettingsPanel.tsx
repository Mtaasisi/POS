// Instagram Settings Panel Component
// Configuration interface for Instagram DM settings

import React, { useState } from 'react';
import { 
  Settings, 
  Save, 
  TestTube, 
  Shield, 
  Clock, 
  MessageSquare,
  Zap,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { InstagramSettings, AutoReplyRule, IceBreaker, PersistentMenu } from '../types/instagram';

interface InstagramSettingsPanelProps {
  settings: InstagramSettings | null;
  autoReplyRules: AutoReplyRule[];
  onUpdateSettings: (updates: Partial<InstagramSettings>) => Promise<boolean>;
  onSetWelcomeMessage: (message: string) => Promise<boolean>;
  onSetPersistentMenu: (menu: PersistentMenu) => Promise<boolean>;
  onSetIceBreakers: (iceBreakers: IceBreaker[]) => Promise<boolean>;
  onAddAutoReplyRule: (rule: Omit<AutoReplyRule, 'id' | 'created_at' | 'updated_at'>) => void;
  onUpdateAutoReplyRule: (id: string, updates: Partial<AutoReplyRule>) => void;
  onDeleteAutoReplyRule: (id: string) => void;
  className?: string;
}

const InstagramSettingsPanel: React.FC<InstagramSettingsPanelProps> = ({
  settings,
  autoReplyRules,
  onUpdateSettings,
  onSetWelcomeMessage,
  onSetPersistentMenu,
  onSetIceBreakers,
  onAddAutoReplyRule,
  onUpdateAutoReplyRule,
  onDeleteAutoReplyRule,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'auto-reply' | 'ice-breakers' | 'menu'>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // General Settings
  const [welcomeMessage, setWelcomeMessage] = useState(settings?.welcome_message || '');
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(settings?.auto_reply_enabled || false);
  const [businessHours, setBusinessHours] = useState(settings?.business_hours || {
    enabled: false,
    timezone: 'UTC',
    schedule: {
      monday: { start: '09:00', end: '17:00', enabled: true },
      tuesday: { start: '09:00', end: '17:00', enabled: true },
      wednesday: { start: '09:00', end: '17:00', enabled: true },
      thursday: { start: '09:00', end: '17:00', enabled: true },
      friday: { start: '09:00', end: '17:00', enabled: true },
      saturday: { start: '10:00', end: '16:00', enabled: false },
      sunday: { start: '10:00', end: '16:00', enabled: false }
    }
  });

  // Auto-reply rule form
  const [newRule, setNewRule] = useState<Partial<AutoReplyRule>>({
    trigger_keywords: [],
    response_type: 'text',
    response_content: '',
    is_active: true,
    priority: 1
  });

  // Ice breakers
  const [iceBreakers, setIceBreakersState] = useState<IceBreaker[]>(settings?.ice_breakers || []);

  const handleSaveGeneral = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    
    try {
      const updates = {
        welcome_message: welcomeMessage,
        auto_reply_enabled: autoReplyEnabled,
        business_hours: businessHours
      };
      
      const success = await onUpdateSettings(updates);
      
      if (welcomeMessage !== settings?.welcome_message) {
        await onSetWelcomeMessage(welcomeMessage);
      }
      
      setSaveStatus(success ? 'success' : 'error');
    } catch (error) {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleAddAutoReplyRule = () => {
    if (!newRule.trigger_keywords?.length || !newRule.response_content) return;
    
    onAddAutoReplyRule(newRule as Omit<AutoReplyRule, 'id' | 'created_at' | 'updated_at'>);
    setNewRule({
      trigger_keywords: [],
      response_type: 'text',
      response_content: '',
      is_active: true,
      priority: 1
    });
  };

  const handleSaveIceBreakers = async () => {
    setIsSaving(true);
    try {
      await onSetIceBreakers(iceBreakers);
      setSaveStatus('success');
    } catch (error) {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'auto-reply', label: 'Auto-Reply', icon: Zap },
    { id: 'ice-breakers', label: 'Ice Breakers', icon: MessageSquare },
    { id: 'menu', label: 'Persistent Menu', icon: Shield }
  ];

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Settings size={20} />
          Instagram DM Settings
        </h2>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon size={16} />
                  {tab.label}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Welcome Message
              </label>
              <textarea
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                placeholder="Enter a welcome message for new conversations..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                This message will be sent to users when they first interact with your account.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Auto-Reply</h4>
                <p className="text-xs text-gray-500">
                  Automatically respond to messages based on keywords
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoReplyEnabled}
                  onChange={(e) => setAutoReplyEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Business Hours */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900">Business Hours</h4>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={businessHours.enabled}
                    onChange={(e) => setBusinessHours(prev => ({ ...prev, enabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {businessHours.enabled && (
                <div className="space-y-2">
                  {Object.entries(businessHours.schedule).map(([day, schedule]) => (
                    <div key={day} className="flex items-center gap-4">
                      <div className="w-20 text-sm font-medium capitalize">
                        {day}
                      </div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={schedule.enabled}
                          onChange={(e) => setBusinessHours(prev => ({
                            ...prev,
                            schedule: {
                              ...prev.schedule,
                              [day]: { ...schedule, enabled: e.target.checked }
                            }
                          }))}
                          className="mr-2"
                        />
                        <span className="text-sm">Open</span>
                      </label>
                      {schedule.enabled && (
                        <div className="flex gap-2">
                          <input
                            type="time"
                            value={schedule.start}
                            onChange={(e) => setBusinessHours(prev => ({
                              ...prev,
                              schedule: {
                                ...prev.schedule,
                                [day]: { ...schedule, start: e.target.value }
                              }
                            }))}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                          <span className="text-sm text-gray-500">to</span>
                          <input
                            type="time"
                            value={schedule.end}
                            onChange={(e) => setBusinessHours(prev => ({
                              ...prev,
                              schedule: {
                                ...prev.schedule,
                                [day]: { ...schedule, end: e.target.value }
                              }
                            }))}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveGeneral}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Save Settings
              </button>

              {saveStatus === 'success' && (
                <div className="flex items-center gap-1 text-green-600 text-sm">
                  <CheckCircle size={16} />
                  Saved successfully
                </div>
              )}

              {saveStatus === 'error' && (
                <div className="flex items-center gap-1 text-red-600 text-sm">
                  <AlertCircle size={16} />
                  Save failed
                </div>
              )}
            </div>
          </div>
        )}

        {/* Auto-Reply Rules */}
        {activeTab === 'auto-reply' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-4">Auto-Reply Rules</h3>
              
              {/* Existing Rules */}
              <div className="space-y-3 mb-6">
                {autoReplyRules.map((rule) => (
                  <div key={rule.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium">
                            Keywords: {rule.trigger_keywords.join(', ')}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded ${
                            rule.is_active 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {rule.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                            Priority: {rule.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {rule.response_type === 'text' 
                            ? rule.response_content as string
                            : `${rule.response_type} template`
                          }
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onUpdateAutoReplyRule(rule.id, { is_active: !rule.is_active })}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          {rule.is_active ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => onDeleteAutoReplyRule(rule.id)}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* New Rule Form */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Add New Rule</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trigger Keywords (comma separated)
                    </label>
                    <input
                      type="text"
                      value={newRule.trigger_keywords?.join(', ') || ''}
                      onChange={(e) => setNewRule({
                        ...newRule,
                        trigger_keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                      })}
                      placeholder="hello, hi, support, help"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Response Type
                    </label>
                    <select
                      value={newRule.response_type}
                      onChange={(e) => setNewRule({ ...newRule, response_type: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="text">Text Message</option>
                      <option value="quick_reply">Quick Replies</option>
                      <option value="template">Template</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Response Content
                    </label>
                    <textarea
                      value={newRule.response_content as string || ''}
                      onChange={(e) => setNewRule({ ...newRule, response_content: e.target.value })}
                      placeholder="Enter your auto-reply message..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority (1-10)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={newRule.priority || 1}
                        onChange={(e) => setNewRule({ ...newRule, priority: parseInt(e.target.value) })}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={handleAddAutoReplyRule}
                        disabled={!newRule.trigger_keywords?.length || !newRule.response_content}
                        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
                      >
                        Add Rule
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ice Breakers */}
        {activeTab === 'ice-breakers' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Ice Breakers</h3>
              <p className="text-sm text-gray-500 mb-4">
                Pre-written questions that users can tap to start a conversation.
              </p>

              <div className="space-y-3">
                {iceBreakers.map((iceBreaker, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={iceBreaker.question}
                      onChange={(e) => {
                        const updated = [...iceBreakers];
                        updated[index] = { ...iceBreaker, question: e.target.value };
                        setIceBreakersState(updated);
                      }}
                      placeholder="Enter question..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={iceBreaker.payload}
                      onChange={(e) => {
                        const updated = [...iceBreakers];
                        updated[index] = { ...iceBreaker, payload: e.target.value };
                        setIceBreakersState(updated);
                      }}
                      placeholder="Payload"
                      className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => setIceBreakersState(iceBreakers.filter((_, i) => i !== index))}
                      className="px-3 py-2 text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => setIceBreakersState([...iceBreakers, { question: '', payload: '' }])}
                  className="px-4 py-2 text-blue-600 hover:text-blue-700 border border-blue-300 rounded-md"
                >
                  + Add Ice Breaker
                </button>
              </div>

              <div className="mt-4">
                <button
                  onClick={handleSaveIceBreakers}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  Save Ice Breakers
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Persistent Menu */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">Persistent Menu</h3>
              <p className="text-sm text-gray-500 mb-4">
                A menu that appears in the conversation for easy navigation.
              </p>
              
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  🚧 Persistent menu configuration coming soon. This will allow you to set up a menu with multiple options for users.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstagramSettingsPanel;