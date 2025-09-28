import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp, 
  MessageCircle, 
  Users, 
  Calendar,
  ChevronRight,
  Activity,
  Clock,
  Send,
  CheckCircle
} from 'lucide-react';
import { supabase } from '../../../../lib/supabaseClient';
import { toast } from '../../../../lib/toastUtils';

interface ChartData {
  date: string;
  messages: number;
  customers: number;
  delivered: number;
  customerIds?: string[];
}

interface TopCustomer {
  id: string;
  name: string;
  phone: string;
  messageCount: number;
  lastMessage: string;
  lastMessageTime: string;
}

interface InteractiveMessageChartsProps {
  timeRange?: '7d' | '30d' | '90d' | '1y';
  onNavigateToChat?: (customerId?: string) => void;
}

const InteractiveMessageCharts: React.FC<InteractiveMessageChartsProps> = ({
  timeRange = '7d',
  onNavigateToChat
}) => {
  const navigate = useNavigate();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalMessages, setTotalMessages] = useState(0);
  const [averageResponseTime, setAverageResponseTime] = useState(0);
  const [deliveryRate, setDeliveryRate] = useState(0);

  // Generate sample chart data (in a real app, this would come from your database)
  const generateChartData = (days: number): ChartData[] => {
    const data: ChartData[] = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Generate realistic sample data
      const messages = Math.floor(Math.random() * 50) + 10;
      const customers = Math.floor(messages / 3) + Math.floor(Math.random() * 5);
      const delivered = Math.floor(messages * (0.85 + Math.random() * 0.1));
      
      data.push({
        date: date.toISOString().split('T')[0],
        messages,
        customers,
        delivered,
        customerIds: [] // Would contain actual customer IDs
      });
    }
    
    return data;
  };

  // Load chart data from database
  const loadChartData = async () => {
    try {
      setLoading(true);
      
      if (!supabase) {
        console.error('❌ Database connection not available');
        return;
      }

      // Check if user is authenticated
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.log('⚠️ User not authenticated, using sample data');
        // Use sample data when not authenticated
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
        const sampleData = generateChartData(days);
        setChartData(sampleData);
        setTotalMessages(sampleData.reduce((sum, day) => sum + day.messages, 0));
        setDeliveryRate(92); // Sample delivery rate
        setLoading(false);
        return;
      }

      // Calculate date range
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Load chat messages data
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select(`
          id,
          content,
          sender,
          timestamp,
          status,
          customer_id,
          customers(id, name, phone, email)
        `)
        .eq('user_id', user.id)
        .gte('timestamp', startDate.toISOString())
        .order('timestamp', { ascending: true });

      if (messagesError) {
        console.error('❌ Error loading messages:', messagesError);
        toast.error('Failed to load message data');
        // Fallback to sample data
        const sampleData = generateChartData(days);
        setChartData(sampleData);
        setTotalMessages(sampleData.reduce((sum, day) => sum + day.messages, 0));
        setDeliveryRate(92);
        setLoading(false);
        return;
      }

      // Process data for charts
      const processedData = processMessagesForChart(messages || [], days);
      setChartData(processedData);

      // Calculate metrics
      const total = (messages || []).length;
      setTotalMessages(total);

      const delivered = (messages || []).filter(m => 
        m.status === 'delivered' || m.status === 'read'
      ).length;
      setDeliveryRate(total > 0 ? Math.round((delivered / total) * 100) : 0);

      // Load top customers
      await loadTopCustomers(user.id);

    } catch (error: any) {
      console.error('❌ Exception loading chart data:', error);
      toast.error(`Failed to load analytics data: ${error.message}`);
      
      // Fallback to sample data
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const sampleData = generateChartData(days);
      setChartData(sampleData);
      setTotalMessages(sampleData.reduce((sum, day) => sum + day.messages, 0));
      setDeliveryRate(92);
    } finally {
      setLoading(false);
    }
  };

  // Process messages data for chart visualization
  const processMessagesForChart = (messages: any[], days: number): ChartData[] => {
    const dataMap = new Map<string, ChartData>();
    
    // Initialize all days with zero data
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      dataMap.set(dateStr, {
        date: dateStr,
        messages: 0,
        customers: 0,
        delivered: 0,
        customerIds: []
      });
    }
    
    // Process actual messages
    messages.forEach(message => {
      const dateStr = new Date(message.timestamp).toISOString().split('T')[0];
      const dayData = dataMap.get(dateStr);
      
      if (dayData) {
        dayData.messages++;
        if (message.status === 'delivered' || message.status === 'read') {
          dayData.delivered++;
        }
        if (message.customer_id && !dayData.customerIds?.includes(message.customer_id)) {
          dayData.customerIds?.push(message.customer_id);
          dayData.customers++;
        }
      }
    });
    
    return Array.from(dataMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  };

  // Load top customers by message count
  const loadTopCustomers = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          customer_id,
          customers!inner(id, name, phone),
          timestamp
        `)
        .eq('user_id', userId)
        .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) {
        console.error('❌ Error loading top customers:', error);
        return;
      }

      // Group by customer and count messages
      const customerMap = new Map<string, TopCustomer>();
      
      data?.forEach(message => {
        const customerId = message.customer_id;
        const customer = message.customers;
        
        if (!customerMap.has(customerId)) {
          customerMap.set(customerId, {
            id: customerId,
            name: customer.name || 'Unknown',
            phone: customer.phone || '',
            messageCount: 0,
            lastMessage: '',
            lastMessageTime: message.timestamp
          });
        }
        
        const customerData = customerMap.get(customerId)!;
        customerData.messageCount++;
        
        if (new Date(message.timestamp) > new Date(customerData.lastMessageTime)) {
          customerData.lastMessageTime = message.timestamp;
        }
      });

      // Sort by message count and take top 5
      const topCustomersList = Array.from(customerMap.values())
        .sort((a, b) => b.messageCount - a.messageCount)
        .slice(0, 5);

      setTopCustomers(topCustomersList);
    } catch (error) {
      console.error('❌ Exception loading top customers:', error);
    }
  };

  // Load data when component mounts or timeRange changes
  useEffect(() => {
    loadChartData();
  }, [timeRange]);

  // Handle navigation to chat
  const handleNavigateToChat = (customerId?: string) => {
    if (onNavigateToChat) {
      onNavigateToChat(customerId);
    } else {
      navigate('/lats/whatsapp-chat' + (customerId ? `?customerId=${customerId}` : ''));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div 
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleNavigateToChat()}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Messages</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalMessages}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div 
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleNavigateToChat()}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Delivery Rate</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{deliveryRate}%</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div 
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleNavigateToChat()}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Active Customers</p>
              <p className="text-2xl font-bold text-purple-600 mt-1">{topCustomers.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div 
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleNavigateToChat()}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Avg Response</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{averageResponseTime}m</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Top Customers */}
      {topCustomers.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Customers</h3>
            <button
              onClick={() => handleNavigateToChat()}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
            >
              View All
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            {topCustomers.map((customer, index) => (
              <div
                key={customer.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleNavigateToChat(customer.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium text-sm">
                      {customer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    <p className="text-sm text-gray-500">{customer.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{customer.messageCount} messages</p>
                  <p className="text-sm text-gray-500">
                    {new Date(customer.lastMessageTime).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sample Data Notice */}
      {totalMessages === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-blue-900">No chat data yet</p>
              <p className="text-sm text-blue-700">
                Start chatting with customers to see analytics here. 
                <button
                  onClick={() => handleNavigateToChat()}
                  className="underline hover:no-underline ml-1"
                >
                  Go to WhatsApp Chat
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveMessageCharts;