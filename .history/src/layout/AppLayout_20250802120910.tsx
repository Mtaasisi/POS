import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDevices } from '../context/DevicesContext';
import { useCustomers } from '../context/CustomersContext';
import FloatingActionButton from '../components/ui/FloatingActionButton';
import AddCustomerModal from '../components/forms/AddCustomerModal';

import AdHeader from '../components/AdHeader';
import ActivityCounter from '../components/ui/ActivityCounter';
import {
  LayoutDashboard, 
  LogOut, 
  Menu, 
  Smartphone, 
  X, 
  Settings,
  Users,
  User, 
  ChevronRight as ChevronRightIcon,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  MessageSquare,
  RotateCcw,
  BarChart2,
  CreditCard,
  Monitor,
  FileText,
  Building,
  ShoppingBag,
  DollarSign,
  Stethoscope,
  Plus,
  Receipt,
  Sparkles,
  Package,
  TestTube,
} from 'lucide-react';
import GlassButton from '../components/ui/GlassButton';

const AppLayout: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { devices } = useDevices();
  const { customers } = useCustomers();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Calculate activity counts
  const getActivityCounts = () => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Total devices
    const totalDevices = devices.length;

    // Active devices (not done or failed)
    const activeDevices = devices.filter(device => {
      return device.status !== 'done' && device.status !== 'failed';
    }).length;

    // Recent devices (last 24 hours)
    const recentDevices = devices.filter(device => {
      const deviceDate = new Date(device.createdAt || device.updatedAt);
      return deviceDate > oneDayAgo;
    }).length;

    // Overdue devices
    const overdueDevices = devices.filter(device => {
      if (device.status === 'done' || device.status === 'failed') return false;
      if (!device.expectedReturnDate) return false;
      const dueDate = new Date(device.expectedReturnDate);
      return dueDate < now;
    }).length;

    // Recent customers (last week)
    const recentCustomers = customers.filter(customer => {
      if (!customer.created_at) return false;
      const customerDate = new Date(customer.created_at);
      return customerDate > oneWeekAgo;
    }).length;

    // New customers (unread)
    const newCustomers = customers.filter(customer => {
      return customer.isRead === false || customer.isRead === undefined;
    }).length;

    // Due today devices
    const dueTodayDevices = devices.filter(device => {
      if (device.status === 'done' || device.status === 'failed') return false;
      if (!device.expectedReturnDate) return false;
      const dueDate = new Date(device.expectedReturnDate);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return dueDate.getTime() === today.getTime();
    }).length;

    return {
      totalDevices,
      activeDevices,
      recentDevices,
      overdueDevices,
      recentCustomers,
      newCustomers,
      dueTodayDevices
    };
  };

  const activityCounts = getActivityCounts();

  if (!currentUser) {
    localStorage.setItem('postLoginRedirect', location.pathname);
    navigate('/login');
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };



  const getNavItems = () => {
    const items = [
      {
        path: '/dashboard',
        label: 'Dashboard',
        icon: <LayoutDashboard size={20} />,
        roles: ['admin', 'customer-care', 'technician'],
        count: activityCounts.activeDevices
      },
      {
        path: '/admin-dashboard',
        label: 'Admin Dashboard',
        icon: <BarChart2 size={20} />,
        roles: ['admin'],
        count: activityCounts.overdueDevices
      },

      {
        path: '/finance',
        label: 'Finance Management',
        icon: <DollarSign size={20} />,
        roles: ['admin']
      },
      // {
      //   path: '/payments-report',
      //   label: 'Payments',
      //   icon: <Receipt size={20} />,
      //   roles: ['admin', 'customer-care']
      // },
      // {
      //   path: '/brand-management',
      //   label: 'Brand Management',
      //   icon: <Settings size={20} />,
      //   roles: ['admin']
      // },
      // {
      //   path: '/category-management',
      //   label: 'Category Management',
      //   icon: <Building size={20} />,
      //   roles: ['admin']
      // },
      {
        path: '/customers',
        label: 'Customers',
        icon: <Users size={20} />,
        roles: ['admin', 'customer-care'],
        count: activityCounts.newCustomers
      },
      {
        path: '/inventory',
        label: 'Inventory',
        icon: <Package size={20} />,
        roles: ['admin', 'customer-care']
      },
      {
        path: '/spare-parts',
        label: 'Spare Parts',
        icon: <Package size={20} />,
        roles: ['admin', 'technician']
      },
      {
        path: '/sms',
        label: 'SMS Centre',
        icon: <MessageSquare size={20} />,
        roles: ['admin']
      },
      {
        path: '/diagnostics/assigned',
        label: 'My Diagnostics',
        icon: <Stethoscope size={20} />,
        roles: ['technician']
      },
      {
        path: '/diagnostics/reports',
        label: 'Diagnostic Reports',
        icon: <Stethoscope size={20} />,
        roles: ['admin']
      },
      {
        path: '/diagnostics/my-requests',
        label: 'My Diagnostic Requests',
        icon: <Stethoscope size={20} />,
        roles: ['customer-care']
      },
      {
        path: '/diagnostics/new',
        label: 'New Diagnostic Request',
        icon: <Plus size={20} />,
        roles: ['customer-care']
      },

      {
        path: '/backup-management',
        label: 'Backup Management',
        icon: <RotateCcw size={20} />,
        roles: ['admin']
      },
      {
        path: '/settings',
        label: 'Settings',
        icon: <Settings size={20} />,
        roles: ['admin']
      }
    ];
    
    return items.filter(item => item.roles.includes(currentUser.role));
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'transparent' }}>
      {/* Fixed Ad Header Topbar - DISABLED */}
      {/* <div className="fixed top-0 left-0 right-0 z-40">
        <div className={`transition-all duration-500 ${isNavCollapsed ? 'md:ml-[5.5rem]' : 'md:ml-72'}`}>
          <AdHeader />
        </div>
      </div> */}
      
      {/* Mobile Header - Enhanced */}
      <header className="sticky top-0 z-20 backdrop-blur-xl original-theme:bg-white/60 original-theme:border-gray-200 dark-theme:bg-white/10 dark-theme:border-white/20 shadow-lg p-4 md:hidden">
        <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="p-2 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg flex-shrink-0">
                <Smartphone className="h-5 w-5" />
              </div>
              <span className="font-bold original-theme:text-gray-900 dark-theme:text-white truncate">Repair Shop</span>
            </div>
          
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-lg bg-white/30 hover:bg-white/50 transition-all duration-300 backdrop-blur-sm"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>
      
      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 md:w-72 
        bg-white/10 backdrop-blur-xl border-r border-white/20 shadow-xl
        transition-all duration-500 transform
        ${isMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} 
        ${isNavCollapsed ? 'md:w-[5.5rem]' : 'md:w-72'}
        sidebar-hover
      `}
        onMouseEnter={() => {
          if (window.innerWidth >= 768 && isNavCollapsed) setIsNavCollapsed(false);
        }}
        onMouseLeave={() => {
          if (window.innerWidth >= 768 && !isNavCollapsed) setIsNavCollapsed(true);
        }}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className={`
            p-6 border-b border-white/20 flex items-center bg-white/10
            ${isNavCollapsed ? 'justify-center' : ''}
          `}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg">
                <Smartphone className={`h-6 w-6 ${isNavCollapsed ? 'scale-90' : ''}`} />
              </div>
              <div className={`transition-opacity duration-300 ${isNavCollapsed ? 'md:hidden' : ''} min-w-0 flex-1`}>
                <h1 className="font-bold text-xl text-white truncate">Repair Shop</h1>
                <p className="text-sm text-gray-300 truncate">Management System</p>
              </div>
            </div>
          </div>
          
          {/* Toggle Button */}
          <button
            onClick={() => setIsNavCollapsed(!isNavCollapsed)}
            className={`
              hidden md:flex items-center justify-center 
              fixed top-8 z-50
              w-8 h-8 rounded-full
              bg-gradient-to-br from-blue-500/40 to-indigo-500/40
              hover:from-blue-500/50 hover:to-indigo-500/50
              border border-white/40
              text-white
              shadow-lg backdrop-blur-md
              transition-all duration-500
              hover:scale-105 hover:rotate-180
              hover:shadow-blue-500/20 hover:shadow-xl
              group
              ${isNavCollapsed ? 'left-[4.25rem]' : 'left-[16.5rem]'}
            `}
          >
            {isNavCollapsed ? (
              <ChevronRight size={16} className="group-hover:scale-110 transition-transform duration-300" />
            ) : (
              <ChevronLeft size={16} className="group-hover:scale-110 transition-transform duration-300" />
            )}
          </button>
           
          {/* Navigation */}
          <nav className={`flex-1 ${isNavCollapsed ? 'p-2' : 'p-4'} overflow-y-auto`}>
            <ul className="space-y-1">
              {navItems.map(item => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300
                      ${isNavCollapsed ? 'justify-center' : ''}
                      ${location.pathname === item.path
                        ? 'bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-white font-medium shadow-sm backdrop-blur-sm border border-blue-300/30'
                        : 'text-white hover:bg-white/20 hover:text-white'
                      }
                    `}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className={`
                      ${location.pathname === item.path ? 'text-blue-300' : 'text-blue-200'}
                      ${isNavCollapsed ? 'w-8 h-8 flex items-center justify-center' : ''}
                      relative
                    `}>
                      {item.icon}
                      
                      {/* Activity Counter - Compact mode for collapsed sidebar */}
                      {item.count && item.count > 0 && isNavCollapsed && (
                        <ActivityCounter 
                          count={item.count} 
                          compact={true}
                        />
                      )}
                    </span>
                    <span className={`transition-opacity duration-300 ${isNavCollapsed ? 'md:hidden' : ''} flex-1`}>
                      {item.label}
                    </span>
                    
                    {/* Activity Counter - Normal mode for expanded sidebar */}
                    {item.count && item.count > 0 && !isNavCollapsed && (
                      <ActivityCounter 
                        count={item.count} 
                        className={`${isNavCollapsed ? 'md:hidden' : ''}`}
                      />
                    )}
                    
                    {location.pathname === item.path && (
                      <ChevronRightIcon size={16} className={`
                        ml-auto text-blue-300
                        ${isNavCollapsed ? 'md:hidden' : ''}
                      `} />
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* User Profile & Logout */}
          <div className={`${isNavCollapsed ? 'p-2' : 'p-4'} border-t border-white/20`}>
            <div className={`
              flex items-center gap-3 p-2 rounded-lg
              bg-white/10 backdrop-blur-sm mb-4 
              ${isNavCollapsed ? 'justify-center' : ''}
            `}>
              <div className="p-2 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 text-white shadow-lg">
                <User size={20} />
              </div>
              <div className={`transition-opacity duration-300 ${isNavCollapsed ? 'md:hidden' : ''} min-w-0 flex-1`}>
                <p className="font-medium text-white truncate">{currentUser.name}</p>
                <p className="text-sm text-gray-300 capitalize truncate">{currentUser.role.replace('-', ' ')}</p>
              </div>
            </div>
            
            <GlassButton
              onClick={handleLogout} 
              variant="danger"
              className={`w-full ${isNavCollapsed ? 'justify-center px-0' : 'justify-start'}`}
            >
              <LogOut size={18} />
              <span className={`transition-opacity duration-300 ${isNavCollapsed ? 'md:hidden' : ''}`}>
                Logout
              </span>
            </GlassButton>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <main className={`transition-all duration-500 min-h-screen relative z-10 pt-4 md:pt-16 pb-8 ${isNavCollapsed ? 'md:ml-[5.5rem]' : 'md:ml-72'}`}>
        <Outlet />
        
        {/* Only show floating action button for users with permissions */}
        {(currentUser.role === 'admin' || currentUser.role === 'customer-care') && (
          <FloatingActionButton
            onAddCustomer={() => setShowAddCustomer(true)}
            onAddDevice={() => navigate('/devices/new')}
          />
        )}
        {/* Only show modals for users with permissions */}
        {(currentUser.role === 'admin' || currentUser.role === 'customer-care') && (
          <>
            <AddCustomerModal
              isOpen={showAddCustomer}
              onClose={() => setShowAddCustomer(false)}
            />
          </>
        )}
        

      </main>
    </div>
  );
};

export default AppLayout;