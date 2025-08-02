import React, { useState, useEffect, useRef } from 'react';
import { whatsappService } from '../services/whatsappService';
import { supabase } from '../lib/supabaseClient';
import { MessageCircle, Users, FileText, Bell, UserCheck, BarChart2, Settings, Clock, User, Archive, User as UserIcon, Send, CheckCircle } from 'lucide-react';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import 'react-datepicker/dist/react-datepicker.css';
import Modal from '../components/ui/Modal';
import Papa from 'papaparse';
import './WhatsAppManagerPage.css';
import { useLocation } from 'react-router-dom';
import BulkFiltersPanel from '../components/BulkFiltersPanel';


const SIDEBAR_TABS = [
  { key: 'Inbox', label: 'Inbox', icon: <MessageCircle size={24} /> },
  { key: 'Bulk', label: 'Bulk', icon: <Users size={24} /> },
  { key: 'Templates', label: 'Templates', icon: <FileText size={24} /> },
  { key: 'Notifications', label: 'Notifications', icon: <Bell size={24} /> },
  { key: 'Assignment', label: 'Assignment', icon: <UserCheck size={24} /> },
  { key: 'Analytics', label: 'Analytics', icon: <BarChart2 size={24} /> },
  { key: 'Settings', label: 'Settings', icon: <Settings size={24} /> },
  { key: 'Scheduled', label: 'Scheduled', icon: <Clock size={24} /> },
];


function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString();
}

// Minimal Inbox
const Inbox: React.FC<{ onSelectChat: (chat: any) => void }> = ({ onSelectChat }) => {
  const [chats, setChats] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);
  const [lastMessages, setLastMessages] = useState<{ [chatId: string]: any }>({});
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    const fetchChats = async () => {
      setLoading(true);
      const { data: chatData } = await supabase
        .from('whatsapp_chats')
        .select('*')
        .order('updated_at', { ascending: false });
      setChats(chatData || []);
      setLoading(false);
    };
    const fetchCustomers = async () => {
      const { data } = await supabase
        .from('customers')
        .select('id, name, email, phone, gender, city, joined_date, loyalty_level, color_tag, referred_by, total_spent, points, last_visit, is_active, whatsapp, birth_month, birth_day, referral_source, initial_notes, total_returns, profile_image, created_at, updated_at');
      setCustomers(data || []);
    };
    fetchChats();
    fetchCustomers();
  }, []);

  useEffect(() => {
    const fetchLastMessages = async () => {
      const ids = chats.map(c => c.id);
      if (ids.length === 0) return;
      const { data } = await supabase
        .from('whatsapp_messages')
        .select('id, chat_id, content, timestamp, status')
        .in('chat_id', ids)
        .order('timestamp', { ascending: false });
      const map: { [chatId: string]: any } = {};
      for (const msg of data || []) {
        if (!map[msg.chat_id]) map[msg.chat_id] = msg;
      }
      setLastMessages(map);
    };
    fetchLastMessages();
  }, [chats]);

  const getCustomer = (id: string) => customers.find((c: any) => c.id === id);

  const filtered = chats.filter(chat => {
    if (!showArchived && chat.archived) return false;
    if (showArchived && !chat.archived) return false;
    if (!search) return true;
    const customer = getCustomer(chat.customer_id);
    return (
      (customer && customer.name?.toLowerCase().includes(search.toLowerCase())) ||
      (chat.tags && chat.tags.join(',').toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <div className="flex flex-col gap-2 p-2">
      <div className="flex items-center gap-2 mb-2">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded px-3 py-1 w-full text-sm bg-gray-50 focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <label className="flex items-center gap-1 text-xs text-gray-500">
          <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} />
          Archived
        </label>
      </div>
      {loading ? (
        <div className="text-gray-400 text-sm py-8 text-center">Loading chats...</div>
      ) : filtered.length === 0 ? (
        <div className="text-gray-300 text-sm py-8 text-center">No chats found.</div>
      ) : (
        <div className="flex flex-col gap-1 overflow-y-auto">
          {filtered.map(chat => {
            const customer = getCustomer(chat.customer_id);
            const lastMsg = lastMessages[chat.id];
            const unread = chat.unread_count > 0;
            return (
              <button
                key={chat.id}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors w-full text-left hover:bg-gray-100 ${unread ? 'bg-gray-50' : ''}`}
                onClick={() => onSelectChat(chat)}
              >
                {customer?.profile_image ? (
                  <img src={customer.profile_image} alt={customer.name} className="w-9 h-9 rounded-full object-cover border border-gray-200" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-base font-bold border border-gray-200">
                    {customer?.name?.charAt(0).toUpperCase() || <User size={18} />}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800 truncate text-sm">{customer?.name || 'Unknown'}</span>
                    {unread && <span className="ml-1 w-2 h-2 rounded-full bg-primary inline-block" />}
                  </div>
                  <div className="text-xs text-gray-500 truncate">{lastMsg ? lastMsg.content : 'No messages yet.'}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Minimal ChatView
const ChatView: React.FC<{ chat: any; onBack: () => void }> = ({ chat, onBack }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msgType, setMsgType] = useState<'text' | 'media' | 'template'>('text');
  const [mediaUrl, setMediaUrl] = useState('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date | null>(null);
  const [] = useState(false);
  const [showAllForCustomer, setShowAllForCustomer] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      const { data } = await supabase
        .from('customers')
        .select('id, name, profile_image, whatsapp');
      setCustomers(data || []);
    };
    fetchCustomers();
  }, []);

  const getCustomer = (id: string) => customers.find((c: any) => c.id === id);

  const fetchMessages = async () => {
    setLoading(true);
    let data;
    if (showAllForCustomer && chat.customer_id) {
      // Fetch all messages for this customer (across all chats)
      const { data: msgs } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .in('chat_id',
          (await supabase.from('whatsapp_chats').select('id').eq('customer_id', chat.customer_id)).data?.map((c: any) => c.id) || []
        )
        .order('timestamp', { ascending: true });
      data = msgs;
    } else {
      // Fetch only messages for this chat
      const { data: msgs } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('chat_id', chat.id)
        .order('timestamp', { ascending: true });
      data = msgs;
    }
    setMessages(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMessages();
    const fetchTemplates = async () => {
      const { data } = await supabase
        .from('communication_templates')
        .select('*')
        .eq('template_type', 'whatsapp')
        .eq('is_active', true)
        .order('title', { ascending: true });
      setTemplates(data || []);
    };
    fetchTemplates();
  }, [chat.id, showAllForCustomer]);

  const handleSend = async () => {
    if (msgType === 'text' && !newMsg.trim()) return;
    if (msgType === 'media' && !mediaUrl.trim()) return;
    if (msgType === 'template' && !selectedTemplate) return;
    setSending(true);
    setError(null);
    try {
      let res: any = null;
      const customer = customers.find((c: any) => c.id === chat.customer_id);
      const whatsappNumber = customer?.whatsapp ? customer.whatsapp.replace(/[^0-9]/g, '') + '@c.us' : null;
      if (!whatsappNumber) {
        setError('Customer WhatsApp number not found or invalid.');
        setSending(false);
        return;
      }
      if (isScheduled && scheduleDate) {
        // Insert into scheduled_whatsapp_messages
        const insertRes = await supabase.from('scheduled_whatsapp_messages').insert({
          chat_id: chat.id,
          content: newMsg,
          type: msgType,
          media_url: msgType === 'media' ? mediaUrl : null,
          template_id: msgType === 'template' ? selectedTemplate : null,
          variables: msgType === 'template' ? null : null, // Add variable support if needed
          scheduled_for: scheduleDate.toISOString(),
          status: 'pending',
          created_by: null // set current user if available
        });
        if (insertRes.error) {
          setError(insertRes.error.message || 'Failed to schedule message');
        } else {
          setNewMsg('');
          setMediaUrl('');
          setSelectedTemplate('');
          setIsScheduled(false);
          setScheduleDate(null);
        }
        setSending(false);
        return;
      }
      // Debug log
      // eslint-disable-next-line no-console
      // console.log('[WhatsApp Debug] Sending to:', whatsappNumber, 'Message:', newMsg, 'Type:', msgType);
      if (msgType === 'text') {
        res = await whatsappService.sendMessage(whatsappNumber, newMsg, 'text');
      } else if (msgType === 'media') {
        res = await whatsappService.sendMessage(whatsappNumber, newMsg, 'media', mediaUrl);
      } else if (msgType === 'template') {
        res = await whatsappService.sendMessage(whatsappNumber, newMsg, 'template', undefined, selectedTemplate);
      }
      // eslint-disable-next-line no-console
      // console.log('[WhatsApp Debug] API response:', res);
      if (!res) {
        setError('Failed to send message');
        setSending(false);
        return;
      }
      if (!res.success) {
        setError(res.error || 'Failed to send message');
      } else {
        // Insert sent message into DB
        await supabase.from('whatsapp_messages').insert({
          chat_id: chat.id,
          sender: 'me',
          recipient: whatsappNumber,
          content: newMsg,
          type: msgType,
          status: 'sent',
          timestamp: new Date().toISOString(),
          ...(msgType === 'media' ? { media_url: mediaUrl } : {}),
          ...(msgType === 'template' ? { template_id: selectedTemplate } : {})
        });
        setNewMsg('');
        setMediaUrl('');
        setSelectedTemplate('');
        await fetchMessages();
      }
    } catch (e: any) {
      setError(e.message || 'Failed to send message');
    }
    setSending(false);
  };



  const renderMessage = (msg: any) => {
    const isMe = msg.sender === 'me';
    const customer = getCustomer(msg.sender);
    const showAvatar = !isMe;
    const isMedia = msg.type === 'media' && msg.media_url;
    return (
      <div key={msg.id} className={`mb-4 flex ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in`}> 
        <div className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}> 
          {showAvatar && (
            customer?.profile_image ? (
              <img src={customer.profile_image} alt={customer.name} className="w-7 h-7 rounded-full object-cover border border-gray-200" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold border border-gray-200">
                {customer?.name?.charAt(0).toUpperCase() || <UserIcon size={12} />}
              </div>
            )
          )}
          <div className={`px-4 py-2 rounded-2xl max-w-xs break-words shadow-md transition-all duration-200 ${isMe ? 'bg-primary text-white' : 'bg-white text-gray-900 border border-gray-100'}`}> 
            {isMedia ? (
              <div className="mb-1">
                <img src={msg.media_url} alt="media" className="rounded-lg max-h-40 mb-1" />
                {msg.content && <div className="text-sm mt-1">{msg.content}</div>}
              </div>
            ) : (
              <div className="text-base">{msg.content}</div>
            )}
            <div className="text-xs text-gray-400 mt-1 text-right">{formatDate(msg.timestamp)}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full max-h-[80vh]">
      <div className="flex items-center gap-2 border-b px-4 py-2 bg-white">
        <button onClick={onBack} className="text-primary text-sm px-2 py-1 rounded hover:bg-gray-100">&larr; Back</button>
        <span className="font-medium text-gray-700 text-sm ml-2">
          Chat: {getCustomer(chat.customer_id)?.name || 'Unknown'}
        </span>
        {/* Toggle for all messages for this customer */}
        <label className="ml-auto flex items-center gap-1 text-xs">
          <input type="checkbox" checked={showAllForCustomer} onChange={e => setShowAllForCustomer(e.target.checked)} />
          Show all messages for this customer
        </label>
      </div>
      {/* Debug: Show all message senders and content */}
      <div className="overflow-x-auto whitespace-nowrap bg-yellow-50 border-b px-4 py-2 text-xs flex gap-4">
        {messages.length === 0 ? (
          <span className="text-gray-400">No messages loaded.</span>
        ) : (
          messages.map(m => (
            <div key={m.id} className="inline-block bg-yellow-100 border border-yellow-300 rounded px-3 py-1 mr-2">
              <span className="font-semibold text-yellow-800">Sender: {m.sender}</span>
              <span className="ml-2 text-gray-700">{m.content}</span>
              <span className="ml-2 text-gray-500">{new Date(m.timestamp).toLocaleString()}</span>
            </div>
          ))
        )}
      </div>
      {/* Sent Texts Summary Bar */}
      <div className="overflow-x-auto whitespace-nowrap bg-gray-100 border-b px-4 py-2 text-xs flex gap-4">
        {messages.filter(m => m.type === 'text' && (m.sender === 'me' || m.sender === 'system')).length === 0 ? (
          <span className="text-gray-400">No sent texts yet.</span>
        ) : (
          messages.filter(m => m.type === 'text' && (m.sender === 'me' || m.sender === 'system')).map(m => (
            <div key={m.id} className="inline-block bg-primary/10 border border-primary/20 rounded px-3 py-1 mr-2">
              <span className="font-semibold text-primary">{m.content}</span>
              <span className="ml-2 text-gray-500">{new Date(m.timestamp).toLocaleString()}</span>
            </div>
          ))
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-2 bg-gray-50">
        {loading ? (
          <div className="text-gray-400 text-sm">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-gray-300 text-sm">No messages yet.</div>
        ) : (
          messages.map(renderMessage)
        )}
      </div>
      <form className="flex flex-col gap-2 px-4 py-2 bg-white border-t" onSubmit={e => { e.preventDefault(); handleSend(); }}>
        <div className="flex gap-2 items-center">
          <select value={msgType} onChange={e => setMsgType(e.target.value as any)} className="border border-gray-200 rounded px-2 py-1 text-sm bg-gray-50">
            <option value="text">Text</option>
            <option value="media">Media</option>
            <option value="template">Template</option>
          </select>
          {msgType === 'media' && (
            <input
              type="text"
              value={mediaUrl}
              onChange={e => setMediaUrl(e.target.value)}
              placeholder="Media URL"
              className="border border-gray-200 rounded px-2 py-1 text-sm bg-gray-50 flex-1"
              disabled={sending}
            />
          )}
        </div>
        {msgType === 'text' && (
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              placeholder="Type a message..."
              className="border border-gray-200 rounded px-3 py-2 flex-1 text-sm bg-gray-50"
              disabled={sending}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button type="submit" className="bg-primary text-white px-4 py-2 rounded text-sm" disabled={sending} aria-label="Send">
              <Send size={16} />
            </button>
          </div>
        )}
        {msgType === 'media' && (
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={mediaUrl}
              onChange={e => setMediaUrl(e.target.value)}
              placeholder="Media URL"
              className="border border-gray-200 rounded px-2 py-1 text-sm bg-gray-50 flex-1"
              disabled={sending}
            />
            <input
              type="text"
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              placeholder="Caption (optional)"
              className="border border-gray-200 rounded px-3 py-2 flex-1 text-sm bg-gray-50"
              disabled={sending}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <button type="submit" className="bg-primary text-white px-4 py-2 rounded text-sm" disabled={sending} aria-label="Send">
              <Send size={16} />
            </button>
          </div>
        )}
        {msgType === 'template' && (
          <div className="flex flex-col gap-2">
            <select
              value={selectedTemplate}
              onChange={e => setSelectedTemplate(e.target.value)}
              className="border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50"
              disabled={sending}
            >
              <option value="">Select Template</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                placeholder="Template variables/content"
                className="border border-gray-200 rounded px-3 py-2 flex-1 text-sm bg-gray-50"
                disabled={sending}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <button type="submit" className="bg-primary text-white px-4 py-2 rounded text-sm" disabled={sending} aria-label="Send">
                <Send size={16} />
              </button>
            </div>
          </div>
        )}
      </form>
      {error && <div className="mt-2 text-danger text-xs px-4">{error}</div>}
    </div>
  );
};

// Add helper to extract variables from message
function extractVariables(str: string): string[] {
  const matches = str.match(/\{(\w+)\}/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map(v => v.replace(/[{}]/g, ''))));
}

const BulkMessaging: React.FC = () => {
  const [chats, setChats] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [msgType, setMsgType] = useState<'text' | 'media' | 'template'>('text');
  const [newMsg, setNewMsg] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [sending, setSending] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date | null>(null);
  // Advanced filtering state
  const [filterTag, setFilterTag] = useState('');
  const [filterLoyalty, setFilterLoyalty] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRegDateFrom, setFilterRegDateFrom] = useState('');
  const [filterRegDateTo, setFilterRegDateTo] = useState('');
  // New advanced filter states
  const [filterCity, setFilterCity] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterLastVisitFrom, setFilterLastVisitFrom] = useState('');
  const [filterLastVisitTo, setFilterLastVisitTo] = useState('');
  const [filterTotalSpentMin, setFilterTotalSpentMin] = useState('');
  const [filterTotalSpentMax, setFilterTotalSpentMax] = useState('');
  const [filterTagsMulti, setFilterTagsMulti] = useState<string[]>([]);
  const [filterLoyaltyMulti, setFilterLoyaltyMulti] = useState<string[]>([]);
  // Add preview state
  const [showPreview, setShowPreview] = useState(false);
  // CSV import state
  const [importedRecipients, setImportedRecipients] = useState<any[]>([]);
  const [importSummary, setImportSummary] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAllCustomersModal, setShowAllCustomersModal] = useState(false);
  const [allCustomers] = useState<any[]>([]);
  const [selectedBulkCustomers, setSelectedBulkCustomers] = useState<string[]>([]);
  // Test message state
  const [testNumber, setTestNumber] = useState('');
  const [testResult, setTestResult] = useState<string>('');
  const [sendingTest, setSendingTest] = useState(false);
  // Scheduling UI improvements
  const [, setShowSchedulePicker] = useState(false);
  // Progress bar state
  const [, setProgress] = useState(0);
  const [sendingStatus, setSendingStatus] = useState<{[chatId: string]: string}>({});
  // Campaigns state
  const [savedCampaigns, setSavedCampaigns] = useState<any[]>([]);
  const [campaignName, setCampaignName] = useState('');
  const [campaignsLoaded, setCampaignsLoaded] = useState(false);
  // Exclude filters
  const [excludeTag, setExcludeTag] = useState('');
  const [excludeTagsMulti, setExcludeTagsMulti] = useState<string[]>([]);
  const [excludeStatus, setExcludeStatus] = useState('');
  // Attachment upload state
  const [] = useState<File | null>(null);
  const [attachmentUrl] = useState('');
  const [] = useState(false);
  // New: recipient tab state
  const [recipientTab, setRecipientTab] = useState<'filtered' | 'all' | 'import'>('filtered');
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);

  useEffect(() => {
    const fetchChats = async () => {
      const { data } = await supabase
        .from('whatsapp_chats')
        .select('id, customer_id, tags, unread_count, updated_at')
        .order('updated_at', { ascending: false });
      setChats(data || []);
    };
    const fetchTemplates = async () => {
      const { data } = await supabase
        .from('communication_templates')
        .select('*')
        .eq('template_type', 'whatsapp')
        .eq('is_active', true)
        .order('title', { ascending: true });
      setTemplates(data || []);
    };
    const fetchCustomers = async () => {
      const { data } = await supabase
        .from('customers')
        .select('id, name, email, phone, gender, city, joined_date, loyalty_level, color_tag, referred_by, total_spent, points, last_visit, is_active, whatsapp, birth_month, birth_day, referral_source, initial_notes, total_returns, profile_image, created_at, updated_at');
      setCustomers(data || []);
    };
    fetchChats();
    fetchTemplates();
    fetchCustomers();
  }, []);

  const getCustomer = (id: string) => customers.find((c: any) => c.id === id);

  // Filtering logic (only use valid fields)
  const filteredChats = chats.filter(chat => {
    const customer = getCustomer(chat.customer_id);
    if (!customer) return false;
    // Loyalty (single)
    if (filterLoyalty && customer.loyalty_level !== filterLoyalty) return false;
    // Loyalty (multi)
    if (filterLoyaltyMulti.length > 0 && !filterLoyaltyMulti.includes(customer.loyalty_level)) return false;
    // Status
    if (filterStatus) {
      if (filterStatus === 'active' && !customer.is_active) return false;
      if (filterStatus === 'inactive' && customer.is_active) return false;
    }
    // Exclude status
    if (excludeStatus) {
      if (excludeStatus === 'active' && customer.is_active) return false;
      if (excludeStatus === 'inactive' && !customer.is_active) return false;
    }
    // Registration date
    if (filterRegDateFrom && new Date(customer.created_at) < new Date(filterRegDateFrom)) return false;
    if (filterRegDateTo && new Date(customer.created_at) > new Date(filterRegDateTo)) return false;
    // City
    if (filterCity && customer.city !== filterCity) return false;
    // Gender
    if (filterGender && customer.gender !== filterGender) return false;
    // Last visit
    if (filterLastVisitFrom && (!customer.last_visit || new Date(customer.last_visit) < new Date(filterLastVisitFrom))) return false;
    if (filterLastVisitTo && (!customer.last_visit || new Date(customer.last_visit) > new Date(filterLastVisitTo))) return false;
    // Total spent
    if (filterTotalSpentMin && (isNaN(Number(customer.total_spent)) || Number(customer.total_spent) < Number(filterTotalSpentMin))) return false;
    if (filterTotalSpentMax && (isNaN(Number(customer.total_spent)) || Number(customer.total_spent) > Number(filterTotalSpentMax))) return false;
    // Tag (single)
    if (filterTag && !(customer.tags || []).includes(filterTag)) return false;
    // Tags (multi)
    if (filterTagsMulti.length > 0 && !filterTagsMulti.some(tag => (customer.tags || []).includes(tag))) return false;
    // Exclude tag (single)
    if (excludeTag && (customer.tags || []).includes(excludeTag)) return false;
    // Exclude tags (multi)
    if (excludeTagsMulti.length > 0 && excludeTagsMulti.some(tag => (customer.tags || []).includes(tag))) return false;
    return true;
  });

  const handleSelect = (id: string) => {
    setSelected(sel => sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]);
  };


  // Helper to build personalized message for a customer
  const buildPersonalizedMsg = (msg: string, customer: any) => {
    if (!customer || typeof msg !== 'string') return msg;
    let result = msg;
    const vars = extractVariables(msg);
    vars.forEach(v => {
      let val = '';
      if (v === 'name') val = customer.name || '';
      else if (v === 'phone') val = customer.whatsapp || '';
      else if (v === 'loyalty') val = customer.loyalty || '';
      else if (v === 'status') val = customer.status || '';
      else if (v === 'reg_date') val = customer.created_at ? new Date(customer.created_at).toLocaleDateString() : '';
      else if (v === 'tag') val = (customer.tags || []).join(', ');
      else if (customer[v]) val = customer[v];
      result = result.replace(new RegExp(`\\{${v}\\}`, 'gi'), val);
    });
    return result;
  };

  // Fetch all customers

  const handleSendBulk = async () => {
    if (selected.length === 0 && selectedBulkCustomers.length === 0) return;
    setSending(true);
    setResults([]);
    setProgress(0);
    setSendingStatus({});
    let sendResults: any[] = [];
    // If using selectedBulkCustomers, create chats if needed
    let targetChatIds = [...selected];
    if (selectedBulkCustomers.length > 0) {
      for (const customerId of selectedBulkCustomers) {
        // Find or create chat
        let chat = chats.find((c: any) => c.customer_id === customerId);
        if (!chat) {
          const res = await whatsappService.createChat(customerId);
          if (res.success && res.chat) chat = res.chat;
        }
        if (chat) targetChatIds.push(chat.id);
      }
    }
    // Remove duplicates
    targetChatIds = Array.from(new Set(targetChatIds));
    if (isScheduled && scheduleDate) {
      for (let i = 0; i < targetChatIds.length; i++) {
        const chatId = targetChatIds[i];
        setSendingStatus(prev => ({ ...prev, [chatId]: 'scheduling' }));
        const insertRes = await supabase.from('scheduled_whatsapp_messages').insert({
          chat_id: chatId,
          content: newMsg,
          type: msgType,
          media_url: msgType === 'media' ? mediaUrl : null,
          template_id: msgType === 'template' ? selectedTemplate : null,
          variables: msgType === 'template' ? null : null,
          scheduled_for: scheduleDate.toISOString(),
          status: 'pending',
          created_by: null
        });
        sendResults.push({ chatId, ...insertRes });
        setSendingStatus(prev => ({ ...prev, [chatId]: insertRes.error ? 'failed' : 'scheduled' }));
        setProgress(Math.round(((i + 1) / targetChatIds.length) * 100));
      }
      setResults(sendResults);
      setSending(false);
      setNewMsg('');
      setMediaUrl('');
      setSelectedTemplate('');
      setIsScheduled(false);
      setScheduleDate(null);
      setProgress(100);
      return;
    }
    for (let i = 0; i < targetChatIds.length; i++) {
      const chatId = targetChatIds[i];
      setSendingStatus(prev => ({ ...prev, [chatId]: 'sending' }));
      let res: any = null;
      if (msgType === 'text') {
        res = await whatsappService.sendMessage(chatId, newMsg, 'text');
      } else if (msgType === 'media') {
        res = await whatsappService.sendMessage(chatId, newMsg, 'media', attachmentUrl || mediaUrl);
      } else if (msgType === 'template') {
        res = await whatsappService.sendMessage(chatId, newMsg, 'template', undefined, selectedTemplate);
      }
      sendResults.push({ chatId, ...res });
      setSendingStatus(prev => ({ ...prev, [chatId]: res && res.success ? 'sent' : 'failed' }));
      setProgress(Math.round(((i + 1) / targetChatIds.length) * 100));
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    setResults(sendResults);
    setSending(false);
    setProgress(100);
  };

  // CSV import handler
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        const rows = results.data;
        // Try to match by customer_id or phone/whatsapp
        const matched: string[] = [];
        let found = 0, notFound = 0;
        rows.forEach((row: any) => {
          let chatId = '';
          if (row.customer_id) {
            const chat = chats.find((c: any) => getCustomer(c.customer_id)?.id === row.customer_id);
            if (chat) chatId = chat.id;
          } else if (row.phone || row.whatsapp) {
            const phone = (row.phone || row.whatsapp).replace(/[^0-9]/g, '');
            const chat = chats.find((c: any) => getCustomer(c.customer_id)?.whatsapp?.replace(/[^0-9]/g, '') === phone);
            if (chat) chatId = chat.id;
          }
          if (chatId && !matched.includes(chatId)) {
            matched.push(chatId);
            found++;
          } else {
            notFound++;
          }
        });
        setSelected(matched);
        setImportedRecipients(matched);
        setImportSummary(`Imported: ${found} matched, ${notFound} not found.`);
      },
      error: () => setImportSummary('Failed to parse CSV.')
    });
  };
  const handleClearImport = () => {
    setImportedRecipients([]);
    setImportSummary('');
    setSelected([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Send test message handler
  const handleSendTest = async () => {
    if (!testNumber) return;
    setSendingTest(true);
    setTestResult('');
    // Replace variables with dummy/test values
    let msg = newMsg;
    const vars = extractVariables(newMsg);
    vars.forEach(v => {
      let val = '[test]';
      if (v === 'name') val = 'Test Name';
      else if (v === 'phone') val = testNumber;
      else if (v === 'loyalty') val = 'Gold';
      else if (v === 'status') val = 'Active';
      else if (v === 'reg_date') val = '2024-01-01';
      else if (v === 'tag') val = 'VIP';
      msg = msg.replace(new RegExp(`\\{${v}\\}`, 'gi'), val);
    });
    try {
      let res: any = null;
      const waNumber = testNumber.replace(/[^0-9]/g, '') + '@c.us';
      if (msgType === 'text') {
        res = await whatsappService.sendMessage(waNumber, msg, 'text');
      } else if (msgType === 'media') {
        res = await whatsappService.sendMessage(waNumber, msg, 'media', mediaUrl);
      } else if (msgType === 'template') {
        res = await whatsappService.sendMessage(waNumber, msg, 'template', undefined, selectedTemplate);
      }
      if (res && res.success) setTestResult('Test message sent!');
      else setTestResult(res?.error || 'Failed to send test message');
    } catch (e: any) {
      setTestResult(e.message || 'Failed to send test message');
    }
    setSendingTest(false);
  };

  // Load campaigns from localStorage
  useEffect(() => {
    if (!campaignsLoaded) {
      const data = localStorage.getItem('bulk_campaigns');
      if (data) setSavedCampaigns(JSON.parse(data));
      setCampaignsLoaded(true);
    }
  }, [campaignsLoaded]);

  // Save campaigns to localStorage
  const saveCampaigns = (campaigns: any[]) => {
    setSavedCampaigns(campaigns);
    localStorage.setItem('bulk_campaigns', JSON.stringify(campaigns));
  };

  // Save current as campaign
  const handleSaveCampaign = () => {
    if (!campaignName.trim()) return;
    const newCampaign = {
      name: campaignName.trim(),
      msgType,
      newMsg,
      mediaUrl,
      selectedTemplate
    };
    const updated = [...savedCampaigns, newCampaign];
    saveCampaigns(updated);
    setCampaignName('');
  };

  // Load campaign
  const handleLoadCampaign = (c: any) => {
    setMsgType(c.msgType);
    setNewMsg(c.newMsg);
    setMediaUrl(c.mediaUrl);
    setSelectedTemplate(c.selectedTemplate);
  };

  // Delete campaign
  const handleDeleteCampaign = (idx: number) => {
    const updated = savedCampaigns.filter((_, i) => i !== idx);
    saveCampaigns(updated);
  };

  // Handle attachment file selection and upload

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6">
      {/* Left: Recipient selection and filters */}
      <GlassCard className="w-full lg:w-1/2 flex flex-col gap-4 p-4">
        {/* Tabs for recipient selection */}
        <div className="flex gap-2 mb-2">
          <GlassButton size="sm" variant={recipientTab === 'filtered' ? 'primary' : 'secondary'} onClick={() => setRecipientTab('filtered')}>Filtered</GlassButton>
          <GlassButton size="sm" variant={recipientTab === 'all' ? 'primary' : 'secondary'} onClick={() => setRecipientTab('all')}>All Customers</GlassButton>
          <GlassButton size="sm" variant={recipientTab === 'import' ? 'primary' : 'secondary'} onClick={() => setRecipientTab('import')}>Import CSV</GlassButton>
        </div>
        {/* Collapsible filters */}
        <div className="mb-2">
          <button className="text-xs text-primary underline" onClick={() => setFiltersCollapsed(f => !f)}>
            {filtersCollapsed ? 'Show Filters' : 'Hide Filters'}
          </button>
        </div>
        {!filtersCollapsed && (
          <BulkFiltersPanel
            customers={customers}
            filterTag={filterTag}
            setFilterTag={setFilterTag}
            filterTagsMulti={filterTagsMulti}
            setFilterTagsMulti={setFilterTagsMulti}
            filterLoyalty={filterLoyalty}
            setFilterLoyalty={setFilterLoyalty}
            filterLoyaltyMulti={filterLoyaltyMulti}
            setFilterLoyaltyMulti={setFilterLoyaltyMulti}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterRegDateFrom={filterRegDateFrom}
            setFilterRegDateFrom={setFilterRegDateFrom}
            filterRegDateTo={filterRegDateTo}
            setFilterRegDateTo={setFilterRegDateTo}
            filterCity={filterCity}
            setFilterCity={setFilterCity}
            filterGender={filterGender}
            setFilterGender={setFilterGender}
            filterLastVisitFrom={filterLastVisitFrom}
            setFilterLastVisitFrom={setFilterLastVisitFrom}
            filterLastVisitTo={filterLastVisitTo}
            setFilterLastVisitTo={setFilterLastVisitTo}
            filterTotalSpentMin={filterTotalSpentMin}
            setFilterTotalSpentMin={setFilterTotalSpentMin}
            filterTotalSpentMax={filterTotalSpentMax}
            setFilterTotalSpentMax={setFilterTotalSpentMax}
            excludeTag={excludeTag}
            setExcludeTag={setExcludeTag}
            excludeTagsMulti={excludeTagsMulti}
            setExcludeTagsMulti={setExcludeTagsMulti}
            excludeStatus={excludeStatus}
            setExcludeStatus={setExcludeStatus}
          />
        )}
        {/* Recipient list based on tab */}
        <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[350px]">
          {recipientTab === 'filtered' && (
            <div className="flex flex-col gap-1 overflow-y-auto">
              {filteredChats.map(chat => {
                const customer = getCustomer(chat.customer_id);
                return (
                  <label key={chat.id} className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-all ${selected.includes(chat.id) ? 'bg-primary/10' : 'hover:bg-gray-100'}`}> 
                    <input
                      type="checkbox"
                      checked={selected.includes(chat.id)}
                      onChange={() => handleSelect(chat.id)}
                      className="accent-primary"
                    />
                    {customer?.profile_image ? (
                      <img src={customer.profile_image} alt={customer.name} className="w-7 h-7 rounded-full object-cover border border-gray-200" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold border border-gray-200">
                        {customer?.name?.charAt(0).toUpperCase() || <User size={12} />}
                      </div>
                    )}
                    <span className="text-xs text-gray-800 truncate">{customer?.name || 'Unknown'}</span>
                    <span className="text-xs text-gray-400 ml-2">Unread: {chat.unread_count || 0}</span>
                  </label>
                );
              })}
            </div>
          )}
          {recipientTab === 'all' && (
            <div className="flex flex-col gap-1 overflow-y-auto">
              {allCustomers.map(c => (
                <label key={c.id} className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-all ${selected.includes(c.id) ? 'bg-primary/10' : 'hover:bg-gray-100'}`}> 
                  <input
                    type="checkbox"
                    checked={selected.includes(c.id)}
                    onChange={() => handleSelect(c.id)}
                    className="accent-primary"
                  />
                  {c.profile_image && <img src={c.profile_image} alt={c.name} className="w-6 h-6 rounded-full" />}
                  <span>{c.name} {c.whatsapp ? `(${c.whatsapp})` : ''}</span>
                </label>
              ))}
            </div>
          )}
          {recipientTab === 'import' && (
            <div className="flex flex-col gap-1 overflow-y-auto">
              <div className="flex items-center gap-2 mb-2">
                <GlassButton
                  size="sm"
                  variant="primary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Import Recipients (CSV)
                </GlassButton>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleImportCSV}
                />
                {importedRecipients.length > 0 && (
                  <GlassButton size="sm" variant="secondary" onClick={handleClearImport}>Clear Import</GlassButton>
                )}
                {importSummary && <span className="text-xs text-gray-500 ml-2">{importSummary}</span>}
              </div>
            </div>
          )}
        </div>
      </GlassCard>
      {/* Right: Message composer, preview, actions */}
      <GlassCard className="w-full lg:w-1/2 flex flex-col gap-4 p-4 relative">
        {/* Message type tabs, composer, attachment, etc. */}
        <div className="flex gap-2 items-center mb-2">
          <select value={msgType} onChange={e => setMsgType(e.target.value as any)} className="border border-gray-200 rounded px-2 py-1 text-sm bg-gray-50 mb-1">
            <option value="text">Text</option>
            <option value="media">Media</option>
            <option value="template">Template</option>
          </select>
          {msgType === 'media' && (
            <input
              type="text"
              value={mediaUrl}
              onChange={e => setMediaUrl(e.target.value)}
              placeholder="Media URL"
              className="border border-gray-200 rounded px-2 py-1 text-sm bg-gray-50 flex-1"
              disabled={sending}
            />
          )}
        </div>
        {/* Send Test Message & Save Campaign */}
        <div className="flex flex-wrap gap-2 items-center mb-2">
          <input
            type="text"
            value={testNumber}
            onChange={e => setTestNumber(e.target.value)}
            placeholder="Test WhatsApp number (e.g. 2557xxxxxxx)"
            className="border border-gray-200 rounded px-2 py-1 text-xs bg-gray-50 w-48"
          />
          <GlassButton
            size="sm"
            variant="success"
            onClick={handleSendTest}
            disabled={sendingTest || !testNumber}
          >
            {sendingTest ? 'Sending...' : 'Send Test Message'}
          </GlassButton>
          {testResult && <span className={`text-xs ml-2 ${testResult.includes('sent') ? 'text-success' : 'text-danger'}`}>{testResult}</span>}
          <input
            type="text"
            value={campaignName}
            onChange={e => setCampaignName(e.target.value)}
            placeholder="Save as campaign..."
            className="border border-gray-200 rounded px-2 py-1 text-xs bg-gray-50"
          />
          <GlassButton
            size="sm"
            variant="primary"
            onClick={handleSaveCampaign}
            disabled={!campaignName.trim()}
          >
            Save
          </GlassButton>
        </div>
        {/* Message input always visible */}
        <div className="flex gap-2 items-center mb-2">
          <input
            type="text"
            value={newMsg}
            onChange={e => setNewMsg(e.target.value)}
            placeholder={msgType === 'text' ? 'Type a message...' : msgType === 'media' ? 'Caption (optional)' : 'Template variables/content'}
            className="border border-gray-200 rounded px-3 py-2 flex-1 text-sm bg-gray-50"
            disabled={sending}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendBulk();
              }
            }}
          />
        </div>
        {/* Campaigns UI */}
        <div className="mb-3">
          {savedCampaigns.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-1">
              {savedCampaigns.map((c, idx) => (
                <div key={idx} className="flex items-center gap-1 border border-gray-200 rounded px-2 py-1 text-xs bg-gray-50">
                  <span className="font-semibold">{c.name}</span>
                  <GlassButton size="sm" variant="secondary" onClick={() => handleLoadCampaign(c)}>Load</GlassButton>
                  <GlassButton size="sm" variant="danger" onClick={() => handleDeleteCampaign(idx)}>Delete</GlassButton>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Show/Hide Preview toggle */}
        <div className="flex items-center gap-2 mb-2">
          <GlassButton
            size="sm"
            variant="secondary"
            onClick={() => setShowPreview(p => !p)}
            disabled={selected.length === 0}
          >
            {showPreview ? 'Hide Preview' : 'Show Personalization Preview'}
          </GlassButton>
        </div>
        {/* Personalization preview */}
        {showPreview && (
          <div className="mb-4 border rounded bg-white/80 p-2 max-h-48 overflow-y-auto">
            <div className="font-semibold text-xs mb-2">Personalization Preview</div>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500">
                  <th className="text-left">Recipient</th>
                  <th className="text-left">Message</th>
                </tr>
              </thead>
              <tbody>
                {selected.map(chatId => {
                  const chat = chats.find((c: any) => c.id === chatId);
                  const customer = chat ? getCustomer(chat.customer_id) : null;
                  return (
                    <tr key={chatId} className="border-b last:border-b-0">
                      <td className="pr-2 py-1">{customer?.name || 'Unknown'}</td>
                      <td className="py-1">{buildPersonalizedMsg(newMsg, customer)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {/* Scheduling UI */}
        <div className="flex items-center gap-2 mb-3">
          <label className="flex items-center gap-1 text-xs">
            <input
              type="checkbox"
              checked={isScheduled}
              onChange={e => {
                setIsScheduled(e.target.checked);
                setShowSchedulePicker(e.target.checked);
              }}
            />
            Schedule Bulk Message
          </label>
          {isScheduled && (
            <>
              <input
                type="datetime-local"
                value={scheduleDate ? new Date(scheduleDate).toISOString().slice(0, 16) : ''}
                onChange={e => setScheduleDate(e.target.value ? new Date(e.target.value) : null)}
                className="border border-gray-200 rounded px-2 py-1 text-xs bg-gray-50"
                min={new Date().toISOString().slice(0, 16)}
              />
              {scheduleDate && (
                <span className="text-xs text-gray-500 ml-2">Scheduled for: {new Date(scheduleDate).toLocaleString()}</span>
              )}
              <GlassButton
                size="sm"
                variant="secondary"
                onClick={() => { setIsScheduled(false); setShowSchedulePicker(false); setScheduleDate(null); }}
              >
                Clear
              </GlassButton>
            </>
          )}
        </div>
        {/* Progress/results UI */}
        <div className="mt-4">
          <div className="font-semibold text-sm mb-2 flex items-center gap-2">
            Results:
            {results.length > 0 && (
              <GlassButton
                size="sm"
                variant="primary"
                onClick={() => {
                  const data = results.map(r => {
                    const chat = chats.find(c => c.id === r.chatId);
                    const customer = chat ? getCustomer(chat.customer_id) : null;
                    const status = sendingStatus[r.chatId] || (r.success ? 'sent' : r.error ? 'failed' : '');
                    return {
                      Recipient: customer?.name || 'Unknown',
                      ChatID: r.chatId,
                      Status: status,
                      Error: r.error || ''
                    };
                  });
                  const csv = Papa.unparse(data);
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'bulk_results.csv';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Export CSV
              </GlassButton>
            )}
          </div>
          <div className="space-y-1">
            {results.map(r => {
              const chat = chats.find(c => c.id === r.chatId);
              const customer = chat ? getCustomer(chat.customer_id) : null;
              const status = sendingStatus[r.chatId] || (r.success ? 'sent' : r.error ? 'failed' : '');
              return (
                <div key={r.chatId} className={`text-xs flex items-center gap-2 ${status === 'sent' ? 'text-success-dark' : status === 'failed' ? 'text-danger' : status === 'sending' ? 'text-warning' : status === 'scheduled' ? 'text-info' : ''}`}>
                  {status === 'sent' && <CheckCircle size={14} />}
                  {status === 'failed' && <Archive size={14} />}
                  {status === 'sending' && <Clock size={14} />}
                  {status === 'scheduled' && <Clock size={14} />}
                  {customer?.name || 'Unknown'}: {status.charAt(0).toUpperCase() + status.slice(1)}
                  {r.error && <span className="ml-2 text-danger">({r.error})</span>}
                </div>
              );
            })}
          </div>
        </div>
        {/* Sticky action bar (Send, Schedule, Export) */}
        <div className="sticky bottom-0 left-0 w-full bg-white/80 py-3 flex gap-3 justify-end z-10 border-t border-gray-100">
          <GlassButton
            size="md"
            variant="primary"
            onClick={handleSendBulk}
            disabled={sending || (selected.length === 0 && selectedBulkCustomers.length === 0)}
          >
            <Send size={16} /> Send
          </GlassButton>
          {isScheduled && (
            <GlassButton
              size="md"
              variant="secondary"
              onClick={() => setIsScheduled(false)}
            >
              Cancel Schedule
            </GlassButton>
          )}
          {results.length > 0 && (
            <GlassButton
              size="md"
              variant="secondary"
              onClick={() => {
                const data = results.map(r => {
                  const chat = chats.find(c => c.id === r.chatId);
                  const customer = chat ? getCustomer(chat.customer_id) : null;
                  const status = sendingStatus[r.chatId] || (r.success ? 'sent' : r.error ? 'failed' : '');
                  return {
                    Recipient: customer?.name || 'Unknown',
                    ChatID: r.chatId,
                    Status: status,
                    Error: r.error || ''
                  };
                });
                const csv = Papa.unparse(data);
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'bulk_results.csv';
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              Export Results
            </GlassButton>
          )}
        </div>
      </GlassCard>
      {/* Modal to select customers for bulk WhatsApp */}
      {showAllCustomersModal && (
        <Modal isOpen={showAllCustomersModal} onClose={() => setShowAllCustomersModal(false)} title="Select Customers for Bulk WhatsApp">
          <div className="max-h-96 overflow-y-auto">
            {allCustomers.map(c => (
              <label key={c.id} className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  checked={selectedBulkCustomers.includes(c.id)}
                  onChange={() => setSelectedBulkCustomers(sel => sel.includes(c.id) ? sel.filter(x => x !== c.id) : [...sel, c.id])}
                />
                {c.profile_image && <img src={c.profile_image} alt={c.name} className="w-6 h-6 rounded-full" />}
                <span>{c.name} {c.whatsapp ? `(${c.whatsapp})` : ''}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <GlassButton onClick={() => setShowAllCustomersModal(false)}>Done</GlassButton>
          </div>
        </Modal>
      )}
      {/* Test Message UI */}
      <div className="flex items-center gap-2 mb-3">
        <input
          type="text"
          value={testNumber}
          onChange={e => setTestNumber(e.target.value)}
          placeholder="Test WhatsApp number (e.g. 2557xxxxxxx)"
          className="border border-gray-200 rounded px-2 py-1 text-xs bg-gray-50 w-48"
        />
        <button
          type="button"
          className="text-xs bg-success text-white px-3 py-1 rounded hover:bg-success/80"
          onClick={handleSendTest}
          disabled={sendingTest || !testNumber}
        >
          {sendingTest ? 'Sending...' : 'Send Test Message'}
        </button>
        {testResult && <span className={`text-xs ml-2 ${testResult.includes('sent') ? 'text-success' : 'text-danger'}`}>{testResult}</span>}
      </div>
    </div>
  );
};

// Minimal TemplatesManager
const TemplatesManager: React.FC = () => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTemplate, setEditTemplate] = useState<any | null>(null);
  const [form, setForm] = useState({ title: '', content: '', variables: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('communication_templates')
      .select('*')
      .eq('template_type', 'whatsapp')
      .order('title', { ascending: true });
    setTemplates(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchTemplates(); }, []);

  const openModal = (tpl?: any) => {
    setEditTemplate(tpl || null);
    setForm({
      title: tpl?.title || '',
      content: tpl?.content || '',
      variables: tpl?.variables ? JSON.stringify(tpl.variables) : '',
      description: tpl?.description || ''
    });
    setShowModal(true);
    setError(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditTemplate(null);
    setForm({ title: '', content: '', variables: '', description: '' });
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const variables = form.variables ? JSON.parse(form.variables) : {};
      if (editTemplate) {
        await supabase.from('communication_templates').update({
          title: form.title,
          content: form.content,
          variables,
          description: form.description
        }).eq('id', editTemplate.id);
      } else {
        await supabase.from('communication_templates').insert({
          title: form.title,
          content: form.content,
          variables,
          description: form.description,
          template_type: 'whatsapp',
          is_active: true
        });
      }
      await fetchTemplates();
      closeModal();
    } catch (e: any) {
      setError(e.message || 'Failed to save template');
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this template?')) return;
    await supabase.from('communication_templates').delete().eq('id', id);
    await fetchTemplates();
  };

  return (
    <div className="p-4 max-w-lg w-full mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="font-semibold text-base">WhatsApp Templates</div>
        <button className="bg-primary text-white px-3 py-1 rounded text-sm" onClick={() => openModal()}>Add Template</button>
      </div>
      {loading ? (
        <div className="text-gray-400 text-sm">Loading templates...</div>
      ) : templates.length === 0 ? (
        <div className="text-gray-300 text-sm">No templates found.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {templates.map(tpl => (
            <div key={tpl.id} className="bg-white rounded border border-gray-100 p-3 flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900 text-sm">{tpl.title}</div>
                <div className="text-xs text-gray-500 mb-1">{tpl.description}</div>
                <div className="text-xs text-gray-700">{tpl.content}</div>
                <div className="text-xs text-gray-400">Vars: {tpl.variables ? JSON.stringify(tpl.variables) : '-'}</div>
              </div>
              <div className="flex gap-2">
                <button className="text-xs text-primary px-2 py-1 rounded hover:bg-primary/10" onClick={() => openModal(tpl)}>Edit</button>
                <button className="text-xs text-danger px-2 py-1 rounded hover:bg-danger/10" onClick={() => handleDelete(tpl.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="font-semibold mb-2">{editTemplate ? 'Edit' : 'Add'} Template</div>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Title"
              className="border border-gray-200 rounded px-3 py-2 w-full mb-2 text-sm bg-gray-50"
              disabled={saving}
            />
            <input
              type="text"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Description"
              className="border border-gray-200 rounded px-3 py-2 w-full mb-2 text-sm bg-gray-50"
              disabled={saving}
            />
            <textarea
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="Content (use {var} for variables)"
              className="border border-gray-200 rounded px-3 py-2 w-full mb-2 text-sm bg-gray-50"
              rows={3}
              disabled={saving}
            />
            <input
              type="text"
              value={form.variables}
              onChange={e => setForm(f => ({ ...f, variables: e.target.value }))}
              placeholder='Variables (JSON, e.g. {"name":""})'
              className="border border-gray-200 rounded px-3 py-2 w-full mb-2 text-sm bg-gray-50"
              disabled={saving}
            />
            <div className="flex gap-2 mt-2 justify-end">
              <button className="px-4 py-2 rounded bg-gray-100 text-gray-700 text-sm" onClick={closeModal} disabled={saving}>Cancel</button>
              <button className="px-4 py-2 rounded bg-primary text-white text-sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
            {error && <div className="text-danger mt-2 text-xs">{error}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

// Minimal NotificationsPanel
const NotificationsPanel: React.FC = () => {
  const [unread, setUnread] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<any[]>([]);

  const fetchUnread = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('status', 'sent')
      .order('timestamp', { ascending: false });
    setUnread(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchUnread();
    const fetchCustomers = async () => {
      const { data } = await supabase.from('customers').select('id, name');
      setCustomers(data || []);
    };
    fetchCustomers();
    // Subscribe to new WhatsApp messages
    const sub = supabase
      .channel('whatsapp-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'whatsapp_messages' },
        payload => {
          setUnread(prev => [payload.new, ...prev]);
        }
      )
      .subscribe();
    return () => { sub.unsubscribe(); };
  }, []);

  const getCustomer = (id: string) => customers.find((c: any) => c.id === id);

  const markAsRead = async (id: string) => {
    await supabase.from('whatsapp_messages').update({ status: 'read' }).eq('id', id);
    setUnread(prev => prev.filter(m => m.id !== id));
  };

  return (
    <div className="p-4 max-w-lg w-full mx-auto">
      <div className="font-semibold mb-4 text-base">Unread WhatsApp Messages</div>
      {loading ? (
        <div className="text-gray-400 text-sm">Loading notifications...</div>
      ) : unread.length === 0 ? (
        <div className="text-gray-300 text-sm">No new messages.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {unread.map(msg => (
            <div key={msg.id} className="bg-white rounded border border-gray-100 p-3 flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900 text-sm">{msg.content}</div>
                <div className="text-xs text-gray-500">Chat: {getCustomer(msg.customer_id)?.name || 'Unknown'}</div>
                <div className="text-xs text-gray-400">{formatDate(msg.timestamp)}</div>
              </div>
              <button className="text-xs text-primary px-2 py-1 rounded hover:bg-primary/10" onClick={() => markAsRead(msg.id)}>Mark as Read</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Minimal AssignmentTagging
const AssignmentTagging: React.FC = () => {
  const [chats, setChats] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const { data: chatData } = await supabase
      .from('whatsapp_chats')
      .select('*')
      .order('updated_at', { ascending: false });
    const { data: userData } = await supabase
      .from('auth_users')
      .select('id, name, role')
      .order('name', { ascending: true });
    setChats(chatData || []);
    setUsers(userData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const fetchCustomers = async () => {
      const { data } = await supabase.from('customers').select('id, name');
      setCustomers(data || []);
    };
    fetchCustomers();
  }, []);

  const getCustomer = (id: string) => customers.find((c: any) => c.id === id);

  const handleAssign = async (chatId: string, userId: string) => {
    await supabase.from('whatsapp_chats').update({ assigned_to: userId }).eq('id', chatId);
    fetchData();
  };

  const handleAddTag = async (chatId: string) => {
    if (!tagInput.trim()) return;
    const chat = chats.find((c: any) => c.id === chatId);
    const tags = Array.from(new Set([...(chat.tags || []), tagInput.trim()]));
    await supabase.from('whatsapp_chats').update({ tags }).eq('id', chatId);
    setTagInput('');
    fetchData();
  };

  const handleRemoveTag = async (chatId: string, tag: string) => {
    const chat = chats.find((c: any) => c.id === chatId);
    const tags = (chat.tags || []).filter((t: string) => t !== tag);
    await supabase.from('whatsapp_chats').update({ tags }).eq('id', chatId);
    fetchData();
  };

  const filtered = chats.filter(chat => {
    if (filterTag && !(chat.tags || []).includes(filterTag)) return false;
    if (filterUser && chat.assigned_to !== filterUser) return false;
    return true;
  });

  return (
    <div className="p-4 max-w-lg w-full mx-auto">
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={filterTag}
          onChange={e => setFilterTag(e.target.value)}
          placeholder="Filter by tag"
          className="border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50"
        />
        <select value={filterUser} onChange={e => setFilterUser(e.target.value)} className="border border-gray-200 rounded px-3 py-2 text-sm bg-gray-50">
          <option value="">All Staff</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </div>
      {loading ? (
        <div className="text-gray-400 text-sm">Loading chats...</div>
      ) : filtered.length === 0 ? (
        <div className="text-gray-300 text-sm">No chats found.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map(chat => (
            <div key={chat.id} className="bg-white rounded border border-gray-100 p-3 flex flex-col gap-2">
              <div className="flex items-center gap-4">
                <div className="font-semibold text-gray-900 text-sm">Chat: {getCustomer(chat.customer_id)?.name || 'Unknown'}</div>
                {/* <div className="text-xs text-gray-500">Customer: {chat.customer_id || 'N/A'}</div> */}
                <div className="text-xs text-gray-400">Tags: {(chat.tags || []).join(', ') || '-'}</div>
                <div className="text-xs text-gray-400">Assigned: {users.find(u => u.id === chat.assigned_to)?.name || '-'}</div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={chat.assigned_to || ''}
                  onChange={e => handleAssign(chat.id, e.target.value)}
                  className="border border-gray-200 rounded px-2 py-1 text-sm bg-gray-50"
                >
                  <option value="">Assign to...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  placeholder="Add tag"
                  className="border border-gray-200 rounded px-2 py-1 text-sm bg-gray-50"
                />
                <button className="bg-success text-white px-3 py-1 rounded text-xs" onClick={() => handleAddTag(chat.id)}>Add Tag</button>
                {(chat.tags || []).map((tag: string) => (
                  <button key={tag} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded ml-1" onClick={() => handleRemoveTag(chat.id, tag)}>{tag} ×</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Minimal AnalyticsPanel
const AnalyticsPanel: React.FC = () => {
  const [stats, setStats] = useState<any>({ total: 0, sent: 0, delivered: 0, read: 0, failed: 0 });
  const [chatCount, setChatCount] = useState(0);
  const [staffStats, setStaffStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const analytics = await whatsappService.getAnalytics();
      setStats(analytics);
      const { count: chatCount } = await supabase
        .from('whatsapp_chats')
        .select('*', { count: 'exact', head: true });
      setChatCount(chatCount || 0);
      // Staff performance: messages sent per staff
      const { data: users } = await supabase
        .from('auth_users')
        .select('id, name');
      const staffStatsArr: any[] = [];
      for (const user of users || []) {
        const { count } = await supabase
          .from('whatsapp_chats')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', user.id);
        staffStatsArr.push({ id: user.id, name: user.name, chats: count || 0 });
      }
      setStaffStats(staffStatsArr);
      setLoading(false);
    };
    fetchStats();
  }, []);

  return (
    <div className="p-4 max-w-2xl w-full mx-auto">
      <div className="font-semibold mb-4 text-base">WhatsApp Analytics</div>
      {loading ? (
        <div className="text-gray-400 text-sm">Loading analytics...</div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            <div className="bg-white rounded border border-gray-100 p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.total}</div>
              <div className="text-xs text-gray-500">Total Messages</div>
            </div>
            <div className="bg-white rounded border border-gray-100 p-4 text-center">
              <div className="text-2xl font-bold text-success">{stats.sent}</div>
              <div className="text-xs text-gray-500">Sent</div>
            </div>
            <div className="bg-white rounded border border-gray-100 p-4 text-center">
              <div className="text-2xl font-bold text-warning">{stats.delivered}</div>
              <div className="text-xs text-gray-500">Delivered</div>
            </div>
            <div className="bg-white rounded border border-gray-100 p-4 text-center">
              <div className="text-2xl font-bold text-indigo">{stats.read}</div>
              <div className="text-xs text-gray-500">Read</div>
            </div>
            <div className="bg-white rounded border border-gray-100 p-4 text-center">
              <div className="text-2xl font-bold text-danger">{stats.failed}</div>
              <div className="text-xs text-gray-500">Failed</div>
            </div>
          </div>
          <div className="bg-white rounded border border-gray-100 p-4">
            <div className="font-semibold mb-2 text-sm">Total Chats: {chatCount}</div>
            <div className="font-semibold mb-2 text-sm">Staff Performance</div>
            <div className="space-y-1">
              {staffStats.map(s => (
                <div key={s.id} className="flex justify-between text-xs">
                  <span>{s.name}</span>
                  <span className="font-bold text-primary">{s.chats} chats</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Minimal SettingsPanel
const SettingsPanel: React.FC = () => {
  const [instanceId, setInstanceId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchKeys = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('settings').select('key, value').in('key', ['whatsapp_instance_id', 'whatsapp_green_api_key']);
      if (error) setError(error.message);
      else {
        setInstanceId(data?.find((d: any) => d.key === 'whatsapp_instance_id')?.value || '');
        setApiKey(data?.find((d: any) => d.key === 'whatsapp_green_api_key')?.value || '');
      }
      setLoading(false);
    };
    fetchKeys();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    const { error } = await supabase.from('settings').upsert([
      { key: 'whatsapp_instance_id', value: instanceId },
      { key: 'whatsapp_green_api_key', value: apiKey }
    ], { onConflict: 'key' });
    if (error) setError(error.message);
    else setSuccess('Green API credentials saved successfully.');
    setSaving(false);
  };

  const handleRemove = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    const { error } = await supabase.from('settings').delete().in('key', ['whatsapp_instance_id', 'whatsapp_green_api_key']);
    if (error) setError(error.message);
    else {
      setInstanceId('');
      setApiKey('');
      setSuccess('Green API credentials removed.');
    }
    setSaving(false);
  };

  return (
    <div className="p-4 max-w-md w-full mx-auto bg-white rounded border border-gray-100">
      <div className="font-semibold mb-4 text-base">Green API Credentials</div>
      <div className="mb-2 font-semibold text-sm">Instance ID</div>
      <input type="text" className="border border-gray-200 rounded px-3 py-2 w-full mb-2 text-sm bg-gray-50" value={instanceId} onChange={e => setInstanceId(e.target.value)} placeholder="Instance ID" />
      <div className="mb-2 font-semibold text-sm">API Key</div>
      <input type="password" className="border border-gray-200 rounded px-3 py-2 w-full mb-2 text-sm bg-gray-50" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="API Key" />
      <div className="flex gap-2 mt-2">
        <button className="bg-primary text-white px-4 py-2 rounded text-sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        <button className="bg-danger text-white px-4 py-2 rounded text-sm" onClick={handleRemove} disabled={saving || (!instanceId && !apiKey)}>Remove</button>
      </div>
      {loading && <div className="mt-2 text-gray-500 text-xs">Loading...</div>}
      {error && <div className="mt-2 text-danger text-xs">{error}</div>}
      {success && <div className="mt-2 text-success text-xs">{success}</div>}
    </div>
  );
};

// Minimal ScheduledMessagesPanel
const ScheduledMessagesPanel: React.FC = () => {
  const [scheduledMessages, setScheduledMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMessage, setEditMessage] = useState<any | null>(null);
  const [form, setForm] = useState({ type: 'text', content: '', media_url: '', template_id: '', variables: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);

  const fetchScheduledMessages = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('scheduled_whatsapp_messages')
      .select('*')
      .order('scheduled_for', { ascending: true });
    setScheduledMessages(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchScheduledMessages();
    const fetchCustomers = async () => {
      const { data } = await supabase.from('customers').select('id, name');
      setCustomers(data || []);
    };
    fetchCustomers();
    // Subscribe to new scheduled messages
    const sub = supabase
      .channel('scheduled-whatsapp-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'scheduled_whatsapp_messages' },
        payload => {
          setScheduledMessages(prev => [payload.new, ...prev]);
        }
      )
      .subscribe();
    return () => { sub.unsubscribe(); };
  }, []);

  const getCustomer = (id: string) => customers.find((c: any) => c.id === id);

  const openModal = (msg?: any) => {
    setEditMessage(msg || null);
    setForm({
      type: msg?.type || 'text',
      content: msg?.content || '',
      media_url: msg?.media_url || '',
      template_id: msg?.template_id || '',
      variables: msg?.variables ? JSON.stringify(msg.variables) : ''
    });
    setShowModal(true);
    setError(null);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMessage(null);
    setForm({ type: 'text', content: '', media_url: '', template_id: '', variables: '' });
    setError(null);
  };

  const handleSaveScheduled = async () => {
    setSaving(true);
    setError(null);
    try {
      const variables = form.variables ? JSON.parse(form.variables) : {};
      if (editMessage) {
        await supabase.from('scheduled_whatsapp_messages').update({
          content: form.content,
          media_url: form.media_url,
          template_id: form.template_id,
          variables,
          scheduled_for: editMessage.scheduled_for // Keep original scheduled_for
        }).eq('id', editMessage.id);
      } else {
        await supabase.from('scheduled_whatsapp_messages').insert({
          chat_id: editMessage?.chat_id, // Use chat_id from editMessage if editing
          content: form.content,
          media_url: form.media_url,
          template_id: form.template_id,
          variables,
          scheduled_for: editMessage?.scheduled_for || new Date().toISOString(), // Use original scheduled_for if editing
          status: 'pending',
          created_by: null // set current user if available
        });
      }
      await fetchScheduledMessages();
      closeModal();
    } catch (e: any) {
      setError(e.message || 'Failed to save scheduled message');
    }
    setSaving(false);
  };

  const handleDeleteScheduled = async (id: string) => {
    if (!window.confirm('Delete this scheduled message?')) return;
    await supabase.from('scheduled_whatsapp_messages').delete().eq('id', id);
    await fetchScheduledMessages();
  };

  const handleSendNow = async (id: string) => {
    const message = scheduledMessages.find(msg => msg.id === id);
    if (!message) return;

    let res: any = null;
    if (message.type === 'text') {
      res = await whatsappService.sendMessage(message.chat_id, message.content, 'text');
    } else if (message.type === 'media') {
      res = await whatsappService.sendMessage(message.chat_id, message.content, 'media', message.media_url);
    } else if (message.type === 'template') {
      res = await whatsappService.sendMessage(message.chat_id, message.content, 'template', undefined, message.template_id);
    }

    if (!res) {
      setError('Failed to send scheduled message');
      return;
    }
    if (!res.success) {
      setError(res.error || 'Failed to send scheduled message');
    } else {
      await supabase.from('scheduled_whatsapp_messages').update({ status: 'sent' }).eq('id', id);
      await fetchScheduledMessages();
    }
  };

  return (
    <div className="p-4 max-w-lg w-full mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="font-semibold text-base">Scheduled WhatsApp Messages</div>
        <button className="bg-primary text-white px-4 py-2 rounded text-sm" onClick={() => openModal()}>Add Scheduled Message</button>
      </div>
      {loading ? (
        <div className="text-gray-400 text-sm">Loading scheduled messages...</div>
      ) : scheduledMessages.length === 0 ? (
        <div className="text-gray-300 text-sm">No scheduled messages found.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {scheduledMessages.map(msg => (
            <div key={msg.id} className="bg-white rounded border border-gray-100 p-3 flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900 text-sm">Chat: {getCustomer(msg.customer_id)?.name || 'Unknown'}</div>
                <div className="text-xs text-gray-500">Scheduled for: {new Date(msg.scheduled_for).toLocaleString()}</div>
                <div className="text-xs text-gray-700">Content: {msg.content}</div>
                <div className="text-xs text-gray-400">Type: {msg.type}</div>
                <div className="text-xs text-gray-400">Status: {msg.status}</div>
                <div className="text-xs text-gray-400">Vars: {msg.variables ? JSON.stringify(msg.variables) : '-'}</div>
              </div>
              <div className="flex gap-2">
                <button className="text-xs text-primary px-2 py-1 rounded hover:bg-primary/10" onClick={() => openModal(msg)}>Edit</button>
                <button className="text-xs text-danger px-2 py-1 rounded hover:bg-danger/10" onClick={() => handleDeleteScheduled(msg.id)}>Delete</button>
                {msg.status === 'pending' && (
                  <button className="text-xs text-success px-2 py-1 rounded hover:bg-success/10" onClick={() => handleSendNow(msg.id)}>Send Now</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="font-semibold mb-2">{editMessage ? 'Edit' : 'Add'} Scheduled Message</div>
            <div className="mb-2 font-semibold text-sm">Chat ID</div>
            <input type="text" className="border border-gray-200 rounded px-3 py-2 w-full mb-2 text-sm bg-gray-50" value={editMessage?.chat_id || ''} readOnly />
            <div className="mb-2 font-semibold text-sm">Scheduled For</div>
            <input type="text" className="border border-gray-200 rounded px-3 py-2 w-full mb-2 text-sm bg-gray-50" value={editMessage?.scheduled_for ? new Date(editMessage.scheduled_for).toLocaleString() : ''} readOnly />
            <div className="mb-2 font-semibold text-sm">Message Type</div>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="border border-gray-200 rounded px-3 py-2 w-full mb-2 text-sm bg-gray-50">
              <option value="text">Text</option>
              <option value="media">Media</option>
              <option value="template">Template</option>
            </select>
            <div className="mb-2 font-semibold text-sm">Content/Media URL/Template ID</div>
            <textarea
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="Content for text, Media URL for media, Template ID for template"
              className="border border-gray-200 rounded px-3 py-2 w-full mb-2 text-sm bg-gray-50"
              rows={3}
              disabled={saving}
            />
            <input
              type="text"
              value={form.media_url}
              onChange={e => setForm(f => ({ ...f, media_url: e.target.value }))}
              placeholder="Media URL (for media type)"
              className="border border-gray-200 rounded px-3 py-2 w-full mb-2 text-sm bg-gray-50"
              disabled={saving}
            />
            <input
              type="text"
              value={form.template_id}
              onChange={e => setForm(f => ({ ...f, template_id: e.target.value }))}
              placeholder="Template ID (for template type)"
              className="border border-gray-200 rounded px-3 py-2 w-full mb-2 text-sm bg-gray-50"
              disabled={saving}
            />
            <input
              type="text"
              value={form.variables}
              onChange={e => setForm(f => ({ ...f, variables: e.target.value }))}
              placeholder='Variables (JSON, e.g. {"name":""})'
              className="border border-gray-200 rounded px-3 py-2 w-full mb-2 text-sm bg-gray-50"
              disabled={saving}
            />
            <div className="flex gap-2 mt-2 justify-end">
              <button className="px-4 py-2 rounded bg-gray-100 text-gray-700 text-sm" onClick={closeModal} disabled={saving}>Cancel</button>
              <button className="px-4 py-2 rounded bg-primary text-white text-sm" onClick={handleSaveScheduled} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
            {error && <div className="text-danger mt-2 text-xs">{error}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

const WhatsAppManagerPage: React.FC = () => {
  const [tab, setTab] = useState('Inbox');
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [existingChats, setExistingChats] = useState<any[]>([]);
  const [newChatCustomerId, setNewChatCustomerId] = useState('');
  const [creatingChat, setCreatingChat] = useState(false);
  const [newChatError, setNewChatError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Fetch all customers and existing chats for modal
  useEffect(() => {
    if (!showNewChatModal) return;
    const fetchData = async () => {
      const { data: customers } = await supabase.from('customers').select('id, name, profile_image, whatsapp');
      const { data: chats } = await supabase.from('whatsapp_chats').select('customer_id');
      setAllCustomers(customers || []);
      setExistingChats((chats || []).map((c: any) => c.customer_id));
    };
    fetchData();
  }, [showNewChatModal]);

  useEffect(() => {
    // Auto-select chat if customerId is passed in location.state
    if (location.state && location.state.customerId) {
      const customerId = location.state.customerId;
      const fetchOrCreateChat = async () => {
        // Try to find existing chat
        const { data: chats } = await supabase.from('whatsapp_chats').select('*').eq('customer_id', customerId);
        let chat = chats && chats.length > 0 ? chats[0] : null;
        if (!chat) {
          // Create chat if not exists
          const res = await whatsappService.createChat(customerId);
          if (res.success && res.chat) chat = res.chat;
        }
        if (chat) {
          setTab('Inbox');
          setSelectedChat(chat);
        }
      };
      fetchOrCreateChat();
      // Clear the state so it doesn't repeat
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleCreateChat = async () => {
    if (!newChatCustomerId) return;
    setCreatingChat(true);
    setNewChatError('');
    const res = await whatsappService.createChat(newChatCustomerId);
    setCreatingChat(false);
    if (res.success && res.chat) {
      setShowNewChatModal(false);
      setSelectedChat(res.chat);
      setNewChatCustomerId('');
    } else {
      setNewChatError(res.error || 'Failed to create chat');
    }
  };

  // Example WhatsApp account info and stats (replace with real data if available)

  return (
    <div className="flex min-h-screen items-start justify-start pl-4 sm:pl-8 lg:pl-12 pr-4 sm:pr-8 lg:pr-12">
      <GlassCard className="flex w-full h-full mb-0 p-0 shadow-lg border-none bg-white/80 rounded-2xl">
        {/* Sidebar - now part of unified card */}
        <aside
          className={`transition-all duration-300 ease-in-out
            ${sidebarOpen ? 'w-56' : 'w-16'}
            h-full bg-transparent rounded-l-2xl rounded-r-none border-none shadow-none flex flex-col items-center p-0 m-0
          `}
          style={{ minHeight: '70vh', maxHeight: '100vh', backdropFilter: 'blur(8px)' }}
          onMouseEnter={() => setSidebarOpen(true)}
          onMouseLeave={() => setSidebarOpen(false)}
        >
          <div className="flex flex-col items-center gap-2 py-5 w-full">
            <div className="p-1.5 bg-white/50 rounded-xl">
              <img src="/public/logos/whatsapp.svg" alt="WA" className="w-8 h-8" />
            </div>
          </div>
          <nav className="flex-1 flex flex-col gap-1.5 items-center w-full px-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 hover:scrollbar-thumb-gray-300">
            {SIDEBAR_TABS.map(t => (
              <button
                key={t.key}
                className={`flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl transition-all duration-300 font-semibold text-base
                  ${tab === t.key 
                    ? 'bg-blue-500 text-white shadow-xl border border-primary/40 scale-[1.04]' 
                    : 'text-gray-700 hover:bg-blue-100/70 hover:text-blue-700 hover:shadow-md hover:scale-[1.03]'}
                  ${!sidebarOpen && 'justify-center'}
                `}
                style={{ transition: 'background 0.2s, color 0.2s, box-shadow 0.2s, border 0.2s, transform 0.2s, width 0.3s' }}
                onClick={() => { setTab(t.key); setSelectedChat(null); }}
                title={t.label}
              >
                <span className={`flex-shrink-0 ${!sidebarOpen && 'mx-auto'}`}>{t.icon}</span>
                <span
                  className={`text-base font-semibold whitespace-nowrap transition-all duration-300
                    ${sidebarOpen ? 'opacity-100 ml-2' : 'opacity-0 w-0 overflow-hidden'}
                  `}
                >{t.label}</span>
              </button>
            ))}
          </nav>
          <div className="mt-auto py-4 flex flex-col items-center w-full px-3">
            <div className={`h-[1px] w-full bg-gray-200/50 mb-3 ${!sidebarOpen && 'w-8 mx-auto'}`} />
            {/* Status indicator */}
            <div className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-gray-600
              ${!sidebarOpen && 'justify-center'}
            `}>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              {sidebarOpen && <span>Connected</span>}
            </div>
          </div>
        </aside>
        {/* Main Content - tab content area */}
        <div className="flex-1 flex flex-col h-full bg-transparent rounded-r-2xl p-0 m-0">
          {/* Render content based on tab */}
          {tab === 'Inbox' && (
            <div className="flex min-h-[70vh] h-full">
              {/* Chat List Panel */}
              <section className="w-80 max-w-xs border-r border-gray-100 flex flex-col bg-transparent">
                <div className="p-4 border-b flex items-center justify-between">
                  <span className="font-bold text-lg text-primary-dark">Chats</span>
                  <button className="w-8 h-8 flex items-center justify-center rounded backdrop-blur-md border border-gray-200 shadow-md hover:bg-white/30 text-primary" onClick={() => setShowNewChatModal(true)}>
                    <span className="text-xl leading-none">+</span>
                  </button>
                </div>
                {/* Chat List (reuse Inbox chat list, but as a persistent panel) */}
                <Inbox onSelectChat={setSelectedChat} />
              </section>
              {/* Chat View Panel */}
              <main className="flex-1 flex flex-col bg-transparent">
                {!selectedChat ? (
                  <div className="flex flex-1 items-center justify-center text-gray-300 text-lg">
                    Select a chat to start messaging
                  </div>
                ) : (
                  <ChatView chat={selectedChat} onBack={() => setSelectedChat(null)} />
                )}
              </main>
            </div>
          )}
          {tab === 'Bulk' && (
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto px-4 py-6">
                <GlassCard className="w-full max-w-2xl mx-auto">
                  <BulkMessaging />
                </GlassCard>
              </div>
            </div>
          )}
          {tab === 'Templates' && (
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto px-4 py-6">
                <GlassCard className="w-full max-w-2xl mx-auto">
                  <TemplatesManager />
                </GlassCard>
              </div>
            </div>
          )}
          {tab === 'Notifications' && (
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto px-4 py-6">
                <GlassCard className="w-full max-w-2xl mx-auto">
                  <NotificationsPanel />
                </GlassCard>
              </div>
            </div>
          )}
          {tab === 'Assignment' && (
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto px-4 py-6">
                <GlassCard className="w-full max-w-2xl mx-auto">
                  <AssignmentTagging />
                </GlassCard>
              </div>
            </div>
          )}
          {tab === 'Analytics' && (
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto px-4 py-6">
                <GlassCard className="w-full max-w-3xl mx-auto">
                  <AnalyticsPanel />
                </GlassCard>
              </div>
            </div>
          )}
          {tab === 'Settings' && (
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto px-4 py-6">
                <GlassCard className="w-full max-w-md mx-auto">
                  <SettingsPanel />
                </GlassCard>
              </div>
            </div>
          )}
          {tab === 'Scheduled' && (
            <div className="flex-1 overflow-hidden">
              <div className="h-full overflow-y-auto px-4 py-6">
                <GlassCard className="w-full max-w-2xl mx-auto">
                  <ScheduledMessagesPanel />
                </GlassCard>
              </div>
            </div>
          )}
        </div>
      </GlassCard>
      {/* New Chat Modal */}
      {showNewChatModal && (
        <Modal isOpen={showNewChatModal} onClose={() => setShowNewChatModal(false)}>
          <div className="p-4">
            <h2 className="text-base font-semibold mb-2">Start New Chat</h2>
            <select
              className="border border-gray-200 rounded px-3 py-2 w-full mb-2 text-sm bg-gray-50"
              value={newChatCustomerId}
              onChange={e => setNewChatCustomerId(e.target.value)}
            >
              <option value="">Select customer...</option>
              {allCustomers.filter(c => !existingChats.includes(c.id)).map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.whatsapp ? `(${c.whatsapp})` : ''}</option>
              ))}
            </select>
            <button className="bg-primary text-white w-full py-2 rounded mt-2 text-sm" onClick={handleCreateChat} disabled={creatingChat || !newChatCustomerId}>
              {creatingChat ? 'Creating...' : 'Create Chat'}
            </button>
            {newChatError && <div className="text-danger mt-2 text-sm">{newChatError}</div>}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default WhatsAppManagerPage; 