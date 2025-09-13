// CustomerList component for LATS module
import React, { useState } from 'react';
import { LATS_CLASSES } from '../../tokens';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import GlassBadge from '../ui/GlassBadge';
import LoadingSkeleton from '../ui/LoadingSkeleton';
import EmptyState from '../ui/EmptyState';
import CustomerCard from './CustomerCard';
import { t } from '../../lib/i18n/t';
import { format } from '../../lib/format';
import { Customer } from '../../../types';

interface CustomerListProps {
  customers: Customer[];
  loading?: boolean;
  error?: string | null;
  onEdit?: (customer: Customer) => void;
  onView?: (customer: Customer) => void;
  onDelete?: (customer: Customer) => void;
  onContact?: (customer: Customer, method: string) => void;
  onSelect?: (customer: Customer) => void;
  selectedCustomers?: string[];
  viewMode?: 'grid' | 'list' | 'table';
  variant?: 'default' | 'compact' | 'minimal';
  showActions?: boolean;
  showSelection?: boolean;
  className?: string;
}

const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  loading = false,
  error = null,
  onEdit,
  onView,
  onDelete,
  onContact,
  onSelect,
  selectedCustomers = [],
  viewMode = 'grid',
  variant = 'default',
  showActions = true,
  showSelection = false,
  className = ''
}) => {
  const [sortBy, setSortBy] = useState<'name' | 'joinedDate' | 'totalSpent' | 'points'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Handle sort change
  const handleSortChange = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Sort customers
  const sortedCustomers = [...customers].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'joinedDate':
        aValue = new Date(a.joinedDate).getTime();
        bValue = new Date(b.joinedDate).getTime();
        break;
      case 'totalSpent':
        aValue = a.totalSpent || 0;
        bValue = b.totalSpent || 0;
        break;
      case 'points':
        aValue = a.points || 0;
        bValue = b.points || 0;
        break;
      default:
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Handle customer selection
  const handleCustomerSelect = (customer: Customer) => {
    onSelect?.(customer);
  };

  // Get sort icon
  const getSortIcon = (field: typeof sortBy) => {
    if (sortBy !== field) {
      return (
        <svg className="w-4 h-4 text-lats-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4 text-lats-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-lats-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {Array.from({ length: 6 }).map((_, index) => (
          <LoadingSkeleton key={index} className="h-24" />
        ))}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <EmptyState
        title="Error Loading Customers"
        description={error}
        icon={
          <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        actions={[
          {
            label: 'Try Again',
            onClick: () => window.location.reload(),
            variant: 'primary'
          }
        ]}
      />
    );
  }

  // Empty state
  if (customers.length === 0) {
    return (
      <EmptyState
        title="No Customers Found"
        description="No customers match your current search criteria. Try adjusting your filters or add a new customer."
        icon={
          <svg className="w-12 h-12 text-lats-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        }
        actions={[
          {
            label: 'Add Customer',
            onClick: () => window.location.href = '/customers/new',
            variant: 'primary'
          }
        ]}
      />
    );
  }

  // Grid view
  if (viewMode === 'grid') {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${className}`}>
        {sortedCustomers.map((customer) => (
          <CustomerCard
            key={customer.id}
            customer={customer}
            onEdit={onEdit}
            onView={onView}
            onDelete={onDelete}
            onContact={onContact}
            onSelect={showSelection ? handleCustomerSelect : undefined}
            selected={selectedCustomers.includes(customer.id)}
            variant={variant}
            showActions={showActions}
          />
        ))}
      </div>
    );
  }

  // List view
  if (viewMode === 'list') {
    return (
      <div className={`space-y-2 ${className}`}>
        {sortedCustomers.map((customer) => (
          <CustomerCard
            key={customer.id}
            customer={customer}
            onEdit={onEdit}
            onView={onView}
            onDelete={onDelete}
            onContact={onContact}
            onSelect={showSelection ? handleCustomerSelect : undefined}
            selected={selectedCustomers.includes(customer.id)}
            variant="compact"
            showActions={showActions}
          />
        ))}
      </div>
    );
  }

  // Table view
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Table Header */}
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-lats-glass-border">
                {showSelection && (
                  <th className="text-left p-4">
                    <input
                      type="checkbox"
                      className="rounded border-lats-glass-border text-lats-primary focus:ring-lats-primary/50"
                      checked={selectedCustomers.length === customers.length && customers.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onSelect && customers.forEach(customer => onSelect(customer));
                        } else {
                          onSelect && customers.forEach(customer => onSelect(customer));
                        }
                      }}
                    />
                  </th>
                )}
                <th className="text-left p-4">
                  <button
                    onClick={() => handleSortChange('name')}
                    className="flex items-center gap-2 text-sm font-medium text-lats-text hover:text-lats-primary transition-colors"
                  >
                    Name
                    {getSortIcon('name')}
                  </button>
                </th>
                <th className="text-left p-4 text-sm font-medium text-lats-text">Contact</th>
                <th className="text-left p-4 text-sm font-medium text-lats-text">Location</th>
                <th className="text-left p-4">
                  <button
                    onClick={() => handleSortChange('points')}
                    className="flex items-center gap-2 text-sm font-medium text-lats-text hover:text-lats-primary transition-colors"
                  >
                    Points
                    {getSortIcon('points')}
                  </button>
                </th>
                <th className="text-left p-4">
                  <button
                    onClick={() => handleSortChange('totalSpent')}
                    className="flex items-center gap-2 text-sm font-medium text-lats-text hover:text-lats-primary transition-colors"
                  >
                    Total Spent
                    {getSortIcon('totalSpent')}
                  </button>
                </th>
                <th className="text-left p-4">
                  <button
                    onClick={() => handleSortChange('joinedDate')}
                    className="flex items-center gap-2 text-sm font-medium text-lats-text hover:text-lats-primary transition-colors"
                  >
                    Joined
                    {getSortIcon('joinedDate')}
                  </button>
                </th>
                <th className="text-left p-4 text-sm font-medium text-lats-text">Status</th>
                {showActions && (
                  <th className="text-left p-4 text-sm font-medium text-lats-text">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {sortedCustomers.map((customer) => (
                <tr key={customer.id} className="border-b border-lats-glass-border/50 hover:bg-lats-surface/30 transition-colors">
                  {showSelection && (
                    <td className="p-4">
                      <input
                        type="checkbox"
                        className="rounded border-lats-glass-border text-lats-primary focus:ring-lats-primary/50"
                        checked={selectedCustomers.includes(customer.id)}
                        onChange={() => handleCustomerSelect(customer)}
                      />
                    </td>
                  )}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {customer.profileImage && (
                        <img
                          src={customer.profileImage}
                          alt={customer.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <div className="font-medium text-lats-text">{customer.name}</div>
                        <div className="text-sm text-lats-text-secondary">{customer.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      <div className="text-lats-text">{customer.phone}</div>
                      {customer.whatsapp && (
                        <div className="text-lats-text-secondary">WhatsApp: {customer.whatsapp}</div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-lats-text">{customer.city || 'N/A'}</div>
                  </td>
                  <td className="p-4">
                    <GlassBadge variant="primary" size="sm">
                      {customer.points || 0} pts
                    </GlassBadge>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-medium text-lats-text">
                      {format.currency(customer.totalSpent || 0)}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-lats-text-secondary">
                      {format.date(customer.joinedDate)}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <GlassBadge
                        variant={customer.isActive ? 'success' : 'error'}
                        size="sm"
                      >
                        {customer.isActive ? 'Active' : 'Inactive'}
                      </GlassBadge>
                      <GlassBadge
                        variant={customer.colorTag === 'vip' ? 'warning' : 'ghost'}
                        size="sm"
                      >
                        {customer.colorTag}
                      </GlassBadge>
                    </div>
                  </td>
                  {showActions && (
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {onView && (
                          <GlassButton
                            variant="ghost"
                            size="sm"
                            onClick={() => onView(customer)}
                            icon={
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            }
                          />
                        )}
                        {onEdit && (
                          <GlassButton
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(customer)}
                            icon={
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            }
                          />
                        )}
                        {onDelete && (
                          <GlassButton
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(customer)}
                            icon={
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            }
                          />
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

export default CustomerList;
