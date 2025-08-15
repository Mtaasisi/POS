# Project Organization Plan

## Feature-Based Structure

### 1. Admin Module (`features/admin/`)
**Pages:**
- AdminSettingsPage.tsx
- AuditLogsPage.tsx
- DatabaseSetupPage.tsx

**Components:**
- AdminFeedbackModal.tsx
- AdminGoalsManagement.tsx
- UserGoalsManagement.tsx
- UserRoleDebug.tsx
- admin-dashboard/ (entire folder)

### 2. POS Module (`features/pos/`)
**Pages:**
- POSPage.tsx
- POSInventoryPage.tsx
- POSSalesPage.tsx
- DeliveryOptionsPage.tsx

**Components:**
- pos/ (entire folder)
- PrintableSlip.tsx
- PaymentSelectionModal.tsx

### 3. Customers Module (`features/customers/`)
**Pages:**
- CustomersPage.tsx
- CustomerDetailPage.tsx
- CustomerDataUpdatePage.tsx
- CustomerCareDiagnosticsPage.tsx

**Components:**
- CustomerFilters.tsx
- CustomerAnalytics.tsx
- CustomerFinancialSummary.tsx
- CustomerUpdateImportModal.tsx
- forms/AddCustomerModal.tsx
- forms/CustomerForm.tsx

### 4. Devices Module (`features/devices/`)
**Pages:**
- NewDevicePage.tsx
- DeviceDetailPage.tsx

**Components:**
- DeviceCard.tsx
- DeviceDetailHeader.tsx
- DeviceBarcodeCard.tsx
- DeviceQRCodePrint.tsx
- BarcodeScanner.tsx
- ConditionAssessment.tsx
- RepairChecklist.tsx
- StatusUpdateForm.tsx
- QuickStatusUpdate.tsx
- AssignTechnicianForm.tsx

### 5. Diagnostics Module (`features/diagnostics/`)
**Pages:**
- AssignedDiagnosticsPage.tsx
- NewDiagnosticRequestPage.tsx
- DiagnosticReportsPage.tsx
- DiagnosticDevicePage.tsx
- DiagnosticGroupedDevicesPage.tsx
- DiagnosticRequestDetailPage.tsx
- DiagnosticTemplatesPage.tsx

**Components:**
- DiagnosticChecklist.tsx
- DiagnosticDeviceCard.tsx

### 6. WhatsApp Module (`features/whatsapp/`)
**Pages:**
- WhatsAppManagerPage.tsx
- WhatsAppWebPage.tsx
- WhatsAppTemplatesPage.tsx

**Components:**
- WhatsAppChatUI.tsx
- CommunicationHub.tsx

### 7. Finance Module (`features/finance/`)
**Pages:**
- FinanceManagementPage.tsx
- FinancialTestPage.tsx
- PaymentsReportPage.tsx
- PaymentsAccountsPage.tsx
- PointsManagementPage.tsx

**Components:**
- FinancialDashboard.tsx
- PointsManagementModal.tsx

### 8. Inventory Module (`features/inventory/`)
**Pages:**
- InventoryManagementPage.tsx
- NewInventoryPage.tsx
- ProductDetailPage.tsx
- ProductEditPage.tsx
- SparePartsPage.tsx
- SparePartCategoryManagementPage.tsx
- NewPurchaseOrderPage.tsx
- PurchaseOrdersPage.tsx

**Components:**
- InventoryDashboard.tsx
- SparePartUsageModal.tsx
- forms/SparePartForm.tsx

### 9. Backup Module (`features/backup/`)
**Pages:**
- BackupManagementPage.tsx

**Components:**
- AutomaticBackupSettings.tsx
- AutomaticDropboxBackupWidget.tsx
- BackupNotification.tsx
- BackupStatusWidget.tsx
- BackupMonitoringDashboard.tsx
- SqlBackupWidget.tsx

### 10. Settings Module (`features/settings/`)
**Pages:**
- SettingsPage.tsx
- BrandManagementPage.tsx
- CategoryManagementPage.tsx

**Components:**
- BackgroundSelector.tsx
- IntegrationsManager.tsx
- forms/BrandForm.tsx

### 11. Reports Module (`features/reports/`)
**Pages:**
- SMSControlCenterPage.tsx
- ExcelImportPage.tsx

**Components:**
- BulkFiltersPanel.tsx
- BulkSMSModal.tsx
- SMSLogDetailsModal.tsx
- EnhancedExcelImportModal.tsx
- ExcelImportModal.tsx

### 12. Forms Module (`features/forms/`)
**Components:**
- forms/ (remaining forms)
- CategorySelector.tsx

### 13. Shared Module (`features/shared/`)
**Components:**
- ui/ (entire folder)
- TopBar.tsx
- AdHeader.tsx
- ErrorBoundary.tsx
- dashboards/ (entire folder)

## Root Level Structure
- `App.tsx` - Main app component
- `main.tsx` - Entry point
- `index.css` - Global styles
- `types.ts` - Global types
- `context/` - Global context providers
- `hooks/` - Global hooks
- `lib/` - Global utilities and services
- `services/` - Global services
- `data/` - Global data
- `styles/` - Global styles
- `layout/` - Layout components

## Migration Steps:
1. Move pages to their respective feature folders
2. Move components to their respective feature folders
3. Update all import statements
4. Create index files for easy imports
5. Update routing configuration
6. Test all functionality
