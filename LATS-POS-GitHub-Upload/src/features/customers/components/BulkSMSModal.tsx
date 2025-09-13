import React, { useState, useMemo } from 'react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { LoyaltyLevel, Customer } from '../../../types';

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

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      let pass = true;
      if (loyalty !== 'all') pass = pass && c.loyaltyLevel === loyalty;
      if (status !== 'all') pass = pass && (status === 'active' ? c.isActive : !c.isActive);
      if (tag !== 'all') pass = pass && c.colorTag === tag;
      return pass;
    });
  }, [customers, loyalty, status, tag]);

  const handleSend = () => {
    if (!message.trim()) return;
    onSend(filteredCustomers, message);
    setMessage('');
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <GlassCard className="w-full max-w-lg p-6 relative">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="text-xl font-bold mb-4 text-gray-900">Send Bulk SMS</h2>
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
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
          <textarea
            className="w-full rounded-lg border-gray-300 min-h-[80px]"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Type your SMS message here..."
            maxLength={320}
          />
        </div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-600">Recipients: <b>{filteredCustomers.length}</b></span>
          <span className="text-xs text-gray-400">{message.length}/320</span>
        </div>
        <div className="flex gap-2 justify-end">
          <GlassButton variant="secondary" onClick={onClose} disabled={sending}>Cancel</GlassButton>
          <GlassButton onClick={handleSend} disabled={sending || !message.trim() || filteredCustomers.length === 0}>
            {sending ? 'Sending...' : 'Send SMS'}
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
};

export default BulkSMSModal;
