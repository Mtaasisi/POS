import React from 'react';
import {
  Clock,
  X,
  Smartphone,
  Users,
  Package,
  FileText,
  Crown,
  CreditCard,
  TrendingUp,
  Warehouse,
  BarChart3,
  Calendar,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';

interface SearchHomeProps {
  recentSearches: string[];
  onSearch: (query: string) => void;
  onRemoveSearch: (query: string) => void;
  userRole: string;
}

const SearchHome: React.FC<SearchHomeProps> = ({
  recentSearches,
  onSearch,
  onRemoveSearch,
  userRole,
}) => {
  const getQuickAccessItems = () => {
    const items = [];

    // Common items for all roles
    items.push(
      { label: 'Active Devices', icon: <Smartphone size={20} />, query: 'status:active', color: 'blue' },
      { label: 'New Customers', icon: <Users size={20} />, query: 'isRead:false', color: 'green' },
      { label: 'Overdue Devices', icon: <Clock size={20} />, query: 'overdue:true', color: 'red' }
    );

    // Role-specific items
    if (userRole === 'admin' || userRole === 'customer-care') {
      items.push(
        { label: 'All Products', icon: <Package size={20} />, query: 'type:product', color: 'purple' },
        { label: 'Recent Sales', icon: <TrendingUp size={20} />, query: 'type:sale', color: 'amber' }
      );
    }

    if (userRole === 'admin') {
      items.push(
        { label: 'Payment Reports', icon: <CreditCard size={20} />, query: 'type:payment', color: 'emerald' },
        { label: 'Loyalty Members', icon: <Crown size={20} />, query: 'type:loyalty', color: 'yellow' },
        { label: 'Inventory Alerts', icon: <Warehouse size={20} />, query: 'low:stock', color: 'orange' },
        { label: 'Sales Reports', icon: <BarChart3 size={20} />, query: 'type:report', color: 'indigo' }
      );
    }

    if (userRole === 'customer-care') {
      items.push(
        { label: 'Customer Issues', icon: <MessageSquare size={20} />, query: 'status:issue', color: 'pink' },
        { label: 'Appointments', icon: <Calendar size={20} />, query: 'type:appointment', color: 'cyan' }
      );
    }

    return items;
  };

  const getSearchCategories = () => {
    const categories = [
      {
        title: 'Devices',
        icon: <Smartphone size={24} />,
        color: 'blue',
        items: [
          { label: 'By Status', query: 'status:' },
          { label: 'By Model', query: 'model:' },
          { label: 'By Customer', query: 'customer:' }
        ]
      },
      {
        title: 'Customers',
        icon: <Users size={24} />,
        color: 'green',
        items: [
          { label: 'By Name', query: 'name:' },
          { label: 'By Phone', query: 'phone:' },
          { label: 'By Email', query: 'email:' },
          { label: 'By Location', query: 'location:' }
        ]
      }
    ];

    if (userRole === 'admin' || userRole === 'customer-care') {
      categories.push({
        title: 'Products',
        icon: <Package size={24} />,
        color: 'purple',
        items: [
          { label: 'By Name', query: 'product:' },
          { label: 'By Category', query: 'category:' },
          { label: 'By Price', query: 'price:' }
        ]
      });
    }

    if (userRole === 'admin') {
      categories.push({
        title: 'Sales & Finance',
        icon: <DollarSign size={24} />,
        color: 'emerald',
        items: [
          { label: 'By Date', query: 'date:' },
          { label: 'By Amount', query: 'amount:' },
          { label: 'By Payment Method', query: 'payment:' },
          { label: 'By Customer', query: 'customer:' }
        ]
      });
    }

    return categories;
  };

  const quickAccessItems = getQuickAccessItems();
  const searchCategories = getSearchCategories();

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Global Search</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Search across all your data - devices, customers, products, sales, and more. 
          Use filters and advanced search operators to find exactly what you need.
        </p>
      </div>

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/30 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={20} className="text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Recent Searches</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((search, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-2 bg-white/70 rounded-full border border-white/40 hover:bg-white/90 transition-all duration-200 cursor-pointer group"
                onClick={() => onSearch(search)}
              >
                <span className="text-sm text-gray-700">{search}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveSearch(search);
                  }}
                  className="p-1 rounded-full hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X size={12} className="text-gray-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Access */}
      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/30 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Access</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {quickAccessItems.map((item, index) => (
            <button
              key={index}
              onClick={() => onSearch(item.query)}
              className="flex items-center gap-3 p-4 rounded-lg bg-white/70 border border-white/40 hover:bg-white/90 hover:shadow-md transition-all duration-200 text-left group"
            >
              <div className={`p-2 rounded-lg bg-${item.color}-100 text-${item.color}-600 group-hover:bg-${item.color}-200 transition-colors`}>
                {item.icon}
              </div>
              <span className="text-sm font-medium text-gray-700">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search Categories */}
      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-white/30 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {searchCategories.map((category, index) => (
            <div key={index} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-${category.color}-100 text-${category.color}-600`}>
                  {category.icon}
                </div>
                <h3 className="font-semibold text-gray-900">{category.title}</h3>
              </div>
              <div className="space-y-2">
                {category.items.map((item, itemIndex) => (
                  <button
                    key={itemIndex}
                    onClick={() => onSearch(item.query)}
                    className="flex items-center gap-2 w-full p-2 rounded-lg hover:bg-white/70 transition-colors text-left group"
                  >
                    <span className="text-sm text-gray-600">{item.label}</span>
                    <ArrowRight size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search Tips */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200/30">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Search Tips</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              <strong>Use filters:</strong> Type "status:active" to find active devices
            </p>
            <p className="text-sm text-gray-600">
              <strong>Search by date:</strong> Type "date:2024-01" to find items from January 2024
            </p>
            <p className="text-sm text-gray-600">
              <strong>Combine terms:</strong> Type "iphone status:active" to find active iPhones
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              <strong>Exact match:</strong> Use quotes for exact phrases: "John Doe"
            </p>
            <p className="text-sm text-gray-600">
              <strong>Price range:</strong> Type "price:1000-5000" to find items in price range
            </p>
            <p className="text-sm text-gray-600">
              <strong>Location search:</strong> Type "location:Nairobi" to find items by location
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchHome;
