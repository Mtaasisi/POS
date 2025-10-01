# Quality Check System - Code Documentation

## Overview

Complete TypeScript/React implementation of the quality check system with type safety, reusable components, and comprehensive service layer.

## File Structure

```
src/features/lats/
├── types/
│   └── quality-check.ts          # Type definitions
├── services/
│   └── qualityCheckService.ts    # API service layer
└── components/
    └── quality-check/
        ├── QualityCheckModal.tsx     # Main quality check modal
        ├── QualityCheckSummary.tsx   # Summary display component
        └── index.ts                  # Barrel export
```

## Type Definitions

### Core Types

```typescript
// Template
interface QualityCheckTemplate {
  id: string;
  name: string;
  description?: string;
  category: 'electronics' | 'accessories' | 'general' | 'custom';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Criteria
interface QualityCheckCriteria {
  id: string;
  templateId: string;
  name: string;
  description?: string;
  isRequired: boolean;
  sortOrder: number;
  createdAt: string;
}

// Quality Check
interface PurchaseOrderQualityCheck {
  id: string;
  purchaseOrderId: string;
  templateId?: string;
  status: 'pending' | 'in_progress' | 'passed' | 'failed' | 'partial';
  overallResult?: 'pass' | 'fail' | 'conditional';
  checkedBy?: string;
  checkedAt?: string;
  notes?: string;
  signature?: string;
  createdAt: string;
  updatedAt: string;
  template?: QualityCheckTemplate;
}

// Check Item
interface QualityCheckItem {
  id: string;
  qualityCheckId: string;
  purchaseOrderItemId: string;
  criteriaId?: string;
  criteriaName: string;
  result: 'pass' | 'fail' | 'na';
  quantityChecked: number;
  quantityPassed: number;
  quantityFailed: number;
  defectType?: string;
  defectDescription?: string;
  actionTaken?: 'accept' | 'reject' | 'return' | 'replace' | 'repair';
  notes?: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}
```

## Service Layer

### QualityCheckService Methods

#### 1. Get Templates
```typescript
static async getTemplates(): Promise<{
  success: boolean;
  data?: QualityCheckTemplate[];
  message?: string;
}>
```

#### 2. Get Template Criteria
```typescript
static async getTemplateCriteria(templateId: string): Promise<{
  success: boolean;
  data?: QualityCheckCriteria[];
  message?: string;
}>
```

#### 3. Create Quality Check
```typescript
static async createQualityCheck(params: {
  purchaseOrderId: string;
  templateId: string;
  checkedBy: string;
}): Promise<{
  success: boolean;
  data?: string;
  message?: string;
}>
```

#### 4. Get Quality Check
```typescript
static async getQualityCheck(id: string): Promise<{
  success: boolean;
  data?: PurchaseOrderQualityCheck;
  message?: string;
}>
```

#### 5. Get Quality Checks by PO
```typescript
static async getQualityChecksByPO(purchaseOrderId: string): Promise<{
  success: boolean;
  data?: PurchaseOrderQualityCheck[];
  message?: string;
}>
```

#### 6. Get Quality Check Items
```typescript
static async getQualityCheckItems(qualityCheckId: string): Promise<{
  success: boolean;
  data?: QualityCheckItem[];
  message?: string;
}>
```

#### 7. Update Quality Check Item
```typescript
static async updateQualityCheckItem(params: {
  id: string;
  result: 'pass' | 'fail' | 'na';
  quantityChecked: number;
  quantityPassed: number;
  quantityFailed: number;
  defectType?: string;
  defectDescription?: string;
  actionTaken?: 'accept' | 'reject' | 'return' | 'replace' | 'repair';
  notes?: string;
  images?: string[];
}): Promise<{
  success: boolean;
  message?: string;
}>
```

#### 8. Complete Quality Check
```typescript
static async completeQualityCheck(params: {
  qualityCheckId: string;
  notes?: string;
  signature?: string;
}): Promise<{
  success: boolean;
  message?: string;
}>
```

#### 9. Get Quality Check Summary
```typescript
static async getQualityCheckSummary(purchaseOrderId: string): Promise<{
  success: boolean;
  data?: QualityCheckSummary;
  message?: string;
}>
```

## Components

### QualityCheckModal

Full-featured modal for performing quality checks.

**Props:**
```typescript
interface QualityCheckModalProps {
  purchaseOrderId: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}
```

**Usage:**
```tsx
import { QualityCheckModal } from '@/features/lats/components/quality-check';

function PurchaseOrderPage() {
  const [showQualityCheck, setShowQualityCheck] = useState(false);

  return (
    <>
      <button onClick={() => setShowQualityCheck(true)}>
        Start Quality Check
      </button>

      <QualityCheckModal
        purchaseOrderId="po-id"
        isOpen={showQualityCheck}
        onClose={() => setShowQualityCheck(false)}
        onComplete={() => {
          // Refresh data
          loadPurchaseOrder();
          setShowQualityCheck(false);
        }}
      />
    </>
  );
}
```

