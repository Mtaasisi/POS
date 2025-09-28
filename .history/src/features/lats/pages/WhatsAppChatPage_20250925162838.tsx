import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, 
  Send, 
  Search,
  User,
  CheckCircle,
  ChevronRight,
  Plus,
  Image,
  FileText,
  MapPin,
  Smile,
  XCircle,
  RefreshCw,
  Phone,
  Video,
  MoreVertical,
  Clock,
  Check,
  CheckCheck,
  Mic,
  Paperclip,
  File,
  Music,
  Download,
  Play
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { toast } from '../../../lib/toastUtils';
import { greenApiService } from '../../../services/greenApiService';
import { useWhatsApp } from '../../../context/WhatsAppContext';
import { useTheme } from '../../../context/ThemeContext';

const WhatsAppChatPage: React.FC = () => {
  // Get instances from WhatsApp context
  const { instances, loading: instancesLoading } = useWhatsApp();
  const { isDark } = useTheme();

  // Instance Selection State
  const [selectedInstance, setSelectedInstance] = useState<any>(null);
  const [showInstanceSelector, setShowInstanceSelector] = useState(false);

  // Chat State
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [isSendingChatMessage, setIsSendingChatMessage] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  
  // Enhanced Chat Features
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'text' | 'image' | 'button' | 'template' | 'document' | 'audio'>('text');
  
  // Enhanced Quick Reply states
  const [quickReplyCategory, setQuickReplyCategory] = useState<string>('Frequently Used');
  const [favoriteReplies, setFavoriteReplies] = useState<string[]>([]);
  const [recentReplies, setRecentReplies] = useState<string[]>([]);
  const [showQuickReplyManager, setShowQuickReplyManager] = useState(false);
  const [editingReply, setEditingReply] = useState<{index: number, text: string, category: string} | null>(null);
  const [newReplyText, setNewReplyText] = useState('');
  const [newReplyCategory, setNewReplyCategory] = useState('Frequently Used');
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{oldName: string, newName: string} | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [compactView, setCompactView] = useState(false);
  
  // Interactive Buttons states
  const [showInteractiveButtons, setShowInteractiveButtons] = useState(false);
  const [buttonMessage, setButtonMessage] = useState('');
  const [buttonFooter, setButtonFooter] = useState('');
  const [interactiveButtons, setInteractiveButtons] = useState<{id: string, text: string}[]>([
    {id: 'btn1', text: 'Yes'}
  ]);
  const [isInteractiveButtonsEnabled, setIsInteractiveButtonsEnabled] = useState(false);
  const [useTextFormatForButtons, setUseTextFormatForButtons] = useState(false);
  
  // File upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // Voice message states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  // Chat search and reactions
  const [chatSearchTerm, setChatSearchTerm] = useState('');
  const [filteredChatHistory, setFilteredChatHistory] = useState<any[]>([]);
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [messageReactions, setMessageReactions] = useState<{[key: number]: string[]}>({});
  const [showReactionPicker, setShowReactionPicker] = useState<number | null>(null);
  
  // Message status tracking
  const [messageStatuses, setMessageStatuses] = useState<{[key: number]: 'sending' | 'sent' | 'delivered' | 'read'}>({});
  
  // Emoji picker data
  const emojis = ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🙈', '🙉', '🙊', '👶', '👧', '🧒', '👦', '👩', '🧑', '👨', '👵', '🧓', '👴', '👮‍♀️', '👮', '👮‍♂️', '🕵️‍♀️', '🕵️', '🕵️‍♂️', '💂‍♀️', '💂', '💂‍♂️', '👷‍♀️', '👷', '👷‍♂️', '🤴', '👸', '👳‍♀️', '👳', '👳‍♂️', '👲', '🧕', '🤵‍♀️', '🤵', '🤵‍♂️', '👰‍♀️', '👰', '👰‍♂️', '🤰', '🤱', '👼', '🎅', '🤶', '🧙‍♀️', '🧙', '🧙‍♂️', '🧝‍♀️', '🧝', '🧝‍♂️', '🧛‍♀️', '🧛', '🧛‍♂️', '🧟‍♀️', '🧟', '🧟‍♂️', '🧞‍♀️', '🧞', '🧞‍♂️', '🧜‍♀️', '🧜', '🧜‍♂️', '🧚‍♀️', '🧚', '🧚‍♂️', '👼', '🤰', '🤱', '👼', '🎅', '🤶', '🧙‍♀️', '🧙', '🧙‍♂️', '🧝‍♀️', '🧝', '🧝‍♂️', '🧛‍♀️', '🧛', '🧛‍♂️', '🧟‍♀️', '🧟', '🧟‍♂️', '🧞‍♀️', '🧞', '🧞‍♂️', '🧜‍♀️', '🧜', '🧜‍♂️', '🧚‍♀️', '🧚', '🧚‍♂️'];
  
  // Quick reaction emojis
  const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '😡'];

  // Enhanced Quick Replies with categories
  const quickReplyCategories: { [key: string]: string[] } = {
    'Greetings': [
      'Hello! How can I help you today?',
      'Hi there! Welcome to our service.',
      'Good morning! How may I assist you?',
      'Hello! Thank you for contacting us.',
      'Hi! I\'m here to help you.'
    ],
    'Customer Service': [
      'Thank you for your patience.',
      'I understand your concern.',
      'Let me check that for you.',
      'I\'ll get back to you shortly.',
      'Is there anything else I can help with?'
    ],
    'Sales & Orders': [
      'Your order has been confirmed.',
      'Your payment has been received.',
      'Your item is ready for pickup.',
      'Your delivery is on the way.',
      'Would you like to place an order?'
    ],
    'Technical Support': [
      'Let me troubleshoot this issue.',
      'Have you tried restarting?',
      'I\'ll escalate this to our technical team.',
      'Can you provide more details?',
      'This should resolve your issue.'
    ],
    'Appointments': [
      'Your appointment is confirmed.',
      'Would you like to reschedule?',
      'What time works best for you?',
      'I\'ll send you a reminder.',
      'Your appointment is tomorrow.'
    ],
    'Frequently Used': [
      'Thank you!',
      'You\'re welcome!',
      'Have a great day!',
      'See you soon!',
      'Take care!'
    ]
  };
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'chat' | 'contacts'>('chat');
  
  // Load customers
  const loadCustomers = async () => {
    try {
      if (!supabase) {
        toast.error('Database connection not available');
        return;
      }
      
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, phone, email, created_at')
        .order('name', { ascending: true });
      
      if (error) throw error;
      setCustomers(data || []);
      setFilteredCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
    }
  };

  // Filter customers based on search term
  useEffect(() => {
    if (customerSearchTerm.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(customer =>
        customer.name?.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
        customer.phone?.includes(customerSearchTerm) ||
        customer.email?.toLowerCase().includes(customerSearchTerm.toLowerCase())
      );
      setFilteredCustomers(filtered);
    }
  }, [customerSearchTerm, customers]);

  // Load customers on mount
  useEffect(() => {
    loadCustomers();
  }, []);

  // Auto-select first connected instance
  useEffect(() => {
    if (instances && instances.length > 0 && !selectedInstance) {
      const connectedInstance = instances.find(i => i.status === 'connected');
      if (connectedInstance) {
        setSelectedInstance(connectedInstance);
      } else if (instances.length > 0) {
        setSelectedInstance(instances[0]); // Select first available instance
      }
    }
  }, [instances, selectedInstance]);

  // Close instance selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showInstanceSelector && !target.closest('.instance-selector')) {
        setShowInstanceSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showInstanceSelector]);

  // Phone number formatting function
  const formatPhoneNumber = (phone: string) => {
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    cleaned = cleaned.replace(/\+{2,}/g, '+');
    return cleaned;
  };

  // Interactive buttons helper functions
  const addInteractiveButton = () => {
    if (interactiveButtons.length < 3) {
      setInteractiveButtons(prev => [...prev, {
        id: `btn${prev.length + 1}`,
        text: `Button ${prev.length + 1}`
      }]);
    }
  };

  const removeInteractiveButton = (index: number) => {
    if (interactiveButtons.length > 1) {
      setInteractiveButtons(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateButtonText = (index: number, text: string) => {
    setInteractiveButtons(prev => {
      const newButtons = [...prev];
      newButtons[index].text = text;
      return newButtons;
    });
  };

  // Check if interactive buttons might work (basic heuristics)
  const checkInteractiveButtonsSupport = () => {
    // Basic check - this would need more sophisticated logic in production
    const lastCustomerMessage = chatHistory
      .filter(msg => msg.sender === 'customer')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    
    if (lastCustomerMessage) {
      const hoursSinceLastMessage = (Date.now() - new Date(lastCustomerMessage.timestamp).getTime()) / (1000 * 60 * 60);
      return hoursSinceLastMessage < 24;
    }
    
    return false; // No recent customer message
  };

  // Enhanced chat input functions
  const handleTyping = (value: string) => {
    setChatMessage(value);
    setIsTyping(true);
    
    clearTimeout((window as any).typingTimeout);
    (window as any).typingTimeout = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      setMessageType('image');
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setMessageType('text');
  };

  // File handling functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setMessageType('document');
      
      // Create file preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setMessageType('text');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText size={20} className="text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText size={20} className="text-blue-500" />;
      case 'xls':
      case 'xlsx':
        return <FileText size={20} className="text-green-500" />;
      case 'ppt':
      case 'pptx':
        return <FileText size={20} className="text-orange-500" />;
      case 'txt':
        return <FileText size={20} className="text-gray-500" />;
      default:
        return <File size={20} className="text-gray-500" />;
    }
  };

  const sendQuickReply = (reply: string) => {
    setChatMessage(reply);
    setShowQuickReplies(false);
    
    // Add to recent replies
    setRecentReplies(prev => {
      const filtered = prev.filter(r => r !== reply);
      return [reply, ...filtered.slice(0, 4)]; // Keep last 5
    });
  };

  const addToFavorites = (reply: string) => {
    setFavoriteReplies(prev => {
      if (prev.includes(reply)) {
        return prev.filter(r => r !== reply);
      } else {
        return [...prev, reply].slice(0, 10); // Max 10 favorites
      }
    });
  };

  const isFavorite = (reply: string) => {
    return favoriteReplies.includes(reply);
  };

  const getQuickRepliesToShow = () => {
    if (quickReplyCategory === 'Favorites') {
      return favoriteReplies;
    } else if (quickReplyCategory === 'Recent') {
      return recentReplies;
    } else {
      return quickReplyCategories[quickReplyCategory] || [];
    }
  };

  // Quick Reply Management Functions
  const addQuickReply = (text: string, category: string) => {
    if (text.trim()) {
        const updatedCategories = { ...quickReplyCategories };
        if (!updatedCategories[category]) {
          updatedCategories[category] = [];
        }
        updatedCategories[category] = [...updatedCategories[category], text.trim()];
      
      // Update the categories (in a real app, this would save to database)
        Object.assign(quickReplyCategories, updatedCategories);
        
        setNewReplyText('');
        setNewReplyCategory('Frequently Used');
        toast.success('Quick reply added successfully!');
    }
  };

  const editQuickReply = (index: number, newText: string, category: string) => {
    if (newText.trim()) {
      const updatedCategories = { ...quickReplyCategories };
      if (updatedCategories[category]) {
        updatedCategories[category][index] = newText.trim();
        Object.assign(quickReplyCategories, updatedCategories);
        setEditingReply(null);
        toast.success('Quick reply updated!');
      }
    }
  };

  const deleteQuickReply = (index: number, category: string) => {
    const updatedCategories = { ...quickReplyCategories };
    if (updatedCategories[category]) {
      updatedCategories[category] = updatedCategories[category].filter((_, i) => i !== index);
      Object.assign(quickReplyCategories, updatedCategories);
      toast.success('Quick reply deleted!');
    }
  };

  const moveQuickReply = (fromCategory: string, fromIndex: number, toCategory: string) => {
    const updatedCategories = { ...quickReplyCategories };
    const reply = updatedCategories[fromCategory][fromIndex];
    
    // Remove from original category
    updatedCategories[fromCategory] = updatedCategories[fromCategory].filter((_, i) => i !== fromIndex);
    
    // Add to new category
    if (!updatedCategories[toCategory]) {
      updatedCategories[toCategory] = [];
    }
    updatedCategories[toCategory].push(reply);
    
    Object.assign(quickReplyCategories, updatedCategories);
    toast.success(`Moved to ${toCategory}!`);
  };

  // Category Management Functions
  const addCategory = (name: string) => {
    if (name.trim() && !quickReplyCategories[name.trim()]) {
      const updatedCategories = { ...quickReplyCategories };
      updatedCategories[name.trim()] = [];
      Object.assign(quickReplyCategories, updatedCategories);
      setNewCategoryName('');
      toast.success(`Category "${name.trim()}" created!`);
    } else if (quickReplyCategories[name.trim()]) {
      toast.error('Category already exists!');
    }
  };

  const editCategory = (oldName: string, newName: string) => {
    if (newName.trim() && newName.trim() !== oldName) {
      if (quickReplyCategories[newName.trim()]) {
        toast.error('Category name already exists!');
        return;
      }
      
      const updatedCategories = { ...quickReplyCategories };
      updatedCategories[newName.trim()] = updatedCategories[oldName];
      delete updatedCategories[oldName];
      Object.assign(quickReplyCategories, updatedCategories);
      
      // Update current category if it was renamed
      if (quickReplyCategory === oldName) {
        setQuickReplyCategory(newName.trim());
      }
      
      setEditingCategory(null);
      toast.success(`Category renamed to "${newName.trim()}"!`);
    }
  };

  const deleteCategory = (categoryName: string) => {
    if (Object.keys(quickReplyCategories).length <= 1) {
      toast.error('Cannot delete the last category!');
      return;
    }
    
    if (quickReplyCategories[categoryName]?.length > 0) {
      const moveToCategory = prompt(
        `Category "${categoryName}" has ${quickReplyCategories[categoryName].length} replies. Enter a category to move them to:`,
        Object.keys(quickReplyCategories).find(cat => cat !== categoryName) || ''
      );
      
      if (moveToCategory && quickReplyCategories[moveToCategory]) {
        const updatedCategories = { ...quickReplyCategories };
        updatedCategories[moveToCategory] = [...updatedCategories[moveToCategory], ...updatedCategories[categoryName]];
        delete updatedCategories[categoryName];
        Object.assign(quickReplyCategories, updatedCategories);
        
        if (quickReplyCategory === categoryName) {
          setQuickReplyCategory(moveToCategory);
        }
        
        toast.success(`Category deleted and replies moved to "${moveToCategory}"!`);
      }
    } else {
      const updatedCategories = { ...quickReplyCategories };
      delete updatedCategories[categoryName];
      Object.assign(quickReplyCategories, updatedCategories);
      
      if (quickReplyCategory === categoryName) {
        setQuickReplyCategory(Object.keys(updatedCategories)[0]);
      }
      
      toast.success('Category deleted!');
    }
  };

  const duplicateCategory = (categoryName: string) => {
    const newName = `${categoryName} (Copy)`;
    let counter = 1;
    let finalName = newName;
    
    while (quickReplyCategories[finalName]) {
      finalName = `${categoryName} (Copy ${counter})`;
      counter++;
    }
    
    const updatedCategories = { ...quickReplyCategories };
    updatedCategories[finalName] = [...updatedCategories[categoryName]];
    Object.assign(quickReplyCategories, updatedCategories);
    toast.success(`Category duplicated as "${finalName}"!`);
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setMessageType('audio');
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      const timer = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      (window as any).mediaRecorder = mediaRecorder;
      (window as any).recordingTimer = timer;
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Could not access microphone');
    }
  };

  const stopRecording = () => {
    const mediaRecorder = (window as any).mediaRecorder;
    const timer = (window as any).recordingTimer;
    
    if (mediaRecorder) {
      mediaRecorder.stop();
    }
    if (timer) {
      clearInterval(timer);
    }
    
    setIsRecording(false);
  };

  const removeAudio = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setMessageType('text');
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Chat search functions
  useEffect(() => {
    if (chatSearchTerm.trim() === '') {
      setFilteredChatHistory(chatHistory);
    } else {
      const filtered = chatHistory.filter(message =>
        message.content?.toLowerCase().includes(chatSearchTerm.toLowerCase()) ||
        message.customer?.name?.toLowerCase().includes(chatSearchTerm.toLowerCase())
      );
      setFilteredChatHistory(filtered);
    }
  }, [chatSearchTerm, chatHistory]);

  // Message reaction functions
  const addReaction = (messageId: number, emoji: string) => {
    setMessageReactions(prev => ({
      ...prev,
      [messageId]: [...(prev[messageId] || []), emoji]
    }));
    setShowReactionPicker(null);
  };

  const removeReaction = (messageId: number, emojiIndex: number) => {
    setMessageReactions(prev => ({
      ...prev,
      [messageId]: prev[messageId]?.filter((_, index) => index !== emojiIndex) || []
    }));
  };

  // Enhanced timestamp formatting
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const shouldShowDateSeparator = (currentMessage: any, previousMessage: any) => {
    if (!previousMessage) return true;
    
    const currentDate = new Date(currentMessage.timestamp).toDateString();
    const previousDate = new Date(previousMessage.timestamp).toDateString();
    
    return currentDate !== previousDate;
  };

  // Emoji picker functions
  const addEmoji = (emoji: string) => {
    setChatMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Message status functions
  const updateMessageStatus = (messageId: number, status: 'sending' | 'sent' | 'delivered' | 'read') => {
    setMessageStatuses(prev => ({
      ...prev,
      [messageId]: status
    }));
  };

  const getMessageStatusIcon = (status: 'sending' | 'sent' | 'delivered' | 'read') => {
    switch (status) {
      case 'sending':
        return <Clock size={10} className="text-gray-400" />;
      case 'sent':
        return <Check size={10} className="text-gray-400" />;
      case 'delivered':
        return <CheckCheck size={10} className="text-gray-400" />;
      case 'read':
        return <CheckCheck size={10} className="text-green-500" />;
      default:
        return null;
    }
  };

  // Select customer for chat
  const selectCustomerForChat = (customer: any) => {
    setSelectedCustomer(customer);
    setChatMessage('');
    setChatHistory([]);
  };

  // Send interactive buttons with fallback
  const sendInteractiveButtons = async (customerPhone: string, connectedInstance: any) => {
    try {
      console.log('🔘 Attempting to send interactive buttons...');
      
      // Validate button requirements
      if (!interactiveButtons || interactiveButtons.length === 0) {
        throw new Error('No interactive buttons provided');
      }
      
      if (interactiveButtons.length > 3) {
        throw new Error('Maximum 3 buttons allowed');
      }
      
      // Validate button text length (max 20 characters per button)
      const invalidButtons = interactiveButtons.filter(btn => !btn.text || btn.text.length > 20);
      if (invalidButtons.length > 0) {
        throw new Error('Button text must be between 1-20 characters');
      }
      
      // Validate message body (required and max 1024 characters)
      if (!buttonMessage || buttonMessage.trim().length === 0) {
        throw new Error('Message body is required for interactive buttons');
      }
      
      if (buttonMessage.length > 1024) {
        throw new Error('Message body must be 1024 characters or less');
      }
      
      // Format buttons for Green API - ensure proper structure
      const formattedButtons = interactiveButtons.map((button, index) => ({
        buttonId: button.id || `btn_${index + 1}`,
        buttonText: button.text.trim().substring(0, 20) // Ensure max 20 characters
      }));

      console.log('🔘 Formatted buttons:', formattedButtons);

      // Validate instance connection
      if (!connectedInstance || !connectedInstance.instance_id || !connectedInstance.api_token) {
        throw new Error('Invalid WhatsApp instance configuration');
      }
      
      if (connectedInstance.status !== 'connected') {
        throw new Error('WhatsApp instance is not connected');
      }

      // Try to send interactive buttons via direct API
      const directApiUrl = connectedInstance.green_api_host || `https://7105.api.greenapi.com`;
      const sendButtonsUrl = `${directApiUrl}/waInstance${connectedInstance.instance_id}/sendButtons/${connectedInstance.api_token}`;
      
      // Validate and format phone number
      let formattedPhone = customerPhone;
      if (!formattedPhone.includes('@c.us')) {
        // Remove any non-digit characters except +
        formattedPhone = formattedPhone.replace(/[^\d+]/g, '');
        // Ensure it starts with country code
        if (!formattedPhone.startsWith('+')) {
          formattedPhone = `+${formattedPhone}`;
        }
        // Remove the + for Green API format
        formattedPhone = formattedPhone.replace('+', '');
        formattedPhone = `${formattedPhone}@c.us`;
      }
      
      // Ensure proper payload structure according to Green API docs
      const buttonsPayload: any = {
        chatId: formattedPhone,
        message: (buttonMessage || 'Please select an option:').substring(0, 1024), // Ensure max 1024 characters
        buttons: formattedButtons
      };
      
      // Add footer as part of the message if provided
      if (buttonFooter && buttonFooter.trim()) {
        let fullMessage = buttonsPayload.message;
        if (buttonFooter.length > 60) {
          throw new Error('Footer text must be 60 characters or less');
        }
        fullMessage += `\n\n_${buttonFooter.trim().substring(0, 60)}_`;
        buttonsPayload.message = fullMessage;
      }
      

      
      console.log('📦 Sending buttons payload:', buttonsPayload);
      console.log('🔗 SendButtons API URL:', sendButtonsUrl);
      console.log('📱 Formatted phone:', formattedPhone);
      
      const response = await fetch(sendButtonsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(buttonsPayload)
      });
      
      console.log('📡 Buttons response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Buttons sent successfully:', data);
        return { success: true, data };
      } else {
        const errorData = await response.text();
        console.error('❌ Buttons failed:', response.status, errorData);
        console.error('📦 Payload that failed:', JSON.stringify(buttonsPayload, null, 2));
        
        // Enhanced error handling with specific messages
        if (response.status === 400) {
          // Try to parse error details
          try {
            const errorJson = JSON.parse(errorData);
            if (errorJson.error) {
              throw new Error(`Buttons error: ${errorJson.error}`);
            } else if (errorJson.message) {
              throw new Error(`Buttons error: ${errorJson.message}`);
            }
          } catch (parseError) {
            // If we can't parse JSON, use generic message
            throw new Error(`Buttons format invalid or not supported (400 error): ${errorData}`);
          }
        } else if (response.status === 403) {
          throw new Error('Buttons are temporarily disabled by Green API (403 error)');
        } else if (response.status === 466) {
          throw new Error('Message sent outside 24-hour window - buttons not allowed');
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded - please wait before sending more messages');
        } else {
          throw new Error(`API Error ${response.status}: ${errorData}`);
        }
      }
    } catch (error: any) {
      console.error('❌ Error sending buttons:', error);
      throw error;
    }
  };

  // Send chat message
  const handleSendChatMessage = async () => {
    if (!selectedCustomer || !instances?.length) {
      toast.error('Please select a customer and ensure WhatsApp is connected');
      return;
    }

    if (messageType === 'text' && !chatMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    if (messageType === 'button' && (!buttonMessage.trim() || interactiveButtons.length === 0)) {
      toast.error('Please enter a message and add at least one button');
      return;
    }

    if (messageType === 'image' && !selectedImage) {
      toast.error('Please select an image');
      return;
    }

    if (messageType === 'document' && !selectedFile) {
      toast.error('Please select a file');
      return;
    }

    if (messageType === 'audio' && !audioBlob) {
      toast.error('Please record an audio message');
      return;
    }

    setIsSendingChatMessage(true);
    setIsTyping(false);
    
    try {
      if (!selectedInstance) {
        toast.error('Please select a WhatsApp instance first');
        return;
      }

      if (selectedInstance.status !== 'connected') {
        toast.error(`Selected instance "${selectedInstance.instance_name || selectedInstance.instance_id}" is not connected`);
        return;
      }

      const customerPhone = formatPhoneNumber(selectedCustomer.phone);
      
      let result;
      
      if (messageType === 'button') {
        // Check if user prefers text format or if interactive buttons failed before
        if (useTextFormatForButtons) {
          // Send as formatted text message directly
          let textMessage = buttonMessage;
          
          if (interactiveButtons.length > 0) {
            textMessage += '\n\nPlease reply with the number of your choice:\n';
            textMessage += interactiveButtons.map((btn, idx) => `${idx + 1}. ${btn.text}`).join('\n');
          }
          
          if (buttonFooter && buttonFooter.trim()) {
            textMessage += `\n\n${buttonFooter}`;
          }
          
          textMessage += '\n\n💡 Tip: Reply with the number (1, 2, 3) to select your option.';
          
          result = await greenApiService.sendMessage({
            instanceId: selectedInstance.instance_id,
            chatId: customerPhone,
            message: textMessage,
            messageType: 'text'
          });
          
          toast.success('Message sent as numbered options!');
        } else {
          try {
            // Try to send interactive buttons first
            const buttonResult = await sendInteractiveButtons(customerPhone, selectedInstance);
            
            if (buttonResult?.success) {
              toast.success('Interactive buttons sent successfully!');
              result = buttonResult;
            } else {
              throw new Error('Interactive buttons failed to send');
            }
          } catch (error: any) {
            console.error('❌ Interactive buttons failed, falling back to text:', error);
            
            // Fallback: Send as formatted text message with clear instructions
            let fallbackMessage = buttonMessage;
            
            if (interactiveButtons.length > 0) {
              fallbackMessage += '\n\nPlease reply with the number of your choice:\n';
              fallbackMessage += interactiveButtons.map((btn, idx) => `${idx + 1}. ${btn.text}`).join('\n');
            }
            
            if (buttonFooter && buttonFooter.trim()) {
              fallbackMessage += `\n\n${buttonFooter}`;
            }
            
            fallbackMessage += '\n\n💡 Tip: Reply with the number (1, 2, 3) to select your option.';
            
            result = await greenApiService.sendMessage({
              instanceId: selectedInstance.instance_id,
              chatId: customerPhone,
              message: fallbackMessage,
              messageType: 'text'
            });
            
            toast(`Interactive buttons not supported. Sent as numbered options instead.`, {
              duration: 5000,
              action: {
                label: 'Use Text Format',
                onClick: () => setUseTextFormatForButtons(true)
              }
            });
          }
        }
      } else if (messageType === 'image' && selectedImage) {
        result = await greenApiService.sendMessage({
          instanceId: selectedInstance.instance_id,
          chatId: customerPhone,
          message: chatMessage || 'Image shared',
          messageType: 'image',
          metadata: { imageFile: selectedImage }
        });
      } else if (messageType === 'document' && selectedFile) {
        result = await greenApiService.sendMessage({
          instanceId: selectedInstance.instance_id,
          chatId: customerPhone,
          message: chatMessage || `File: ${selectedFile.name}`,
          messageType: 'document',
          metadata: { documentFile: selectedFile }
        });
      } else if (messageType === 'audio' && audioBlob) {
        result = await greenApiService.sendMessage({
          instanceId: selectedInstance.instance_id,
          chatId: customerPhone,
          message: chatMessage || 'Voice message',
          messageType: 'audio',
          metadata: { audioBlob: audioBlob }
        });
      } else {
        result = await greenApiService.sendMessage({
          instanceId: selectedInstance.instance_id,
          chatId: customerPhone,
          message: chatMessage,
          messageType: 'text'
        });
      }

      const messageId = Date.now();
      const newMessage = {
        id: messageId,
        content: messageType === 'image' ? 'Image shared' : 
                messageType === 'document' ? `File: ${selectedFile?.name}` :
                messageType === 'audio' ? 'Voice message' :
                messageType === 'button' ? buttonMessage : chatMessage,
        sender: 'business',
        timestamp: new Date().toISOString(),
        status: 'sent',
        customer: selectedCustomer,
        type: messageType,
        imageUrl: messageType === 'image' ? imagePreview : null,
        fileUrl: messageType === 'document' ? filePreview : null,
        audioUrl: messageType === 'audio' ? audioUrl : null,
        fileName: selectedFile?.name,
        fileSize: selectedFile?.size,
        audioDuration: messageType === 'audio' ? formatRecordingTime(recordingTime) : null,
        buttons: messageType === 'button' ? interactiveButtons : null,
        buttonFooter: messageType === 'button' ? buttonFooter : null
      };
      
      // Set initial status
      updateMessageStatus(messageId, 'sending');
      setChatHistory(prev => [...prev, newMessage]);
      
      // Simulate message status progression
      setTimeout(() => updateMessageStatus(messageId, 'sent'), 1000);
      setTimeout(() => updateMessageStatus(messageId, 'delivered'), 2000);
      setTimeout(() => updateMessageStatus(messageId, 'read'), 5000);
      
      // Clear all message states
      setChatMessage('');
      setButtonMessage('');
      setButtonFooter('');
      setSelectedImage(null);
      setImagePreview(null);
      setSelectedFile(null);
      setFilePreview(null);
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingTime(0);
      setMessageType('text');
      setShowInteractiveButtons(false);
      
      const messageTypeName = messageType === 'button' ? 'Interactive buttons' : 'Message';
      toast.success(`${messageTypeName} sent to ${selectedCustomer.name}`);
      
    } catch (error: any) {
      console.error('Error sending chat message:', error);
      toast.error('Failed to send message: ' + error.message);
    } finally {
      setIsSendingChatMessage(false);
    }
  };

  return (
    <div className="h-[90vh] max-h-[90vh] bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col overflow-hidden rounded-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-3 flex items-center gap-3 shadow-lg flex-shrink-0 rounded-t-2xl">
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
          <MessageCircle size={16} />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-base">WhatsApp Business Chat</h3>
          <div className="flex items-center gap-3 mt-1">
            {/* Instance Selector */}
            <div className="relative instance-selector">
              <button
                onClick={() => setShowInstanceSelector(!showInstanceSelector)}
                className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-sm hover:bg-white/30 transition-all duration-200"
              >
                <div className={`w-2 h-2 rounded-full ${
                  selectedInstance?.status === 'connected' ? 'bg-green-300' : 
                  selectedInstance?.status === 'connecting' ? 'bg-yellow-300' : 'bg-red-300'
                }`}></div>
                <span className="font-medium">
                  {selectedInstance ? selectedInstance.instance_name || selectedInstance.instance_id : 'Select Instance'}
                </span>
                <ChevronRight size={12} className={`transition-transform ${showInstanceSelector ? 'rotate-90' : ''}`} />
              </button>
              
              {/* Instance Dropdown */}
              {showInstanceSelector && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
                  <div className="p-3 border-b border-gray-100">
                    <h4 className="font-semibold text-gray-800 text-sm">Select WhatsApp Instance</h4>
                    <p className="text-gray-500 text-xs">Choose which instance to use for messaging</p>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {instances && instances.length > 0 ? (
                      instances.map((instance) => (
                        <button
                          key={instance.id}
                          onClick={() => {
                            setSelectedInstance(instance);
                            setShowInstanceSelector(false);
                            toast.success(`Selected WhatsApp instance: ${instance.instance_name || instance.instance_id}`);
                          }}
                          className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${
                            selectedInstance?.id === instance.id ? 'bg-green-50 border-r-2 border-green-500' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              instance.status === 'connected' ? 'bg-green-500' : 
                              instance.status === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}></div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 text-sm">
                                {instance.instance_name || instance.instance_id}
                              </p>
                              <p className="text-gray-500 text-xs">
                                {instance.phone_number ? `+${instance.phone_number}` : 'No phone number'}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                instance.status === 'connected' ? 'bg-green-100 text-green-800' :
                                instance.status === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {instance.status}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        <p className="text-sm">No WhatsApp instances found</p>
                        <p className="text-xs mt-1">Create an instance in the WhatsApp Dashboard</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-green-100 text-xs flex items-center gap-2">
              <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
              {instances?.filter(i => i.status === 'connected')?.length || 0} connected
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={loadCustomers}
            className="p-1.5 hover:bg-white/20 rounded-full transition-all duration-200 hover:scale-110"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className="w-96 bg-white border-r border-gray-200 flex flex-col shadow-lg h-full rounded-l-2xl">
          {/* Tabs */}
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white flex-shrink-0">
            <div className="flex bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl p-2 mb-4">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold text-base transition-all duration-300 ${
                  activeTab === 'chat'
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                }`}
              >
                <div className="flex items-center justify-center gap-3">
                  <MessageCircle size={20} />
                  Chat
                </div>
              </button>
              <button
                onClick={() => setActiveTab('contacts')}
                className={`flex-1 py-3 px-6 rounded-xl font-semibold text-base transition-all duration-300 ${
                  activeTab === 'contacts'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                }`}
              >
                <div className="flex items-center justify-center gap-3">
                  <User size={20} />
                  Contacts
                </div>
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search customers..."
                value={customerSearchTerm}
                onChange={(e) => setCustomerSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-all duration-200 bg-white shadow-sm text-sm"
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
              <span>{filteredCustomers.length} customers</span>
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                {instances?.filter(i => i.status === 'connected')?.length || 0} Connected
              </span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 min-h-0">
            {activeTab === 'chat' ? (
              // Chat tab content - show recent chats or empty state
                <div className="p-4 text-center text-gray-500">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <MessageCircle size={32} className="text-white" />
                  </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Recent Chats</h3>
                <p className="text-sm text-gray-600 mb-4">Your recent conversations will appear here</p>
                <div className="space-y-2">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        A
                        </div>
                      <div className="flex-1 text-left">
                        <h4 className="font-medium text-gray-900 text-sm">Abdalah</h4>
                        <p className="text-xs text-gray-500">Hello! How can I help you?</p>
                            </div>
                      <div className="text-xs text-gray-400">2m ago</div>
                          </div>
                          </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        S
                        </div>
                      <div className="flex-1 text-left">
                        <h4 className="font-medium text-gray-900 text-sm">Sarah</h4>
                        <p className="text-xs text-gray-500">Thank you for your help!</p>
                        </div>
                      <div className="text-xs text-gray-400">1h ago</div>
                      </div>
                </div>
                </div>
              </div>
            ) : (
              // Contacts tab content - show customer list
              <>
                {filteredCustomers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <User size={20} className="text-gray-400" />
                </div>
                <p className="text-sm font-medium">No customers found</p>
                <p className="text-xs mt-1">Try adjusting your search terms</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => selectCustomerForChat(customer)}
                    className={`w-full p-4 pl-8 text-left hover:bg-gray-50 transition-all duration-200 group ${
                      selectedCustomer?.id === customer.id 
                        ? 'bg-gradient-to-r from-green-50 to-green-100 border-r-4 border-green-500 shadow-sm' 
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-base shadow-lg transition-all duration-200 ${
                        selectedCustomer?.id === customer.id 
                          ? 'bg-gradient-to-br from-green-500 to-green-600 scale-110' 
                          : 'bg-gradient-to-br from-blue-500 to-blue-600 group-hover:scale-105'
                      }`}>
                        {customer.name?.charAt(0)?.toUpperCase() || 'C'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate group-hover:text-green-600 transition-colors text-base">
                          {customer.name || 'Unknown Customer'}
                        </h4>
                        <p className="text-sm text-gray-500 truncate">
                          {customer.phone || customer.email || 'No contact info'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-green-600 font-medium">Available</span>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ChevronRight size={16} className="text-gray-400" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
              </>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-gradient-to-br from-gray-50 to-white h-full min-h-0 rounded-r-2xl">
          {selectedCustomer ? (
            <>
              {/* Instance Status Bar */}
              {selectedInstance && (
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 border-b border-blue-200 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        selectedInstance.status === 'connected' ? 'bg-green-500' : 
                        selectedInstance.status === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <span className="text-sm font-medium text-blue-800">
                        Using: {selectedInstance.instance_name || selectedInstance.instance_id}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        selectedInstance.status === 'connected' ? 'bg-green-100 text-green-800' :
                        selectedInstance.status === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedInstance.status}
                      </span>
                    </div>
                    {selectedInstance.phone_number && (
                      <span className="text-xs text-blue-600">
                        +{selectedInstance.phone_number}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Chat Header */}
              <div className="bg-white p-5 border-b border-gray-200 shadow-sm flex-shrink-0 rounded-tr-2xl">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {selectedCustomer.name?.charAt(0)?.toUpperCase() || 'C'}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-xl">{selectedCustomer.name || 'Unknown Customer'}</h4>
                    <p className="text-base text-gray-500 flex items-center gap-2">
                      <span>{selectedCustomer.phone || selectedCustomer.email}</span>
                      <span>•</span>
                      <span className="text-green-600 font-medium">Online</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setShowChatSearch(!showChatSearch)}
                      className="p-3 text-orange-500 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-all duration-200"
                    >
                      <Search size={20} />
                    </button>
                    <button className="p-3 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all duration-200">
                      <Phone size={20} />
                    </button>
                    <button className="p-3 text-purple-500 hover:text-purple-600 hover:bg-purple-50 rounded-full transition-all duration-200">
                      <Video size={20} />
                    </button>
                    <button className="p-3 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200">
                      <MoreVertical size={20} />
                    </button>
                  </div>
                </div>
                
                {/* Chat Search Bar */}
                {showChatSearch && (
                  <div className="mt-4 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      placeholder="Search in chat..."
                      value={chatSearchTerm}
                      onChange={(e) => setChatSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-all duration-200 bg-gray-50 focus:bg-white shadow-sm text-sm"
                    />
                    {chatSearchTerm && (
                      <button
                        onClick={() => setChatSearchTerm('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                      >
                        <XCircle size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Chat Messages */}
              <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 p-3 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent min-h-0">
                {chatHistory.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
                      <MessageCircle size={28} className="text-green-500" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-2">Start a conversation</h3>
                    <p className="text-gray-600 mb-3 max-w-md mx-auto text-sm">
                      Send your first message to {selectedCustomer.name}. Your messages will appear here.
                    </p>
                    <div className="flex items-center justify-center gap-3 text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-green-500" />
                        <span>End-to-end encrypted</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle size={14} className="text-green-500" />
                        <span>Instant delivery</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(chatSearchTerm ? filteredChatHistory : chatHistory).map((message, index) => (
                      <div key={message.id}>
                        {/* Date Separator */}
                        {shouldShowDateSeparator(message, chatHistory[index - 1]) && (
                          <div className="flex justify-center my-4">
                            <div className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium">
                              {formatMessageTime(message.timestamp)}
                            </div>
                          </div>
                        )}
                        
                        <div className={`flex ${message.sender === 'business' ? 'justify-end' : 'justify-start'}`}>
                          <div className="relative group">
                            <div
                              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm ${
                                message.sender === 'business'
                                  ? 'bg-gradient-to-br from-green-500 to-green-600 text-white'
                                  : 'bg-white text-gray-900 border border-gray-200'
                              }`}
                            >
                              {message.type === 'image' && message.imageUrl && (
                                <div className="mb-2">
                                  <img 
                                    src={message.imageUrl} 
                                    alt="Shared image" 
                                    className="w-full h-32 object-cover rounded-lg"
                                  />
                                </div>
                              )}
                              
                              {message.type === 'document' && message.fileName && (
                                <div className="mb-2 p-3 bg-white/10 rounded-lg">
                                  <div className="flex items-center gap-3">
                                    {getFileIcon(message.fileName)}
                                    <div className="flex-1">
                                      <p className="text-sm font-medium truncate">{message.fileName}</p>
                                      <p className="text-xs opacity-80">{formatFileSize(message.fileSize || 0)}</p>
                                    </div>
                                    <button className="p-1 hover:bg-white/20 rounded">
                                      <Download size={16} />
                                    </button>
                                  </div>
                                </div>
                              )}
                              
                              {message.type === 'audio' && message.audioUrl && (
                                <div className="mb-2 p-3 bg-white/10 rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                      <Music size={16} />
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-sm font-medium">Voice Message</p>
                                      <p className="text-xs opacity-80">{message.audioDuration}</p>
                                    </div>
                                    <button className="p-2 bg-white/20 rounded-full hover:bg-white/30">
                                      <Play size={16} />
                                    </button>
                                  </div>
                                </div>
                              )}
                              
                              <p className="text-sm leading-relaxed">{message.content}</p>
                              
                              {message.type === 'button' && message.buttons && (
                                <div className="mt-2 space-y-2">
                                  {message.buttons.map((button: any, btnIndex: number) => (
                                    <div key={btnIndex} className="p-2 bg-white/10 rounded-lg border border-white/20 text-center">
                                      <span className="text-sm font-medium">{button.text}</span>
                                    </div>
                                  ))}
                                  {message.buttonFooter && (
                                    <p className="text-xs opacity-80 mt-1">{message.buttonFooter}</p>
                                  )}
                                </div>
                              )}
                              
                              <div className={`flex items-center justify-between mt-1 ${
                                message.sender === 'business' ? 'text-green-100' : 'text-gray-500'
                              }`}>
                                <span className="text-xs">
                                  {formatMessageTime(message.timestamp)}
                                </span>
                                {message.sender === 'business' && (
                                  <div className="flex items-center gap-1">
                                    {getMessageStatusIcon(messageStatuses[message.id] || 'sent')}
                                    <span className="text-xs">
                                      {messageStatuses[message.id] === 'sending' && 'Sending...'}
                                      {messageStatuses[message.id] === 'sent' && 'Sent'}
                                      {messageStatuses[message.id] === 'delivered' && 'Delivered'}
                                      {messageStatuses[message.id] === 'read' && 'Read'}
                                      {!messageStatuses[message.id] && 'Sent'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Message Reactions */}
                            {messageReactions[message.id] && messageReactions[message.id].length > 0 && (
                              <div className="absolute -bottom-6 left-0 bg-white rounded-full px-2 py-1 shadow-lg border border-gray-200">
                                <div className="flex items-center gap-1">
                                  {messageReactions[message.id].map((reaction, reactionIndex) => (
                                    <button
                                      key={reactionIndex}
                                      onClick={() => removeReaction(message.id, reactionIndex)}
                                      className="text-sm hover:scale-110 transition-transform"
                                    >
                                      {reaction}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Reaction Picker */}
                            {showReactionPicker === message.id && (
                              <div className="absolute -bottom-12 left-0 bg-white rounded-full px-3 py-2 shadow-lg border border-gray-200">
                                <div className="flex items-center gap-2">
                                  {quickReactions.map((emoji, emojiIndex) => (
                                    <button
                                      key={emojiIndex}
                                      onClick={() => addReaction(message.id, emoji)}
                                      className="text-lg hover:scale-125 transition-transform"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                  <button
                                    onClick={() => setShowReactionPicker(null)}
                                    className="text-gray-400 hover:text-gray-600 ml-2"
                                  >
                                    <XCircle size={16} />
                                  </button>
                                </div>
                              </div>
                            )}
                            
                            {/* Reaction Button */}
                            <button
                              onClick={() => setShowReactionPicker(showReactionPicker === message.id ? null : message.id)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-200"
                            >
                              <Smile size={12} className="text-gray-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Typing Indicator */}
                    {isTyping && (
                      <div className="flex justify-start">
                        <div className="bg-white text-gray-900 border border-gray-200 max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm">
                          <div className="flex items-center gap-2">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                            <span className="text-xs text-gray-500">typing...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="bg-white p-4 border-t border-gray-200 shadow-lg flex-shrink-0 rounded-br-2xl">
                {/* Image Preview */}
                {imagePreview && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-2xl border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Image Preview</span>
                      <button
                        onClick={removeImage}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <XCircle size={14} />
                      </button>
                    </div>
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-24 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* File Preview */}
                {filePreview && selectedFile && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-2xl border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">File Preview</span>
                      <button
                        onClick={removeFile}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <XCircle size={14} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-white rounded-lg">
                      {getFileIcon(selectedFile.name)}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                      </div>
                      <button className="p-1 text-blue-500 hover:text-blue-600">
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Audio Preview */}
                {audioUrl && audioBlob && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-2xl border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Voice Message</span>
                      <button
                        onClick={removeAudio}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <XCircle size={14} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-white rounded-lg">
                      <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center">
                        <Music size={20} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Voice Message</p>
                        <p className="text-xs text-gray-500">{formatRecordingTime(recordingTime)}</p>
                      </div>
                      <button className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors">
                        <Play size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Interactive Buttons Builder */}
                {showInteractiveButtons && (
                  <div className="mb-4 p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl border border-blue-200 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4zM6 6v12h12V6H6z" />
                          </svg>
                        </div>
                        <span className="text-base font-semibold text-blue-800">Interactive Buttons</span>
                        <div className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
                          ⚠️ May not work on all devices
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setShowInteractiveButtons(false);
                          setMessageType('text');
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-full transition-all duration-200"
                      >
                        <XCircle size={18} />
                      </button>
                    </div>
                    
                    {/* Format Toggle */}
                    <div className="mb-4 p-3 bg-white/50 rounded-xl border border-blue-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-blue-800">Message Format:</span>
                          <span className="text-xs text-blue-600">
                            {useTextFormatForButtons ? 'Text with numbers' : 'Interactive buttons'}
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={useTextFormatForButtons}
                            onChange={(e) => setUseTextFormatForButtons(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <p className="text-xs text-blue-600 mt-2">
                        {useTextFormatForButtons 
                          ? '📝 Will send as numbered options (works on all devices)' 
                          : '🔘 Will try interactive buttons first, fallback to text if needed'
                        }
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Message Text</label>
                        <textarea
                          value={buttonMessage}
                          onChange={(e) => setButtonMessage(e.target.value)}
                          placeholder="Enter your message text..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200 resize-none"
                          rows={2}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Footer (Optional)</label>
                        <input
                          type="text"
                          value={buttonFooter}
                          onChange={(e) => setButtonFooter(e.target.value)}
                          placeholder="Add footer text..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Buttons</label>
                        <div className="space-y-2">
                          {interactiveButtons.map((button, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={button.text}
                                onChange={(e) => {
                                  const newButtons = [...interactiveButtons];
                                  newButtons[index].text = e.target.value;
                                  setInteractiveButtons(newButtons);
                                }}
                                placeholder={`Button ${index + 1} text...`}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                              />
                              <button
                                onClick={() => {
                                  setInteractiveButtons(prev => prev.filter((_, i) => i !== index));
                                }}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                disabled={interactiveButtons.length === 1}
                              >
                                <XCircle size={16} />
                              </button>
                            </div>
                          ))}
                          
                          {interactiveButtons.length < 3 && (
                            <button
                              onClick={() => {
                                setInteractiveButtons(prev => [...prev, {
                                  id: `btn${prev.length + 1}`,
                                  text: `Button ${prev.length + 1}`
                                }]);
                              }}
                              className="w-full py-2 border-2 border-dashed border-blue-300 text-blue-600 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 text-sm font-medium"
                            >
                              + Add Button
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Up to 3 buttons allowed</p>
                      </div>
                    </div>
                    
                    {/* Warning Message */}
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <div className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        <div className="text-sm flex-1">
                          <p className="font-medium text-yellow-800">Interactive Button Limitations</p>
                          <p className="text-yellow-700">
                            • Only works within 24 hours of customer's last message<br />
                            • May not display on all WhatsApp versions<br />
                            • If buttons fail, message will be sent as formatted text
                          </p>
                        </div>
                        <button
                          onClick={async () => {
                            if (selectedInstance && selectedCustomer) {
                              toast.success('Interactive buttons test - check your WhatsApp instance status');
                            }
                          }}
                          className="px-3 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-xs font-medium"
                        >
                          Test
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Enhanced Quick Replies */}
                {showQuickReplies && (
                  <div className="mb-4 bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 text-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                            <MessageCircle size={16} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">Quick Replies</h3>
                            <p className="text-purple-100 text-sm">Select a message to send instantly</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowQuickReplies(false)}
                          className="p-2 hover:bg-white/20 rounded-full transition-all duration-200"
                        >
                          <XCircle size={20} />
                        </button>
                      </div>
                    </div>

                    {/* Category Tabs */}
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                        {['Frequently Used', 'Recent', 'Favorites', 'Greetings', 'Customer Service', 'Sales & Orders', 'Technical Support', 'Appointments'].map((category) => (
                          <button
                            key={category}
                            onClick={() => setQuickReplyCategory(category)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                              quickReplyCategory === category
                                ? 'bg-purple-500 text-white shadow-lg'
                                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                            }`}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quick Reply Messages - Grid Layout */}
                    <div className="p-4 max-h-80 overflow-y-auto">
                      {getQuickRepliesToShow().length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {getQuickRepliesToShow().map((reply, index) => (
                            <div
                              key={index}
                              className="group relative bg-white rounded-xl p-3 hover:bg-purple-50 transition-all duration-200 cursor-pointer border border-gray-200 hover:border-purple-300 hover:shadow-md transform hover:scale-105"
                            >
                              {/* Quick Reply Content */}
                              <div className="mb-3">
                                <p className="text-sm text-gray-800 leading-relaxed line-clamp-3">
                                  {reply}
                                </p>
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      addToFavorites(reply);
                                    }}
                                    className={`p-1.5 rounded-full transition-all duration-200 ${
                                      isFavorite(reply)
                                        ? 'bg-red-100 text-red-500 hover:bg-red-200'
                                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-red-500'
                                    }`}
                                    title={isFavorite(reply) ? "Remove from favorites" : "Add to favorites"}
                                  >
                                    <svg className="w-3 h-3" fill={isFavorite(reply) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                  </button>
                                  
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(reply);
                                      toast.success('Copied to clipboard!');
                                    }}
                                    className="p-1.5 bg-gray-100 text-gray-400 rounded-full hover:bg-gray-200 hover:text-blue-500 transition-all duration-200"
                                    title="Copy to clipboard"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                  </button>
                                </div>
                                
                                {/* Send Button */}
                                <button
                                  onClick={() => sendQuickReply(reply)}
                                  className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg text-xs font-medium hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                                >
                                  Send
                                </button>
                              </div>
                              
                              {/* Hover Overlay for Quick Send */}
                              <div className="absolute inset-0 bg-purple-500 bg-opacity-0 group-hover:bg-opacity-5 rounded-xl transition-all duration-200 pointer-events-none" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <MessageCircle size={24} className="text-gray-400" />
                          </div>
                          <p className="text-gray-500 text-sm">
                            {quickReplyCategory === 'Favorites' 
                              ? 'No favorite replies yet. Click the heart icon to add favorites!'
                              : quickReplyCategory === 'Recent'
                              ? 'No recent replies yet. Send some messages to see them here!'
                              : 'No replies in this category.'
                            }
                          </p>
                        </div>
                      )}
                    </div>

                                         {/* Quick Actions */}
                     <div className="bg-gray-50 p-3 border-t border-gray-200">
                       <div className="flex items-center justify-between text-sm text-gray-600">
                         <span>
                           {getQuickRepliesToShow().length} replies in {quickReplyCategory}
                         </span>
                         <div className="flex items-center gap-2">
                           <button
                             onClick={() => {
                               const customReply = prompt('Enter your custom quick reply:');
                               if (customReply && customReply.trim()) {
                                 sendQuickReply(customReply.trim());
                               }
                             }}
                             className="px-3 py-1 bg-purple-500 text-white rounded-full hover:bg-purple-600 transition-colors text-xs"
                           >
                             Custom Reply
                           </button>
                           <button
                             onClick={() => setShowQuickReplyManager(true)}
                             className="px-3 py-1 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors text-xs"
                           >
                             Manage Replies
                           </button>
                         </div>
                       </div>
                     </div>
                  </div>
                )}

                {/* Attachment Menu */}
                {showAttachmentMenu && (
                  <div className="mb-4 p-4 bg-gradient-to-br from-white to-gray-50 rounded-3xl border border-gray-200 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <Plus size={16} className="text-white" />
                        </div>
                        <span className="text-base font-semibold text-gray-800">Add Attachment</span>
                      </div>
                      <button
                        onClick={() => setShowAttachmentMenu(false)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
                      >
                        <XCircle size={18} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <label className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:from-blue-100 hover:to-blue-200 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-lg">
                        <div className="p-4 flex flex-col items-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                            <Image size={24} className="text-white" />
                          </div>
                          <span className="text-sm font-medium text-blue-700">Photo & Video</span>
                          <span className="text-xs text-blue-600 mt-1">Share images</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                          />
                        </div>
                      </label>
                      
                      <label className="group relative overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border-2 border-purple-200 hover:border-purple-400 hover:from-purple-100 hover:to-purple-200 transition-all duration-300 cursor-pointer transform hover:scale-105 hover:shadow-lg">
                        <div className="p-4 flex flex-col items-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                            <FileText size={24} className="text-white" />
                          </div>
                          <span className="text-sm font-medium text-purple-700">Document</span>
                          <span className="text-xs text-purple-600 mt-1">Share files</span>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                        </div>
                      </label>
                      
                      <button 
                        onClick={() => {
                          setShowInteractiveButtons(true);
                          setShowAttachmentMenu(false);
                          setMessageType('button');
                        }}
                        className="group relative overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-200 hover:border-blue-400 hover:from-blue-100 hover:to-blue-200 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                      >
                        <div className="p-4 flex flex-col items-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4zM6 6v12h12V6H6z" />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-blue-700">Interactive Buttons</span>
                          <span className="text-xs text-blue-600 mt-1">
                            {checkInteractiveButtonsSupport() ? 'Add buttons' : '⚠️ 24h window expired'}
                          </span>
                        </div>
                      </button>
                      
                      <button 
                        onClick={isRecording ? stopRecording : startRecording}
                        className="group relative overflow-hidden bg-gradient-to-br from-red-50 to-red-100 rounded-2xl border-2 border-red-200 hover:border-red-400 hover:from-red-100 hover:to-red-200 transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                      >
                        <div className="p-4 flex flex-col items-center">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 ${
                            isRecording 
                              ? 'bg-gradient-to-br from-red-500 to-red-600 animate-pulse' 
                              : 'bg-gradient-to-br from-red-500 to-red-600'
                          }`}>
                            <Mic size={24} className="text-white" />
                          </div>
                          <span className="text-sm font-medium text-red-700">
                            {isRecording ? 'Stop Recording' : 'Voice Message'}
                          </span>
                          <span className="text-xs text-red-600 mt-1">
                            {isRecording ? formatRecordingTime(recordingTime) : 'Record audio'}
                          </span>
                        </div>
                      </button>
                      
                      <button className="group relative overflow-hidden bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border-2 border-green-200 hover:border-green-400 hover:from-green-100 hover:to-green-200 transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
                        <div className="p-4 flex flex-col items-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                            <MapPin size={24} className="text-white" />
                          </div>
                          <span className="text-sm font-medium text-green-700">Location</span>
                          <span className="text-xs text-green-600 mt-1">Share location</span>
                        </div>
                      </button>
                      
                      <button className="group relative overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl border-2 border-orange-200 hover:border-orange-400 hover:from-orange-100 hover:to-orange-200 transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
                        <div className="p-4 flex flex-col items-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                            <User size={24} className="text-white" />
                          </div>
                          <span className="text-sm font-medium text-orange-700">Contact</span>
                          <span className="text-xs text-orange-600 mt-1">Share contact</span>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {/* Emoji Picker */}
                {showEmojiPicker && (
                  <div className="mb-4 p-4 bg-white rounded-3xl border border-gray-200 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center">
                          <Smile size={16} className="text-white" />
                        </div>
                        <span className="text-base font-semibold text-gray-800">Emoji</span>
                      </div>
                      <button
                        onClick={() => setShowEmojiPicker(false)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
                      >
                        <XCircle size={18} />
                      </button>
                    </div>
                    <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto">
                      {emojis.map((emoji, index) => (
                        <button
                          key={index}
                          onClick={() => addEmoji(emoji)}
                          className="p-2 text-2xl hover:bg-gray-100 rounded-lg transition-all duration-200 hover:scale-110"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                    className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200 hover:scale-110"
                  >
                    <Plus size={20} />
                  </button>
                  <button 
                    onClick={() => setShowQuickReplies(!showQuickReplies)}
                    className={`p-3 rounded-full transition-all duration-200 hover:scale-110 ${
                      showQuickReplies 
                        ? 'bg-purple-500 text-white shadow-lg' 
                        : 'text-purple-500 hover:text-purple-600 hover:bg-purple-50'
                    }`}
                  >
                    <MessageCircle size={20} />
                  </button>
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={(e) => handleTyping(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendChatMessage()}
                      placeholder={`Type a message to ${selectedCustomer.name}...`}
                      className="w-full px-5 py-4 border border-gray-300 rounded-full focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-all duration-200 bg-gray-50 focus:bg-white shadow-sm text-base"
                    />
                                          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                        <button 
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <Smile size={18} />
                        </button>
                      </div>
                  </div>
                                      <button
                      onClick={handleSendChatMessage}
                      disabled={
                        (messageType === 'text' && !chatMessage.trim()) ||
                        (messageType === 'button' && (!buttonMessage.trim() || interactiveButtons.length === 0)) ||
                        (messageType === 'image' && !selectedImage) ||
                        (messageType === 'document' && !selectedFile) ||
                        (messageType === 'audio' && !audioBlob) ||
                        isSendingChatMessage
                      }
                      className="p-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-110 shadow-lg"
                    >
                      {isSendingChatMessage ? (
                        <RefreshCw size={20} className="animate-spin" />
                      ) : (
                        <Send size={20} />
                      )}
                    </button>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>Press Enter to send, Shift+Enter for new line</span>
                  <span>{chatMessage.length}/1000 characters</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-r-2xl">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <MessageCircle size={40} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Select a customer</h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  Choose a customer from the list to start a WhatsApp conversation. 
                  You can search by name, phone number, or email address.
                </p>
                <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-500" />
                    <span>Real-time messaging</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle size={16} className="text-green-500" />
                    <span>Secure & private</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Reply Manager Popup */}
      {showQuickReplyManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                    <MessageCircle size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Quick Reply Manager</h2>
                    <p className="text-purple-100">Create, edit, and organize your quick replies</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowQuickReplyManager(false)}
                  className="p-3 hover:bg-white/20 rounded-full transition-all duration-200"
                >
                  <XCircle size={24} />
                </button>
              </div>
            </div>

            <div className="flex h-[calc(90vh-120px)]">
              {/* Sidebar - Categories */}
              <div className="w-80 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">Categories</h3>
                  <button
                    onClick={() => setShowCategoryManager(true)}
                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Manage Categories"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-2">
                  {Object.keys(quickReplyCategories).map((category) => (
                    <div
                      key={category}
                      className={`group relative rounded-xl transition-all duration-200 ${
                        quickReplyCategory === category
                          ? 'bg-purple-500 text-white shadow-lg'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <button
                        onClick={() => setQuickReplyCategory(category)}
                        className="w-full text-left p-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{category}</span>
                          <span className="text-sm opacity-70">
                            {quickReplyCategories[category]?.length || 0}
                          </span>
                        </div>
                      </button>
                      
                      {/* Category Actions (visible on hover) */}
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingCategory({oldName: category, newName: category});
                            }}
                            className="p-1 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                            title="Rename"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateCategory(category);
                            }}
                            className="p-1 text-green-500 hover:bg-green-50 rounded transition-colors"
                            title="Duplicate"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                          
                          {Object.keys(quickReplyCategories).length > 1 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Are you sure you want to delete the category "${category}"?`)) {
                                  deleteCategory(category);
                                }
                              }}
                              className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                              title="Delete"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 p-6 overflow-y-auto">
                {/* Add New Reply */}
                <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                  <h3 className="font-semibold text-gray-800 mb-3">Add New Quick Reply</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        value={newReplyCategory}
                        onChange={(e) => setNewReplyCategory(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 transition-all duration-200"
                      >
                        {Object.keys(quickReplyCategories).map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                      <textarea
                        value={newReplyText}
                        onChange={(e) => setNewReplyText(e.target.value)}
                        placeholder="Enter your quick reply message..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 transition-all duration-200 resize-none"
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={() => addQuickReply(newReplyText, newReplyCategory)}
                        disabled={!newReplyText.trim()}
                        className="px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-medium hover:from-purple-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                      >
                        Add Reply
                      </button>
                    </div>
                  </div>
                </div>

                {/* Replies List */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800">
                      {quickReplyCategory} ({quickReplyCategories[quickReplyCategory]?.length || 0} replies)
                    </h3>
                  </div>
                  
                  <div className="space-y-3">
                    {quickReplyCategories[quickReplyCategory]?.map((reply, index) => (
                      <div
                        key={index}
                        className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-lg transition-all duration-200"
                      >
                        {editingReply?.index === index && editingReply?.category === quickReplyCategory ? (
                          <div className="space-y-3">
                            <textarea
                              value={editingReply.text}
                              onChange={(e) => setEditingReply({...editingReply, text: e.target.value})}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 resize-none"
                              rows={2}
                            />
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => editQuickReply(index, editingReply.text, quickReplyCategory)}
                                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingReply(null)}
                                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-gray-800 leading-relaxed">{reply}</p>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={() => setEditingReply({index, text: reply, category: quickReplyCategory})}
                                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              
                              <div className="relative">
                                <button
                                  onClick={() => {
                                    const newCategory = prompt('Move to category:', quickReplyCategory);
                                    if (newCategory && newCategory !== quickReplyCategory) {
                                      moveQuickReply(quickReplyCategory, index, newCategory);
                                    }
                                  }}
                                  className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Move"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                  </svg>
                                </button>
                              </div>
                              
                              <button
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this quick reply?')) {
                                    deleteQuickReply(index, quickReplyCategory);
                                  }
                                }}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    
                                         {(!quickReplyCategories[quickReplyCategory] || quickReplyCategories[quickReplyCategory].length === 0) && (
                       <div className="text-center py-8">
                         <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                           <MessageCircle size={24} className="text-gray-400" />
                         </div>
                         <p className="text-gray-500">No replies in this category yet.</p>
                         <p className="text-gray-400 text-sm mt-1">Add a new reply above to get started!</p>
                       </div>
                     )}
                   </div>
                 </div>
               </div>
             </div>
           </div>
         </div>
       )}

       {/* Category Manager Popup */}
       {showCategoryManager && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
             {/* Header */}
             <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                     </svg>
                   </div>
                   <div>
                     <h2 className="text-2xl font-bold">Category Manager</h2>
                     <p className="text-blue-100">Create, edit, and organize your categories</p>
                   </div>
                 </div>
                 <button
                   onClick={() => setShowCategoryManager(false)}
                   className="p-3 hover:bg-white/20 rounded-full transition-all duration-200"
                 >
                   <XCircle size={24} />
                 </button>
               </div>
             </div>

             <div className="p-6 max-h-[calc(80vh-120px)] overflow-y-auto">
               {/* Add New Category */}
               <div className="bg-gray-50 rounded-2xl p-4 mb-6">
                 <h3 className="font-semibold text-gray-800 mb-3">Add New Category</h3>
                 <div className="flex gap-3">
                   <input
                     type="text"
                     value={newCategoryName}
                     onChange={(e) => setNewCategoryName(e.target.value)}
                     placeholder="Enter category name..."
                     className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200"
                     onKeyPress={(e) => e.key === 'Enter' && addCategory(newCategoryName)}
                   />
                   <button
                     onClick={() => addCategory(newCategoryName)}
                     disabled={!newCategoryName.trim()}
                     className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                   >
                     Add
                   </button>
                 </div>
               </div>

               {/* Categories List */}
               <div>
                 <h3 className="font-semibold text-gray-800 mb-4">
                   Categories ({Object.keys(quickReplyCategories).length})
                 </h3>
                 
                 <div className="space-y-3">
                   {Object.keys(quickReplyCategories).map((category) => (
                     <div
                       key={category}
                       className="bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-lg transition-all duration-200"
                     >
                       {editingCategory?.oldName === category ? (
                         <div className="space-y-3">
                           <input
                             type="text"
                             value={editingCategory.newName}
                             onChange={(e) => setEditingCategory({...editingCategory, newName: e.target.value})}
                             className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-200"
                             onKeyPress={(e) => e.key === 'Enter' && editCategory(category, editingCategory.newName)}
                           />
                           <div className="flex items-center gap-2">
                             <button
                               onClick={() => editCategory(category, editingCategory.newName)}
                               className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                             >
                               Save
                             </button>
                             <button
                               onClick={() => setEditingCategory(null)}
                               className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                             >
                               Cancel
                             </button>
                           </div>
                         </div>
                       ) : (
                         <div className="flex items-center justify-between">
                           <div className="flex-1">
                             <h4 className="font-medium text-gray-800">{category}</h4>
                             <p className="text-sm text-gray-500">
                               {quickReplyCategories[category]?.length || 0} replies
                             </p>
                           </div>
                           <div className="flex items-center gap-2">
                             <button
                               onClick={() => setEditingCategory({oldName: category, newName: category})}
                               className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                               title="Rename"
                             >
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                               </svg>
                             </button>
                             
                             <button
                               onClick={() => duplicateCategory(category)}
                               className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                               title="Duplicate"
                             >
                               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                               </svg>
                             </button>
                             
                             {Object.keys(quickReplyCategories).length > 1 && (
                               <button
                                 onClick={() => {
                                   if (confirm(`Are you sure you want to delete the category "${category}"?`)) {
                                     deleteCategory(category);
                                   }
                                 }}
                                 className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                 title="Delete"
                               >
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                 </svg>
                               </button>
                             )}
                           </div>
                         </div>
                       )}
                     </div>
                   ))}
                 </div>
               </div>
            </div>
          </div>
        </div>
      )}
      </div>
    );
};

export default WhatsAppChatPage;
