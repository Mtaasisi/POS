import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import Modal from '../ui/Modal';
import { 
  Wallet, 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw,
  DollarSign,
  Building,
  Smartphone,
  CreditCard,
  PiggyBank,
  TrendingUp,
  CheckCircle,
  Search,
  Filter,
  X,
  Banknote,
  Coins,
  Landmark,
  Smartphone as MobileIcon,
  CreditCard as CardIcon,
  PiggyBank as SavingsIcon,
  TrendingUp as InvestmentIcon,
  Briefcase,
  Home,
  Car,
  ShoppingCart,
  Gift,
  Heart,
  Star,
  Zap,
  Shield,
  Globe,
  Users,
  Settings,
  BarChart3,
  PieChart,
  Target,
  Award,
  Crown,
  Gem,
  Diamond,
  Trophy,
  Medal,
  Flag,
  Anchor,
  Compass,
  MapPin,
  Navigation,
  Plane,
  Ship,
  Train,
  Bus,
  Bike,
  Car as CarIcon,
  Truck,
  Package,
  Box,
  Archive,
  Folder,
  FileText,
  File,
  Database,
  Server,
  Cloud,
  Wifi,
  Signal,
  Battery,
  Power,
  Lightbulb,
  Camera,
  Video,
  Music,
  Headphones,
  Speaker,
  Mic,
  Phone,
  Mail,
  MessageSquare,
  Bell,
  Clock,
  Calendar,
  Watch,
  Timer,
  Stopwatch,
  Hourglass,
  Sunrise,
  Sunset,
  Moon,
  Sun,
  Cloud as CloudIcon,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Thermometer,
  Umbrella,
  Snowflake,
  Leaf,
  Tree,
  Flower,
  Seedling,
  Sprout,
  Cactus,
  Palm,
  Mountain,
  Hill,
  Volcano,
  Island,
  Beach,
  Desert,
  Forest,
  Jungle,
  Park,
  Garden,
  Farm,
  Barn,
  House,
  Building as BuildingIcon,
  Factory,
  Warehouse,
  Store,
  Shop,
  Mall,
  Hotel,
  Restaurant,
  Cafe,
  Bar,
  Pub,
  Club,
  Theater,
  Cinema,
  Museum,
  Library,
  School,
  University,
  Hospital,
  Clinic,
  Pharmacy,
  Ambulance,
  Fire,
  Police,
  Shield as ShieldIcon,
  Lock,
  Unlock,
  Key,
  Eye,
  EyeOff,
  User,
  UserCheck,
  UserX,
  UserPlus,
  UserMinus,
  Users as UsersIcon,
  User as UserIcon,
  UserCheck as UserCheckIcon,
  UserX as UserXIcon,
  UserPlus as UserPlusIcon,
  UserMinus as UserMinusIcon,
  Heart as HeartIcon,
  Star as StarIcon,
  ThumbsUp,
  ThumbsDown,
  Smile,
  Frown,
  Meh,
  Laugh,
  Cry,
  Angry,
  Surprised,
  Wink,
  Tongue,
  Kiss,
  Hug,
  Hand,
  Handshake,
  ThumbsUp as ThumbsUpIcon,
  ThumbsDown as ThumbsDownIcon,
  Point,
  Fingerprint,
  Scan,
  QrCode,
  Barcode,
  Tag,
  Label,
  Bookmark,
  Flag as FlagIcon,
  Pin,
  MapPin as MapPinIcon,
  Navigation as NavigationIcon,
  Compass as CompassIcon,
  Map,
  Globe as GlobeIcon,
  World,
  Earth,
  Satellite,
  Rocket,
  Plane as PlaneIcon,
  Helicopter,
  Ship as ShipIcon,
  Anchor as AnchorIcon,
  LifeBuoy,
  Sailboat,
  Ferry,
  Submarine,
  Train as TrainIcon,
  Bus as BusIcon,
  Bike as BikeIcon,
  Car as CarIcon2,
  Truck as TruckIcon,
  Ambulance as AmbulanceIcon,
  FireTruck,
  PoliceCar,
  Taxi,
  Limousine,
  Van,
  Pickup,
  SUV,
  Hatchback,
  Sedan,
  Coupe,
  Convertible,
  Wagon,
  Minivan,
  Jeep,
  Hummer,
  Ferrari,
  Porsche,
  Lamborghini,
  Bentley,
  RollsRoyce,
  Mercedes,
  BMW,
  Audi,
  Volkswagen,
  Toyota,
  Honda,
  Nissan,
  Ford,
  Chevrolet,
  Dodge,
  Jeep as JeepIcon,
  LandRover,
  RangeRover,
  Volvo,
  Saab,
  Subaru,
  Mitsubishi,
  Mazda,
  Lexus,
  Infiniti,
  Acura,
  Cadillac,
  Lincoln,
  Buick,
  Pontiac,
  Oldsmobile,
  Plymouth,
  Chrysler,
  Jeep as JeepIcon2,
  Hummer as HummerIcon,
  Ferrari as FerrariIcon,
  Porsche as PorscheIcon,
  Lamborghini as LamborghiniIcon,
  Bentley as BentleyIcon,
  RollsRoyce as RollsRoyceIcon,
  Mercedes as MercedesIcon,
  BMW as BMWIcon,
  Audi as AudiIcon,
  Volkswagen as VolkswagenIcon,
  Toyota as ToyotaIcon,
  Honda as HondaIcon,
  Nissan as NissanIcon,
  Ford as FordIcon,
  Chevrolet as ChevroletIcon,
  Dodge as DodgeIcon,
  Jeep as JeepIcon3,
  LandRover as LandRoverIcon,
  RangeRover as RangeRoverIcon,
  Volvo as VolvoIcon,
  Saab as SaabIcon,
  Subaru as SubaruIcon,
  Mitsubishi as MitsubishiIcon,
  Mazda as MazdaIcon,
  Lexus as LexusIcon,
  Infiniti as InfinitiIcon,
  Acura as AcuraIcon,
  Cadillac as CadillacIcon,
  Lincoln as LincolnIcon,
  Buick as BuickIcon,
  Pontiac as PontiacIcon,
  Oldsmobile as OldsmobileIcon,
  Plymouth as PlymouthIcon,
  Chrysler as ChryslerIcon
} from 'lucide-react';
import { formatCurrency } from '../../lib/customerApi';
import { toast } from 'react-hot-toast';
import { paymentMethodService, PaymentMethod, PaymentMethodAccount } from '../../lib/paymentMethodService';