**Features:**
- ✅ Template selection
- ✅ Item-by-item inspection
- ✅ Pass/Fail/N/A results
- ✅ Quantity tracking
- ✅ Defect documentation
- ✅ Action specification
- ✅ Notes and comments
- ✅ Progress tracking
- ✅ Summary review
- ✅ Final sign-off

### QualityCheckSummary

Display quality check summary and statistics.

**Props:**
```typescript
interface QualityCheckSummaryProps {
  purchaseOrderId: string;
  onViewDetails?: (qualityCheckId: string) => void;
}
```

**Usage:**
```tsx
import { QualityCheckSummary } from '@/features/lats/components/quality-check';

function PurchaseOrderDetails() {
  const handleViewDetails = (qualityCheckId: string) => {
    // Navigate to detailed report
    navigate(`/quality-check/${qualityCheckId}`);
  };

  return (
    <QualityCheckSummary
      purchaseOrderId="po-id"
      onViewDetails={handleViewDetails}
    />
  );
}
```

**Features:**
- ✅ Status display
- ✅ Item statistics
- ✅ Pass rate visualization
- ✅ Overall result
- ✅ Link to detailed report

## Integration Examples

### 1. Basic Quality Check Flow

```tsx
import { useState } from 'react';
import { QualityCheckModal, QualityCheckSummary } from '@/features/lats/components/quality-check';

function PurchaseOrderPage({ purchaseOrderId }: { purchaseOrderId: string }) {
  const [showQualityCheck, setShowQualityCheck] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleComplete = () => {
    setRefreshKey(prev => prev + 1);
    setShowQualityCheck(false);
  };

  return (
    <div>
      {/* Summary */}
      <QualityCheckSummary
        key={refreshKey}
        purchaseOrderId={purchaseOrderId}
      />

      {/* Start Check Button */}
      <button onClick={() => setShowQualityCheck(true)}>
        Start Quality Check
      </button>

      {/* Quality Check Modal */}
      <QualityCheckModal
        purchaseOrderId={purchaseOrderId}
        isOpen={showQualityCheck}
        onClose={() => setShowQualityCheck(false)}
        onComplete={handleComplete}
      />
    </div>
  );
}
```

### 2. With Permission Check

```tsx
import { useAuth } from '@/features/auth/hooks/useAuth';

function QualityCheckSection({ purchaseOrderId }: { purchaseOrderId: string }) {
  const { currentUser, hasPermission } = useAuth();
  const [showQualityCheck, setShowQualityCheck] = useState(false);

  const canPerformQualityCheck = hasPermission('quality_check.perform');

  return (
    <div>
      <QualityCheckSummary purchaseOrderId={purchaseOrderId} />

      {canPerformQualityCheck && (
        <button onClick={() => setShowQualityCheck(true)}>
          Start Quality Check
        </button>
      )}

      <QualityCheckModal
        purchaseOrderId={purchaseOrderId}
        isOpen={showQualityCheck}
        onClose={() => setShowQualityCheck(false)}
        onComplete={() => setShowQualityCheck(false)}
      />
    </div>
  );
}
```

### 3. Programmatic API Usage

```tsx
import { QualityCheckService } from '@/features/lats/services/qualityCheckService';

async function performQuickQualityCheck(purchaseOrderId: string, userId: string) {
  // 1. Create quality check
  const createResult = await QualityCheckService.createQualityCheck({
    purchaseOrderId,
    templateId: 'electronics-template-id',
    checkedBy: userId
  });

  if (!createResult.success || !createResult.data) {
    console.error('Failed to create quality check');
    return;
  }

  const qualityCheckId = createResult.data;

  // 2. Get items
  const itemsResult = await QualityCheckService.getQualityCheckItems(qualityCheckId);

  if (!itemsResult.success || !itemsResult.data) {
    console.error('Failed to get items');
    return;
  }

  // 3. Update all items as passed
  for (const item of itemsResult.data) {
    await QualityCheckService.updateQualityCheckItem({
      id: item.id,
      result: 'pass',
      quantityChecked: item.purchaseOrderItem?.quantity || 0,
      quantityPassed: item.purchaseOrderItem?.quantity || 0,
      quantityFailed: 0,
      notes: 'Quick check - all passed'
    });
  }

  // 4. Complete quality check
  await QualityCheckService.completeQualityCheck({
    qualityCheckId,
    notes: 'Quick quality check completed - all items passed'
  });

  console.log('Quality check completed successfully');
}
```

### 4. Custom Template Creation

