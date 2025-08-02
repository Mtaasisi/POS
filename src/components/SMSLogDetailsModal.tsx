import React from 'react';
import Modal from './ui/Modal';
import { SMSLog } from '../services/smsService';

interface SMSLogDetailsModalProps {
  log: SMSLog | null;
  isOpen: boolean;
  onClose: () => void;
}

const SMSLogDetailsModal: React.FC<SMSLogDetailsModalProps> = ({ log, isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="SMS Log Details">
      {log ? (
        <div className="space-y-2">
          <div><b>Date:</b> {log.created_at}</div>
          <div><b>Phone:</b> {log.phone_number}</div>
          <div><b>Message:</b> {log.message}</div>
          <div><b>Status:</b> {log.status}</div>
          <div><b>Error:</b> {log.error_message || '-'}</div>
          <div><b>Sent At:</b> {log.sent_at ?? '-'}</div>
          <div><b>Sent By:</b> {log.sent_by ?? '-'}</div>
        </div>
      ) : (
        <div>Log not found.</div>
      )}
    </Modal>
  );
};

export default SMSLogDetailsModal; 