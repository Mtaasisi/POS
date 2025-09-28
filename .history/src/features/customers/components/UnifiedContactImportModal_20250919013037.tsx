import React, { useState, useRef } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import Modal from '../../shared/components/ui/Modal';
import { 
  Upload, 
  FileText, 
  Smartphone, 
  Users, 
  CheckCircle, 
  AlertTriangle,
  Download,
  RefreshCw,
  BarChart3,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Filter,
  Search,
  Eye,
  Trash2,
  Edit
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ImportStats {
  total: number;
  smsOnly: number;
  csvOnly: number;
  merged: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: number;
  communicationHistory: number;
}

interface ContactPreview {
  phone: string;
  name: string;
  email: string;
  address: string;
  sources: string[];
  messageCount: number;
  lastMessageDate: string | null;
  firstMessageDate: string | null;
}

interface UnifiedContactImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (stats: ImportStats) => void;
}

const UnifiedContactImportModal: React.FC<UnifiedContactImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const { currentUser } = useAuth();
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [previewContacts, setPreviewContacts] = useState<ContactPreview[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [filteredContacts, setFilteredContacts] = useState<ContactPreview[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [showStats, setShowStats] = useState(false);

  const smsFileRef = useRef<HTMLInputElement>(null);
  const csvFileRef = useRef<HTMLInputElement>(null);

  // Filter contacts based on search term
  React.useEffect(() => {
    if (!searchTerm) {
      setFilteredContacts(previewContacts);
    } else {
      const filtered = previewContacts.filter(contact =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phone.includes(searchTerm) ||
        contact.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredContacts(filtered);
    }
  }, [searchTerm, previewContacts]);

  const handleImport = async () => {
    if (!currentUser) {
      toast.error('Please log in to import contacts');
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      // Simulate import process with progress updates
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      // Call the import API endpoint
      const response = await fetch('/api/import-contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.access_token}`
        },
        body: JSON.stringify({
          smsFilePath: '/Users/mtaasisi/Downloads/sms-20250919010749.xml',
          csvFilePath: '/Users/mtaasisi/Combined_Contacts_Merged_Names.csv',
          selectedContacts: Array.from(selectedContacts)
        })
      });

      clearInterval(progressInterval);
      setImportProgress(100);

      if (!response.ok) {
        throw new Error('Import failed');
      }

      const stats = await response.json();
      setImportStats(stats);
      setShowStats(true);

      toast.success(`Successfully imported ${stats.imported} contacts!`);
      onImportComplete?.(stats);

    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import contacts. Please try again.');
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  const handlePreview = async () => {
    try {
      // Simulate preview data - in real implementation, this would call the preview API
      const mockPreview: ContactPreview[] = [
        {
          phone: '+255746605561',
          name: 'Mtaasisi',
          email: '',
          address: 'Dar es Salaam',
          sources: ['SMS Backup', 'CSV Import'],
          messageCount: 167,
          lastMessageDate: 'Sep 4, 2025 1:46:31 PM',
          firstMessageDate: 'Sep 4, 2022 1:06:05 AM'
        },
        {
          phone: '+255712378850',
          name: 'Zana boda boda',
          email: '',
          address: 'Tanzania',
          sources: ['SMS Backup'],
          messageCount: 1014,
          lastMessageDate: 'Aug 30, 2025 11:57:55 AM',
          firstMessageDate: 'Sep 4, 2022 9:29:15 AM'
        },
        {
          phone: '+255654841225',
          name: 'Samal Fundi Laptop',
          email: '',
          address: 'Dar es Salaam',
          sources: ['SMS Backup'],
          messageCount: 1013,
          lastMessageDate: 'Sep 1, 2025 4:04:17 PM',
          firstMessageDate: 'Sep 4, 2022 11:05:49 AM'
        }
      ];

      setPreviewContacts(mockPreview);
      setFilteredContacts(mockPreview);
      setShowPreview(true);
      toast.success('Preview generated successfully!');
    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Failed to generate preview');
    }
  };

  const handleSelectAll = () => {
    if (selectedContacts.size === filteredContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(filteredContacts.map(c => c.phone)));
    }
  };

  const handleSelectContact = (phone: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(phone)) {
      newSelected.delete(phone);
    } else {
      newSelected.add(phone);
    }
    setSelectedContacts(newSelected);
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('255')) {
      const number = cleaned.substring(3);
      return `+255 ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6)}`;
    }
    return phone;
  };

  const getSourceIcon = (sources: string[]) => {
    if (sources.includes('SMS Backup')) {
      return <MessageSquare className="w-4 h-4 text-blue-500" />;
    }
    if (sources.includes('CSV Import')) {
      return <FileText className="w-4 h-4 text-green-500" />;
    }
    return <Users className="w-4 h-4 text-gray-500" />;
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Unified Contact Import" 
      maxWidth="1200px"
    >
      <div className="space-y-6">
        {/* Import Options */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Smartphone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">SMS Backup Integration</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Import contacts and communication history from SMS backup
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
              <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">CSV Contacts Integration</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Import contacts from Combined_Contacts_Merged_Names.csv
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <GlassButton
              onClick={handlePreview}
              disabled={isImporting}
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Preview Contacts
            </GlassButton>
            
            <GlassButton
              onClick={handleImport}
              disabled={isImporting || previewContacts.length === 0}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              {isImporting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {isImporting ? 'Importing...' : 'Import Contacts'}
            </GlassButton>
          </div>

          {isImporting && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Import Progress</span>
                <span>{importProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
            </div>
          )}
        </GlassCard>

        {/* Preview Section */}
        {showPreview && (
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Contact Preview ({filteredContacts.length} contacts)
              </h3>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
                />
                <GlassButton
                  onClick={handleSelectAll}
                  className="text-sm"
                >
                  {selectedContacts.size === filteredContacts.length ? 'Deselect All' : 'Select All'}
                </GlassButton>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.phone}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedContacts.has(contact.phone)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => handleSelectContact(contact.phone)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedContacts.has(contact.phone)}
                        onChange={() => handleSelectContact(contact.phone)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div className="flex items-center gap-2">
                        {getSourceIcon(contact.sources)}
                        <div>
                          <h4 className="font-medium">{contact.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatPhoneNumber(contact.phone)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-4">
                        {contact.messageCount > 0 && (
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {contact.messageCount} msgs
                          </span>
                        )}
                        {contact.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            Email
                          </span>
                        )}
                        {contact.address && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {contact.address}
                          </span>
                        )}
                      </div>
                      {contact.lastMessageDate && (
                        <p className="text-xs mt-1">
                          Last: {new Date(contact.lastMessageDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Import Statistics */}
        {showStats && importStats && (
          <GlassCard className="p-6">
            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5" />
              Import Statistics
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {importStats.total}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Contacts</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {importStats.imported}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">New Imported</div>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {importStats.updated}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Updated</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {importStats.communicationHistory}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Messages</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="flex justify-between">
                <span>SMS-only contacts:</span>
                <span className="font-medium">{importStats.smsOnly}</span>
              </div>
              <div className="flex justify-between">
                <span>CSV-only contacts:</span>
                <span className="font-medium">{importStats.csvOnly}</span>
              </div>
              <div className="flex justify-between">
                <span>Merged contacts:</span>
                <span className="font-medium">{importStats.merged}</span>
              </div>
              <div className="flex justify-between">
                <span>Skipped:</span>
                <span className="font-medium">{importStats.skipped}</span>
              </div>
              <div className="flex justify-between">
                <span>Errors:</span>
                <span className="font-medium text-red-600">{importStats.errors}</span>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <GlassButton onClick={onClose} variant="outline">
            Close
          </GlassButton>
          {showStats && (
            <GlassButton
              onClick={() => {
                setShowStats(false);
                setShowPreview(false);
                setPreviewContacts([]);
                setSelectedContacts(new Set());
                setSearchTerm('');
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              Import More
            </GlassButton>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default UnifiedContactImportModal;