```tsx
import { supabase } from '@/lib/supabaseClient';

async function createCustomTemplate() {
  // Create template
  const { data: template, error: templateError } = await supabase
    .from('quality_check_templates')
    .insert({
      name: 'Custom Electronics Check',
      description: 'Custom quality check for specific electronics',
      category: 'custom',
      is_active: true
    })
    .select()
    .single();

  if (templateError || !template) {
    console.error('Failed to create template');
    return;
  }

  // Create criteria
  const criteria = [
    { name: 'Screen Quality', description: 'Check for dead pixels, scratches', is_required: true, sort_order: 1 },
    { name: 'Battery Test', description: 'Test battery health and charging', is_required: true, sort_order: 2 },
    { name: 'Camera Test', description: 'Test all cameras', is_required: true, sort_order: 3 },
  ];

  const { error: criteriaError } = await supabase
    .from('quality_check_criteria')
    .insert(
      criteria.map(c => ({
        template_id: template.id,
        name: c.name,
        description: c.description,
        is_required: c.is_required,
        sort_order: c.sort_order
      }))
    );

  if (criteriaError) {
    console.error('Failed to create criteria');
    return;
  }

  console.log('Custom template created:', template.id);
}
```

## Best Practices

### 1. Error Handling
```tsx
const handleQualityCheck = async () => {
  try {
    const result = await QualityCheckService.createQualityCheck({
      purchaseOrderId,
      templateId,
      checkedBy: currentUser.id
    });

    if (!result.success) {
      toast.error(result.message || 'Failed to create quality check');
      return;
    }

    toast.success('Quality check started');
  } catch (error) {
    console.error('Unexpected error:', error);
    toast.error('An unexpected error occurred');
  }
};
```

### 2. Loading States
```tsx
const [isLoading, setIsLoading] = useState(false);

const handleComplete = async () => {
  setIsLoading(true);
  try {
    await QualityCheckService.completeQualityCheck({
      qualityCheckId,
      notes
    });
  } finally {
    setIsLoading(false);
  }
};
```

### 3. Real-time Updates
```tsx
useEffect(() => {
  const subscription = supabase
    .channel('quality-checks')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'purchase_order_quality_checks',
        filter: `purchase_order_id=eq.${purchaseOrderId}`
      },
      (payload) => {
        // Refresh summary
        loadSummary();
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, [purchaseOrderId]);
```

## Styling

The components use Tailwind CSS classes. Key design patterns:

- **Color Scheme:**
  - Pass: Green (`bg-green-50`, `text-green-600`)
  - Fail: Red (`bg-red-50`, `text-red-600`)
  - Pending: Yellow (`bg-yellow-50`, `text-yellow-600`)
  - Info: Blue (`bg-blue-50`, `text-blue-600`)

- **Responsive:**
  - Mobile-first design
  - Grid layouts adjust for different screens
  - Modal max-width for readability

- **Accessibility:**
  - Semantic HTML
  - ARIA labels where needed
  - Keyboard navigation support

## Testing

### Unit Tests Example
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { QualityCheckModal } from './QualityCheckModal';

describe('QualityCheckModal', () => {
  it('renders template selection', () => {
    render(
      <QualityCheckModal
        purchaseOrderId="test-po"
        isOpen={true}
        onClose={() => {}}
        onComplete={() => {}}
      />
    );

    expect(screen.getByText('Choose Quality Check Template')).toBeInTheDocument();
  });

  it('calls onComplete when finished', async () => {
    const onComplete = jest.fn();
    
    render(
      <QualityCheckModal
        purchaseOrderId="test-po"
        isOpen={true}
        onClose={() => {}}
        onComplete={onComplete}
      />
    );

    // Simulate completing quality check
    // ...

    expect(onComplete).toHaveBeenCalled();
  });
});
```

## Performance Optimization

1. **Lazy Loading:**
```tsx
const QualityCheckModal = lazy(() => 
  import('./components/quality-check/QualityCheckModal')
);
```

2. **Memoization:**
```tsx
const MemoizedQualityCheckSummary = memo(QualityCheckSummary);
```

3. **Debounced Updates:**
```tsx
const debouncedUpdate = useMemo(
  () => debounce(updateQualityCheckItem, 500),
  []
);
```

## Troubleshooting

### Common Issues

1. **Template not loading:**
   - Check if templates exist in database
   - Verify RLS policies
   - Check user permissions

2. **Items not updating:**
   - Verify quality check ID is correct
   - Check trigger functions are enabled
   - Review error logs

3. **Summary not showing:**
   - Ensure quality check exists for PO
   - Check RPC function permissions
   - Verify data format

## Support

For issues or questions:
1. Check type definitions
2. Review service layer methods
3. Test with sample data
4. Check browser console for errors
