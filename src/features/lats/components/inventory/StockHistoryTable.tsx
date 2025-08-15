// StockHistoryTable component for LATS module
import React, { useState, useMemo } from 'react';
import { LATS_CLASSES } from '../../../tokens';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassInput from '../../../features/shared/components/ui/GlassInput';
import GlassSelect from '../../../features/shared/components/ui/GlassSelect';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import GlassBadge from '../../../features/shared/components/ui/GlassBadge';
import LoadingSkeleton from '../../../features/shared/components/ui/LoadingSkeleton';
import { t } from '../../../lib/i18n/t';
import { format } from '../../../lib/format';

interface StockMovement {
  id: string;
  variantId: string;
  variantSku: string;
  variantName: string;
  adjustmentType: 'in' | 'out' | 'set';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  reference?: string;
  notes?: string;
  cost?: number;
  location?: string;
  createdBy: string;
  createdAt: string;
}

interface StockHistoryTableProps {
  movements: StockMovement[];
  loading?: boolean;
  onFilterChange?: (filters: StockHistoryFilters) => void;
  onExport?: () => void;
  className?: string;
}

interface StockHistoryFilters {
  adjustmentType?: string;
  reason?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

const StockHistoryTable: React.FC<StockHistoryTableProps> = ({
  movements,
  loading = false,
  onFilterChange,
  onExport,
  className = ''
}) => {
  const [filters, setFilters] = useState<StockHistoryFilters>({});
  const [sortField, setSortField] = useState<keyof StockMovement>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filter and sort movements
  const filteredAndSortedMovements = useMemo(() => {
    let filtered = movements.filter(movement => {
      if (filters.adjustmentType && movement.adjustmentType !== filters.adjustmentType) {
        return false;
      }
      if (filters.reason && movement.reason !== filters.reason) {
        return false;
      }
      if (filters.dateFrom && new Date(movement.createdAt) < new Date(filters.dateFrom)) {
        return false;
      }
      if (filters.dateTo && new Date(movement.createdAt) > new Date(filters.dateTo)) {
        return false;
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          movement.variantSku.toLowerCase().includes(searchLower) ||
          movement.variantName.toLowerCase().includes(searchLower) ||
          movement.reason.toLowerCase().includes(searchLower) ||
          (movement.reference && movement.reference.toLowerCase().includes(searchLower))
        );
      }
      return true;
    });

    // Sort movements
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

    return filtered;
  }, [movements, filters, sortField, sortDirection]);

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<StockHistoryFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange?.(updatedFilters);
  };

  // Handle sort
  const handleSort = (field: keyof StockMovement) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get adjustment type badge
  const getAdjustmentTypeBadge = (type: string) => {
    switch (type) {
      case 'in':
        return <GlassBadge variant="success">Stock In</GlassBadge>;
      case 'out':
        return <GlassBadge variant="error">Stock Out</GlassBadge>;
      case 'set':
        return <GlassBadge variant="info">Set Stock</GlassBadge>;
      default:
        return null;
    }
  };

  // Get quantity display
  const getQuantityDisplay = (movement: StockMovement) => {
    const prefix = movement.adjustmentType === 'in' ? '+' : movement.adjustmentType === 'out' ? '-' : '';
    return (
      <span className={`font-mono ${movement.adjustmentType === 'in' ? 'text-lats-success' : movement.adjustmentType === 'out' ? 'text-lats-error' : 'text-lats-text'}`}>
        {prefix}{movement.quantity}
      </span>
    );
  };

  // Sortable header component
  const SortableHeader: React.FC<{
    field: keyof StockMovement;
    children: React.ReactNode;
    className?: string;
  }> = ({ field, children, className = '' }) => (
    <button
      onClick={() => handleSort(field)}
      className={`flex items-center gap-1 hover:text-lats-primary transition-colors ${className}`}
    >
      {children}
      <svg className={`w-4 h-4 transition-transform ${sortField === field ? 'text-lats-primary' : 'text-lats-text-secondary'} ${sortDirection === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    </button>
  );

  // Filter options
  const adjustmentTypeOptions = [
    { value: '', label: 'All Types' },
    { value: 'in', label: 'Stock In' },
    { value: 'out', label: 'Stock Out' },
    { value: 'set', label: 'Set Stock' }
  ];

  const reasonOptions = [
    { value: '', label: 'All Reasons' },
    { value: 'purchase', label: 'Purchase Order' },
    { value: 'sale', label: 'Sale' },
    { value: 'return', label: 'Customer Return' },
    { value: 'damage', label: 'Damaged Goods' },
    { value: 'expiry', label: 'Expired Goods' },
    { value: 'theft', label: 'Theft/Loss' },
    { value: 'adjustment', label: 'Manual Adjustment' },
    { value: 'transfer', label: 'Location Transfer' },
    { value: 'audit', label: 'Stock Audit' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <GlassCard className={className}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-lats-text">Stock Movement History</h2>
          <p className="text-sm text-lats-text-secondary mt-1">
            Track all stock adjustments and movements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <GlassButton
            variant="secondary"
            size="sm"
            onClick={() => setFilters({})}
            disabled={Object.keys(filters).length === 0}
          >
            Clear Filters
          </GlassButton>
          {onExport && (
            <GlassButton
              variant="primary"
              size="sm"
              onClick={onExport}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            >
              Export
            </GlassButton>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <GlassInput
          label="Search"
          placeholder="Search SKU, name, reason..."
          value={filters.search || ''}
          onChange={(e) => handleFilterChange({ search: e.target.value })}
        />
        <GlassSelect
          label="Adjustment Type"
          placeholder="All Types"
          value={filters.adjustmentType || ''}
          onChange={(value) => handleFilterChange({ adjustmentType: value })}
          options={adjustmentTypeOptions}
          clearable
        />
        <GlassSelect
          label="Reason"
          placeholder="All Reasons"
          value={filters.reason || ''}
          onChange={(value) => handleFilterChange({ reason: value })}
          options={reasonOptions}
          clearable
        />
        <GlassInput
          label="Date From"
          type="date"
          value={filters.dateFrom || ''}
          onChange={(e) => handleFilterChange({ dateFrom: e.target.value })}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-lats-glass-border">
              <th className="text-left p-3 font-medium text-lats-text">
                <SortableHeader field="createdAt">Date & Time</SortableHeader>
              </th>
              <th className="text-left p-3 font-medium text-lats-text">
                <SortableHeader field="variantSku">SKU</SortableHeader>
              </th>
              <th className="text-left p-3 font-medium text-lats-text">
                <SortableHeader field="variantName">Product</SortableHeader>
              </th>
              <th className="text-left p-3 font-medium text-lats-text">
                <SortableHeader field="adjustmentType">Type</SortableHeader>
              </th>
              <th className="text-left p-3 font-medium text-lats-text">
                <SortableHeader field="quantity">Quantity</SortableHeader>
              </th>
              <th className="text-left p-3 font-medium text-lats-text">
                <SortableHeader field="newStock">New Stock</SortableHeader>
              </th>
              <th className="text-left p-3 font-medium text-lats-text">
                <SortableHeader field="reason">Reason</SortableHeader>
              </th>
              <th className="text-left p-3 font-medium text-lats-text">
                <SortableHeader field="createdBy">Created By</SortableHeader>
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, index) => (
                <tr key={index} className="border-b border-lats-glass-border/50">
                  <td className="p-3">
                    <LoadingSkeleton variant="text" width="120px" height="1rem" />
                  </td>
                  <td className="p-3">
                    <LoadingSkeleton variant="text" width="80px" height="1rem" />
                  </td>
                  <td className="p-3">
                    <LoadingSkeleton variant="text" width="150px" height="1rem" />
                  </td>
                  <td className="p-3">
                    <LoadingSkeleton variant="text" width="80px" height="1rem" />
                  </td>
                  <td className="p-3">
                    <LoadingSkeleton variant="text" width="60px" height="1rem" />
                  </td>
                  <td className="p-3">
                    <LoadingSkeleton variant="text" width="60px" height="1rem" />
                  </td>
                  <td className="p-3">
                    <LoadingSkeleton variant="text" width="100px" height="1rem" />
                  </td>
                  <td className="p-3">
                    <LoadingSkeleton variant="text" width="100px" height="1rem" />
                  </td>
                </tr>
              ))
            ) : filteredAndSortedMovements.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-lats-text-secondary">
                  No stock movements found
                </td>
              </tr>
            ) : (
              filteredAndSortedMovements.map((movement) => (
                <tr key={movement.id} className="border-b border-lats-glass-border/50 hover:bg-lats-surface/30 transition-colors">
                  <td className="p-3">
                    <div className="text-sm text-lats-text">
                      {format.dateTime(movement.createdAt)}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-mono text-sm text-lats-text">
                      {movement.variantSku}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="text-sm text-lats-text">
                      {movement.variantName}
                    </div>
                  </td>
                  <td className="p-3">
                    {getAdjustmentTypeBadge(movement.adjustmentType)}
                  </td>
                  <td className="p-3">
                    <div className="text-sm font-medium">
                      {getQuantityDisplay(movement)}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="text-sm text-lats-text">
                      {movement.newStock}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="text-sm text-lats-text">
                      {movement.reason}
                      {movement.reference && (
                        <div className="text-xs text-lats-text-secondary mt-1">
                          Ref: {movement.reference}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="text-sm text-lats-text">
                      {movement.createdBy}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      {!loading && filteredAndSortedMovements.length > 0 && (
        <div className="mt-6 p-4 bg-lats-surface/30 rounded-lats-radius-md border border-lats-glass-border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-lats-text">
                {filteredAndSortedMovements.length}
              </div>
              <div className="text-xs text-lats-text-secondary">Total Movements</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-lats-success">
                {filteredAndSortedMovements
                  .filter(m => m.adjustmentType === 'in')
                  .reduce((sum, m) => sum + m.quantity, 0)}
              </div>
              <div className="text-xs text-lats-text-secondary">Stock In</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-lats-error">
                {filteredAndSortedMovements
                  .filter(m => m.adjustmentType === 'out')
                  .reduce((sum, m) => sum + m.quantity, 0)}
              </div>
              <div className="text-xs text-lats-text-secondary">Stock Out</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-lats-text">
                {filteredAndSortedMovements.length > 0 
                  ? format.dateTime(filteredAndSortedMovements[0].createdAt)
                  : 'N/A'
                }
              </div>
              <div className="text-xs text-lats-text-secondary">Latest Movement</div>
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  );
};

// Export with display name for debugging
StockHistoryTable.displayName = 'StockHistoryTable';

export default StockHistoryTable;
