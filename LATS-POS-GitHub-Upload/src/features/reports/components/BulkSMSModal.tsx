import React, { useState, useMemo } from 'react';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import { LoyaltyLevel, Customer } from '../../../types';
import geminiService from '../../../services/geminiService';
import { toast } from 'react-hot-toast';

interface BulkSMSModalProps {
  open: boolean;
  onClose: () => void;
  customers: Customer[];
  onSend: (recipients: Customer[], message: string) => void;
  sending?: boolean;
}

const BulkSMSModal: React.FC<BulkSMSModalProps> = ({ open, onClose, customers, onSend, sending = false }) => {
  const [loyalty, setLoyalty] = useState<'all' | LoyaltyLevel>('all');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [tag, setTag] = useState<'all' | 'vip' | 'new' | 'complainer'>('all');
  const [message, setMessage] = useState('');
  const [aiMode, setAiMode] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string>('');

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      let pass = true;
      if (loyalty !== 'all') pass = pass && c.loyaltyLevel === loyalty;
      if (status !== 'all') pass = pass && (status === 'active' ? c.isActive : !c.isActive);
      if (tag !== 'all') pass = pass && c.colorTag === tag;
      return pass;
    });
  }, [customers, loyalty, status, tag]);

  // AI-powered message generation
  const generateAIMessage = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter a prompt for AI message generation');
      return;
    }

    setAiGenerating(true);
    try {
      const context = `Generate SMS messages for ${filteredCustomers.length} customers in a device repair and sales business.
      
Customer Segment Info:
- Loyalty Level: ${loyalty === 'all' ? 'Mixed' : loyalty}
- Status: ${status === 'all' ? 'Mixed' : status}
- Tag: ${tag === 'all' ? 'Mixed' : tag}
- Total Customers: ${filteredCustomers.length}

Business Context:
- Device repair and sales business
- Professional but friendly tone
- Quick response times
- Technical expertise available
- Customer service focused

Requirements:
- Generate 3 different message variations
- Each message should be under 160 characters
- Professional and friendly tone
- Address the specific prompt/context
- Include call-to-action if appropriate
- Use simple language (Swahili/English mix is okay)`;

      const fullPrompt = `${context}\n\nYour prompt: ${aiPrompt}\n\nGenerate 3 SMS message variations:`;

      const response = await geminiService.chat([{ role: 'user', content: fullPrompt }]);
      
      if (response.success && response.data) {
        // Parse the AI response to extract message suggestions
        const suggestions = response.data
          .split('\n')
          .filter(line => line.trim().length > 0 && line.trim().length < 200)
          .map(line => line.replace(/^\d+\.\s*/, '').trim())
          .slice(0, 3);
        
        setAiSuggestions(suggestions);
        toast.success('AI generated message suggestions!');
      } else {
        toast.error('Failed to generate AI suggestions');
      }
    } catch (error) {
      console.error('AI generation error:', error);
      toast.error('Error generating AI suggestions');
    } finally {
      setAiGenerating(false);
    }
  };

  // AI-powered customer insights
  const generateCustomerInsights = async () => {
    if (filteredCustomers.length === 0) {
      toast.error('No customers selected for analysis');
      return;
    }

    setAiGenerating(true);
    try {
      const customerData = filteredCustomers.map(c => ({
        name: c.name,
        loyaltyLevel: c.loyaltyLevel,
        totalSpent: c.totalSpent,
        points: c.points,
        colorTag: c.colorTag,
        isActive: c.isActive
      }));

      const prompt = `Analyze this customer segment for a device repair and sales business:

Customer Data: ${JSON.stringify(customerData, null, 2)}

Please provide:
1. Key insights about this customer segment
2. Recommended messaging approach
3. Best time to contact them
4. Potential offers or promotions
5. Risk factors to consider

Keep response concise and actionable.`;

      const response = await geminiService.chat([{ role: 'user', content: prompt }]);
      
      if (response.success && response.data) {
        // Show insights in a toast or modal
        toast.success('Customer insights generated! Check console for details.');
        console.log('AI Customer Insights:', response.data);
      } else {
        toast.error('Failed to generate customer insights');
      }
    } catch (error) {
      console.error('Customer insights error:', error);
      toast.error('Error generating customer insights');
    } finally {
      setAiGenerating(false);
    }
  };

  // AI-powered personalized message generation
  const generatePersonalizedMessages = async () => {
    if (filteredCustomers.length === 0) {
      toast.error('No customers selected');
      return;
    }

    setAiGenerating(true);
    try {
      const sampleCustomer = filteredCustomers[0];
      const prompt = `Generate a personalized SMS template for a device repair business customer:

Customer Info:
- Name: ${sampleCustomer.name}
- Loyalty Level: ${sampleCustomer.loyaltyLevel}
- Total Spent: ${sampleCustomer.totalSpent}
- Points: ${sampleCustomer.points}
- Tag: ${sampleCustomer.colorTag}

Business Context:
- Device repair and sales
- Professional but friendly tone
- Include customer's name and loyalty level
- Make it personal and relevant

Generate a personalized message template with placeholders like {name}, {loyaltyLevel}, {totalSpent}, {points}.`;

      const response = await geminiService.chat([{ role: 'user', content: prompt }]);
      
      if (response.success && response.data) {
        setMessage(response.data.trim());
        toast.success('Personalized message template generated!');
      } else {
        toast.error('Failed to generate personalized template');
      }
    } catch (error) {
      console.error('Personalized message error:', error);
      toast.error('Error generating personalized template');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSend = () => {
    if (!message.trim()) return;
    
    // If using AI suggestion, use that message
    const finalMessage = selectedSuggestion || message;
    onSend(filteredCustomers, finalMessage);
    setMessage('');
    setSelectedSuggestion('');
    setAiSuggestions([]);
    onClose();
  };

  const selectSuggestion = (suggestion: string) => {
    setSelectedSuggestion(suggestion);
    setMessage(suggestion);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <GlassCard className="w-full max-w-4xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
          onClick={onClose}
        >
          ×
        </button>
        
        <h2 className="text-xl font-bold mb-4 text-gray-900">AI-Powered Bulk SMS</h2>
        
        {/* AI Mode Toggle */}
        <div className="mb-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={aiMode}
                onChange={(e) => setAiMode(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm font-medium">🤖 Enable AI Features</span>
            </label>
            {aiMode && (
              <div className="flex gap-2">
                <GlassButton
                  size="sm"
                  variant="secondary"
                  onClick={generateCustomerInsights}
                  disabled={aiGenerating}
                >
                  {aiGenerating ? 'Analyzing...' : '📊 Customer Insights'}
                </GlassButton>
                <GlassButton
                  size="sm"
                  variant="secondary"
                  onClick={generatePersonalizedMessages}
                  disabled={aiGenerating}
                >
                  {aiGenerating ? 'Generating...' : '👤 Personalized Template'}
                </GlassButton>
              </div>
            )}
          </div>
        </div>

        {/* Customer Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loyalty</label>
            <select
              className="w-full rounded-lg border-gray-300"
              value={loyalty}
              onChange={e => setLoyalty(e.target.value as any)}
            >
              <option value="all">All</option>
              <option value="platinum">Platinum</option>
              <option value="gold">Gold</option>
              <option value="silver">Silver</option>
              <option value="bronze">Bronze</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full rounded-lg border-gray-300"
              value={status}
              onChange={e => setStatus(e.target.value as any)}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tag</label>
            <select
              className="w-full rounded-lg border-gray-300"
              value={tag}
              onChange={e => setTag(e.target.value as any)}
            >
              <option value="all">All</option>
              <option value="vip">VIP</option>
              <option value="new">New</option>
              <option value="complainer">Complainer</option>
            </select>
          </div>
        </div>

        {/* AI Message Generation */}
        {aiMode && (
          <div className="mb-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">🤖 AI Message Generation</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">AI Prompt</label>
                <textarea
                  className="w-full rounded-lg border-gray-300 min-h-[60px]"
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder="Describe what kind of message you want to send (e.g., 'Promote our new phone repair service', 'Thank loyal customers', 'Announce special discount')"
                />
              </div>
              <GlassButton
                onClick={generateAIMessage}
                disabled={aiGenerating || !aiPrompt.trim()}
                className="w-full"
              >
                {aiGenerating ? '🤖 Generating...' : '🤖 Generate AI Suggestions'}
              </GlassButton>
              
              {/* AI Suggestions */}
              {aiSuggestions.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-blue-700">AI Suggestions:</label>
                  {aiSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded border cursor-pointer transition-colors ${
                        selectedSuggestion === suggestion
                          ? 'border-blue-500 bg-blue-100'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => selectSuggestion(suggestion)}
                    >
                      <div className="text-sm text-gray-700">{suggestion}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {suggestion.length} characters
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message {aiMode && '(AI-enhanced)'}
          </label>
          <textarea
            className="w-full rounded-lg border-gray-300 min-h-[80px]"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder={aiMode 
              ? "Type your message or use AI suggestions above... (Use {name}, {loyaltyLevel}, {totalSpent}, {points} for personalization)"
              : "Type your SMS message here..."
            }
            maxLength={320}
          />
          {aiMode && (
            <div className="text-xs text-gray-500 mt-1">
              💡 Personalization variables: {'{name}'}, {'{loyaltyLevel}'}, {'{totalSpent}'}, {'{points}'}
            </div>
          )}
        </div>

        {/* Message Stats */}
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-1">
            <span className="text-sm text-gray-600">
              Recipients: <b>{filteredCustomers.length}</b>
            </span>
            {aiMode && (
              <div className="text-xs text-blue-600">
                🤖 AI Features: {aiSuggestions.length > 0 ? 'Suggestions available' : 'Ready to generate'}
              </div>
            )}
          </div>
          <span className="text-xs text-gray-400">{message.length}/320</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 justify-end">
          <GlassButton variant="secondary" onClick={onClose} disabled={sending}>
            Cancel
          </GlassButton>
          <GlassButton 
            onClick={handleSend} 
            disabled={sending || !message.trim() || filteredCustomers.length === 0}
            className={aiMode ? 'bg-gradient-to-r from-blue-500 to-purple-600' : ''}
          >
            {sending ? 'Sending...' : aiMode ? '🤖 Send AI-Enhanced SMS' : 'Send SMS'}
          </GlassButton>
        </div>

        {/* AI Status */}
        {aiMode && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <span>🤖</span>
              <span>AI-powered features enabled. Messages will be personalized automatically.</span>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default BulkSMSModal; 