interface Account {
  id: string;
  name: string;
  type: 'bank' | 'cash' | 'mobile_money' | 'credit_card' | 'savings' | 'investment' | 'other';
  balance: number;
  account_number?: string;
  bank_name?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PaymentsAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountSelect?: (account: Account) => void;
}

const PaymentsAccountsModal: React.FC<PaymentsAccountsModalProps> = ({ 
  isOpen, 
  onClose, 
  onAccountSelect 
}) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Payment methods state
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentMethodAccounts, setPaymentMethodAccounts] = useState<PaymentMethodAccount[]>([]);
  const [showLinkPaymentMethod, setShowLinkPaymentMethod] = useState(false);
  const [selectedAccountForLinking, setSelectedAccountForLinking] = useState<Account | null>(null);
  


  // Account form state
  const [accountForm, setAccountForm] = useState({
    name: '',
    type: 'bank' as Account['type'],
    balance: 0,
    account_number: '',
    bank_name: '',
    is_active: true
  });

  useEffect(() => {
    if (isOpen) {
      loadAccounts();
      loadPaymentMethods();
    }
  }, [isOpen]);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('finance_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading accounts:', error);
        toast.error('Failed to load accounts');
      } else {
        setAccounts(data || []);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
      toast.error('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentMethods = async () => {
    try {
      const methods = await paymentMethodService.getActivePaymentMethods();
      setPaymentMethods(methods);
      
      // Load payment method account links
      const methodsWithAccounts = await paymentMethodService.getPaymentMethodsWithAccounts();
      const allLinks: PaymentMethodAccount[] = [];
      methodsWithAccounts.forEach(method => {
        if (method.accounts) {
          allLinks.push(...method.accounts);
        }
      });
      setPaymentMethodAccounts(allLinks);
    } catch (error) {
      console.error('Error loading payment methods:', error);
      toast.error('Failed to load payment methods');
    }
  };

  const handleAddAccount = async () => {
    if (!accountForm.name.trim()) {
      toast.error('Account name is required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('finance_accounts')
        .insert([{
          name: accountForm.name.trim(),
          type: accountForm.type,
          balance: accountForm.balance,
          account_number: accountForm.account_number.trim() || null,
          bank_name: accountForm.bank_name.trim() || null,
          is_active: accountForm.is_active
        }])
        .select()
        .single();

      if (error) throw error;

      setAccounts(prev => [data, ...prev]);
      setShowAddAccount(false);
      resetForm();
      toast.success('Account added successfully');
    } catch (error) {
      console.error('Error adding account:', error);
      toast.error('Failed to add account');
    }
  };

  const handleUpdateAccount = async () => {
    if (!editingAccount || !accountForm.name.trim()) {
      toast.error('Account name is required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('finance_accounts')
        .update({
          name: accountForm.name.trim(),
          type: accountForm.type,
          balance: accountForm.balance,
          account_number: accountForm.account_number.trim() || null,
          bank_name: accountForm.bank_name.trim() || null,
          is_active: accountForm.is_active
        })
        .eq('id', editingAccount.id)
        .select()
        .single();

      if (error) throw error;

      setAccounts(prev => prev.map(acc => acc.id === editingAccount.id ? data : acc));
      setEditingAccount(null);
      resetForm();
      toast.success('Account updated successfully');
    } catch (error) {
      console.error('Error updating account:', error);
      toast.error('Failed to update account');
    }
  };

  const handleDeleteAccount = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return;

    try {
      const { error } = await supabase
        .from('finance_accounts')
        .delete()
        .eq('id', accountId);

      if (error) throw error;

      setAccounts(prev => prev.filter(acc => acc.id !== accountId));
      toast.success('Account deleted successfully');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    }
  };

  const handleLinkPaymentMethod = async (paymentMethodId: string, accountId: string, isDefault: boolean = false) => {
    try {
      const success = await paymentMethodService.linkPaymentMethodToAccount(paymentMethodId, accountId, isDefault);
      if (success) {
        await loadPaymentMethods(); // Reload the links
        toast.success('Payment method linked successfully');
      } else {
        toast.error('Failed to link payment method');
      }
    } catch (error) {
      console.error('Error linking payment method:', error);
      toast.error('Failed to link payment method');
    }
  };

  const handleUnlinkPaymentMethod = async (paymentMethodId: string, accountId: string) => {
    try {
      const success = await paymentMethodService.unlinkPaymentMethodFromAccount(paymentMethodId, accountId);
      if (success) {
        await loadPaymentMethods(); // Reload the links
        toast.success('Payment method unlinked successfully');
      } else {
        toast.error('Failed to unlink payment method');
      }
    } catch (error) {
      console.error('Error unlinking payment method:', error);
      toast.error('Failed to unlink payment method');
    }
  };

  const getLinkedPaymentMethods = (accountId: string) => {
    return paymentMethodAccounts.filter(link => link.account_id === accountId);
  };

  const getPaymentMethodName = (paymentMethodId: string) => {
    const method = paymentMethods.find(m => m.id === paymentMethodId);
    return method?.name || 'Unknown Method';
  };

  const resetForm = () => {
    setAccountForm({
      name: '',
      type: 'bank',
      balance: 0,
      account_number: '',
      bank_name: '',
      is_active: true
    });
  };

  const getAccountTypeIcon = (type: Account['type']) => {
    const iconSize = "w-6 h-6";
    const baseClasses = "rounded-full p-2";
    
    switch (type) {
      case 'bank':
        return (
          <div className={`${baseClasses} bg-blue-100 text-blue-600`}>
            <Building className={iconSize} />
          </div>
        );
      case 'cash':
        return (
          <div className={`${baseClasses} bg-green-100 text-green-600`}>
            <DollarSign className={iconSize} />
          </div>
        );
      case 'mobile_money':
        return (
          <div className={`${baseClasses} bg-purple-100 text-purple-600`}>
            <Smartphone className={iconSize} />
          </div>
        );
      case 'credit_card':
        return (
          <div className={`${baseClasses} bg-indigo-100 text-indigo-600`}>
            <CreditCard className={iconSize} />
          </div>
        );
      case 'savings':
        return (
          <div className={`${baseClasses} bg-yellow-100 text-yellow-600`}>
            <PiggyBank className={iconSize} />
          </div>
        );
      case 'investment':
        return (
          <div className={`${baseClasses} bg-emerald-100 text-emerald-600`}>
            <TrendingUp className={iconSize} />
          </div>
        );
      default:
        return (
          <div className={`${baseClasses} bg-gray-100 text-gray-600`}>
            <Wallet className={iconSize} />
          </div>
        );
    }
  };

  const getAccountTypeColor = (type: Account['type']): string => {
    switch (type) {
      case 'bank': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'cash': return 'bg-green-100 text-green-700 border-green-200';
      case 'mobile_money': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'credit_card': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'savings': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'investment': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getAccountTypeGradient = (type: Account['type']): string => {
    switch (type) {
      case 'bank': return 'from-blue-400 to-blue-600';
      case 'cash': return 'from-green-400 to-green-600';
      case 'mobile_money': return 'from-purple-400 to-purple-600';
      case 'credit_card': return 'from-indigo-400 to-indigo-600';
      case 'savings': return 'from-yellow-400 to-yellow-600';
      case 'investment': return 'from-emerald-400 to-emerald-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (account.account_number && account.account_number.includes(searchQuery)) ||
                         (account.bank_name && account.bank_name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'all' || account.type === filterType;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && account.is_active) ||
                         (filterStatus === 'inactive' && !account.is_active);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleAccountSelect = (account: Account) => {
    if (onAccountSelect) {
      onAccountSelect(account);
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Payment Accounts"
      maxWidth="2xl"
      actions={
        <div className="flex gap-3">
          <GlassButton
            variant="outline"
            onClick={onClose}
          >
            Close
          </GlassButton>
          <GlassButton
            onClick={() => setShowAddAccount(true)}
          >
            <Plus className="w-4 h-4" />
            Add Account
          </GlassButton>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header with Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlassCard>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Wallet className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Accounts</p>
                <p className="text-2xl font-bold text-gray-900">{accounts.length}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Accounts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {accounts.filter(acc => acc.is_active).length}
                </p>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(accounts.reduce((sum, acc) => sum + acc.balance, 0))}
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="bank">Bank</option>
              <option value="cash">Cash</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="credit_card">Credit Card</option>
              <option value="savings">Savings</option>
              <option value="investment">Investment</option>
              <option value="other">Other</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Accounts List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading accounts...</span>
            </div>
          ) : filteredAccounts.length === 0 ? (
            <GlassCard>
              <div className="text-center py-12">
                <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No accounts found</h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || filterType !== 'all' || filterStatus !== 'all' 
                    ? 'Try adjusting your search or filters'
                    : 'Get started by adding your first account'
                  }
                </p>
                <GlassButton onClick={() => setShowAddAccount(true)}>
                  <Plus className="w-4 h-4" />
                  Add Account
                </GlassButton>
              </div>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredAccounts.map((account) => (
                <GlassCard key={account.id} className="hover:shadow-lg transition-all duration-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                      {getAccountTypeIcon(account.type)}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg">{account.name}</h3>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getAccountTypeColor(account.type)}`}>
                          {account.type.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-xl text-gray-900">{formatCurrency(account.balance)}</p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        account.is_active ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'
                      }`}>
                        {account.is_active ? '🟢 Active' : '🔴 Inactive'}
                      </span>
                    </div>
                  </div>

                  {(account.account_number || account.bank_name) && (
                    <div className="text-sm text-gray-600 space-y-1 mb-4 p-3 bg-gray-50 rounded-lg">
                      {account.account_number && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">🔢</span>
                          <span>Account: {account.account_number}</span>
                        </div>
                      )}
                      {account.bank_name && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">🏦</span>
                          <span>Bank: {account.bank_name}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Linked Payment Methods */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <span>🔗</span>
                        Linked Payment Methods
                      </h4>
                      <GlassButton
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedAccountForLinking(account);
                          setShowLinkPaymentMethod(true);
                        }}
                        className="text-xs"
                      >
                        <Plus className="w-3 h-3" />
                        Link Method
                      </GlassButton>
                    </div>
                    
                    {getLinkedPaymentMethods(account.id).length > 0 ? (
                      <div className="space-y-2">
                        {getLinkedPaymentMethods(account.id).map((link) => (
                          <div key={link.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 text-sm">💳</span>
                              </div>
                              <div>
                                <span className="text-sm font-medium text-gray-900">
                                  {getPaymentMethodName(link.payment_method_id)}
                                </span>
                                {link.is_default && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full font-medium">
                                      ⭐ Default
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <GlassButton
                              variant="danger"
                              size="sm"
                              onClick={() => handleUnlinkPaymentMethod(link.payment_method_id, account.id)}
                              className="text-xs"
                            >
                              <X className="w-3 h-3" />
                            </GlassButton>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        <div className="text-center">
                          <span className="text-gray-400 text-2xl">🔗</span>
                          <p className="text-sm text-gray-500 mt-1">No payment methods linked</p>
                          <p className="text-xs text-gray-400 mt-1">Click "Link Method" to connect payment options</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    {onAccountSelect && (
                      <GlassButton
                        variant="primary"
                        size="sm"
                        onClick={() => handleAccountSelect(account)}
                        className="flex-1"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Select Account
                      </GlassButton>
                    )}
                    <GlassButton
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setEditingAccount(account);
                        setAccountForm({
                          name: account.name,
                          type: account.type,
                          balance: account.balance,
                          account_number: account.account_number || '',
                          bank_name: account.bank_name || '',
                          is_active: account.is_active
                        });
                      }}
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </GlassButton>
                    <GlassButton
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteAccount(account.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </GlassButton>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>

        {/* Add/Edit Account Modal */}
        {(showAddAccount || editingAccount) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">
                  {editingAccount ? 'Edit Account' : 'Add New Account'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddAccount(false);
                    setEditingAccount(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                  <input
                    type="text"
                    value={accountForm.name}
                    onChange={(e) => setAccountForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter account name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                  <select
                    value={accountForm.type}
                    onChange={(e) => setAccountForm(prev => ({ ...prev, type: e.target.value as Account['type'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="bank">🏦 Bank</option>
                    <option value="cash">💰 Cash</option>
                    <option value="mobile_money">📱 Mobile Money</option>
                    <option value="credit_card">💳 Credit Card</option>
                    <option value="savings">🏦 Savings</option>
                    <option value="investment">📈 Investment</option>
                    <option value="other">📁 Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Initial Balance</label>
                  <input
                    type="number"
                    value={accountForm.balance}
                    onChange={(e) => setAccountForm(prev => ({ ...prev, balance: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number (Optional)</label>
                  <input
                    type="text"
                    value={accountForm.account_number}
                    onChange={(e) => setAccountForm(prev => ({ ...prev, account_number: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter account number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name (Optional)</label>
                  <input
                    type="text"
                    value={accountForm.bank_name}
                    onChange={(e) => setAccountForm(prev => ({ ...prev, bank_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter bank name"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={accountForm.is_active}
                    onChange={(e) => setAccountForm(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                    Account is active
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <GlassButton
                  variant="outline"
                  onClick={() => {
                    setShowAddAccount(false);
                    setEditingAccount(null);
                    resetForm();
                  }}
                  className="flex-1"
                >
                  Cancel
                </GlassButton>
                <GlassButton
                  onClick={editingAccount ? handleUpdateAccount : handleAddAccount}
                  className="flex-1"
                >
                  {editingAccount ? 'Update' : 'Add'} Account
                </GlassButton>
              </div>
            </div>
          </div>
                 )}

         {/* Link Payment Method Modal */}
         {showLinkPaymentMethod && selectedAccountForLinking && (
           <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
             <div className="bg-white rounded-xl p-6 w-full max-w-4xl">
               <div className="flex items-center justify-between mb-4">
                 <h2 className="text-xl font-bold">
                   Link Payment Methods to {selectedAccountForLinking.name}
                 </h2>
                 <button
                   onClick={() => {
                     setShowLinkPaymentMethod(false);
                     setSelectedAccountForLinking(null);
                   }}
                   className="text-gray-400 hover:text-gray-600"
                 >
                   <X className="w-5 h-5" />
                 </button>
               </div>
               
               <div className="space-y-4">
                 <p className="text-sm text-gray-600 mb-4">
                   Select payment methods to link to this account. When customers pay using these methods, 
                   the money will be recorded in this account.
                 </p>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {paymentMethods.map((method) => {
                     const isLinked = getLinkedPaymentMethods(selectedAccountForLinking.id)
                       .some(link => link.payment_method_id === method.id);
                     const isDefault = getLinkedPaymentMethods(selectedAccountForLinking.id)
                       .some(link => link.payment_method_id === method.id && link.is_default);
                     
                     return (
                       <div key={method.id} className="flex flex-col p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                         <div className="flex items-center gap-3 mb-3">
                           <div 
                             className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm"
                             style={{ backgroundColor: method.color + '20' }}
                           >
                             <span className="text-lg">
                               {method.icon === 'dollar-sign' && '💰'}
                               {method.icon === 'credit-card' && '💳'}
                               {method.icon === 'building' && '🏦'}
                               {method.icon === 'smartphone' && '📱'}
                               {method.icon === 'truck' && '🚚'}
                               {method.icon === 'globe' && '🌐'}
                               {method.icon === 'file-text' && '📄'}
                               {method.icon === 'calendar' && '📅'}
                               {method.icon === 'package' && '📦'}
                               {!['dollar-sign', 'credit-card', 'building', 'smartphone', 'truck', 'globe', 'file-text', 'calendar', 'package'].includes(method.icon) && '💳'}
                             </span>
                           </div>
                           <div className="flex-1">
                             <span className="font-medium text-gray-900 text-sm">{method.name}</span>
                             <p className="text-xs text-gray-500 mt-1">{method.description}</p>
                           </div>
                         </div>
                         
                         <div className="flex items-center justify-between">
                           {isLinked ? (
                             <div className="flex items-center gap-2 w-full">
                               {isDefault && (
                                 <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full font-medium flex items-center gap-1">
                                   <Star className="w-3 h-3" />
                                   Default
                                 </span>
                               )}
                               <GlassButton
                                 variant="danger"
                                 size="sm"
                                 onClick={() => handleUnlinkPaymentMethod(method.id, selectedAccountForLinking.id)}
                                 className="flex-1"
                               >
                                 <X className="w-3 h-3 mr-1" />
                                 Unlink
                               </GlassButton>
                             </div>
                           ) : (
                             <GlassButton
                               variant="primary"
                               size="sm"
                               onClick={() => handleLinkPaymentMethod(method.id, selectedAccountForLinking.id)}
                               className="w-full"
                             >
                               <Plus className="w-3 h-3 mr-1" />
                               Link
                             </GlassButton>
                           )}
                         </div>
                       </div>
                     );
                   })}
                 </div>
               </div>
             </div>
           </div>
         )}
       </div>
     </Modal>
   );
 };

export default PaymentsAccountsModal; 