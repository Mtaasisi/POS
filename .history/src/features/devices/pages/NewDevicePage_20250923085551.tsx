import React, { useState, useRef, useEffect } from 'react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';

import { useNavigate } from 'react-router-dom';
import { toast } from '../../../lib/toastUtils';
import { SimpleBackButton as BackButton } from '../../../features/shared/components/ui/SimpleBackButton';
import { ArrowLeft, User, Smartphone, Tag, Layers, Hash, FileText, DollarSign, Key, Phone, Mail, MapPin, Calendar, Clock, ChevronDown, Battery, Camera as CameraIcon, Wifi, Bluetooth, Plug, Volume2, Mic, Speaker, Vibrate, Cpu, HardDrive, Droplet, Shield, Wrench, AlertTriangle as AlertIcon, Eye, Edit, MessageCircle, Users, Star, UserPlus, Brain, Zap, Lightbulb, Search, Sparkles, Package, RefreshCw, WifiOff, Store, CheckSquare } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import Modal from '../../../features/shared/components/ui/Modal';
import { useCustomers } from '../../../context/CustomersContext';
import { searchCustomersFast } from '../../../lib/customerApi/search';
import AddCustomerModal from '../../../features/customers/components/forms/AddCustomerModal';
import { useDevices } from '../../../context/DevicesContext';
import { DeviceStatus } from '../../../types';
import CountdownTimer from '../../../features/shared/components/ui/CountdownTimer';
import { useAuth } from '../../../context/AuthContext';
import deviceModels from '../../../data/deviceModels';
import ModelSuggestionInput from '../../../features/shared/components/ui/ModelSuggestionInput';


import ConditionAssessment from '../components/ConditionAssessment';
import DeviceQRCodePrint from '../components/DeviceQRCodePrint';
import { smsService } from '../../../services/smsService';
import { SoundManager } from '../../../lib/soundUtils';
import { useDraftForm } from '../../../lib/useDraftForm';
import { saveActionOffline } from '../../../lib/offlineSync';

import geminiService from '../../../services/geminiService';
import offlineAIService from '../../../services/offlineAIService';
import StepIndicator from '../components/StepIndicator';
import InteractiveDeviceDiagram from '../components/InteractiveDeviceDiagram';
import VideoTutorials from '../components/VideoTutorials';

const COMMON_MODELS = {
  'Apple': ['iPhone 15', 'iPhone 14', 'iPhone 13', 'iPhone 12', 'iPhone 11', 'iPhone X', 'iPhone 8', 'iPhone 7', 'iPhone 6'],
  'Samsung': ['Galaxy S24', 'Galaxy S23', 'Galaxy S22', 'Galaxy S21', 'Galaxy Note', 'Galaxy A', 'Galaxy M'],
  'Huawei': ['P40', 'P30', 'Mate 40', 'Mate 30', 'Nova', 'Y Series'],
  'Xiaomi': ['Mi 13', 'Mi 12', 'Redmi Note', 'POCO', 'Mi A'],
  'OnePlus': ['OnePlus 11', 'OnePlus 10', 'OnePlus 9', 'OnePlus 8', 'OnePlus 7'],
  'Google': ['Pixel 8', 'Pixel 7', 'Pixel 6', 'Pixel 5', 'Pixel 4'],
  'Sony': ['Xperia 1', 'Xperia 5', 'Xperia 10'],
  'LG': ['G Series', 'V Series', 'K Series'],
  'Motorola': ['Edge', 'G Power', 'One', 'Razr'],
  'Nokia': ['G Series', 'X Series', 'C Series']
};

const initialForm = {
  brand: '',
  model: '',
  serialNumber: '',
  issueDescription: '',
  repairCost: '',
  depositAmount: '',
  diagnosisRequired: false,
  expectedReturnDate: new Date().toISOString().split('T')[0], // default to today
  unlockCode: '',
  deviceNotes: '',
  deviceCost: '',
  assignedTo: '', // Add assignedTo to form state
  problemCategory: '', // Add problem category to form state
};

type DeviceConditionKey = 'screenCracked' | 'backCoverDamaged' | 'waterDamage' | 'noPower' | 'buttonsNotWorking' | 'other';
const conditionOptions: { key: DeviceConditionKey | 'otherText'; label: string }[] = [
  { key: 'other', label: 'Condition Assessment' },
];

