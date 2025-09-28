#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// List of modal files that need to be updated
const modalFiles = [
  'src/features/lats/components/pos/SalesAnalyticsModal.tsx',
  'src/features/lats/components/pos/CustomerSelectionModal.tsx',
  'src/features/lats/components/pos/AddExternalProductModal.tsx',
  'src/features/lats/components/pos/PaymentTrackingModal.tsx',
  'src/features/lats/components/pos/POSDiscountModal.tsx',
  'src/features/lats/components/pos/CampaignsModal.tsx',
  'src/features/lats/components/pos/DraftManagementModal.tsx',
  'src/features/lats/components/pos/POSReceiptModal.tsx',
  'src/features/lats/components/pos/POSSettingsModal.tsx',
  'src/features/lats/components/pos/CommunicationModal.tsx',
  'src/features/lats/components/pos/VariantSelectionModal.tsx',
  'src/features/lats/components/pos/RewardRedemptionModal.tsx',
  'src/features/lats/components/pos/PointsManagementModal.tsx',
  'src/features/lats/components/inventory/EditProductModal.tsx',
  'src/features/lats/components/inventory/CategoryFormModal.tsx',
  'src/features/lats/components/inventory/StockAdjustModal.tsx',
  'src/features/lats/components/inventory/EnhancedStockAdjustModal.tsx',
  'src/features/lats/components/inventory/BulkImportModal.tsx',
  'src/features/lats/components/inventory-management/ShelfModal.tsx',
  'src/features/lats/components/inventory-management/StorageLocationModal.tsx',
  'src/features/lats/components/purchase-order/AddSupplierModal.tsx',
  'src/features/lats/components/purchase-order/AddProductModal.tsx',
  'src/features/lats/components/purchase-order/SupplierSelectionModal.tsx',
  'src/features/lats/components/purchase-order/PurchaseOrderSuccessModal.tsx',
  'src/features/lats/components/product/ProductSuccessModal.tsx',
  'src/features/lats/components/ProductExcelImportModal.tsx'
];

console.log('Modal files that need body scroll lock:');
modalFiles.forEach((file, index) => {
  console.log(`${index + 1}. ${file}`);
});

console.log('\nTo update each modal, you need to:');
console.log('1. Add import: import { useBodyScrollLock } from \'../../../../hooks/useBodyScrollLock\';');
console.log('2. Add hook usage: useBodyScrollLock(isOpen);');
console.log('3. Make sure the hook is called before the early return (if (!isOpen) return null;)');
