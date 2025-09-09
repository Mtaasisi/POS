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

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('❌ User not authenticated');
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
          customers!inner(id, name, phone, email)
        `)
        .eq('user_id', user.id)
        .gte('timestamp', startDate.toISOString())
        .order('timestamp', { ascending: true });

      if (messagesError) {
        console.error('❌ Error loading messages:', messagesError);
        toast.error('Failed to load message data');
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
    } finally {
      setLoading(false);
    }
  };

  // Process messages data for chart visualization
  const processMessagesForChart = (messages: any[], days: number): ChartData[] => {
    const dataMap = new Map<string, ChartData>();
    
    // Initialize all days with zero data
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      
      dataMap.set(dateKey, {
        date: dateKey,
        messages: 0,
        customers: 0,
        delivered: 0,
        customerIds: []
      });
    }
    
    // Process actual messages
    const customersByDate = new Map<string, Set<string>>();
    
    messages.forEach(message => {
      const messageDate = new Date(message.timestamp).toISOString().split('T')[0];
      const existing = dataMap.get(messageDate);
      
      if (existing) {
        existing.messages += 1;
        existing.customerIds?.push(message.customer_id);
        
        if (message.status === 'delivered' || message.status === 'read') {
          existing.delivered += 1;
        }
        
        // Track unique customers per day
        if (!customersByDate.has(messageDate)) {
          customersByDate.set(messageDate, new Set());
        }
        customersByDate.get(messageDate)?.add(message.customer_id);
      }
    });
    
    // Update customer counts
    customersByDate.forEach((customers, date) => {
      const existing = dataMap.get(date);
      if (existing) {
        existing.customers = customers.size;
      }
    });
    
    return Array.from(dataMap.values());
  };

  // Load top customers by message count
  const loadTopCustomers = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          customer_id,
          content,
          timestamp,
          customers!inner(id, name, phone, email)
        `)
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      if (error) {
        console.error('❌ Error loading top customers:', error);
        return;
      }

      // Group by customer and count messages
      const customerMap = new Map<string, any>();
      
      (data || []).forEach(message => {
        const customerId = message.customer_id;
        const customer = message.customers;
        
        if (!customerMap.has(customerId)) {
          customerMap.set(customerId, {
            id: customerId,
            name: customer.name || 'Unknown Customer',
            phone: customer.phone || '',
            messageCount: 0,
            lastMessage: message.content,
            lastMessageTime: message.timestamp
          });
        }
        
        customerMap.get(customerId).messageCount += 1;
      });
      
      // Convert to array and sort by message count
      const topCustomersList = Array.from(customerMap.values())
        .sort((a, b) => b.messageCount - a.messageCount)
        .slice(0, 5);
      
      setTopCustomers(topCustomersList);
      
    } catch (error: any) {
      console.error('❌ Exception loading top customers:', error);
    }
  };

  useEffect(() => {
    loadChartData();
  }, [timeRange]);

  // Handle navigation to chat
  const handleNavigateToChat = (customerId?: string) => {
    if (onNavigateToChat) {
      onNavigateToChat(customerId);
    } else {
      // Navigate to chat page with optional customer selection
      if (customerId) {
        navigate(`/lats/whatsapp-chat?customerId=${customerId}`);
      } else {
        navigate('/lats/whatsapp-chat');
      }
    }
  };

  // Handle chart bar click
  const handleChartBarClick = (data: ChartData) => {
    if (data.customerIds && data.customerIds.length > 0) {
      // If there's only one customer, navigate directly to them
      if (data.customerIds.length === 1) {
        handleNavigateToChat(data.customerIds[0]);
      } else {
        // For multiple customers, just navigate to chat page
        handleNavigateToChat();
        toast(`${data.messages} messages sent on ${new Date(data.date).toLocaleDateString()}`);
      }
    } else {
      handleNavigateToChat();
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-6 bg-gray-50 rounded-xl animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const maxMessages = Math.max(...chartData.map(d => d.messages), 1);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div 
          className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:scale-105"
          onClick={() => handleNavigateToChat()}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Messages</p>
              <p className="text-2xl font-bold">{totalMessages}</p>
            </div>
            <Send size={24} className="text-blue-100" />
          </div>
          <div className="mt-2 flex items-center text-blue-100 text-xs">
            <span>Click to view in chat</span>
            <ChevronRight size={12} className="ml-1" />
          </div>
        </div>

        <div className="p-4 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Delivery Rate</p>
              <p className="text-2xl font-bold">{deliveryRate}%</p>
            </div>
            <CheckCircle size={24} className="text-green-100" />
          </div>
        </div>

        <div 
          className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl cursor-pointer hover:shadow-lg transition-all duration-200 transform hover:scale-105"
          onClick={() => handleNavigateToChat()}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Active Customers</p>
              <p className="text-2xl font-bold">{topCustomers.length}</p>
            </div>
            <Users size={24} className="text-purple-100" />
          </div>
          <div className="mt-2 flex items-center text-purple-100 text-xs">
            <span>Click to view in chat</span>
            <ChevronRight size={12} className="ml-1" />
          </div>
        </div>

        <div className="p-4 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Avg Response Time</p>
              <p className="text-2xl font-bold">{averageResponseTime}min</p>
            </div>
            <Clock size={24} className="text-orange-100" />
          </div>
        </div>
      </div>

      {/* Interactive Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Message Volume Chart */}
        <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Message Volume</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <BarChart3 size={16} />
              <span>Click bars to view chats</span>
            </div>
          </div>
          
          <div className="space-y-3">
            {chartData.map((data, index) => (
              <div 
                key={index}
                className="group cursor-pointer"
                onClick={() => handleChartBarClick(data)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">
                    {new Date(data.date).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {data.messages} messages
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 group-hover:shadow-md transition-all duration-200">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full group-hover:from-blue-600 group-hover:to-blue-700 transition-all duration-200"
                    style={{ 
                      width: `${(data.messages / maxMessages) * 100}%`,
                      minWidth: data.messages > 0 ? '8px' : '0px'
                    }}
                  ></div>
                </div>
                <div className="flex items-center justify-between mt-1 text-xs text-gray-500">
                  <span>{data.customers} customers</span>
                  <span>{data.delivered} delivered</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Customers */}
        <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Top Customers</h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Users size={16} />
              <span>Click to start chat</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {topCustomers.map((customer, index) => (
              <div 
                key={customer.id}
                className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-all duration-200 group border border-transparent hover:border-gray-200"
                onClick={() => handleNavigateToChat(customer.id)}
              >
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm mr-3">
                  {customer.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 truncate group-hover:text-green-600">
                      {customer.name}
                    </h4>
                    <span className="text-sm font-medium text-blue-600">
                      {customer.messageCount} msgs
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {customer.lastMessage}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(customer.lastMessageTime).toLocaleDateString()}
                  </p>
                </div>
                <ChevronRight size={16} className="text-gray-400 group-hover:text-green-500 ml-2" />
              </div>
            ))}
            
            {topCustomers.length === 0 && (
              <div className="text-center py-8">
                <MessageCircle size={32} className="text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No customer data yet</p>
                <button 
                  onClick={() => handleNavigateToChat()}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  Start your first conversation →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <button 
            onClick={() => handleNavigateToChat()}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all in chat →
          </button>
        </div>
        
        <div className="space-y-3">
          {chartData.slice(-3).reverse().map((data, index) => (
            <div 
              key={index}
              className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-all duration-200"
              onClick={() => handleChartBarClick(data)}
            >
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <Activity size={16} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {data.messages} messages sent to {data.customers} customers
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(data.date).toLocaleDateString('en-US', { 
                    weekday: 'long',
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InteractiveMessageCharts;
