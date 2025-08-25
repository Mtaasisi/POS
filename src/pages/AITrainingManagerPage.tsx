import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/features/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Badge } from '@/shared/components/ui/badge';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { 
  Plus, 
  Trash2, 
  Save, 
  TestTube, 
  MessageSquare, 
  Database, 
  Brain, 
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

const supabase = createClient(
  'https://jxhzveborezjhsmzsgbc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
);

interface AutoReplyRule {
  id: string;
  trigger: string;
  response: string;
  enabled: boolean;
  exact_match: boolean;
  case_sensitive: boolean;
  created_at: string;
}

interface ChatData {
  customer: string;
  your_response: string;
  category: string;
}

interface AITestResult {
  success: boolean;
  autoReply: boolean;
  replyType: string;
  reply: string;
  analysis?: any;
}

const AI_CATEGORIES = [
  'greeting',
  'pricing',
  'technical_support',
  'service_inquiry',
  'location',
  'schedule',
  'urgent',
  'appointment',
  'complaint',
  'appreciation',
  'goodbye',
  'warranty'
];

export default function AITrainingManagerPage() {
  const [activeTab, setActiveTab] = useState('database-rules');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [testResult, setTestResult] = useState<AITestResult | null>(null);
  
  // Database Rules State
  const [rules, setRules] = useState<AutoReplyRule[]>([]);
  const [newRule, setNewRule] = useState({
    trigger: '',
    response: '',
    exact_match: true,
    case_sensitive: false
  });

  // Chat Analysis State
  const [chatData, setChatData] = useState<ChatData[]>([
    { customer: '', your_response: '', category: 'greeting' }
  ]);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // AI Test State
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    loadDatabaseRules();
  }, []);

  const loadDatabaseRules = async () => {
    try {
      setLoading(true);
      // Use the compatibility view to handle both old and new column structures
      const { data, error } = await supabase
        
        .select('id, trigger, response, enabled, case_sensitive, exact_match, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error with compatibility view, trying direct table:', error);
        // Fallback to direct table with both column sets
        const { data: fallbackData, error: fallbackError } = await supabase
          
          .select('id, trigger, response, enabled, case_sensitive, exact_match, created_at, updated_at, trigger_text, response_text, is_active')
          .order('created_at', { ascending: false });

        if (fallbackError) throw fallbackError;
        
        // Map the data to ensure consistent structure
        const mappedData = (fallbackData || []).map(rule => ({
          id: rule.id,
          trigger: rule.trigger || rule.trigger_text || '',
          response: rule.response || rule.response_text || '',
          enabled: rule.enabled !== undefined ? rule.enabled : rule.is_active,
          case_sensitive: rule.case_sensitive || false,
          exact_match: rule.exact_match || false,
          created_at: rule.created_at,
          updated_at: rule.updated_at
        }));
        
        setRules(mappedData);
      } else {
        setRules(data || []);
      }
    } catch (error) {
      console.error('Error loading rules:', error);
      setMessage('Error loading database rules');
    } finally {
      setLoading(false);
    }
  };

  const addDatabaseRule = async () => {
    if (!newRule.trigger || !newRule.response) {
      setMessage('Please fill in both trigger and response');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        
        .insert({
          trigger: newRule.trigger,
          response: newRule.response,
          enabled: true,
          exact_match: newRule.exact_match,
          case_sensitive: newRule.case_sensitive,
          // Also set the old column names for compatibility
          trigger_text: newRule.trigger,
          response_text: newRule.response,
          is_active: true
        })
        .select('id, trigger, response, enabled, case_sensitive, exact_match, created_at, updated_at');

      if (error) throw error;

      setRules([data[0], ...rules]);
      setNewRule({ trigger: '', response: '', exact_match: true, case_sensitive: false });
      setMessage('Database rule added successfully!');
    } catch (error) {
      console.error('Error adding rule:', error);
      setMessage('Error adding database rule');
    } finally {
      setLoading(false);
    }
  };

  const deleteDatabaseRule = async (id: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRules(rules.filter(rule => rule.id !== id));
      setMessage('Database rule deleted successfully!');
    } catch (error) {
      console.error('Error deleting rule:', error);
      setMessage('Error deleting database rule');
    } finally {
      setLoading(false);
    }
  };

  const toggleRuleStatus = async (id: string, enabled: boolean) => {
    try {
      setLoading(true);
      const { error } = await supabase
        
        .update({ enabled })
        .eq('id', id);

      if (error) throw error;

      setRules(rules.map(rule => 
        rule.id === id ? { ...rule, enabled } : rule
      ));
      setMessage(`Rule ${enabled ? 'enabled' : 'disabled'} successfully!`);
    } catch (error) {
      console.error('Error updating rule:', error);
      setMessage('Error updating rule status');
    } finally {
      setLoading(false);
    }
  };

  const addChatDataRow = () => {
    setChatData([...chatData, { customer: '', your_response: '', category: 'greeting' }]);
  };

  const removeChatDataRow = (index: number) => {
    if (chatData.length > 1) {
      setChatData(chatData.filter((_, i) => i !== index));
    }
  };

  const updateChatData = (index: number, field: keyof ChatData, value: string) => {
    const updated = [...chatData];
    updated[index] = { ...updated[index], [field]: value };
    setChatData(updated);
  };

  const analyzeChatData = async () => {
    const validData = chatData.filter(chat => chat.customer && chat.your_response);
    
    if (validData.length === 0) {
      setMessage('Please add at least one valid chat conversation');
      return;
    }

    try {
      setLoading(true);
      
      // Simulate chat analysis (in real implementation, this would call your analysis API)
      const analysis = {
        totalConversations: validData.length,
        categories: validData.reduce((acc, chat) => {
          acc[chat.category] = (acc[chat.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        patterns: validData.map(chat => ({
          customer: chat.customer,
          response: chat.your_response,
          category: chat.category,
          keywords: chat.customer.toLowerCase().split(/\s+/).filter(word => word.length > 2)
        }))
      };

      setAnalysisResult(analysis);
      setMessage('Chat analysis completed successfully!');
    } catch (error) {
      console.error('Error analyzing chat data:', error);
      setMessage('Error analyzing chat data');
    } finally {
      setLoading(false);
    }
  };

  const testAIMessage = async () => {
    if (!testMessage.trim()) {
      setMessage('Please enter a test message');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('http://localhost:8888/api/whatsapp-official-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true, message: testMessage })
      });

      const result = await response.json();
      setTestResult(result);
      setMessage('AI test completed successfully!');
    } catch (error) {
      console.error('Error testing AI:', error);
      setMessage('Error testing AI message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🤖 AI Training Manager</h1>
          <p className="text-muted-foreground">
            Train your AI to respond exactly like you do
          </p>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`p-4 rounded-lg ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      {/* Loading Indicator */}
      {loading && (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Processing...</span>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Auto-Reply Rules */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Auto-Reply Rules</h2>
          <div className="space-y-2">
            {rules.map((rule) => (
              <div key={rule.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{rule.name}</h3>
                    <p className="text-sm text-gray-600">{rule.description}</p>
                  </div>
                  <button
                    onClick={() => toggleRule(rule.id, !rule.enabled)}
                    className={`px-3 py-1 rounded text-sm ${
                      rule.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {rule.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Data Analysis */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Chat Data Analysis</h2>
          <div className="space-y-4">
            {chatData.map((chat, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="grid grid-cols-1 gap-2">
                  <input
                    type="text"
                    placeholder="Customer message"
                    value={chat.customer}
                    onChange={(e) => updateChatData(index, 'customer', e.target.value)}
                    className="p-2 border rounded"
                  />
                  <input
                    type="text"
                    placeholder="Your response"
                    value={chat.your_response}
                    onChange={(e) => updateChatData(index, 'your_response', e.target.value)}
                    className="p-2 border rounded"
                  />
                  <select
                    value={chat.category}
                    onChange={(e) => updateChatData(index, 'category', e.target.value)}
                    className="p-2 border rounded"
                  >
                    <option value="greeting">Greeting</option>
                    <option value="support">Support</option>
                    <option value="sales">Sales</option>
                    <option value="technical">Technical</option>
                  </select>
                </div>
                {chatData.length > 1 && (
                  <button
                    onClick={() => removeChatDataRow(index)}
                    className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addChatDataRow}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded"
            >
              Add Chat Data
            </button>
            <button
              onClick={analyzeChatData}
              className="px-4 py-2 bg-green-100 text-green-700 rounded ml-2"
            >
              Analyze Data
            </button>
          </div>
        </div>
      </div>

      {/* Analysis Results */}
      {analysisResult && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Analysis Results</h2>
          <div className="p-4 border rounded-lg">
            <p><strong>Total Conversations:</strong> {analysisResult.totalConversations}</p>
            <p><strong>Categories:</strong></p>
            <ul className="list-disc list-inside">
              {Object.entries(analysisResult.categories).map(([category, count]) => (
                <li key={category}>{category}: {count}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* AI Test */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Test AI Response</h2>
        <div className="space-y-4">
          <textarea
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Enter a test message..."
            className="w-full p-4 border rounded-lg"
            rows={3}
          />
          <button
            onClick={testAIMessage}
            className="px-4 py-2 bg-purple-100 text-purple-700 rounded"
          >
            Test AI Response
          </button>
        </div>
        {testResult && (
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium">AI Response:</h3>
            <pre className="mt-2 text-sm bg-gray-100 p-2 rounded">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