const DeviceIntakeUnifiedPage: React.FC = () => {
  // All state variables and refs
  const [formData, setFormData] = useState(initialForm);
  const [isLoading, setIsLoading] = useState(false);
  const [deviceImages, setDeviceImages] = useState<string[]>([]);
  const [showModelSuggestions, setShowModelSuggestions] = useState(false);

  const navigate = useNavigate();
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const { customers } = useCustomers();
  const [customerSearch, setCustomerSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const customerInputRef = useRef<HTMLInputElement>(null);
  const [recentDevices, setRecentDevices] = useState<any[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [showAllRepairs, setShowAllRepairs] = useState(false);
  const [cardVisible, setCardVisible] = useState(true);
  const [imeiOrSerial, setImeiOrSerial] = useState("");
  const [isReviewing, setIsReviewing] = useState(false);
  const [confirmAccessories, setConfirmAccessories] = useState(false);
  const [confirmProblem, setConfirmProblem] = useState(false);
  const [confirmPrivacy, setConfirmPrivacy] = useState(false);
  const [duplicateDevice, setDuplicateDevice] = useState<null | { found: boolean; info?: string }>(null);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [deviceCondition, setDeviceCondition] = useState<Record<DeviceConditionKey, boolean> & { otherText: string}>(
    {
      screenCracked: false,
      backCoverDamaged: false,
      waterDamage: false,
      noPower: false,
      buttonsNotWorking: false,
      other: false,
      otherText: '',
    }
  );
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [note, setNote] = useState('');

  // AI Analysis state
  const [aiAnalysis, setAiAnalysis] = useState<{
    isAnalyzing: boolean;
    problem: string;
    solutions: string[];
    estimatedCost: string;
    difficulty: string;
    timeEstimate: string;
    partsNeeded: string[];
    error?: string;
  }>({
    isAnalyzing: false,
    problem: '',
    solutions: [],
    estimatedCost: '',
    difficulty: '',
    timeEstimate: '',
    partsNeeded: []
  });
  const [showAiAnalysis, setShowAiAnalysis] = useState(false);
  const [aiAnalysisEnabled, setAiAnalysisEnabled] = useState(true);
  const [aiLanguage, setAiLanguage] = useState<'swahili' | 'english'>('swahili');
  const [isLanguageSwitching, setIsLanguageSwitching] = useState(false);

  // Enhanced AI Analysis Features
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [currentAnalysisStep, setCurrentAnalysisStep] = useState(0);
  const [selectedProblemArea, setSelectedProblemArea] = useState<string | null>(null);
  const [repairSteps, setRepairSteps] = useState<Array<{
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'active' | 'completed' | 'error';
  }>>([]);
  const [problemAreas, setProblemAreas] = useState<Array<{
    id: string;
    name: string;
    description: string;
    x: number;
    y: number;
    severity: 'low' | 'medium' | 'high';
  }>>([]);

  // New state for inline customer creation
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    gender: '',
    loyaltyLevel: 'bronze',
                colorTag: 'new'
  });
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  const [showDeviceNotes, setShowDeviceNotes] = useState(false);
  const [showPartDetails, setShowPartDetails] = useState<any>(null);
  const [showDepositField, setShowDepositField] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: boolean }>({});
  const [errorMessages, setErrorMessages] = useState<{ [key: string]: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  
  // Enhanced error handling states
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [apiErrors, setApiErrors] = useState<string | null>(null);
  const [offlineErrors, setOfflineErrors] = useState<string | null>(null);
  const [criticalError, setCriticalError] = useState<string | null>(null);
  const [errorHistory, setErrorHistory] = useState<Array<{timestamp: Date, error: string, type: string}>>([]);
  const { addDevice } = useDevices();
  const { currentUser } = useAuth();
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modelInputRef = useRef<HTMLInputElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const [offlineSuccess, setOfflineSuccess] = useState(false);
  const qrPrintRef = useRef<HTMLDivElement>(null);

  // Redirect technicians away from this page
  useEffect(() => {
    if (currentUser && currentUser.role === 'technician') {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  // Add state for completion option
  const [completionOption, setCompletionOption] = useState('same_day'); // default to Same Day
  const completionOptions = [
    { label: 'Same Day', value: 'same_day', days: 0 },
    { label: '2 Days', value: '2_days', days: 2 },
    { label: '3 Days', value: '3_days', days: 3 },
    { label: '1 Week', value: '1_week', days: 7 },
    { label: 'Custom', value: 'custom', days: null },
  ];

  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const dropdown = document.querySelector('[data-dropdown="completion"]');
      if (dropdown && !dropdown.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);
  
  const optionIcons = {
    same_day: <Clock size={20} className="text-blue-500" />,
    '2_days': <Calendar size={20} className="text-green-500" />,
    '3_days': <Calendar size={20} className="text-yellow-500" />,
    '1_week': <Calendar size={20} className="text-purple-500" />,
    custom: <Calendar size={20} className="text-gray-400" />,
  };

  const handleDropdownSelect = (value: string) => {
    setCompletionOption(value);
    setDropdownOpen(false);
    if (value !== 'custom') {
      const option = completionOptions.find(opt => opt.value === value);
      if (option && option.days !== null) {
        const now = new Date();
        // If 'same_day', set to 24 hours from now (tomorrow)
        const date = option.value === 'same_day'
          ? new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
          : new Date(now.getFullYear(), now.getMonth(), now.getDate() + (option.days || 0));
        setFormData(prev => ({
          ...prev,
          expectedReturnDate: date.toISOString().split('T')[0],
        }));
      }
    }
  };

  // Fetch technicians from auth_users
  useEffect(() => {
    // Fetch technicians from auth_users
    const fetchTechnicians = async () => {
      const { data, error } = await supabase
        .from('auth_users')
        .select('id, name, email')
        .eq('role', 'technician');
      if (!error && data) setTechnicians(data);
    };
    fetchTechnicians();
  }, []);

  // Debounce customer search using API
  useEffect(() => {
    if (!customerSearch.trim()) {
      setFilteredCustomers([]);
      setSearchingCustomers(false);
      return;
    }
    
    const timeout = setTimeout(async () => {
      try {
        setSearchingCustomers(true);
        const result = await searchCustomersFast(customerSearch, 1, 50);
        
        if (result && result.customers) {
          setFilteredCustomers(result.customers);
        } else {
          setFilteredCustomers([]);
        }
      } catch (error) {
        console.error('Error searching customers:', error);
        toast.error('Failed to search customers');
        setFilteredCustomers([]);
      } finally {
        setSearchingCustomers(false);
      }
    }, 300);
    
    return () => clearTimeout(timeout);
  }, [customerSearch]);

  // Hide suggestions on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (customerInputRef.current && !customerInputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close model suggestions on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modelInputRef.current &&
        !modelInputRef.current.contains(event.target as Node) &&
        modelDropdownRef.current &&
        !modelDropdownRef.current.contains(event.target as Node)
      ) {
        setShowModelSuggestions(false);
      }
    }
    if (showModelSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showModelSuggestions]);

  // Handlers (examples, not full):
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let newValue = type === 'checkbox' && 'checked' in e.target ? (e.target as HTMLInputElement).checked : value;
    // Fix: For number fields, strip commas and only allow valid numbers
    if (name === 'repairCost' || name === 'depositAmount') {
      // Remove commas
      const cleaned = value.replace(/,/g, '');
      // Only set if valid number or empty
      if (cleaned === '' || /^\d+(\.\d{0,2})?$/.test(cleaned)) {
        newValue = cleaned;
      } else {
        // Ignore invalid input
        return;
      }
    }
    setFormData(prev => ({ ...prev, [name]: newValue }));
  };

  // Helper to count words
  const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;
  const minIssueWords = 5;
  const isIssueDescriptionValid = countWords(formData.issueDescription) >= minIssueWords;
  const [issueDescriptionTouched, setIssueDescriptionTouched] = useState(false);

  // Enhanced AI Analysis function with offline capabilities
  const analyzeDeviceProblem = async () => {
    if (!formData.model || !formData.issueDescription.trim()) {
      const errorMsg = 'Please fill in model and issue description for AI analysis';
      handleValidationError('issueDescription', errorMsg);
      toast.error(errorMsg);
      return;
    }

    setAiAnalysis(prev => ({ ...prev, isAnalyzing: true, error: undefined }));
    clearAllErrors(); // Clear previous errors before starting analysis
    
    // Initialize repair steps
    const steps = [
      { id: '1', title: 'Analyzing Device', description: 'Examining device specifications and issue', status: 'active' as const },
      { id: '2', title: 'Identifying Problem', description: 'Determining root cause of issue', status: 'pending' as const },
      { id: '3', title: 'Generating Solutions', description: 'Creating repair recommendations', status: 'pending' as const },
      { id: '4', title: 'Estimating Costs', description: 'Calculating repair costs and time', status: 'pending' as const }
    ];
    setRepairSteps(steps);
    setCurrentAnalysisStep(0);

    try {
      // Check online status first
      if (!isOnline) {
        // Use offline AI analysis
        console.log('🔴 Offline mode - using local AI analysis');
        toast('Working offline - using local AI analysis');
        
        const offlineResult = await offlineAIService.analyzeDevice(
          formData.model,
          formData.issueDescription,
          aiLanguage
        );

        // Update steps
        setRepairSteps(prev => prev.map((step, index) => ({
          ...step,
          status: index <= 3 ? 'completed' : 'pending'
        })));

        setAiAnalysis({
          isAnalyzing: false,
          problem: offlineResult.problem,
          solutions: offlineResult.solutions,
          estimatedCost: offlineResult.estimatedCost,
          difficulty: offlineResult.difficulty,
          timeEstimate: offlineResult.timeEstimate,
          partsNeeded: offlineResult.partsNeeded
        });

        // Generate problem areas for device diagram
        generateProblemAreas(offlineResult);
        
        setShowAiAnalysis(true);
        toast.success(`Offline analysis completed! (${Math.round(offlineResult.confidence * 100)}% confidence)`);
        return;
      }

      // Try online AI first
      try {
        const testResponse = await geminiService.testConnection();
        if (!testResponse.success) {
          throw new Error('Online AI not available');
        }

        // Update step 1
        setRepairSteps(prev => prev.map((step, index) => ({
          ...step,
          status: index === 0 ? 'completed' : index === 1 ? 'active' : 'pending'
        })));
        setCurrentAnalysisStep(1);

        // Create prompt based on selected language
        let prompt;
        
        if (aiLanguage === 'swahili') {
          prompt = `Analyze this device repair problem and provide detailed solutions in SIMPLE SWAHILI with TECHNICAL TERMS IN ENGLISH:

Device: ${formData.model}
Issue Description: ${formData.issueDescription}
Device Conditions: ${selectedConditions.join(', ')} ${otherConditionText ? `, ${otherConditionText}` : ''}

Please provide a structured analysis in JSON format with the following fields, using SIMPLE SWAHILI but TECHNICAL TERMS IN ENGLISH:

{
  "problem": "Maelezo rahisi ya tatizo la kifaa",
  "solutions": ["Njia ya 1 ya kurekebisha", "Njia ya 2 ya kurekebisha", "Njia ya 3 ya kurekebisha"],
  "estimatedCost": "Bei ya kurekebisha (Tsh)",
  "difficulty": "Rahisi/Wastani/Ngumu",
  "timeEstimate": "Muda wa kurekebisha",
  "partsNeeded": ["Part 1", "Part 2", "Part 3"],
  "commonCauses": ["Sababu ya 1", "Sababu ya 2"],
  "preventionTips": ["Ushauri wa 1", "Ushauri wa 2"]
}

IMPORTANT INSTRUCTIONS:
- Use SIMPLE SWAHILI for general explanations
- Use ENGLISH for technical terms and part names
- Keep language simple and practical for Dar es Salaam technicians
- Use Tanzanian Shillings (Tsh) for costs
- Focus on practical, actionable solutions for a local repair shop

TECHNICAL TERMS TO USE IN ENGLISH:
- Cable (not "kebo")
- Screen/LCD (not "skrini")
- Battery (not "betri")
- Charger (not "chaaji")
- Motherboard (not "bodi kuu")
- RAM (not "kumbukumbu")
- Storage (not "uhifadhi")
- Processor/CPU (not "kichakata")
- Speaker (not "spika")
- Microphone/Mic (not "kipaza sauti")
- Camera (not "kamera")
- Sensor (not "hisia")
- Adhesive (not "gundi")
- Connector (not "unganisho")
- Port (not "mlango")
- Button (not "kitufe")
- Switch (not "swichi")
- Circuit (not "mzunguko")
- Voltage (not "volti")
- Current (not "umeme")`;
        } else {
          prompt = `Analyze this device repair problem and provide detailed solutions in ENGLISH:

Device: ${formData.model}
Issue Description: ${formData.issueDescription}
Device Conditions: ${selectedConditions.join(', ')} ${otherConditionText ? `, ${otherConditionText}` : ''}

Please provide a structured analysis in JSON format with the following fields:

{
  "problem": "Clear description of the main problem",
  "solutions": ["Solution 1", "Solution 2", "Solution 3"],
  "estimatedCost": "Estimated repair cost range in USD",
  "difficulty": "Easy/Medium/Hard",
  "timeEstimate": "Estimated repair time",
  "partsNeeded": ["Part 1", "Part 2", "Part 3"],
  "commonCauses": ["Cause 1", "Cause 2"],
  "preventionTips": ["Tip 1", "Tip 2"]
}

IMPORTANT INSTRUCTIONS:
- Use clear, professional English
- Focus on practical, actionable solutions for a device repair shop
- Include specific parts that might need replacement
- Use realistic cost estimates
- Provide detailed technical analysis`;
        }

        // Update step 2
        setRepairSteps(prev => prev.map((step, index) => ({
          ...step,
          status: index <= 1 ? 'completed' : index === 2 ? 'active' : 'pending'
        })));
        setCurrentAnalysisStep(2);

        const response = await geminiService.chat([
          { role: 'user', content: prompt }
        ]);

        if (response.success && response.data) {
          // Update step 3
          setRepairSteps(prev => prev.map((step, index) => ({
            ...step,
            status: index <= 2 ? 'completed' : index === 3 ? 'active' : 'pending'
          })));
          setCurrentAnalysisStep(3);

          try {
            const jsonMatch = response.data.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              setAiAnalysis({
                isAnalyzing: false,
                problem: parsed.problem || 'Analysis completed',
                solutions: parsed.solutions || [],
                estimatedCost: parsed.estimatedCost || 'Cost to be determined',
                difficulty: parsed.difficulty || 'Medium',
                timeEstimate: parsed.timeEstimate || '1-2 hours',
                partsNeeded: parsed.partsNeeded || []
              });
            } else {
              setAiAnalysis({
                isAnalyzing: false,
                problem: 'AI analysis completed',
                solutions: [response.data],
                estimatedCost: 'Cost to be determined',
                difficulty: 'Medium',
                timeEstimate: '1-2 hours',
                partsNeeded: []
              });
            }

                         // Generate problem areas for device diagram
             generateProblemAreas({
               problem: parsed.problem || 'Analysis completed',
               solutions: parsed.solutions || [],
               partsNeeded: parsed.partsNeeded || []
             });

            // Complete all steps
            setRepairSteps(prev => prev.map(step => ({ ...step, status: 'completed' })));
            setCurrentAnalysisStep(4);

            setShowAiAnalysis(true);
            toast.success('🟢 Online AI analysis completed!');
          } catch (parseError) {
            setAiAnalysis({
              isAnalyzing: false,
              problem: 'AI analysis completed',
              solutions: [response.data],
              estimatedCost: 'Cost to be determined',
              difficulty: 'Medium',
              timeEstimate: '1-2 hours',
              partsNeeded: []
            });
            setShowAiAnalysis(true);
            toast.success('AI analysis completed!');
          }
        } else {
          throw new Error(response.error || 'AI analysis failed');
        }
      } catch (onlineError) {
        console.log('🔄 Online AI failed, falling back to offline analysis');
        handleApiError(onlineError, 'AI analysis');
        
        try {
          // Fallback to offline analysis
          const offlineResult = await offlineAIService.analyzeDevice(
            formData.brand,
            formData.model,
            formData.issueDescription,
            aiLanguage
          );

        setAiAnalysis({
          isAnalyzing: false,
          problem: offlineResult.problem,
          solutions: offlineResult.solutions,
          estimatedCost: offlineResult.estimatedCost,
          difficulty: offlineResult.difficulty,
          timeEstimate: offlineResult.timeEstimate,
          partsNeeded: offlineResult.partsNeeded
        });

        // Generate problem areas for device diagram
        generateProblemAreas(offlineResult);

        // Complete all steps
        setRepairSteps(prev => prev.map(step => ({ ...step, status: 'completed' })));
        setCurrentAnalysisStep(4);

        setShowAiAnalysis(true);
        toast.success(`🔄 Fallback analysis completed! (${Math.round(offlineResult.confidence * 100)}% confidence)`);
        addErrorToHistory('Offline AI analysis completed successfully', 'offline');
        } catch (offlineError) {
          handleOfflineError(offlineError);
          setAiAnalysis(prev => ({ 
            ...prev, 
            isAnalyzing: false, 
            error: 'Both online and offline AI analysis failed' 
          }));
        }
      }
    } catch (error) {
      handleCriticalError(error);
      setAiAnalysis(prev => ({ 
        ...prev, 
        isAnalyzing: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }));
      setRepairSteps(prev => prev.map(step => ({ ...step, status: 'error' })));
      toast.error('AI analysis failed. Please try again.');
    }
  };

  // Generate problem areas for device diagram
  const generateProblemAreas = (analysis: any) => {
    const areas = [];
    const issue = analysis.problem.toLowerCase();
    
    // Screen issues
    if (issue.includes('screen') || issue.includes('display') || issue.includes('lcd')) {
      areas.push({
        id: 'screen',
        name: 'Screen',
        description: 'Display or touch issues',
        x: 50,
        y: 30,
        severity: 'high' as const
      });
    }
    
    // Battery issues
    if (issue.includes('battery') || issue.includes('power') || issue.includes('charge')) {
      areas.push({
        id: 'battery',
        name: 'Battery',
        description: 'Power or charging issues',
        x: 20,
        y: 70,
        severity: 'medium' as const
      });
    }
    
    // Camera issues
    if (issue.includes('camera') || issue.includes('photo') || issue.includes('video')) {
      areas.push({
        id: 'camera',
        name: 'Camera',
        description: 'Camera or photo issues',
        x: 80,
        y: 25,
        severity: 'medium' as const
      });
    }
    
    // Audio issues
    if (issue.includes('speaker') || issue.includes('audio') || issue.includes('sound')) {
      areas.push({
        id: 'audio',
        name: 'Audio',
        description: 'Speaker or microphone issues',
        x: 15,
        y: 50,
        severity: 'low' as const
      });
    }
    
    setProblemAreas(areas);
  };

  // Online status listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-trigger AI analysis when issue description is complete
  useEffect(() => {
    if (aiAnalysisEnabled && 
        formData.brand && 
        formData.model && 
        isIssueDescriptionValid && 
        formData.issueDescription.length > 20 &&
        !aiAnalysis.isAnalyzing &&
        !aiAnalysis.problem) {
      // Debounce the analysis
      const timer = setTimeout(() => {
        analyzeDeviceProblem();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [formData.brand, formData.model, formData.issueDescription, aiAnalysisEnabled, aiLanguage]);

  // Get UI labels based on selected language
  const getUILabels = () => {
    if (aiLanguage === 'swahili') {
      return {
        modalTitle: 'Uchambuzi wa Kifaa na AI',
        problemAnalysis: 'Uchambuzi wa Tatizo',
        solutions: 'Njia za Kurekebisha',
        estimatedCost: 'Bei ya Kurekebisha',
        difficulty: 'Kiwango cha Ugumu',
        timeEstimate: 'Muda wa Kurekebisha',
        partsNeeded: 'Sehemu Zinazohitajika',
        noParts: 'Hakuna sehemu maalum zilizotambuliwa',
        analyzing: 'Inachambua...',
        retryAnalysis: 'Jaribu Tena',
        reAnalyze: 'Chambua Tena',
        applySuggestions: 'Tumia Mapendekezo',
        close: 'Funga',
        aiAnalyzing: 'AI inachambua tatizo...',
        analysisAvailable: 'Uchambuzi wa AI unapatikana',
        viewAnalysis: 'Tazama Uchambuzi',
        analysisFailed: 'Uchambuzi wa AI umeshindwa',
        retry: 'Jaribu Tena',
        willAnalyze: 'AI itachambua wakati maelezo yatakapokamilika',
        suggestionsApplied: 'Mapendekezo ya AI yamewekwa kwenye fomu',
        aiAnalysis: 'Uchambuzi wa AI',
        serviceError: 'Hitilafu ya Huduma ya AI',
        setupInstructions: 'Jinsi ya kuweka AI Analysis:',
        goToSettings: '1. Nenda kwenye Mipangilio → Muunganisho',
        findGemini: '2. Tafuta "Gemini AI" muunganisho',
        addApiKey: '3. Ongeza API key yako ya Google Gemini',
        enableIntegration: '4. Wezesha muunganisho',
        testConnection: '5. Jaribu muunganisho',
        getApiKey: 'Pata API key ya bure kutoka:'
      };
    } else {
      return {
        modalTitle: 'AI Device Analysis',
        problemAnalysis: 'Problem Analysis',
        solutions: 'Recommended Solutions',
        estimatedCost: 'Estimated Cost',
        difficulty: 'Difficulty Level',
        timeEstimate: 'Time Estimate',
        partsNeeded: 'Parts Needed',
        noParts: 'No specific parts identified',
        analyzing: 'Analyzing...',
        retryAnalysis: 'Retry Analysis',
        reAnalyze: 'Re-analyze',
        applySuggestions: 'Apply Suggestions',
        close: 'Close',
        aiAnalyzing: 'AI is analyzing the problem...',
        analysisAvailable: 'AI analysis available',
        viewAnalysis: 'View Analysis',
        analysisFailed: 'AI analysis failed',
        retry: 'Retry',
        willAnalyze: 'AI will analyze when description is complete',
        suggestionsApplied: 'AI suggestions applied to form',
        aiAnalysis: 'AI Analysis',
        serviceError: 'AI Service Error',
        setupInstructions: 'How to set up AI Analysis:',
        goToSettings: '1. Go to Settings → Integrations',
        findGemini: '2. Find "Gemini AI" integration',
        addApiKey: '3. Add your Google Gemini API key',
        enableIntegration: '4. Enable the integration',
        testConnection: '5. Test the connection',
        getApiKey: 'Get a free API key from:'
      };
    }
  };

  const labels = getUILabels();

  // Customer creation function
  const handleCreateCustomer = async () => {
    if (!newCustomerData.name.trim() || !newCustomerData.phone.trim()) {
      const errorMsg = 'Name and phone number are required';
      handleValidationError('customer', errorMsg);
      toast.error(errorMsg);
      return;
    }

    setCreatingCustomer(true);
    clearAllErrors();
    
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          name: newCustomerData.name.trim(),
          phone: newCustomerData.phone.trim(),
          email: newCustomerData.email.trim() || null,
          city: newCustomerData.city.trim() || null,
          gender: newCustomerData.gender || null,
          loyaltyLevel: newCustomerData.loyaltyLevel,
          colorTag: newCustomerData.colorTag,
          points: 0,
          totalSpent: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        toast.success('Customer created successfully!');
        setSelectedCustomer(data);
        setShowCreateCustomer(false);
        setNewCustomerData({
          name: '',
          phone: '',
          email: '',
          city: '',
          gender: '',
          loyaltyLevel: 'bronze',
          colorTag: 'new'
        });
        // Clear form for new customer - will be auto-loaded from draft if exists
        setFormData(initialForm);
        setSelectedConditions([]);
        setOtherConditionText('');
        // Refresh customers list
        // Note: This would ideally trigger a refresh of the customers context
      }
    } catch (error: any) {
      handleApiError(error, 'create customer');
      
      // Handle specific customer creation errors
      if (error?.code === '23505') {
        handleValidationError('phone', 'Phone number already exists. Please use a different number.');
      } else if (error?.code === '23503') {
        handleValidationError('customer', 'Invalid data provided for customer creation.');
      }
    } finally {
      setCreatingCustomer(false);
    }
  };

  // Enhanced IMEI/Serial Number validation
  const validateImeiOrSerial = (value: string): { isValid: boolean; error?: string } => {
    const cleaned = value.replace(/\D/g, '');
    
    // Check if empty
    if (!value.trim()) {
      return { isValid: false, error: 'IMEI or Serial Number is required' };
    }
    
    // For alphanumeric serial numbers, check if it has a reasonable mix
    const totalLength = value.replace(/\s/g, '').length;
    const digitCount = cleaned.length;
    const letterCount = totalLength - digitCount;
    
    // If it's mostly letters (like "G9566RL4YC"), it's likely a valid alphanumeric serial
    if (letterCount > digitCount && totalLength >= 8) {
      // Allow alphanumeric serials with more letters than digits
      return { isValid: true };
    }
    
    // Also allow mixed alphanumeric serials with reasonable length
    if (totalLength >= 8 && digitCount >= 2 && letterCount >= 2) {
      return { isValid: true };
    }
    
    // For IMEI-style numbers, check minimum length (12 digits)
    if (digitCount < 12 && letterCount === 0) {
      return { isValid: false, error: 'IMEI or Serial Number must be at least 12 digits' };
    }
    
    // Check maximum length (IMEI is 15 digits, some serials can be longer)
    if (digitCount > 20) {
      return { isValid: false, error: 'IMEI or Serial Number is too long' };
    }
    
    // Prevent common model names and patterns
    const lowerValue = value.toLowerCase();
    const modelPatterns = [
      'iphone', 'galaxy', 'pixel', 'oneplus', 'huawei', 'xiaomi', 'samsung', 'apple',
      'note', 'plus', 'pro', 'max', 'ultra', 'mini', 'lite', 'neo', 'fe',
      'a series', 's series', 'm series', 'c series', 'g series', 'x series'
    ];
    
    // Check if input contains model name patterns
    for (const pattern of modelPatterns) {
      if (lowerValue.includes(pattern)) {
        return { isValid: false, error: 'Please enter the actual IMEI or Serial Number, not the model name' };
      }
    }
    
    // Check for common model number patterns (like "iPhone 15", "Galaxy S24")
    const modelNumberPatterns = [
      /\b(iphone|galaxy|pixel|oneplus|huawei|xiaomi)\s+\d+/i,
      /\b(s|a|m|c|g|x)\s*\d+/i,
      /\b(pro|max|ultra|mini|lite|neo|fe)\b/i
    ];
    
    for (const pattern of modelNumberPatterns) {
      if (pattern.test(value)) {
        return { isValid: false, error: 'Please enter the actual IMEI or Serial Number, not the model name' };
      }
    }
    
    // Check if it looks like a model description rather than IMEI/Serial
    if (value.split(' ').length > 2) {
      return { isValid: false, error: 'Please enter the actual IMEI or Serial Number, not a description' };
    }
    
    // For IMEI-style numbers, ensure they're mostly digits
    if (digitCount >= 12 && digitCount / totalLength >= 0.8) {
      return { isValid: true };
    }
    
    // If it doesn't meet either criteria, it might be invalid
    if (totalLength < 8) {
      return { isValid: false, error: 'IMEI or Serial Number is too short' };
    }
    
    // Allow any reasonable alphanumeric serial (8+ characters with mix of letters and digits)
    if (totalLength >= 8 && digitCount > 0 && letterCount > 0) {
      return { isValid: true };
    }
    
    // Check for common mistakes like "N/A", "Unknown", "Not available"
    const commonMistakes = ['n/a', 'na', 'unknown', 'not available', 'none', 'n/a', 'tbd', 'pending'];
    if (commonMistakes.includes(lowerValue)) {
      return { isValid: false, error: 'Please enter the actual IMEI or Serial Number from the device' };
    }
    
    // Check for repeated patterns that might indicate fake input
    const repeatedPatterns = /(\d)\1{5,}/; // 6 or more repeated digits
    if (repeatedPatterns.test(cleaned)) {
      return { isValid: false, error: 'IMEI or Serial Number appears to be invalid (repeated digits)' };
    }
    
    return { isValid: true };
  };

  const validateForm = () => {
    const errors: { [key: string]: boolean } = {};
    const messages: { [key: string]: string } = {};
    let valid = true;

    // Clear previous errors
    setSubmitError(null);
    setErrorMessages({});

    // Brand validation - brand is included in model name
    const hasBrand = formData.brand || (formData.model && formData.model.trim().length > 0);
    if (!hasBrand) {
      errors.brand = true;
      messages.brand = 'Brand is required (included in model name)';
      valid = false;
    }

    // Model validation
    if (!formData.model.trim()) {
      errors.model = true;
      messages.model = 'Model is required';
      valid = false;
    } else if (formData.model.trim().length < 2) {
      errors.model = true;
      messages.model = 'Model must be at least 2 characters';
      valid = false;
    }
    
    // Enhanced IMEI/Serial validation
    const imeiValidation = validateImeiOrSerial(imeiOrSerial);
    if (!imeiValidation.isValid) {
      errors.imeiOrSerial = true;
      messages.imeiOrSerial = imeiValidation.error || 'Please enter a valid IMEI or Serial Number';
      valid = false;
    }
    
    // Issue description validation
    if (!formData.issueDescription.trim()) {
      errors.issueDescription = true;
      messages.issueDescription = 'Issue description is required';
      valid = false;
    } else if (!isIssueDescriptionValid) {
      errors.issueDescription = true;
      messages.issueDescription = `Issue description must be at least ${minIssueWords} words (currently ${countWords(formData.issueDescription)} words)`;
      valid = false;
    }

    // Technician assignment validation
    if (!formData.assignedTo) {
      errors.assignedTo = true;
      messages.assignedTo = 'Please assign the device to a technician';
      valid = false;
    }

    // Customer validation
    if (!selectedCustomer) {
      errors.customer = true;
      messages.customer = 'Please select or create a customer';
      valid = false;
    }

    // Expected return date validation
    if (!formData.expectedReturnDate) {
      errors.expectedReturnDate = true;
      messages.expectedReturnDate = 'Expected return date is required';
      valid = false;
    } else {
      const returnDate = new Date(formData.expectedReturnDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (returnDate < today) {
        errors.expectedReturnDate = true;
        messages.expectedReturnDate = 'Expected return date cannot be in the past';
        valid = false;
      }
    }

    // Condition assessment validation - DISABLED
    // const anyCondition = Object.values(deviceCondition).some(v => v) || selectedConditions.length > 0 || !!otherConditionText.trim();
    // if (!anyCondition) {
    //   errors.conditionAssessment = true;
    //   messages.conditionAssessment = 'Please complete the device condition assessment';
    //   valid = false;
    // }

    // Repair cost validation (if provided)
    if (formData.repairCost && formData.repairCost.trim()) {
      const cost = parseFloat(formData.repairCost);
      if (isNaN(cost) || cost < 0) {
        errors.repairCost = true;
        messages.repairCost = 'Repair cost must be a valid positive number';
        valid = false;
      }
    }

    // Device cost validation (if provided)
    if (formData.deviceCost && formData.deviceCost.trim()) {
      const cost = parseFloat(formData.deviceCost);
      if (isNaN(cost) || cost < 0) {
        errors.deviceCost = true;
        messages.deviceCost = 'Device cost must be a valid positive number';
        valid = false;
      }
    }

    // Deposit amount validation (if provided)
    if (formData.depositAmount && formData.depositAmount.trim()) {
      const deposit = parseFloat(formData.depositAmount);
      if (isNaN(deposit) || deposit < 0) {
        errors.depositAmount = true;
        messages.depositAmount = 'Deposit amount must be a valid positive number';
        valid = false;
      }
    }

    setFieldErrors(errors);
    setErrorMessages(messages);
    return valid;
  };

  // Enhanced error handling system
  const addErrorToHistory = (error: string, type: string) => {
    const newError = {
      timestamp: new Date(),
      error,
      type
    };
    setErrorHistory(prev => [newError, ...prev.slice(0, 9)]); // Keep last 10 errors
  };

  const clearAllErrors = () => {
    setNetworkError(null);
    setValidationErrors({});
    setApiErrors(null);
    setOfflineErrors(null);
    setCriticalError(null);
    setSubmitError(null);
    setFieldErrors({});
    setErrorMessages({});
  };

  const handleNetworkError = (error: any) => {
    console.error('Network error:', error);
    const errorMsg = 'Network connection lost. Please check your internet connection and try again.';
    setNetworkError(errorMsg);
    addErrorToHistory(errorMsg, 'network');
    toast.error(errorMsg);
  };

  const handleApiError = (error: any, context: string = 'API call') => {
    console.error(`${context} error:`, error);
    
    let errorMessage = `Failed to ${context.toLowerCase()}. Please try again.`;
    
    if (error?.message) {
      if (error.message.includes('permission') || error.message.includes('unauthorized')) {
        errorMessage = 'Permission denied. Please contact your administrator.';
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        errorMessage = 'Network timeout. Please check your connection and try again.';
      } else if (error.message.includes('validation')) {
        errorMessage = 'Invalid data provided. Please check your input and try again.';
      }
    }
    
    setApiErrors(errorMessage);
    addErrorToHistory(errorMessage, 'api');
    toast.error(errorMessage);
  };

  const handleValidationError = (field: string, message: string) => {
    setValidationErrors(prev => ({ ...prev, [field]: message }));
    setFieldErrors(prev => ({ ...prev, [field]: true }));
    setErrorMessages(prev => ({ ...prev, [field]: message }));
    addErrorToHistory(`Validation error in ${field}: ${message}`, 'validation');
  };

  const handleOfflineError = (error: any) => {
    console.error('Offline operation error:', error);
    const errorMsg = 'Failed to save data offline. Please try again or contact support.';
    setOfflineErrors(errorMsg);
    addErrorToHistory(errorMsg, 'offline');
    toast.error(errorMsg);
  };

  const handleCriticalError = (error: any) => {
    console.error('Critical error:', error);
    const errorMsg = 'A critical error occurred. Please refresh the page and try again.';
    setCriticalError(errorMsg);
    addErrorToHistory(errorMsg, 'critical');
    toast.error(errorMsg);
  };

  // Enhanced error handling for device creation
  const handleDeviceCreationError = (error: any) => {
    console.error('Device creation error:', error);
    
    let errorMessage = 'An unexpected error occurred while creating the device.';
    let errorType = 'api';
    
    // Handle specific error types
    if (error?.code === '23505') {
      errorMessage = 'A device with this serial number already exists. Please check the IMEI/Serial Number.';
      errorType = 'validation';
      // Highlight the serial number field
      setFieldErrors(prev => ({ ...prev, imeiOrSerial: true }));
      setErrorMessages(prev => ({ ...prev, imeiOrSerial: errorMessage }));
    } else if (error?.code === '23503') {
      errorMessage = 'Invalid customer or technician selected. Please refresh and try again.';
      errorType = 'validation';
    } else if (error?.code === '23514') {
      errorMessage = 'Invalid data provided. Please check all fields and try again.';
      errorType = 'validation';
    } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
      errorMessage = 'Network error. Please check your connection and try again.';
      errorType = 'network';
      handleNetworkError(error);
    } else if (error?.message?.includes('timeout')) {
      errorMessage = 'Request timed out. Please try again.';
      errorType = 'network';
    } else if (error?.message?.includes('offline')) {
      errorType = 'offline';
      handleOfflineError(error);
      return;
    } else if (error?.message) {
      errorMessage = error.message;
    }
    
    setSubmitError(errorMessage);
    addErrorToHistory(errorMessage, errorType);
    toast.error(errorMessage);
    
    // Reset loading states
    setIsSubmitting(false);
    setIsLoading(false);
  };

  // Retry mechanism for failed submissions
  const retryDeviceCreation = async () => {
    if (retryCount >= 3) {
      const errorMsg = 'Maximum retry attempts reached. Please refresh the page and try again.';
      handleCriticalError(new Error(errorMsg));
      return;
    }
    
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    clearAllErrors();
    
    try {
      // Wait a bit before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1)));
      
      // Retry the submission
      await submitDeviceForm();
      
      // Reset retry count on success
      setRetryCount(0);
      addErrorToHistory('Device creation retry successful', 'success');
    } catch (error) {
      handleDeviceCreationError(error);
    } finally {
      setIsRetrying(false);
    }
  };

  // Enhanced retry mechanism for different operations
  const retryOperation = async (operation: () => Promise<any>, operationName: string, maxRetries: number = 3) => {
    let attempts = 0;
    
    while (attempts < maxRetries) {
      try {
        return await operation();
      } catch (error) {
        attempts++;
        if (attempts >= maxRetries) {
          handleApiError(error, operationName);
          throw error;
        }
        
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempts - 1)));
        addErrorToHistory(`${operationName} retry attempt ${attempts}`, 'retry');
      }
    }
  };

  // Extract brand from model name
  const extractBrandFromModel = (model: string): string => {
    if (!model) return '';
    
    const modelLower = model.toLowerCase();
    
    // Check for common brand patterns
    if (modelLower.includes('iphone') || modelLower.includes('ipad') || modelLower.includes('macbook')) {
      return 'Apple';
    } else if (modelLower.includes('samsung') || modelLower.includes('galaxy')) {
      return 'Samsung';
    } else if (modelLower.includes('google') || modelLower.includes('pixel')) {
      return 'Google';
    } else if (modelLower.includes('huawei')) {
      return 'Huawei';
    } else if (modelLower.includes('xiaomi') || modelLower.includes('redmi') || modelLower.includes('poco')) {
      return 'Xiaomi';
    } else if (modelLower.includes('oneplus')) {
      return 'OnePlus';
    } else if (modelLower.includes('sony') || modelLower.includes('xperia')) {
      return 'Sony';
    } else if (modelLower.includes('lg')) {
      return 'LG';
    } else if (modelLower.includes('motorola')) {
      return 'Motorola';
    } else if (modelLower.includes('nokia')) {
      return 'Nokia';
    } else if (modelLower.includes('microsoft') || modelLower.includes('surface')) {
      return 'Microsoft';
    } else if (modelLower.includes('hp')) {
      return 'HP';
    } else if (modelLower.includes('dell')) {
      return 'Dell';
    } else if (modelLower.includes('lenovo')) {
      return 'Lenovo';
    }
    
    // If no brand found, return the first word as brand
    return model.split(' ')[0] || '';
  };

  // Main device submission function
  const submitDeviceForm = async () => {
    // Clear previous errors
    clearAllErrors();
    
    // Check if form is ready for submission
    if (completionPercentage < 70) {
      const errorMsg = 'Please complete more fields before submitting.';
      addErrorToHistory(errorMsg, 'validation');
      toast.error(errorMsg);
      return;
    }
    
    // If not 100% complete, show warning but allow submission
    if (completionPercentage < 100) {
      const warningMsg = `Form is ${completionPercentage}% complete. Some fields are optional but recommended.`;
      toast.warning(warningMsg);
      addErrorToHistory(warningMsg, 'warning');
    }
    
    // Validate required fields only
    if (!validateForm()) {
      const errorMsg = 'Please fix the required field errors before submitting.';
      addErrorToHistory(errorMsg, 'validation');
      toast.error(errorMsg);
      return;
    }

    // Check network connectivity
    if (!navigator.onLine) {
      setNetworkError('No internet connection. Data will be saved offline.');
      addErrorToHistory('Offline mode detected', 'network');
    }

    setIsSubmitting(true);
    setIsLoading(true);
    setSubmitError(null);

    try {
      const extractedBrand = formData.brand || extractBrandFromModel(formData.model);
      
      const newDevice = {
        brand: extractedBrand,
        model: formData.model,
        serialNumber: formData.serialNumber || imeiOrSerial,
        unlockCode: formData.unlockCode,
        customerId: selectedCustomer?.id,
        expectedReturnDate: formData.expectedReturnDate,
        status: 'assigned' as DeviceStatus,
        issueDescription: formData.issueDescription,
        assignedTo: formData.assignedTo,
        deviceNotes: '', // Condition assessment disabled
        deviceCondition: null, // Condition assessment disabled
        deviceCost: formData.deviceCost ? parseFloat(formData.deviceCost) : null,
        repairCost: formData.repairCost ? parseFloat(formData.repairCost) : null,
        depositAmount: showDepositField && !formData.diagnosisRequired && formData.depositAmount ? parseFloat(formData.depositAmount) : null,
      };

      // Handle offline mode
      if (!navigator.onLine) {
        try {
          await saveActionOffline({ type: 'addDevice', payload: newDevice });
          setOfflineSuccess(true);
          setFormData(initialForm);
          setIsSubmitting(false);
          setIsLoading(false);
          setTimeout(() => setOfflineSuccess(false), 3000);
          toast.success('Device saved offline. Will sync when connection is restored.');
          addErrorToHistory('Device saved offline successfully', 'offline');
          return;
        } catch (offlineError) {
          handleOfflineError(offlineError);
          setIsSubmitting(false);
          setIsLoading(false);
          return;
        }
      }

      // Online submission
      const device = await addDevice(newDevice);
      
      if (device) {
        toast.success('Device intake created successfully!');
        setIsSubmitting(false);
        setIsLoading(false);
        navigate(`/device/${device.id}`);
      } else {
        throw new Error('Failed to create device intake. Please try again.');
      }
    } catch (error) {
      handleDeviceCreationError(error);
    }
  };

  // ... more handlers and helpers as needed ...

  // New condition assessment state
  const [showConditionAssessment, setShowConditionAssessment] = useState(false);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [otherConditionText, setOtherConditionText] = useState('');
  
  // QR Code print state
  const [showQRPrint, setShowQRPrint] = useState(false);
  const [submittedDevice, setSubmittedDevice] = useState<any>(null);

  // Add a step state to control which step is shown
  const [step, setStep] = useState<'form' | 'review'>('form');

  const MODEL_LOGOS_STORAGE_KEY = 'custom_model_logos';
  function getModelLogos() {
    const stored = localStorage.getItem(MODEL_LOGOS_STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    return {};
  }
  const [modelLogos, setModelLogos] = useState(getModelLogos());
  useEffect(() => {
    const handleStorage = () => setModelLogos(getModelLogos());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Draft-saving hook for device intake form - customer-specific
  const draftKey = selectedCustomer 
    ? `device_intake_form_draft_${selectedCustomer.id}` 
    : 'device_intake_form_draft_no_customer';
  
  const { clearDraft } = useDraftForm({
    key: draftKey,
    formData,
    setFormData,
    clearOnSubmit: true,
    submitted: isSubmitting && !isLoading,
  });

  // Clear form when customer changes
  useEffect(() => {
    if (selectedCustomer) {
      // Form will be auto-loaded from draft for this customer
      setSelectedConditions([]);
      setOtherConditionText('');
    } else {
      // Clear form when no customer is selected
      setFormData(initialForm);
      setSelectedConditions([]);
      setOtherConditionText('');
      clearDraft();
    }
  }, [selectedCustomer?.id]); // Only trigger when customer ID changes

  // Auto-save indicator state
  const [showAutoSave, setShowAutoSave] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Show auto-save indicator when form data changes
  useEffect(() => {
    if (Object.values(formData).some(val => val !== '')) {
      setShowAutoSave(true);
      const timer = setTimeout(() => {
        setShowAutoSave(false);
        setLastSaved(new Date());
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [formData]);

  // Calculate form completion percentage
  const getFormCompletion = () => {
    // Extract brand from model name if model is provided
    const hasBrand = formData.brand || (formData.model && formData.model.trim().length > 0);
    
    const requiredFields = [
      selectedCustomer ? 1 : 0,
      hasBrand ? 1 : 0,
      formData.model ? 1 : 0,
      imeiOrSerial ? 1 : 0,
      formData.assignedTo ? 1 : 0,
      formData.issueDescription ? 1 : 0,
      (selectedConditions.length > 0 || otherConditionText.trim()) ? 1 : 0
    ];
    return Math.round((requiredFields.reduce((a, b) => a + b, 0) / requiredFields.length) * 100);
  };

  const completionPercentage = getFormCompletion();

  const [customerCardMinimized, setCustomerCardMinimized] = useState(false);
  
  // Problem category state
  const [selectedProblemCategory, setSelectedProblemCategory] = useState('');
  
  // Handle problem category selection
  const handleProblemCategorySelect = (category: string) => {
    setSelectedProblemCategory(category);
    setFormData(prev => ({ ...prev, problemCategory: category }));
    
    // Auto-fill issue description with category information
    if (category) {
      const categoryDescriptions = {
        'general': 'General device issue',
        'power': 'Power/battery related problem',
        'display': 'Screen/display issue',
        'audio': 'Sound/audio problem',
        'camera': 'Camera functionality issue',
        'network': 'Network/connectivity problem',
        'hardware': 'Hardware component issue',
        'software': 'Software/OS related problem',
        'water': 'Water damage issue',
        'physical': 'Physical damage/crack'
      };
      
      setFormData(prev => ({
        ...prev,
        issueDescription: categoryDescriptions[category as keyof typeof categoryDescriptions] || 'Device problem'
      }));
    }
  };

  return (
    <div className="p-4 sm:p-6 h-full overflow-y-auto pt-8">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        <GlassCard className="p-6">
          <div className="space-y-6">
            {/* Customer Section */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User size={20} className="text-blue-600" />
                Customer Information
              </h3>
              
              {!selectedCustomer ? (
                <div className="space-y-4">
                  <label className={`block text-gray-700 mb-3 font-semibold ${fieldErrors.customer ? 'text-red-600' : ''}`}>
                    Search Customer *
                    {fieldErrors.customer && <span className="text-xs text-red-500 ml-2">(Required)</span>}
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={customerSearch}
                        onChange={e => {
                          setCustomerSearch(e.target.value);
                          setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        className="w-full py-3 pl-10 pr-4 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        placeholder="Type name or phone..."
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                      />
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      {showSuggestions && (
                        <div className="w-full bg-white/95 backdrop-blur-md border border-gray-300 rounded-lg shadow-xl mb-4">
                          {searchingCustomers ? (
                            <div className="p-4 text-center">
                              <div className="flex items-center justify-center gap-2 text-gray-600">
                                <RefreshCw className="animate-spin" size={16} />
                                <span>Searching customers...</span>
                              </div>
                            </div>
                          ) : filteredCustomers.length > 0 ? (
                            <div className="overflow-x-auto">
                              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                                <span className="text-sm text-gray-600">
                                  {filteredCustomers.length} customer(s) found
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setShowCreateCustomer(!showCreateCustomer)}
                                  className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
                                >
                                  <UserPlus size={14} />
                                  {showCreateCustomer ? 'Cancel' : 'Create New Customer'}
                                </button>
                              </div>
                              
                              {showCreateCustomer && (
                                <div className="p-4 bg-gray-50 border-b border-gray-200">
                                  <h4 className="font-semibold text-gray-900 mb-3">Create New Customer</h4>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                      <input
                                        type="text"
                                        value={newCustomerData.name}
                                        onChange={e => setNewCustomerData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full py-2 px-3 bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                        placeholder="Enter customer name"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                                      <input
                                        type="tel"
                                        value={newCustomerData.phone}
                                        onChange={e => setNewCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full py-2 px-3 bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                        placeholder="Enter phone number"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                      <input
                                        type="email"
                                        value={newCustomerData.email}
                                        onChange={e => setNewCustomerData(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full py-2 px-3 bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                        placeholder="Enter email (optional)"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                      <input
                                        type="text"
                                        value={newCustomerData.city}
                                        onChange={e => setNewCustomerData(prev => ({ ...prev, city: e.target.value }))}
                                        className="w-full py-2 px-3 bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                        placeholder="Enter city (optional)"
                                      />
                                    </div>
                                  </div>
                                  
                                  <div className="flex gap-4">
                                    <button
                                      type="button"
                                      onClick={handleCreateCustomer}
                                      disabled={creatingCustomer || !newCustomerData.name.trim() || !newCustomerData.phone.trim()}
                                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {creatingCustomer ? 'Creating...' : 'Create Customer'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setShowCreateCustomer(false)}
                                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                              
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b border-gray-200/50">
                                    <th className="text-left py-3 px-4 font-medium text-gray-700"> </th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Customer</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Contact</th>
                                    <th className="text-right py-3 px-4 font-medium text-gray-700">Points</th>
                                    <th className="text-center py-3 px-4 font-medium text-gray-700">Loyalty</th>
                                    <th className="text-center py-3 px-4 font-medium text-gray-700">Tag</th>
                                    <th className="text-center py-3 px-4 font-medium text-gray-700">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {filteredCustomers.map(c => (
                                    <tr
                                      key={c.id}
                                      className="border-b border-gray-200/30 hover:bg-white/30 transition-colors cursor-pointer"
                                      onClick={() => {
                                        setSelectedCustomer(c);
                                        setCardVisible(true);
                                        setCustomerSearch('');
                                        setShowSuggestions(false);
                                        // Form will be auto-loaded from draft for this customer
                                      }}
                                    >
                                      <td className="py-3 px-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                          {c.name.charAt(0)}
                                        </div>
                                      </td>
                                      <td className="py-3 px-4">
                                        <div>
                                          <p className="font-medium text-gray-900">{c.name}</p>
                                          <p className="text-sm text-gray-600">{c.city}</p>
                                        </div>
                                      </td>
                                      <td className="py-3 px-4">
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-1 text-sm">
                                            <Phone className="w-3 h-3 text-gray-500" />
                                            <span className="text-gray-900">{c.phone}</span>
                                          </div>
                                          {c.email && (
                                            <div className="flex items-center gap-1 text-sm">
                                              <Mail className="w-3 h-3 text-gray-500" />
                                              <span className="text-gray-600">{c.email}</span>
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-3 px-4 text-right">
                                        <span className="text-gray-900 font-semibold">{c.points}</span>
                                      </td>
                                      <td className="py-3 px-4 text-center">
                                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm border ${c.loyaltyLevel === 'platinum' ? 'bg-purple-500/20 text-purple-700 border-purple-300/30' : c.loyaltyLevel === 'gold' ? 'bg-amber-500/20 text-amber-700 border-amber-300/30' : c.loyaltyLevel === 'silver' ? 'bg-gray-400/20 text-gray-700 border-gray-300/30' : 'bg-orange-500/20 text-orange-700 border-orange-300/30'}`}>
                                          <Star size={14} />
                                          <span className="capitalize">{c.loyaltyLevel}</span>
                                        </div>
                                      </td>
                                      <td className="py-3 px-4 text-center">
                                                                              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm border ${c.colorTag === 'vip' ? 'bg-emerald-500/20 text-emerald-700 border-emerald-300/30' : c.colorTag === 'complainer' ? 'bg-rose-500/20 text-rose-700 border-rose-300/30' : c.colorTag === 'purchased' ? 'bg-blue-500/20 text-blue-700 border-blue-300/30' : c.colorTag === 'new' ? 'bg-purple-500/20 text-purple-700 border-purple-300/30' : 'bg-gray-500/20 text-gray-700 border-gray-300/30'}`}>
                                        {c.colorTag}
                                      </div>
                                      </td>
                                      <td className="py-3 px-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                          <button
                                            type="button"
                                            onClick={e => { e.stopPropagation(); }}
                                            className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                                            title="View Details"
                                          >
                                            <Eye size={16} />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={e => { e.stopPropagation(); }}
                                            className="p-1 text-gray-500 hover:text-green-600 transition-colors"
                                            title="Edit Customer"
                                          >
                                            <Edit size={16} />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={e => { e.stopPropagation(); }}
                                            className="p-1 text-gray-500 hover:text-purple-600 transition-colors"
                                            title="Send Message"
                                          >
                                            <MessageCircle size={16} />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="p-6">
                              <div className="text-center mb-4">
                                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No customers found</h3>
                                <p className="text-gray-600 mb-4">Try adjusting your search or create a new customer</p>
                              </div>
                              
                              {/* Inline Customer Creation Form */}
                              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="font-semibold text-gray-900">Create New Customer</h4>
                                  <button
                                    type="button"
                                    onClick={() => setShowCreateCustomer(!showCreateCustomer)}
                                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                                  >
                                    {showCreateCustomer ? 'Cancel' : 'Add Customer'}
                                  </button>
                                </div>
                                
                                {showCreateCustomer && (
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                        <input
                                          type="text"
                                          value={newCustomerData.name}
                                          onChange={e => setNewCustomerData(prev => ({ ...prev, name: e.target.value }))}
                                          className="w-full py-2 px-3 bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                          placeholder="Enter customer name"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                                        <input
                                          type="tel"
                                          value={newCustomerData.phone}
                                          onChange={e => setNewCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                                          className="w-full py-2 px-3 bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                          placeholder="Enter phone number"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input
                                          type="email"
                                          value={newCustomerData.email}
                                          onChange={e => setNewCustomerData(prev => ({ ...prev, email: e.target.value }))}
                                          className="w-full py-2 px-3 bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                          placeholder="Enter email (optional)"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                        <input
                                          type="text"
                                          value={newCustomerData.city}
                                          onChange={e => setNewCustomerData(prev => ({ ...prev, city: e.target.value }))}
                                          className="w-full py-2 px-3 bg-white border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                                          placeholder="Enter city (optional)"
                                        />
                                      </div>
                                    </div>
                                    
                                    <div className="flex gap-4">
                                      <button
                                        type="button"
                                        onClick={handleCreateCustomer}
                                        disabled={creatingCustomer || !newCustomerData.name.trim() || !newCustomerData.phone.trim()}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {creatingCustomer ? 'Creating...' : 'Create Customer'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setShowCreateCustomer(false)}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddCustomerModal(true);
                      }}
                      className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/30 backdrop-blur border border-gray-200 shadow-md hover:bg-white/50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                      aria-label="Add new customer"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="text-blue-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                      </svg>
                    </button>
                  </div>
                  {fieldErrors.customer && (
                    <div className="text-red-500 text-xs mt-2">
                      {errorMessages.customer || 'Please select or create a customer'}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-semibold">
                        {selectedCustomer.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{selectedCustomer.name}</h4>
                        <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCustomerCardMinimized(!customerCardMinimized)}
                        className="text-gray-500 hover:text-gray-700 p-1"
                        title={customerCardMinimized ? "Expand" : "Minimize"}
                      >
                        {customerCardMinimized ? (
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(null);
                          setFormData(initialForm);
                          setSelectedConditions([]);
                          setOtherConditionText('');
                          clearDraft();
                        }}
                        className="text-gray-500 hover:text-gray-700 text-sm"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                  
                  {!customerCardMinimized && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-green-200">
                      <div className="flex items-center gap-2">
                        <Star size={14} className="text-yellow-500" />
                        <div>
                          <p className="text-xs text-gray-500">Loyalty</p>
                          <p className="text-sm font-medium text-gray-900 capitalize">
                            {selectedCustomer.loyaltyLevel || 'Bronze'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <div>
                          <p className="text-xs text-gray-500">Points</p>
                          <p className="text-sm font-medium text-gray-900">
                            {selectedCustomer.points || 0}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <DollarSign size={14} className="text-green-500" />
                        <div>
                          <p className="text-xs text-gray-500">Total Spent</p>
                          <p className="text-sm font-medium text-gray-900">
                            {selectedCustomer.totalSpent ? `Tsh ${selectedCustomer.totalSpent.toLocaleString()}` : 'Tsh 0'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-purple-500" />
                        <div>
                          <p className="text-xs text-gray-500">Last Visit</p>
                          <p className="text-sm font-medium text-gray-900">
                            {selectedCustomer.lastVisit ? new Date(selectedCustomer.lastVisit).toLocaleDateString() : 'Never'}
                          </p>
                        </div>
                      </div>
                      
                      {selectedCustomer.city && (
                        <div className="flex items-center gap-2 md:col-span-2">
                          <MapPin size={14} className="text-red-500" />
                          <div>
                            <p className="text-xs text-gray-500">Location</p>
                            <p className="text-sm font-medium text-gray-900">{selectedCustomer.city}</p>
                          </div>
                        </div>
                      )}
                      
                      {selectedCustomer.colorTag && selectedCustomer.colorTag !== 'regular' && (
                        <div className="flex items-center gap-2 md:col-span-2">
                          <Tag size={14} className="text-orange-500" />
                          <div>
                            <p className="text-xs text-gray-500">Tag</p>
                            <p className="text-sm font-medium text-gray-900 capitalize">{selectedCustomer.colorTag}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* System Status Indicators */}
            <div className="mb-6 p-4 bg-white/50 backdrop-blur-sm border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Network Status */}
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${navigator.onLine ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm text-gray-700">
                      {navigator.onLine ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  
                  {/* Error Count */}
                  {errorHistory.length > 0 && (
                    <div className="flex items-center gap-2">
                      <AlertIcon size={16} className="text-red-500" />
                      <span className="text-sm text-gray-700">
                        {errorHistory.length} recent error{errorHistory.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Clear Errors Button */}
                {errorHistory.length > 0 && (
                  <button
                    onClick={clearAllErrors}
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Clear All Errors
                  </button>
                )}
              </div>
            </div>
            
            {/* Device Form Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Smartphone size={20} className="text-blue-600" />
                Device Information
              </h3>
              
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Model */}
                  <div>
                    <label className={`block mb-2 font-medium ${fieldErrors.model ? 'text-red-600' : 'text-gray-700'}`}>
                      Model *
                      {!formData.model && <span className="text-xs text-gray-400 ml-2">(Required)</span>}
                    </label>
                    <ModelSuggestionInput
                      value={formData.model}
                      onChange={val => setFormData(prev => ({ ...prev, model: val }))}
                      placeholder="Enter model or model number"
                      required
                      className={`w-full ${fieldErrors.model ? 'ring-2 ring-red-200' : !formData.model ? 'ring-2 ring-yellow-200' : ''}`}
                      modelLogos={modelLogos}

                    />
                    {fieldErrors.model && (
                      <div className="text-red-500 text-xs mt-1">
                        {errorMessages.model || 'Model is required'}
                      </div>
                    )}
                  </div>
                  {/* IMEI or Serial Number */}
                  <div>
                    <label className={`block mb-2 font-medium ${fieldErrors.imeiOrSerial ? 'text-red-600' : 'text-gray-700'}`}>
                      IMEI or Serial Number *
                      {!imeiOrSerial && <span className="text-xs text-gray-400 ml-2">(Required)</span>}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        className={`w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none ${fieldErrors.imeiOrSerial ? 'border-red-500 focus:border-red-600' : !imeiOrSerial ? 'border-yellow-300 focus:border-yellow-500' : 'border-gray-300 focus:border-blue-500'}`}
                        placeholder="Enter IMEI or Serial Number (min 12 digits)"
                        value={imeiOrSerial || ''}
                        onChange={e => {
                          const newValue = e.target.value.toUpperCase();
                          setImeiOrSerial(newValue);
                          setFormData(prev => ({ ...prev, serialNumber: newValue }));
                          
                          // Real-time validation feedback
                          if (newValue.length > 0) {
                            const validation = validateImeiOrSerial(newValue);
                            if (!validation.isValid) {
                              setFieldErrors(prev => ({ ...prev, imeiOrSerial: true }));
                            } else {
                              setFieldErrors(prev => ({ ...prev, imeiOrSerial: false }));
                            }
                          }
                        }}
                        onBlur={() => {
                          const validation = validateImeiOrSerial(imeiOrSerial);
                          if (!validation.isValid) {
                            setFieldErrors(prev => ({ ...prev, imeiOrSerial: true }));
                          } else {
                            setFieldErrors(prev => ({ ...prev, imeiOrSerial: false }));
                          }
                        }}
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                      />
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    </div>
                    {fieldErrors.imeiOrSerial && (
                      <div className="text-red-500 text-xs mt-1">
                        {errorMessages.imeiOrSerial || 'Please enter a valid IMEI or Serial Number'}
                      </div>
                    )}
                    {fieldErrors.imeiOrSerial && imeiOrSerial && (
                      <div className="text-xs text-gray-500 mt-1">
                        💡 Tip: Enter the actual IMEI or Serial Number from the device, not the model name
                        <br />
                        📱 Examples: 123456789012345 (IMEI) or G9566RL4YC (Serial)
                      </div>
                    )}
                  </div>
                  {/* Estimated Completion Section */}
                  <div className="relative">
                    <label className={`block mb-2 font-medium text-gray-700`}>Estimated Completion</label>
                    <div className="relative">
                      <button
                        type="button"
                        className="w-full py-3 pl-4 pr-10 bg-white border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none flex items-center"
                        onClick={() => setDropdownOpen((open) => !open)}
                        tabIndex={0}
                      >
                        <span className="flex items-center gap-2 w-full justify-start">
                          {optionIcons[completionOption as keyof typeof optionIcons]}
                          <span className="text-gray-800 whitespace-nowrap">{completionOptions.find(opt => opt.value === completionOption)?.label}</span>
                        </span>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                      </button>
                      {dropdownOpen && (
                        <div data-dropdown="completion" className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-4 grid grid-cols-2 gap-3">
                          {completionOptions.map(opt => (
                            <button
                              key={opt.value}
                              type="button"
                              className={`flex items-center gap-3 px-4 py-4 rounded-lg transition hover:bg-blue-50 w-full text-left text-base ${completionOption === opt.value ? 'bg-blue-100' : ''}`}
                              onClick={() => handleDropdownSelect(opt.value)}
                            >
                              {optionIcons[opt.value as keyof typeof optionIcons]}
                              <span>{opt.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {completionOption === 'custom' && (
                      <div className="relative mt-2">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <input
                          type="date"
                          name="expectedReturnDate"
                          value={formData.expectedReturnDate}
                          onChange={handleInputChange}
                          className={`w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none ${fieldErrors.expectedReturnDate ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-blue-500'}`}
                          required
                          autoComplete="off"
                          autoCorrect="off"
                          spellCheck={false}
                        />
                      </div>
                    )}
                    {fieldErrors.expectedReturnDate && (
                      <div className="text-red-500 text-xs mt-1">
                        {errorMessages.expectedReturnDate || 'Please select a valid return date'}
                      </div>
                    )}
                  </div>
                  {/* Unlock Code/Password */}
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Unlock Code / Password</label>
                    <div className="relative">
                      <input
                        type="text"
                        name="unlockCode"
                        value={formData.unlockCode}
                        onChange={handleInputChange}
                        className="w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        placeholder="Enter unlock code or password (optional)"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                      />
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    </div>
                  </div>
                  {/* Device Cost */}
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Device Value (TSH)</label>
                    <div className="relative">
                      <input
                        type="number"
                        name="deviceCost"
                        value={formData.deviceCost}
                        onChange={handleInputChange}
                        className={`w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none ${fieldErrors.deviceCost ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-blue-500'}`}
                        placeholder="Current market value of device"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                      />
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Estimated current market value of the device</p>
                    {fieldErrors.deviceCost && (
                      <div className="text-red-500 text-xs mt-1">
                        {errorMessages.deviceCost || 'Device cost must be a valid positive number'}
                      </div>
                    )}
                  </div>
                  
                  {/* Repair Cost */}
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Estimated Repair Cost (TSH)</label>
                    <div className="relative">
                      <input
                        type="number"
                        name="repairCost"
                        value={formData.repairCost}
                        onChange={handleInputChange}
                        className={`w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none ${fieldErrors.repairCost ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-blue-500'}`}
                        placeholder="Estimated cost to repair the device"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                      />
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Cost for parts and labor to fix the device</p>
                    {fieldErrors.repairCost && (
                      <div className="text-red-500 text-xs mt-1">
                        {errorMessages.repairCost || 'Repair cost must be a valid positive number'}
                      </div>
                    )}
                  </div>
                  {/* Technician Assignment */}
                  <div>
                    <label className={`block mb-2 font-medium ${fieldErrors.assignedTo ? 'text-red-600' : 'text-gray-700'}`}>Assign Technician *</label>
                    {technicians.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {technicians.map(tech => {
                        const initials = (tech.name || tech.email || '').split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase();
                        const selected = formData.assignedTo === tech.id;
                        return (
                          <button
                            key={tech.id}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, assignedTo: tech.id }))}
                            className={`relative flex flex-col items-center justify-center p-5 border rounded-xl shadow-md transition-all duration-200 focus:outline-none
                              ${selected ? 'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-500 ring-2 ring-blue-400 scale-105' : 'bg-white border-gray-200 hover:shadow-lg hover:scale-105'}
                            `}
                          >
                            {/* Avatar */}
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mb-2 transition-all duration-200
                              ${selected ? 'bg-blue-500 text-white shadow' : 'bg-gray-200 text-gray-700'}`}
                            >
                              {initials}
                            </div>
                            {/* Name */}
                            <span className="font-semibold text-base mb-1 text-gray-900 text-center">{tech.name || tech.email}</span>
                            {/* Checkmark for selected */}
                            {selected && (
                              <span className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1 shadow">
                                <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              </span>
                            )}
                          </button>
                        );
                      })}
                      </div>
                    ) : (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2 text-yellow-800">
                          <AlertIcon size={20} />
                          <div>
                            <p className="font-medium">No technicians available</p>
                            <p className="text-sm text-yellow-700">Please add technicians to the system first, or contact your administrator.</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {fieldErrors.assignedTo && <div className="text-red-500 text-xs mt-1">{errorMessages.assignedTo || 'Please select a technician'}</div>}
                  </div>
                  {/* Deposit Field Toggle */}
                  {/* Arrange toggles vertically as a list */}
                  <div className="space-y-4">
                    {/* Deposit Toggle */}
                    <div className="relative flex items-center" style={{ minHeight: '2.5rem' }}>
                      <label
                        className="text-gray-700 font-medium cursor-pointer flex-1 z-10 relative px-4 bg-transparent"
                        onClick={() => setShowDepositField(!showDepositField)}
                      >
                        Request Deposit
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowDepositField(!showDepositField)}
                        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${showDepositField ? 'bg-blue-600' : 'bg-gray-200'}`}
                        style={{ zIndex: 0 }}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showDepositField ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                      </button>
                    </div>
                    {/* Diagnosis Toggle */}
                    <div className="relative flex items-center" style={{ minHeight: '2.5rem' }}>
                      <label
                        className="text-gray-700 font-medium cursor-pointer flex-1 z-10 relative px-4 bg-transparent"
                        onClick={() => setFormData(prev => ({ ...prev, diagnosisRequired: !prev.diagnosisRequired }))}
                      >
                        Diagnosis Required
                      </label>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, diagnosisRequired: !prev.diagnosisRequired }))}
                        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${formData.diagnosisRequired ? 'bg-blue-600' : 'bg-gray-200'}`}
                        style={{ zIndex: 0 }}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.diagnosisRequired ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                      </button>
                    </div>
                  </div>
                  {/* Deposit Amount Field */}
                  {showDepositField && !formData.diagnosisRequired && (
                    <div className="md:col-span-2">
                      <div className="relative">
                        <input
                          type="number"
                          name="depositAmount"
                          value={formData.depositAmount}
                          onChange={handleInputChange}
                          className={`w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none ${fieldErrors.depositAmount ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-blue-500'}`}
                          placeholder="Enter deposit amount"
                          autoComplete="off"
                          autoCorrect="off"
                          spellCheck={false}
                        />
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      </div>
                      {fieldErrors.depositAmount && (
                        <div className="text-red-500 text-xs mt-1">
                          {errorMessages.depositAmount || 'Deposit amount must be a valid positive number'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Device Notes */}
                <div className="md:col-span-2">
                  <label className="block text-gray-700 mb-2 font-medium">Device Notes (Optional)</label>
                  <div className="relative">
                    <textarea
                      name="deviceNotes"
                      value={formData.deviceNotes}
                      onChange={handleInputChange}
                      className="w-full py-3 pl-4 pr-4 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                      placeholder="Add any additional notes about the device..."
                      rows={2}
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                    />
                  </div>
                </div>
                
                {/* Problem Category */}
                <div>
                  <label className={`block mb-2 font-medium ${fieldErrors.problemCategory ? 'text-red-600' : 'text-gray-700'}`}>
                    Problem Category
                  </label>
                  <select
                    name="problemCategory"
                    value={selectedProblemCategory}
                    onChange={(e) => handleProblemCategorySelect(e.target.value)}
                    className="w-full py-3 pl-4 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none border-gray-300 focus:border-blue-500"
                  >
                    <option value="">Select problem category (optional)</option>
                    <option value="general">General device issue</option>
                    <option value="power">Power/battery problem</option>
                    <option value="display">Screen/display issue</option>
                    <option value="audio">Sound/audio problem</option>
                    <option value="camera">Camera functionality issue</option>
                    <option value="network">Network/connectivity problem</option>
                    <option value="hardware">Hardware component issue</option>
                    <option value="software">Software/OS related problem</option>
                    <option value="water">Water damage issue</option>
                    <option value="physical">Physical damage/crack</option>
                  </select>
                </div>
                
                {/* Issue Description */}
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className={`block font-medium ${fieldErrors.issueDescription ? 'text-red-600' : 'text-gray-700'}`}>Issue Description *</label>
                    <div className="flex items-center gap-2">
                      {/* AI Analysis Toggle */}
                      <label className="flex items-center gap-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={aiAnalysisEnabled}
                          onChange={(e) => setAiAnalysisEnabled(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <Brain size={16} className="text-purple-500" />
                        AI Analysis
                      </label>
                    </div>
                  </div>
                  <textarea
                    name="issueDescription"
                    value={formData.issueDescription}
                    onChange={e => {
                      handleInputChange(e);
                      setIssueDescriptionTouched(true);
                    }}
                    onBlur={() => setIssueDescriptionTouched(true)}
                    className={`w-full py-3 pl-4 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none resize-none ${fieldErrors.issueDescription ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-blue-500'}`}
                    placeholder="Describe the issue in detail (at least 5 words)"
                    rows={3}
                    required
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                  {/* Validation message */}
                  {fieldErrors.issueDescription && (
                    <div className="text-red-500 text-xs mt-1">
                      {errorMessages.issueDescription || 'Please enter at least 5 words in the Issue Description.'}
                    </div>
                  )}
                  
                  {/* AI Analysis Status */}
                  {aiAnalysisEnabled && formData.issueDescription.length > 0 && (
                    <div className="mt-3">
                      {aiAnalysis.isAnalyzing ? (
                        <div className="flex items-center gap-2 text-blue-600 text-sm">
                          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                          <span>{labels.aiAnalyzing}</span>
                        </div>
                      ) : aiAnalysis.problem ? (
                        <div className="flex items-center gap-2 text-green-600 text-sm">
                          <Sparkles size={16} />
                          <span>{labels.analysisAvailable}</span>
                          <button
                            type="button"
                            onClick={() => setShowAiAnalysis(true)}
                            className="text-blue-600 hover:text-blue-700 underline text-sm"
                          >
                            {labels.viewAnalysis}
                          </button>
                        </div>
                      ) : aiAnalysis.error ? (
                        <div className="flex items-center gap-2 text-red-600 text-sm">
                          <AlertIcon size={16} />
                          <span>{labels.analysisFailed}</span>
                          <button
                            type="button"
                            onClick={analyzeDeviceProblem}
                            className="text-blue-600 hover:text-blue-700 underline text-sm"
                          >
                            {labels.retry}
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-600 text-sm">
                          <Search size={16} />
                          <span>{labels.willAnalyze}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* Device Condition Checklist - DISABLED */}
                {/* 
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2 font-medium">Device Condition Assessment</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all flex items-center gap-2 ${
                        selectedConditions.length > 0 || otherConditionText.trim() 
                          ? 'bg-blue-500 text-white border-blue-500' 
                          : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-blue-50'
                      }`}
                      onClick={() => setShowConditionAssessment(true)}
                    >
                      <AlertIcon size={16} />
                      {selectedConditions.length > 0 || otherConditionText.trim() 
                        ? `${selectedConditions.length + (otherConditionText.trim() ? 1 : 0)} issue(s) selected`
                        : 'Select Issues'
                      }
                    </button>
                    
                    {/* Show selected conditions as chips */}
                    {/* {selectedConditions.map((condition, idx) => (
                      <span key={condition + idx} className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold flex items-center gap-1">
                        {condition}
                      </span>
                    ))}
                    {otherConditionText && (
                      <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold flex items-center gap-1">
                        {otherConditionText}
                      </span>
                    )}
                  </div>
                  {fieldErrors.conditionAssessment && (
                    <div className="text-red-500 text-xs mt-2">{errorMessages.conditionAssessment || 'Please select at least one condition in the assessment.'}</div>
                  )}
                </div>
                */}

                {/* Error Display */}
                {submitError && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertIcon className="text-red-500 mt-0.5 flex-shrink-0" size={20} />
                      <div className="flex-1">
                        <h4 className="text-red-800 font-medium mb-1">Submission Error</h4>
                        <p className="text-red-700 text-sm mb-3">{submitError}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={retryDeviceCreation}
                            disabled={isRetrying || retryCount >= 3}
                            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            {isRetrying ? (
                              <>
                                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                                Retrying...
                              </>
                            ) : (
                              <>
                                <RefreshCw size={14} />
                                Retry ({retryCount}/3)
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => setSubmitError(null)}
                            className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300"
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Validation Errors Summary */}
                {Object.keys(fieldErrors).length > 0 && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertIcon className="text-yellow-600 mt-0.5 flex-shrink-0" size={20} />
                      <div className="flex-1">
                        <h4 className="text-yellow-800 font-medium mb-2">Please fix the following errors:</h4>
                        <ul className="text-yellow-700 text-sm space-y-1">
                          {Object.entries(fieldErrors).map(([field, hasError]) => 
                            hasError && errorMessages[field] && (
                              <li key={field} className="flex items-center gap-2">
                                <span className="w-1 h-1 bg-yellow-600 rounded-full"></span>
                                {errorMessages[field]}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end gap-2 mt-6">
                  <button
                    type="button"
                    className="px-6 py-3 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition"
                    onClick={() => navigate(-1)}
                    disabled={isLoading || isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                      completionPercentage === 100 
                        ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg' 
                        : completionPercentage >= 70
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                        : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    }`}
                    onClick={submitDeviceForm}
                    disabled={isLoading || isSubmitting || completionPercentage < 70}
                  >
                    {isLoading || isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Submitting...
                      </div>
                    ) : completionPercentage === 100 ? (
                      <div className="flex items-center gap-2">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Submit Device Intake
                      </div>
                    ) : completionPercentage >= 70 ? (
                      <div className="flex items-center gap-2">
                        <span>Almost Ready ({completionPercentage}%)</span>
                        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>Complete Form ({completionPercentage}%)</span>
                      </div>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </GlassCard>
      </div>
      {/* Device Condition Assessment Modal - DISABLED */}
      {false && showConditionAssessment && (
        <Modal
          isOpen={showConditionAssessment}
          onClose={() => setShowConditionAssessment(false)}
          title="Device Condition Assessment"
        >
          <ConditionAssessment
            isOpen={showConditionAssessment}
            onClose={() => setShowConditionAssessment(false)}
            selectedConditions={selectedConditions}
            onConditionsChange={setSelectedConditions}
            otherText={otherConditionText}
            onOtherTextChange={setOtherConditionText}
          />
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              className="px-6 py-3 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition"
              onClick={() => setShowConditionAssessment(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
              onClick={() => {
                setSelectedConditions(selectedConditions.filter(c => c !== 'other'));
                setOtherConditionText('');
                setShowConditionAssessment(false);
              }}
            >
              Clear All
            </button>
            <button
              type="button"
              className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
              onClick={() => {
                setSelectedConditions(selectedConditions.filter(c => c !== 'other'));
                setOtherConditionText('');
                setShowConditionAssessment(false);
              }}
            >
              Done
            </button>
          </div>
        </Modal>
      )}
      {showQRPrint && submittedDevice && (
        <Modal
          isOpen={showQRPrint}
          onClose={() => setShowQRPrint(false)}
          title="Print QR Code"
        >
          <div ref={qrPrintRef} className="print-area">
            <DeviceQRCodePrint
              isOpen={showQRPrint}
              onClose={() => setShowQRPrint(false)}
              device={submittedDevice}
            />
          </div>
          <div className="flex justify-end gap-2 mt-4 no-print">
            <button
              type="button"
              className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
              onClick={() => {
                if (qrPrintRef.current) {
                  const printContents = qrPrintRef.current.innerHTML;
                  const printWindow = window.open('', '', 'height=600,width=400');
                  if (printWindow) {
                    printWindow.document.write('<html><head><title>Print QR Code</title>');
                    printWindow.document.write('<style>@media print { body { margin: 0; } }</style>');
                    printWindow.document.write('</head><body >');
                    printWindow.document.write(printContents);
                    printWindow.document.write('</body></html>');
                    printWindow.document.close();
                    printWindow.focus();
                    setTimeout(() => {
                      printWindow.print();
                      printWindow.close();
                    }, 300);
                  }
                }
              }}
            >
              Print
            </button>
            <button
              type="button"
              className="px-6 py-3 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition"
              onClick={() => setShowQRPrint(false)}
            >
              Close
            </button>
          </div>
        </Modal>
      )}
      {showAddCustomerModal && (
        <AddCustomerModal
          isOpen={showAddCustomerModal}
          onClose={() => setShowAddCustomerModal(false)}
          onCustomerCreated={(customer: any) => {
            setSelectedCustomer(customer);
            setShowAddCustomerModal(false);
            setCustomerSearch('');
            setShowSuggestions(false);
            // Clear form for new customer - will be auto-loaded from draft if exists
            setFormData(initialForm);
            setSelectedConditions([]);
            setOtherConditionText('');
          }}
        />
      )}
      {/* AI Analysis Modal */}
      {showAiAnalysis && (
        <Modal
          isOpen={showAiAnalysis}
          onClose={() => setShowAiAnalysis(false)}
          title={labels.modalTitle}
          size="lg"
        >
          <div className="space-y-6">
            {/* Language Toggle Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 text-blue-600">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700">Analysis Language:</span>
              </div>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={async () => {
                    if (aiLanguage !== 'swahili' && !isLanguageSwitching) {
                      setIsLanguageSwitching(true);
                      setAiLanguage('swahili');
                      // Auto re-analyze if we have existing analysis
                      if (aiAnalysis.problem) {
                        toast.success('Switching to Swahili and re-analyzing...');
                        await analyzeDeviceProblem();
                      }
                      setIsLanguageSwitching(false);
                    }
                  }}
                  disabled={isLanguageSwitching}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    aiLanguage === 'swahili'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  } ${isLanguageSwitching ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLanguageSwitching && aiLanguage === 'swahili' ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Switching...
                    </div>
                  ) : (
                    '🇹🇿 Swahili'
                  )}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (aiLanguage !== 'english' && !isLanguageSwitching) {
                      setIsLanguageSwitching(true);
                      setAiLanguage('english');
                      // Auto re-analyze if we have existing analysis
                      if (aiAnalysis.problem) {
                        toast.success('Switching to English and re-analyzing...');
                        await analyzeDeviceProblem();
                      }
                      setIsLanguageSwitching(false);
                    }
                  }}
                  disabled={isLanguageSwitching}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    aiLanguage === 'english'
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                  } ${isLanguageSwitching ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLanguageSwitching && aiLanguage === 'english' ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Switching...
                    </div>
                  ) : (
                    '🇬🇧 English'
                  )}
                </button>
              </div>
            </div>
            {/* Error State */}
            {aiAnalysis.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                  <AlertIcon size={20} />
                  {labels.serviceError}
                </h4>
                <p className="text-red-800 mb-3">{aiAnalysis.error}</p>
                {aiAnalysis.error.includes('not configured') && (
                  <div className="bg-white border border-red-200 rounded-lg p-3">
                    <h5 className="font-medium text-red-900 mb-2">{labels.setupInstructions}</h5>
                    <ol className="text-sm text-red-700 space-y-1">
                      <li>{labels.goToSettings}</li>
                      <li>{labels.findGemini}</li>
                      <li>{labels.addApiKey}</li>
                      <li>{labels.enableIntegration}</li>
                      <li>{labels.testConnection}</li>
                    </ol>
                    <div className="mt-3 text-xs text-red-600">
                      {labels.getApiKey} <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Problem Summary */}
            {!aiAnalysis.error && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <AlertIcon size={20} />
                  {labels.problemAnalysis}
                </h4>
                <p className="text-blue-800">{aiAnalysis.problem}</p>
              </div>
            )}

            {/* Solutions */}
            {!aiAnalysis.error && aiAnalysis.solutions.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Lightbulb size={20} className="text-yellow-500" />
                  {labels.solutions}
                </h4>
                <div className="space-y-3">
                  {aiAnalysis.solutions.map((solution, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5">
                          {index + 1}
                        </div>
                        <p className="text-gray-800">{solution}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Repair Details */}
            {!aiAnalysis.error && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Estimated Cost */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h5 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <DollarSign size={16} />
                    {labels.estimatedCost}
                  </h5>
                  <p className="text-green-800 font-medium">{aiAnalysis.estimatedCost}</p>
                </div>

                {/* Difficulty */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h5 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                    <Zap size={16} />
                    {labels.difficulty}
                  </h5>
                  <p className="text-orange-800 font-medium capitalize">{aiAnalysis.difficulty}</p>
                </div>

                {/* Time Estimate */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h5 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                    <Clock size={16} />
                    {labels.timeEstimate}
                  </h5>
                  <p className="text-purple-800 font-medium">{aiAnalysis.timeEstimate}</p>
                </div>

                {/* Parts Needed */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <Package size={16} />
                    {labels.partsNeeded}
                  </h5>
                  {aiAnalysis.partsNeeded.length > 0 ? (
                    <ul className="space-y-1">
                      {aiAnalysis.partsNeeded.map((part, index) => (
                        <li key={index} className="text-gray-700 text-sm flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          {part}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600 text-sm">{labels.noParts}</p>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={analyzeDeviceProblem}
                disabled={aiAnalysis.isAnalyzing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {aiAnalysis.isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {labels.analyzing}
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    {aiAnalysis.error ? labels.retryAnalysis : labels.reAnalyze}
                  </>
                )}
              </button>
              
              <div className="flex gap-2">
                {!aiAnalysis.error && (
                  <button
                    type="button"
                    onClick={() => {
                      // Apply AI suggestions to form
                      if (aiAnalysis.estimatedCost && !formData.repairCost) {
                        const costMatch = aiAnalysis.estimatedCost.match(/Tsh\s*(\d+(?:,\d+)*(?:\.\d{2})?)/);
                        if (costMatch) {
                          setFormData(prev => ({ ...prev, repairCost: costMatch[1].replace(/,/g, '') }));
                        }
                      }
                      setShowAiAnalysis(false);
                      toast.success(labels.suggestionsApplied);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {labels.applySuggestions}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowAiAnalysis(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  {labels.close}
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {showNoteModal && (
        <Modal
          isOpen={showNoteModal}
          onClose={() => setShowNoteModal(false)}
          title="Add Note"
        >
          <textarea
            className="w-full py-3 pl-4 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none resize-none"
            placeholder="Add a note (optional)"
            value={note}
            onChange={e => setNote(e.target.value)}
          />
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              className="px-6 py-3 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition"
              onClick={() => setShowNoteModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
              onClick={() => {
                setShowNoteModal(false);
                setNote('');
              }}
            >
              Save Note
            </button>
          </div>
        </Modal>
      )}

      {/* Enhanced Error Display Components */}
      {criticalError && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg text-center text-base font-semibold animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertIcon size={20} />
            <span>{criticalError}</span>
          </div>
          <button 
            onClick={() => setCriticalError(null)}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}
      
      {networkError && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-orange-600 text-white px-6 py-3 rounded-lg shadow-lg text-center text-base font-semibold animate-fade-in">
          <div className="flex items-center gap-2">
            <WifiOff size={20} />
            <span>{networkError}</span>
          </div>
          <button 
            onClick={() => setNetworkError(null)}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}
      
      {apiErrors && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg text-center text-base font-semibold animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertIcon size={20} />
            <span>{apiErrors}</span>
          </div>
          <button 
            onClick={() => setApiErrors(null)}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}
      
      {offlineErrors && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-600 text-white px-6 py-3 rounded-lg shadow-lg text-center text-base font-semibold animate-fade-in">
          <div className="flex items-center gap-2">
            <Package size={20} />
            <span>{offlineErrors}</span>
          </div>
          <button 
            onClick={() => setOfflineErrors(null)}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}
      
      {Object.keys(validationErrors).length > 0 && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in">
          <div className="text-sm font-semibold mb-2">Validation Errors:</div>
          <div className="space-y-1">
            {Object.entries(validationErrors).map(([field, message]) => (
              <div key={field} className="text-xs">
                <strong>{field}:</strong> {message}
              </div>
            ))}
          </div>
          <button 
            onClick={() => setValidationErrors({})}
            className="mt-2 text-xs underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}
      
      {offlineSuccess && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg text-center text-base font-semibold animate-fade-in">
          Device saved offline! Will sync when you are back online.
        </div>
      )}
    </div>
  );
};

export { DeviceIntakeUnifiedPage as NewDevicePage };
export default DeviceIntakeUnifiedPage;