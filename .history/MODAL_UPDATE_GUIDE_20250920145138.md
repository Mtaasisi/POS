# Modal Body Scroll Lock Update Guide

This guide explains how to add body scroll lock functionality to all modal components in the application.

## What's Been Done

✅ **Created reusable hook**: `src/hooks/useBodyScrollLock.ts`
✅ **Updated ProductInfoModal**: Already implemented
✅ **Updated CreateCustomerModal**: Already implemented  
✅ **Updated StorageRoomModal**: Already implemented
✅ **Updated SalesAnalyticsModal**: Already implemented

## How to Update Remaining Modals

For each modal component, you need to make these changes:

### 1. Add Import
Add this import at the top of the file:
```typescript
import { useBodyScrollLock } from '../../../../hooks/useBodyScrollLock';
```
*Note: Adjust the relative path based on the modal's location*

### 2. Add Hook Usage
Add this line before the early return (usually `if (!isOpen) return null;`):
```typescript
// Prevent body scroll when modal is open
useBodyScrollLock(isOpen);
```

### 3. Example Implementation
```typescript
const MyModal: React.FC<MyModalProps> = ({ isOpen, onClose }) => {
  // ... other state and effects

  // Prevent body scroll when modal is open
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 ...">
      {/* modal content */}
    </div>
  );
};
```

## Remaining Modals to Update

### POS Components
- [ ] `src/features/lats/components/pos/CustomerSelectionModal.tsx`
- [ ] `src/features/lats/components/pos/AddExternalProductModal.tsx`
- [ ] `src/features/lats/components/pos/PaymentTrackingModal.tsx`
- [ ] `src/features/lats/components/pos/POSDiscountModal.tsx`
- [ ] `src/features/lats/components/pos/CampaignsModal.tsx`
- [ ] `src/features/lats/components/pos/DraftManagementModal.tsx`
- [ ] `src/features/lats/components/pos/POSReceiptModal.tsx`
- [ ] `src/features/lats/components/pos/POSSettingsModal.tsx`
- [ ] `src/features/lats/components/pos/CommunicationModal.tsx`
- [ ] `src/features/lats/components/pos/VariantSelectionModal.tsx`
- [ ] `src/features/lats/components/pos/RewardRedemptionModal.tsx`
- [ ] `src/features/lats/components/pos/PointsManagementModal.tsx`

### Inventory Components
- [ ] `src/features/lats/components/inventory/EditProductModal.tsx`
- [ ] `src/features/lats/components/inventory/CategoryFormModal.tsx`
- [ ] `src/features/lats/components/inventory/StockAdjustModal.tsx`
- [ ] `src/features/lats/components/inventory/EnhancedStockAdjustModal.tsx`
- [ ] `src/features/lats/components/inventory/BulkImportModal.tsx`

### Inventory Management Components
- [ ] `src/features/lats/components/inventory-management/ShelfModal.tsx`
- [ ] `src/features/lats/components/inventory-management/StorageLocationModal.tsx`

### Purchase Order Components
- [ ] `src/features/lats/components/purchase-order/AddSupplierModal.tsx`
- [ ] `src/features/lats/components/purchase-order/AddProductModal.tsx`
- [ ] `src/features/lats/components/purchase-order/SupplierSelectionModal.tsx`
- [ ] `src/features/lats/components/purchase-order/PurchaseOrderSuccessModal.tsx`

### Product Components
- [ ] `src/features/lats/components/product/ProductSuccessModal.tsx`

### Other Components
- [ ] `src/features/lats/components/ProductExcelImportModal.tsx`

## Benefits

Once all modals are updated:
- ✅ Background page won't scroll when any modal is open
- ✅ User focus stays on the modal content
- ✅ Consistent behavior across all modals
- ✅ Better user experience
- ✅ Prevents accidental scrolling of background content

## Testing

After updating each modal:
1. Open the modal
2. Try to scroll the background page (should be locked)
3. Close the modal
4. Verify the page returns to the same scroll position
5. Confirm only the modal content can be scrolled

## Notes

- The hook automatically handles cleanup when the modal closes
- The scroll position is preserved when the modal opens/closes
- The implementation is consistent across all modals
- No breaking changes to existing functionality
