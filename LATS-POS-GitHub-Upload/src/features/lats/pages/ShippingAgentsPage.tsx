import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { BackButton } from '../../../features/shared/components/ui/BackButton';
import LATSBreadcrumb from '../components/ui/LATSBreadcrumb';
import { 
  Plus, Search, Edit, Trash2, User, Mail, Phone, Building, 
  CheckCircle, XCircle, Filter, MoreVertical, ArrowLeft, Truck, 
  MapPin, Package, Star, MessageCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getLatsProvider } from '../lib/data/provider';

interface Contact {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  role: 'manager' | 'sales' | 'support' | 'operations' | 'other';
  isPrimary: boolean;
}

interface OfficeLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  phone?: string;
  officeType: 'office' | 'warehouse' | 'branch' | 'headquarters';
  isMainOffice: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface ShippingAgent {
  id: string;
  name: string;
  phone?: string;
  company?: string;
  isActive: boolean;
  managerId?: string;
  createdAt: string;
  // Shipping capabilities
  supportedShippingTypes: string[]; // ['air', 'sea', 'local']
  // Contact and business info
  address?: string;
  city?: string;
  country?: string;
  website?: string;
  // Contacts
  contacts: Contact[];
  // Office locations
  offices: OfficeLocation[];
  // Service details
  serviceAreas: string[]; // ['domestic', 'international', 'regional']
  specializations: string[]; // ['electronics', 'fragile', 'bulk', 'express']
  // Pricing and terms
  pricePerCBM?: number;
  pricePerKg?: number;
  averageDeliveryTime?: string;
  // Additional info
  notes?: string;
  rating?: number;
  totalShipments?: number;
}

interface ShippingManager {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  isActive: boolean;
}

interface ContactFormData {
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  role: 'manager' | 'sales' | 'support' | 'operations' | 'other';
  isPrimary: boolean;
}

interface OfficeFormData {
  name: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  officeType: 'office' | 'warehouse' | 'branch' | 'headquarters';
  isMainOffice: boolean;
}

interface AgentFormData {
  name: string;
  company: string;
  isActive: boolean;
  // Contact information
  phone: string;
  whatsapp: string;
  // Shipping capabilities
  supportedShippingTypes: string[];
  // Business info
  address: string;
  city: string;
  country: string;
  // Contacts
  contacts: ContactFormData[];
  // Office locations
  offices: OfficeFormData[];
  // Service details
  serviceAreas: string[];
  specializations: string[];
  // Pricing and terms
  pricePerCBM: string;
  pricePerKg: string;
  averageDeliveryTime: string;
  // Additional info
  notes: string;
}

const ShippingAgentsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const dataProvider = getLatsProvider();

  // State management
  const [agents, setAgents] = useState<ShippingAgent[]>([]);
  const [managers, setManagers] = useState<ShippingManager[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState<ShippingAgent | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  
  // Error handling state
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<AgentFormData>({
    name: '',
    company: '',
    isActive: true,
    phone: '',
    whatsapp: '',
    supportedShippingTypes: [],
    address: '',
    city: '',
    country: 'Tanzania',
    contacts: [],
    offices: [],
    serviceAreas: [],
    specializations: [],
    pricePerCBM: '',
    pricePerKg: '',
    averageDeliveryTime: '',
    notes: ''
  });

  // Load data from database
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setSubmitError(null);
      
      // Load shipping agents
      const agentsResponse = await dataProvider.getShippingAgents();
      if (agentsResponse.ok) {
        setAgents(agentsResponse.data || []);
      } else {
        console.error('Failed to load shipping agents:', agentsResponse.message);
        toast.error('Failed to load shipping agents');
        setSubmitError('Failed to load shipping agents');
      }

      // Load shipping managers (optional)
      const managersResponse = await dataProvider.getShippingManagers();
      if (managersResponse.ok) {
        setManagers(managersResponse.data || []);
      } else {
        console.log('No shipping managers available:', managersResponse.message);
        setManagers([]); // Set empty array if no managers
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
      setSubmitError('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  // Form validation functions
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Required fields validation
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    if (!formData.company.trim()) {
      errors.company = 'Company name is required';
    }

    // Contact information validation
    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[\+]?[0-9\s\-\(\)]{10,}$/.test(formData.phone.trim())) {
      errors.phone = 'Please enter a valid phone number';
    }

    if (formData.whatsapp.trim() && !/^[\+]?[0-9\s\-\(\)]{10,}$/.test(formData.whatsapp.trim())) {
      errors.whatsapp = 'Please enter a valid WhatsApp number';
    }

    // Shipping types validation
    if (formData.supportedShippingTypes.length === 0) {
      errors.supportedShippingTypes = 'Please select at least one shipping type';
    }

    // Pricing validation (only validate if values are provided)
    if (formData.pricePerCBM && formData.pricePerCBM.trim()) {
      const pricePerCBM = parseFloat(formData.pricePerCBM);
      if (isNaN(pricePerCBM) || pricePerCBM < 0) {
        errors.pricePerCBM = 'Price per CBM must be a valid positive number';
      }
    }

    if (formData.pricePerKg && formData.pricePerKg.trim()) {
      const pricePerKg = parseFloat(formData.pricePerKg);
      if (isNaN(pricePerKg) || pricePerKg < 0) {
        errors.pricePerKg = 'Price per kg must be a valid positive number';
      }
    }

    // Contact validation - make it optional for basic agent creation
    if (formData.contacts.length > 0) {
      formData.contacts.forEach((contact, index) => {
        if (!contact.name.trim()) {
          errors[`contact_${index}_name`] = 'Contact name is required';
        }
        if (!contact.phone.trim()) {
          errors[`contact_${index}_phone`] = 'Contact phone is required';
        }
        if (contact.phone && !/^[\+]?[0-9\s\-\(\)]{10,}$/.test(contact.phone.trim())) {
          errors[`contact_${index}_phone`] = 'Please enter a valid phone number';
        }
        if (contact.whatsapp && !/^[\+]?[0-9\s\-\(\)]{10,}$/.test(contact.whatsapp.trim())) {
          errors[`contact_${index}_whatsapp`] = 'Please enter a valid WhatsApp number';
        }
        if (contact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) {
          errors[`contact_${index}_email`] = 'Please enter a valid email address';
        }
      });
    }

    // Office validation - make it optional for basic agent creation
    if (formData.offices.length > 0) {
      formData.offices.forEach((office, index) => {
        if (!office.name.trim()) {
          errors[`office_${index}_name`] = 'Office name is required';
        }
        if (!office.address.trim()) {
          errors[`office_${index}_address`] = 'Office address is required';
        }
        if (!office.city.trim()) {
          errors[`office_${index}_city`] = 'Office city is required';
        }
        if (!office.country.trim()) {
          errors[`office_${index}_country`] = 'Office country is required';
        }
        if (office.phone && !/^[\+]?[0-9\s\-\(\)]{10,}$/.test(office.phone.trim())) {
          errors[`office_${index}_phone`] = 'Please enter a valid phone number';
        }
      });
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const clearFormErrors = () => {
    setFormErrors({});
    setSubmitError(null);
  };

  // Filter agents based on search and status
  const filteredAgents = agents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.company?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && agent.isActive) ||
                         (statusFilter === 'inactive' && !agent.isActive);
    
    return matchesSearch && matchesStatus;
  });

  // Form handlers
  const handleInputChange = (field: keyof AgentFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleArrayChange = (field: 'supportedShippingTypes' | 'serviceAreas' | 'specializations', value: string) => {
    setFormData(prev => {
      const currentArray = prev[field] || [];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      return { ...prev, [field]: newArray };
    });
    // Clear error for this field when user makes changes
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const addOffice = () => {
    setFormData(prev => ({
      ...prev,
      offices: [...prev.offices, {
        name: '',
        address: '',
        city: '',
        country: '',
        phone: '',
        officeType: 'office',
        isMainOffice: prev.offices.length === 0 // First office is main by default
      }]
    }));
  };

  const removeOffice = (index: number) => {
    setFormData(prev => ({
      ...prev,
      offices: prev.offices.filter((_, i) => i !== index)
    }));
  };

  const updateOffice = (index: number, field: keyof OfficeFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      offices: prev.offices.map((office, i) => 
        i === index ? { ...office, [field]: value } : office
      )
    }));
    // Clear error for this office field when user makes changes
    const errorKey = `office_${index}_${field}`;
    if (formErrors[errorKey]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
    // Also clear general offices error if user adds an office
    if (formErrors.offices && field === 'name' && value) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.offices;
        return newErrors;
      });
    }
  };

  const setMainOffice = (index: number) => {
    setFormData(prev => ({
      ...prev,
      offices: prev.offices.map((office, i) => ({
        ...office,
        isMainOffice: i === index
      }))
    }));
  };

  // Contact management functions
  const addContact = () => {
    setFormData(prev => ({
      ...prev,
      contacts: [...prev.contacts, {
        name: '',
        phone: '',
        whatsapp: '',
        email: '',
        role: 'other',
        isPrimary: prev.contacts.length === 0 // First contact is primary by default
      }]
    }));
  };

  const removeContact = (index: number) => {
    setFormData(prev => ({
      ...prev,
      contacts: prev.contacts.filter((_, i) => i !== index)
    }));
  };

  const updateContact = (index: number, field: keyof ContactFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      contacts: prev.contacts.map((contact, i) => 
        i === index ? { ...contact, [field]: value } : contact
      )
    }));
  };

  const setPrimaryContact = (index: number) => {
    setFormData(prev => ({
      ...prev,
      contacts: prev.contacts.map((contact, i) => ({
        ...contact,
        isPrimary: i === index
      }))
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      company: '',
      isActive: true,
      phone: '',
      whatsapp: '',
      supportedShippingTypes: [],
      address: '',
      city: '',
      country: 'Tanzania',
      contacts: [],
      offices: [],
      serviceAreas: [],
      specializations: [],
      pricePerCBM: '',
      pricePerKg: '',
      averageDeliveryTime: '',
      notes: ''
    });
    clearFormErrors();
    setShowAddForm(false);
    setEditingAgent(null);
  };

  const handleSubmit = async () => {
    try {
      // Clear previous errors
      clearFormErrors();
      
      // Validate form
      if (!validateForm()) {
        console.log('Form validation failed. Current form data:', formData);
        console.log('Form validation failed. Errors:', formErrors);
        const errorCount = Object.keys(formErrors).length;
        const errorFields = Object.keys(formErrors).slice(0, 3).join(', ');
        const errorMessage = errorCount > 3 
          ? `Please fix ${errorCount} errors in the form (${errorFields}...)`
          : `Please fix the errors in: ${errorFields}`;
        toast.error(errorMessage);
        return;
      }

      setIsLoading(true);
      setSubmitError(null);

      if (editingAgent) {
        // Update existing agent
        const response = await dataProvider.updateShippingAgent(editingAgent.id, formData);
        if (response.ok) {
          toast.success('Agent updated successfully');
          await loadData(); // Reload data from database
          resetForm();
        } else {
          const errorMessage = response.message || 'Failed to update agent';
          toast.error(errorMessage);
          setSubmitError(errorMessage);
        }
      } else {
        // Create new agent
        console.log('Submitting form data:', formData);
        console.log('About to call createShippingAgent...');
        let response;
        try {
          response = await dataProvider.createShippingAgent(formData);
          console.log('createShippingAgent response:', response);
        } catch (error) {
          console.error('Error in createShippingAgent call:', error);
          throw error;
        }
        if (response.ok) {
          toast.success('Agent added successfully');
          await loadData(); // Reload data from database
          resetForm();
        } else {
          const errorMessage = response.message || 'Failed to create agent';
          toast.error(errorMessage);
          setSubmitError(errorMessage);
        }
      }
    } catch (error) {
      console.error('Error submitting agent:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save agent';
      toast.error(errorMessage);
      setSubmitError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (agent: ShippingAgent) => {
    clearFormErrors();
    setFormData({
      name: agent.name,
      company: agent.company || '',
      isActive: agent.isActive,
      phone: agent.phone || '',
      whatsapp: agent.whatsapp || '',
      supportedShippingTypes: agent.supportedShippingTypes || [],
      address: agent.address || '',
      city: agent.city || '',
      country: agent.country || '',
      contacts: agent.contacts || [],
      offices: agent.offices || [],
      serviceAreas: agent.serviceAreas || [],
      specializations: agent.specializations || [],
      pricePerCBM: agent.pricePerCBM?.toString() || '',
      pricePerKg: agent.pricePerKg?.toString() || '',
      averageDeliveryTime: agent.averageDeliveryTime || '',
      notes: agent.notes || ''
    });
    setEditingAgent(agent);
    setShowAddForm(true);
  };

  const handleDelete = async (agentId: string) => {
    try {
      setIsLoading(true);
      const response = await dataProvider.deleteShippingAgent(agentId);
      if (response.ok) {
        toast.success('Agent deleted successfully');
        await loadData(); // Reload data from database
        setShowDeleteModal(null);
      } else {
        toast.error(response.message || 'Failed to delete agent');
      }
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error('Failed to delete agent');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAgentStatus = async (agentId: string) => {
    try {
      setIsLoading(true);
      const response = await dataProvider.toggleShippingAgentStatus(agentId);
      if (response.ok) {
        toast.success('Agent status updated successfully');
        await loadData(); // Reload data from database
      } else {
        toast.error(response.message || 'Failed to update agent status');
      }
    } catch (error) {
      console.error('Error toggling agent status:', error);
      toast.error('Failed to update agent status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-6">
        <LATSBreadcrumb 
          items={[
            { label: 'LATS', href: '/lats' },
            { label: 'Shipping Management', href: '/lats/shipping' },
            { label: 'Agents', href: '/lats/shipping/agents' }
          ]} 
        />

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <BackButton onClick={() => navigate('/lats/shipping')} />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Shipping Agents</h1>
              <p className="text-gray-600">Manage your shipping agents and their information</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <GlassButton
              onClick={() => navigate('/lats/shipping')}
              icon={<ArrowLeft size={18} />}
              variant="outline"
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              Back to Shipping
            </GlassButton>
            <GlassButton
              onClick={() => setShowAddForm(true)}
              icon={<Plus size={18} />}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Add Agent
            </GlassButton>
          </div>
        </div>

        {/* Search and Filter */}
        <GlassCard className="p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search agents by name or company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </GlassCard>

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
              <GlassCard className="p-0">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800">
                        {editingAgent ? 'Edit Agent' : 'Add New Agent'}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {editingAgent ? 'Update agent information and capabilities' : 'Create a new shipping agent profile'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={resetForm}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6">

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - Basic Information */}
                    <div className="space-y-6">
                      
                      {/* Basic Information */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-6 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full"></div>
                          <h3 className="text-lg font-semibold text-gray-800">Basic Information</h3>
                        </div>
                        
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6 shadow-sm">
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Agent Name *
                              </label>
                              <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                placeholder="Enter agent name"
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                  formErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                }`}
                              />
                              {formErrors.name && (
                                <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
                              )}
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Company Name *
                              </label>
                              <input
                                type="text"
                                value={formData.company}
                                onChange={(e) => handleInputChange('company', e.target.value)}
                                placeholder="Enter company name"
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                  formErrors.company ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                }`}
                              />
                              {formErrors.company && (
                                <p className="text-red-500 text-sm mt-1">{formErrors.company}</p>
                              )}
                            </div>


                            {/* Contact Information */}
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Phone size={20} className="text-blue-600" />
                                Contact Information
                              </h3>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone Number *
                                  </label>
                                  <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    placeholder="Enter phone number"
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                      formErrors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                    }`}
                                  />
                                  {formErrors.phone && (
                                    <p className="text-red-500 text-sm mt-1">{formErrors.phone}</p>
                                  )}
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    WhatsApp Number
                                  </label>
                                  <input
                                    type="tel"
                                    value={formData.whatsapp}
                                    onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                                    placeholder="Enter WhatsApp number"
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                                      formErrors.whatsapp ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                    }`}
                                  />
                                  {formErrors.whatsapp && (
                                    <p className="text-red-500 text-sm mt-1">{formErrors.whatsapp}</p>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                              <label className="flex items-center space-x-3 cursor-pointer group">
                                <div className="relative">
                                  <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                                    className="sr-only"
                                  />
                                  <div className={`w-6 h-6 rounded-lg border-2 transition-all duration-200 flex items-center justify-center ${
                                    formData.isActive 
                                      ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-200' 
                                      : 'bg-white border-gray-300 group-hover:border-blue-400 group-hover:bg-blue-50'
                                  }`}>
                                    {formData.isActive && (
                                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </div>
                                </div>
                                <span className="text-sm font-semibold text-gray-700 group-hover:text-blue-700 transition-colors">
                                  Active Agent
                                </span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Contact Persons */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-6 bg-gradient-to-b from-green-400 to-green-600 rounded-full"></div>
                        <h3 className="text-lg font-semibold text-gray-800">Contact Persons</h3>
                      </div>
                      
                      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6 shadow-sm">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-gray-700">Contact Persons (Optional)</h4>
                              <p className="text-xs text-gray-500">Add multiple contact persons for different roles</p>
                            </div>
                            <button
                              type="button"
                              onClick={addContact}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
                            >
                              <Plus size={16} />
                              Add Contact
                            </button>
                          </div>

                          {formData.contacts.length === 0 ? (
                            <div className="text-center py-8">
                              <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                              <p className="text-gray-500 font-medium">No contact persons added</p>
                              <p className="text-sm text-gray-400 mt-1">Optional: Click "Add Contact" to add contact persons</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {formData.contacts.map((contact, index) => (
                                <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-3 h-3 rounded-full ${contact.isPrimary ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                      <h5 className="font-medium text-gray-800">
                                        {contact.name || `Contact ${index + 1}`}
                                      </h5>
                                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full capitalize">
                                        {contact.role}
                                      </span>
                                      {contact.isPrimary && (
                                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                          Primary
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {!contact.isPrimary && (
                                        <button
                                          type="button"
                                          onClick={() => setPrimaryContact(index)}
                                          className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-xs font-medium"
                                        >
                                          Set Primary
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => removeContact(index)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Contact Name *
                                      </label>
                                      <input
                                        type="text"
                                        value={contact.name}
                                        onChange={(e) => updateContact(index, 'name', e.target.value)}
                                        placeholder="e.g., John Doe"
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                                          formErrors[`contact_${index}_name`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                        }`}
                                      />
                                      {formErrors[`contact_${index}_name`] && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors[`contact_${index}_name`]}</p>
                                      )}
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Role *
                                      </label>
                                      <select
                                        value={contact.role}
                                        onChange={(e) => updateContact(index, 'role', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                      >
                                        <option value="manager">Manager</option>
                                        <option value="sales">Sales</option>
                                        <option value="support">Support</option>
                                        <option value="operations">Operations</option>
                                        <option value="other">Other</option>
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone *
                                      </label>
                                      <input
                                        type="tel"
                                        value={contact.phone}
                                        onChange={(e) => updateContact(index, 'phone', e.target.value)}
                                        placeholder="e.g., +255 123 456 789"
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                                          formErrors[`contact_${index}_phone`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                        }`}
                                      />
                                      {formErrors[`contact_${index}_phone`] && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors[`contact_${index}_phone`]}</p>
                                      )}
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        WhatsApp
                                      </label>
                                      <input
                                        type="tel"
                                        value={contact.whatsapp}
                                        onChange={(e) => updateContact(index, 'whatsapp', e.target.value)}
                                        placeholder="e.g., +255 123 456 789"
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                                          formErrors[`contact_${index}_whatsapp`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                        }`}
                                      />
                                      {formErrors[`contact_${index}_whatsapp`] && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors[`contact_${index}_whatsapp`]}</p>
                                      )}
                                    </div>

                                    <div className="md:col-span-2">
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email
                                      </label>
                                      <input
                                        type="email"
                                        value={contact.email}
                                        onChange={(e) => updateContact(index, 'email', e.target.value)}
                                        placeholder="e.g., john@company.com"
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
                                          formErrors[`contact_${index}_email`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                        }`}
                                      />
                                      {formErrors[`contact_${index}_email`] && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors[`contact_${index}_email`]}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Office Locations */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-6 bg-gradient-to-b from-indigo-400 to-indigo-600 rounded-full"></div>
                        <h3 className="text-lg font-semibold text-gray-800">Office Locations</h3>
                      </div>
                      
                      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6 shadow-sm">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-gray-700">Office Locations (Optional)</h4>
                              <p className="text-xs text-gray-500">Add multiple office locations in Tanzania and other countries</p>
                            </div>
                            <button
                              type="button"
                              onClick={addOffice}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-2"
                            >
                              <Plus size={16} />
                              Add Office
                            </button>
                          </div>

                          {formData.offices.length === 0 ? (
                            <div className="text-center py-8">
                              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                              <p className="text-gray-500 font-medium">No office locations added</p>
                              <p className="text-sm text-gray-400 mt-1">Optional: Click "Add Office" to add office locations</p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {formData.offices.map((office, index) => (
                                <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                  <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-3 h-3 rounded-full ${office.isMainOffice ? 'bg-indigo-500' : 'bg-gray-300'}`}></div>
                                      <h5 className="font-medium text-gray-800">
                                        {office.name || `${office.officeType} ${index + 1}`}
                                      </h5>
                                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full capitalize">
                                        {office.officeType}
                                      </span>
                                      {office.isMainOffice && (
                                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                                          Main Office
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {!office.isMainOffice && (
                                        <button
                                          type="button"
                                          onClick={() => setMainOffice(index)}
                                          className="px-3 py-1 text-xs bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors"
                                        >
                                          Set as Main
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() => removeOffice(index)}
                                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                      >
                                        <XCircle size={16} />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Office Name *
                                      </label>
                                      <input
                                        type="text"
                                        value={office.name}
                                        onChange={(e) => updateOffice(index, 'name', e.target.value)}
                                        placeholder="e.g., Dar es Salaam Main Office"
                                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
                                          formErrors[`office_${index}_name`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                        }`}
                                      />
                                      {formErrors[`office_${index}_name`] && (
                                        <p className="text-red-500 text-xs mt-1">{formErrors[`office_${index}_name`]}</p>
                                      )}
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Office Type *
                                      </label>
                                      <select
                                        value={office.officeType}
                                        onChange={(e) => updateOffice(index, 'officeType', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                      >
                                        <option value="office">Office</option>
                                        <option value="warehouse">Warehouse</option>
                                        <option value="branch">Branch</option>
                                        <option value="headquarters">Headquarters</option>
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Country *
                                      </label>
                                      <input
                                        type="text"
                                        value={office.country}
                                        onChange={(e) => updateOffice(index, 'country', e.target.value)}
                                        placeholder="Enter country name"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        City *
                                      </label>
                                      <input
                                        type="text"
                                        value={office.city}
                                        onChange={(e) => updateOffice(index, 'city', e.target.value)}
                                        placeholder="Enter city name"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone
                                      </label>
                                      <input
                                        type="tel"
                                        value={office.phone}
                                        onChange={(e) => updateOffice(index, 'phone', e.target.value)}
                                        placeholder="Enter phone number"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                      />
                                    </div>

                                    <div className="md:col-span-2">
                                      <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Address *
                                      </label>
                                      <input
                                        type="text"
                                        value={office.address}
                                        onChange={(e) => updateOffice(index, 'address', e.target.value)}
                                        placeholder="Enter full address"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          {formErrors.offices && (
                            <p className="text-red-500 text-sm mt-2">{formErrors.offices}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Shipping & Service Details */}
                    <div className="space-y-6">
                      
                      {/* Shipping Capabilities & Pricing */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-6 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full"></div>
                          <h3 className="text-lg font-semibold text-gray-800">Shipping Capabilities</h3>
                        </div>
                        
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6 shadow-sm">
                          <div className="space-y-4">
                            {/* Shipping Types */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-3">
                                Supported Shipping Types *
                              </label>
                              <div className={`grid grid-cols-3 gap-3 ${formErrors.supportedShippingTypes ? 'ring-2 ring-red-200 rounded-lg p-2' : ''}`}>
                                {['sea', 'air', 'local'].map(type => (
                                  <label key={type} className={`group cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 ${
                                    formData.supportedShippingTypes.includes(type)
                                      ? 'border-orange-400 bg-gradient-to-br from-orange-50 to-amber-50 shadow-lg shadow-orange-100'
                                      : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-gradient-to-br hover:from-orange-25 hover:to-amber-25 hover:shadow-md'
                                  }`}>
                                    <div className="flex flex-col items-center space-y-3">
                                      <div className="relative">
                                        <input
                                          type="checkbox"
                                          checked={formData.supportedShippingTypes.includes(type)}
                                          onChange={() => handleArrayChange('supportedShippingTypes', type)}
                                          className="sr-only"
                                        />
                                        <div className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 flex items-center justify-center ${
                                          formData.supportedShippingTypes.includes(type)
                                            ? 'bg-orange-500 border-orange-500 shadow-lg shadow-orange-200'
                                            : 'bg-white border-gray-300 group-hover:border-orange-400 group-hover:bg-orange-50'
                                        }`}>
                                          {formData.supportedShippingTypes.includes(type) && (
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                          )}
                                        </div>
                                      </div>
                                      <div className="text-center">
                                        <div className={`text-sm font-semibold capitalize transition-colors ${
                                          formData.supportedShippingTypes.includes(type)
                                            ? 'text-orange-700'
                                            : 'text-gray-700 group-hover:text-orange-600'
                                        }`}>
                                          {type}
                                        </div>
                                        <div className={`text-xs mt-1 transition-colors ${
                                          formData.supportedShippingTypes.includes(type)
                                            ? 'text-orange-600'
                                            : 'text-gray-500 group-hover:text-orange-500'
                                        }`}>
                                          {type === 'sea' && 'Ocean freight'}
                                          {type === 'air' && 'Air cargo'}
                                          {type === 'local' && 'Local delivery'}
                                        </div>
                                      </div>
                                    </div>
                                  </label>
                                ))}
                              </div>
                              {formErrors.supportedShippingTypes && (
                                <p className="text-red-500 text-sm mt-2">{formErrors.supportedShippingTypes}</p>
                              )}
                            </div>

                            {/* Dynamic Pricing Fields */}
                            <div className="space-y-4">
                              {formData.supportedShippingTypes.includes('sea') && (
                                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Price per CBM (USD) *
                                  </label>
                                  <input
                                    type="number"
                                    value={formData.pricePerCBM}
                                    onChange={(e) => handleInputChange('pricePerCBM', e.target.value)}
                                    placeholder="Enter price per cubic meter in USD"
                                    min="0"
                                    step="100"
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                                      formErrors.pricePerCBM ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                    }`}
                                  />
                                  {formErrors.pricePerCBM && (
                                    <p className="text-red-500 text-sm mt-1">{formErrors.pricePerCBM}</p>
                                  )}
                                </div>
                              )}

                              {formData.supportedShippingTypes.includes('air') && (
                                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Price per KG (TZS) *
                                  </label>
                                  <input
                                    type="number"
                                    value={formData.pricePerKg}
                                    onChange={(e) => handleInputChange('pricePerKg', e.target.value)}
                                    placeholder="Enter price per kilogram"
                                    min="0"
                                    step="100"
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                                      formErrors.pricePerKg ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                    }`}
                                  />
                                  {formErrors.pricePerKg && (
                                    <p className="text-red-500 text-sm mt-1">{formErrors.pricePerKg}</p>
                                  )}
                                </div>
                              )}

                              {formData.supportedShippingTypes.includes('local') && (
                                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                                  <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Local Shipping Rate (TZS) *
                                  </label>
                                  <input
                                    type="number"
                                    value={formData.pricePerCBM}
                                    onChange={(e) => handleInputChange('pricePerCBM', e.target.value)}
                                    placeholder="Enter local shipping rate"
                                    min="0"
                                    step="100"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Service Details */}
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-6 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full"></div>
                          <h3 className="text-lg font-semibold text-gray-800">Service Details</h3>
                        </div>
                        
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-6 shadow-sm">
                          <div className="space-y-4">
                            {/* Service Areas */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-3">
                                Service Areas
                              </label>
                              <div className="grid grid-cols-3 gap-3">
                                {['domestic', 'international', 'regional'].map(area => (
                                  <label key={area} className={`group cursor-pointer p-3 rounded-xl border-2 transition-all duration-300 ${
                                    formData.serviceAreas.includes(area)
                                      ? 'border-purple-400 bg-gradient-to-br from-purple-50 to-violet-50 shadow-lg shadow-purple-100'
                                      : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-gradient-to-br hover:from-purple-25 hover:to-violet-25 hover:shadow-md'
                                  }`}>
                                    <div className="flex items-center space-x-3">
                                      <div className="relative">
                                        <input
                                          type="checkbox"
                                          checked={formData.serviceAreas.includes(area)}
                                          onChange={() => handleArrayChange('serviceAreas', area)}
                                          className="sr-only"
                                        />
                                        <div className={`w-6 h-6 rounded-lg border-2 transition-all duration-200 flex items-center justify-center ${
                                          formData.serviceAreas.includes(area)
                                            ? 'bg-purple-500 border-purple-500 shadow-lg shadow-purple-200'
                                            : 'bg-white border-gray-300 group-hover:border-purple-400 group-hover:bg-purple-50'
                                        }`}>
                                          {formData.serviceAreas.includes(area) && (
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex-1">
                                        <div className={`text-sm font-semibold capitalize transition-colors ${
                                          formData.serviceAreas.includes(area)
                                            ? 'text-purple-700'
                                            : 'text-gray-700 group-hover:text-purple-600'
                                        }`}>
                                          {area}
                                        </div>
                                        <div className={`text-xs transition-colors ${
                                          formData.serviceAreas.includes(area)
                                            ? 'text-purple-600'
                                            : 'text-gray-500 group-hover:text-purple-500'
                                        }`}>
                                          {area === 'domestic' && 'Within country'}
                                          {area === 'international' && 'Cross-border'}
                                          {area === 'regional' && 'Regional coverage'}
                                        </div>
                                      </div>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            </div>

                            {/* Specializations */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-3">
                                Specializations
                              </label>
                              <div className="grid grid-cols-2 gap-3">
                                {['electronics', 'fragile', 'bulk', 'express', 'hazardous', 'perishable'].map(spec => (
                                  <label key={spec} className={`group cursor-pointer p-3 rounded-xl border-2 transition-all duration-300 ${
                                    formData.specializations.includes(spec)
                                      ? 'border-purple-400 bg-gradient-to-br from-purple-50 to-violet-50 shadow-lg shadow-purple-100'
                                      : 'border-gray-200 bg-white hover:border-purple-300 hover:bg-gradient-to-br hover:from-purple-25 hover:to-violet-25 hover:shadow-md'
                                  }`}>
                                    <div className="flex items-center space-x-3">
                                      <div className="relative">
                                        <input
                                          type="checkbox"
                                          checked={formData.specializations.includes(spec)}
                                          onChange={() => handleArrayChange('specializations', spec)}
                                          className="sr-only"
                                        />
                                        <div className={`w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${
                                          formData.specializations.includes(spec)
                                            ? 'bg-purple-500 border-purple-500 shadow-lg shadow-purple-200'
                                            : 'bg-white border-gray-300 group-hover:border-purple-400 group-hover:bg-purple-50'
                                        }`}>
                                          {formData.specializations.includes(spec) && (
                                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex-1">
                                        <div className={`text-sm font-semibold capitalize transition-colors ${
                                          formData.specializations.includes(spec)
                                            ? 'text-purple-700'
                                            : 'text-gray-700 group-hover:text-purple-600'
                                        }`}>
                                          {spec}
                                        </div>
                                        <div className={`text-xs transition-colors ${
                                          formData.specializations.includes(spec)
                                            ? 'text-purple-600'
                                            : 'text-gray-500 group-hover:text-purple-500'
                                        }`}>
                                          {spec === 'electronics' && 'Tech devices'}
                                          {spec === 'fragile' && 'Delicate items'}
                                          {spec === 'bulk' && 'Large quantities'}
                                          {spec === 'express' && 'Fast delivery'}
                                          {spec === 'hazardous' && 'Dangerous goods'}
                                          {spec === 'perishable' && 'Fresh products'}
                                        </div>
                                      </div>
                                    </div>
                                  </label>
                                ))}
                              </div>
                            </div>

                            {/* Business Terms */}
                            <div className="grid grid-cols-2 gap-4">

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Average Delivery Time
                                </label>
                                <input
                                  type="text"
                                  value={formData.averageDeliveryTime}
                                  onChange={(e) => handleInputChange('averageDeliveryTime', e.target.value)}
                                  placeholder="e.g., 15-30 days"
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                />
                              </div>
                            </div>

                            {/* Notes */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Additional Notes
                              </label>
                              <textarea
                                value={formData.notes}
                                onChange={(e) => handleInputChange('notes', e.target.value)}
                                placeholder="Enter any additional notes about this agent..."
                                rows={4}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Debug Info - Remove this in production */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-4 p-4 bg-gray-100 rounded-lg text-xs">
                    <details>
                      <summary className="cursor-pointer font-medium">Debug: Form State</summary>
                      <div className="mt-2 space-y-1">
                        <div><strong>Name:</strong> "{formData.name}"</div>
                        <div><strong>Company:</strong> "{formData.company}"</div>
                        <div><strong>Phone:</strong> "{formData.phone}"</div>
                        <div><strong>WhatsApp:</strong> "{formData.whatsapp}"</div>
                        <div><strong>Shipping Types:</strong> {JSON.stringify(formData.supportedShippingTypes)}</div>
                        <div><strong>Offices Count:</strong> {formData.offices.length}</div>
                        <div><strong>Price per CBM:</strong> "{formData.pricePerCBM}"</div>
                        <div><strong>Price per KG:</strong> "{formData.pricePerKg}"</div>
                        <div><strong>Errors:</strong> {Object.keys(formErrors).length} errors</div>
                      </div>
                    </details>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-6 border-t border-gray-200 mt-6 px-6 pb-6">
                  {Object.keys(formErrors).length > 0 && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-5 h-5 text-red-500">⚠️</div>
                        <p className="text-red-700 text-sm font-medium">
                          Please fix {Object.keys(formErrors).length} validation error{Object.keys(formErrors).length > 1 ? 's' : ''}:
                        </p>
                      </div>
                      <ul className="text-red-600 text-sm space-y-1 ml-7">
                        {Object.entries(formErrors).slice(0, 5).map(([field, error]) => (
                          <li key={field} className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                            {error}
                          </li>
                        ))}
                        {Object.keys(formErrors).length > 5 && (
                          <li className="text-red-500 text-xs">
                            ... and {Object.keys(formErrors).length - 5} more errors
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                  {submitError && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 text-red-500">⚠️</div>
                        <p className="text-red-700 text-sm font-medium">Error: {submitError}</p>
                      </div>
                    </div>
                  )}
                  <GlassButton
                    type="button"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className={`w-full py-4 text-white text-lg font-semibold transition-all ${
                      isLoading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                    icon={isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <User size={20} />}
                  >
                    {isLoading 
                      ? (editingAgent ? 'Updating...' : 'Adding...') 
                      : (editingAgent ? 'Update Agent' : 'Add Agent')
                    }
                  </GlassButton>
                </div>
              </GlassCard>
            </div>
          </div>
        )}

        {/* Agents List */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Agents ({filteredAgents.length})
            </h3>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Loading agents...</h4>
              <p className="text-gray-500">Please wait while we fetch your shipping agents</p>
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="text-center py-12">
              <User size={48} className="mx-auto text-gray-400 mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No agents found</h4>
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Get started by adding your first shipping agent'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <GlassButton
                  onClick={() => setShowAddForm(true)}
                  icon={<Plus size={18} />}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Add First Agent
                </GlassButton>
              )}
            </div>
          ) : (
                         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
               {filteredAgents.map(agent => (
                 <div key={agent.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg transition-all duration-200">
                   {/* Header Section */}
                   <div className="flex items-start justify-between mb-4">
                     <div className="flex items-center gap-3">
                       <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                         {agent.name.charAt(0).toUpperCase()}
                       </div>
                       <div>
                         <h4 className="font-semibold text-gray-900 text-lg">{agent.name}</h4>
                         {agent.company && (
                           <p className="text-sm text-gray-500 flex items-center gap-1">
                             <Building size={12} />
                             {agent.company}
                           </p>
                         )}
                       </div>
                     </div>
                     <div className="flex items-center gap-2">
                       <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                         agent.isActive 
                           ? 'bg-green-100 text-green-700' 
                           : 'bg-red-100 text-red-700'
                       }`}>
                         {agent.isActive ? 'Active' : 'Inactive'}
                       </div>
                       {agent.isActive ? (
                         <CheckCircle size={16} className="text-green-500" />
                       ) : (
                         <XCircle size={16} className="text-red-500" />
                       )}
                     </div>
                   </div>

                   {/* Contact Information */}
                   <div className="space-y-2 mb-4">
                     {agent.phone && (
                       <div className="flex items-center gap-2 text-sm text-gray-600">
                         <Phone size={14} className="text-gray-400" />
                         <span>{agent.phone}</span>
                       </div>
                     )}
                     {agent.whatsapp && (
                       <div className="flex items-center gap-2 text-sm text-gray-600">
                         <MessageCircle size={14} className="text-green-500" />
                         <span>{agent.whatsapp}</span>
                       </div>
                     )}
                   </div>

                   {/* Shipping Capabilities */}
                   <div className="mb-4">
                     {agent.supportedShippingTypes && agent.supportedShippingTypes.length > 0 && (
                       <div className="mb-3">
                         <div className="flex items-center gap-2 mb-2">
                           <Truck size={14} className="text-orange-500" />
                           <span className="text-sm font-medium text-gray-700">Shipping Types</span>
                         </div>
                         <div className="flex flex-wrap gap-1">
                           {agent.supportedShippingTypes.map(type => (
                             <span key={type} className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full capitalize font-medium">
                               {type}
                             </span>
                           ))}
                         </div>
                       </div>
                     )}

                     {/* Pricing Information */}
                     {(agent.pricePerCBM || agent.pricePerKg) && (
                       <div className="mb-3">
                         <div className="flex items-center gap-2 mb-2">
                           <span className="text-sm font-medium text-gray-700">Pricing</span>
                         </div>
                         <div className="space-y-1">
                           {agent.pricePerCBM && (
                             <div className="flex items-center justify-between text-sm">
                               <span className="text-gray-500">Per CBM:</span>
                               <span className="font-medium text-green-600">
                                 ${agent.pricePerCBM.toLocaleString()}
                               </span>
                             </div>
                           )}
                           {agent.pricePerKg && (
                             <div className="flex items-center justify-between text-sm">
                               <span className="text-gray-500">Per KG:</span>
                               <span className="font-medium text-green-600">
                                 TZS {agent.pricePerKg.toLocaleString()}
                               </span>
                             </div>
                           )}
                         </div>
                       </div>
                     )}
                   </div>

                   {/* Service Areas & Specializations */}
                   <div className="mb-4 space-y-3">
                     {agent.serviceAreas && agent.serviceAreas.length > 0 && (
                       <div>
                         <div className="flex items-center gap-2 mb-2">
                           <MapPin size={14} className="text-blue-500" />
                           <span className="text-sm font-medium text-gray-700">Service Areas</span>
                         </div>
                         <div className="flex flex-wrap gap-1">
                           {agent.serviceAreas.map(area => (
                             <span key={area} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full capitalize">
                               {area}
                             </span>
                           ))}
                         </div>
                       </div>
                     )}

                     {agent.specializations && agent.specializations.length > 0 && (
                       <div>
                         <div className="flex items-center gap-2 mb-2">
                           <Package size={14} className="text-purple-500" />
                           <span className="text-sm font-medium text-gray-700">Specializations</span>
                         </div>
                         <div className="flex flex-wrap gap-1">
                           {agent.specializations.slice(0, 3).map(spec => (
                             <span key={spec} className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full capitalize">
                               {spec}
                             </span>
                           ))}
                           {agent.specializations.length > 3 && (
                             <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                               +{agent.specializations.length - 3} more
                             </span>
                           )}
                         </div>
                       </div>
                     )}
                   </div>

                   {/* Office Locations */}
                   {agent.offices && agent.offices.length > 0 && (
                     <div className="mb-4">
                       <div className="flex items-center gap-2 mb-2">
                         <MapPin size={14} className="text-indigo-500" />
                         <span className="text-sm font-medium text-gray-700">Office Locations</span>
                       </div>
                       <div className="flex flex-wrap gap-1">
                         {agent.offices.slice(0, 2).map((office, index) => (
                           <span key={index} className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                             {office.city}, {office.country}
                           </span>
                         ))}
                         {agent.offices.length > 2 && (
                           <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                             +{agent.offices.length - 2} more
                           </span>
                         )}
                       </div>
                     </div>
                   )}

                   {/* Performance Metrics */}
                   {(agent.rating || agent.totalShipments) && (
                     <div className="flex items-center gap-4 mb-4 text-sm">
                       {agent.rating && (
                         <div className="flex items-center gap-1">
                           <Star size={14} className="text-yellow-500" />
                           <span className="font-medium text-gray-700">{agent.rating.toFixed(1)}</span>
                         </div>
                       )}
                       {agent.totalShipments && (
                         <div className="flex items-center gap-1">
                           <Truck size={14} className="text-blue-500" />
                           <span className="font-medium text-gray-700">{agent.totalShipments} shipments</span>
                         </div>
                       )}
                     </div>
                   )}

                   {/* Action Buttons */}
                   <div className="flex gap-2 pt-3 border-t border-gray-100">
                     <button
                       onClick={() => handleEdit(agent)}
                       className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-1 font-medium"
                     >
                       <Edit size={14} />
                       Edit
                     </button>
                     <button
                       onClick={() => toggleAgentStatus(agent.id)}
                       className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors flex items-center justify-center gap-1 font-medium ${
                         agent.isActive 
                           ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                           : 'bg-green-50 text-green-600 hover:bg-green-100'
                       }`}
                     >
                       {agent.isActive ? 'Deactivate' : 'Activate'}
                     </button>
                     <button
                       onClick={() => setShowDeleteModal(agent.id)}
                       className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                     >
                       <Trash2 size={14} />
                     </button>
                   </div>
                 </div>
               ))}
             </div>
          )}
        </GlassCard>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Agent</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this agent? This action cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDelete(showDeleteModal)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShippingAgentsPage;
