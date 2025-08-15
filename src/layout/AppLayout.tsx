import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDevices } from '../context/DevicesContext';
import { useCustomers } from '../context/CustomersContext';

import AddCustomerModal from '../features/customers/components/forms/AddCustomerModal';
import TopBar from '../features/shared/components/TopBar';
import GlobalSearchShortcut from '../features/shared/components/GlobalSearchShortcut';

import AdHeader from '../features/shared/components/AdHeader';
import ActivityCounter from '../features/shared/components/ui/ActivityCounter';
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
  DollarSign,
  Stethoscope,
  Plus,
  Receipt,
  Sparkles,
  Package,
  TestTube,
  ShoppingCart,
  Calendar,
  Briefcase,
  UserCheck,
  TrendingUp,
  Smartphone as MobileIcon,
  Clock,
} from 'lucide-react';
import GlassButton from '../features/shared/components/ui/GlassButton';

const AppLayout: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { devices } = useDevices();
  const { customers } = useCustomers();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNavCollapsed, setIsNavCollapsed] = useState(true);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're on the POS page
  const isOnPOSPage = location.pathname === '/pos';

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

    return {
      totalDevices,
      activeDevices,
      recentDevices,
      overdueDevices,
      recentCustomers,
      newCustomers
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

      // Core Business Operations
      {
        path: '/devices',
        label: 'Devices',
        icon: <Smartphone size={20} />,
        roles: ['admin', 'customer-care', 'technician'],
        count: activityCounts.activeDevices
      },
      {
        path: '/pos',
        label: 'POS System',
        icon: <ShoppingCart size={20} />,
        roles: ['admin', 'customer-care']
      },
      {
        path: '/lats/unified-inventory',
        label: 'Unified Inventory',
        icon: <Package size={20} />,
        roles: ['admin', 'customer-care']
      },

      // Customer Management
      {
        path: '/customers',
        label: 'Customers',
        icon: <Users size={20} />,
        roles: ['admin', 'customer-care'],
        count: activityCounts.newCustomers
      },
      {
        path: '/appointments',
        label: 'Appointments',
        icon: <Calendar size={20} />,
        roles: ['admin', 'customer-care']
      },
      {
        path: '/services',
        label: 'Service Management',
        icon: <Briefcase size={20} />,
        roles: ['admin', 'customer-care']
      },

      // Business Management
      {
        path: '/business',
        label: 'Business Management',
        icon: <BarChart2 size={20} />,
        roles: ['admin', 'manager', 'customer-care']
      },

      // Employee & User Management
      {
        path: '/employees',
        label: 'Employee Management',
        icon: <Users size={20} />,
        roles: ['admin', 'manager']
      },
      {
        path: '/attendance',
        label: 'My Attendance',
        icon: <Clock size={20} />,
        roles: ['admin', 'manager', 'technician', 'customer-care']
      },

      // Admin Management
      {
        path: '/admin',
        label: 'Admin Management',
        icon: <Settings size={20} />,
        roles: ['admin']
      },

      // Diagnostics (Role-specific)
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
      }
    ];
    
    return items.filter(item => item.roles.includes(currentUser.role));
  };

  const navItems = getNavItems();

  // If on POS page, render without TopBar and sidebar
  if (isOnPOSPage) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'transparent' }}>
        {/* Main Content - Full width for POS */}
        <main className="min-h-screen relative z-10 pt-0 pb-8">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'transparent' }}>
      <TopBar 
        onMenuToggle={() => setIsMenuOpen(!isMenuOpen)}
        isMenuOpen={isMenuOpen}
        isNavCollapsed={isNavCollapsed}
      />
      
      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}
      

      
      {/* Sidebar */}
      <div
        className={`
          fixed top-0 bottom-0 left-0 z-40 w-64 md:w-72 
          bg-white/80 backdrop-blur-xl border-r border-white/30 shadow-xl
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
            p-6 border-b border-white/20 flex items-center bg-white/20
            ${isNavCollapsed ? 'justify-center' : ''}
          `}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg">
                <Smartphone className={`h-6 w-6 ${isNavCollapsed ? 'scale-90' : ''}`} />
              </div>
              <div className={`transition-opacity duration-300 ${isNavCollapsed ? 'md:hidden' : ''} min-w-0 flex-1`}>
                <h1 className="font-bold text-xl text-gray-900 truncate">Repair Shop</h1>
                <p className="text-sm text-gray-600 truncate">Management System</p>
              </div>
            </div>
          </div>
          

           
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
                        ? 'bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-700 font-medium shadow-sm backdrop-blur-sm border border-blue-200/30'
                        : 'text-gray-700 hover:bg-white/40 hover:text-gray-900'
                      }
                    `}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span className={`
                      ${location.pathname === item.path ? 'text-blue-600' : 'text-blue-500'}
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
                        ml-auto text-blue-500
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
              bg-gradient-to-br from-gray-100 to-gray-50
              backdrop-blur-sm mb-4 
              ${isNavCollapsed ? 'justify-center' : ''}
            `}>
              <div className="p-2 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 text-white shadow-lg">
                <User size={20} />
              </div>
              <div className={`transition-opacity duration-300 ${isNavCollapsed ? 'md:hidden' : ''} min-w-0 flex-1`}>
                <p className="font-medium text-gray-900 truncate">{currentUser.name}</p>
                <p className="text-sm text-gray-600 capitalize truncate">{currentUser.role.replace('-', ' ')}</p>
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
      <main className={`transition-all duration-500 min-h-screen relative z-10 pt-0 pb-8 ${isNavCollapsed ? 'md:ml-[5.5rem]' : 'md:ml-72'}`}>
        <Outlet />
        

        {/* Only show modals for users with permissions */}
        {(currentUser.role === 'admin' || currentUser.role === 'customer-care') && (
          <>
            <AddCustomerModal
              isOpen={showAddCustomer}
              onClose={() => setShowAddCustomer(false)}
            />
          </>
        )}
        
        {/* Global Search Shortcut */}
        <GlobalSearchShortcut />

      </main>
    </div>
  );
};

export default AppLayout;