# Device Diagnostic Checklist Debug Guide

## Overview
I've added comprehensive debug logging to the Device Diagnostic Checklist functionality to help identify and resolve any issues with diagnostic and repair checklist operations. The debug enhancements will show you exactly what's happening at each step of the diagnostic process.

## Debug Enhancements Added

### 1. Enhanced Logging in `DiagnosticChecklist.tsx`

#### **Initialization Logging**
- Shows device information when checklist opens
- Logs whether existing diagnostic data is loaded or new checklist is created
- Displays generated diagnostic items for the device model

#### **Item Status Updates**
- Logs when diagnostic items are marked as pass/fail
- Shows the updated diagnostic items array
- Tracks auto-advancement to next steps

#### **Save Diagnostic Function**
- **Input validation**: Shows diagnostic summary and overall status
- **Database operation**: Logs the diagnostic data being saved
- **Status update logic**: Shows current vs new device status
- **Error handling**: Comprehensive error details if save fails
- **Success confirmation**: Confirms successful save and status updates

#### **Admin Submission Function**
- **Submission data**: Shows all data being submitted to admin
- **Database update**: Logs the admin submission data
- **Notification creation**: Shows admin notification data
- **Error handling**: Detailed error information for failed submissions
- **Success tracking**: Confirms successful admin submission

### 2. Enhanced Logging in `RepairChecklist.tsx`

#### **Save Repair Checklist Function**
- **Input validation**: Shows repair checklist data being saved
- **Database operation**: Logs the repair data update
- **Status update logic**: Shows current vs new device status
- **Error handling**: Comprehensive error details if save fails
- **Success confirmation**: Confirms successful save and status updates

### 3. Debug Script Created

#### `debug-diagnostic-checklist.js`
A comprehensive browser console script that:
- Tests diagnostic checklist database updates
- Tests repair checklist database updates
- Verifies diagnostic and repair data structure
- Tests admin notification creation
- Lists devices with diagnostic data
- Provides helper functions for testing specific devices

## How to Use the Debug Tools

### Step 1: Open Browser Console
1. Open your app in the browser
2. Open Developer Tools (F12)
3. Go to the Console tab

### Step 2: Load Debug Script
Copy and paste the contents of `debug-diagnostic-checklist.js` into the console:

```javascript
// Copy contents of debug-diagnostic-checklist.js
```

### Step 3: Run Tests
Execute the test functions:

```javascript
// Test diagnostic and repair checklist functionality
debugDiagnosticChecklist()

// Test diagnostic checklist for a specific device
testDiagnosticChecklistForDevice('your-device-id-here')

// Test admin notification creation
testAdminNotification('your-device-id-here')

// List devices with diagnostic data
listDevicesWithDiagnostics()
```

### Step 4: Monitor Console Output
The enhanced logging will show you:

1. **Checklist initialization**: What diagnostic items are created/loaded
2. **Item updates**: When items are marked as pass/fail
3. **Save operations**: What data is being saved to the database
4. **Status updates**: How device status changes based on checklist results
5. **Admin submissions**: What data is submitted to admin for review
6. **Error details**: Comprehensive error information if operations fail
7. **Success confirmations**: Confirmation of successful operations

## Expected Debug Output

When working correctly, you should see output like:

```
[DiagnosticChecklist] Initializing diagnostic checklist for device: {
  deviceId: "a4504cd2-5ea9-4b34-a73d-25dd75b0741d",
  brand: "Apple",
  model: "iPhone 12",
  status: "assigned",
  hasExistingChecklist: false
}
[DiagnosticChecklist] Creating new diagnostic checklist for model: iPhone 12
[DiagnosticChecklist] Generated diagnostic items: [...]
[DiagnosticChecklist] Updating diagnostic item status: { itemId: "power-test", status: "pass" }
[DiagnosticChecklist] Updated diagnostic items: [...]
[DiagnosticChecklist] Starting diagnostic save...
[DiagnosticChecklist] Diagnostic summary: { total: 5, passed: 3, failed: 1, pending: 1 }
[DiagnosticChecklist] Overall status: issues-found
[DiagnosticChecklist] Saving diagnostic data: {...}
[DiagnosticChecklist] ✅ Database update successful: [...]
[DiagnosticChecklist] Status update logic: {
  currentStatus: "assigned",
  newStatus: "diagnosis-issues",
  willUpdate: true
}
[DiagnosticChecklist] Updating device status to: diagnosis-issues
[DiagnosticChecklist] ✅ Diagnostic save completed successfully
```

## Database Schema Requirements

The debug tools will help verify that your database has the required columns:

### Devices Table Required Columns:
- `diagnostic_checklist` (JSONB) - Stores diagnostic test results
- `repair_checklist` (JSONB) - Stores repair progress data
- `status` (TEXT) - Device status for workflow management

### Admin Notifications Table (for admin submissions):
- `device_id` (UUID) - Reference to device
- `type` (TEXT) - Notification type
- `title` (TEXT) - Notification title
- `message` (TEXT) - Notification message
- `status` (TEXT) - Notification status
- `created_at` (TIMESTAMP) - Creation timestamp

## Troubleshooting

If you see errors, the debug output will help identify:

1. **Missing database columns**: Check if `diagnostic_checklist` or `repair_checklist` columns exist
2. **Data structure issues**: Verify the JSON structure matches expected format
3. **Permission problems**: Check RLS policies for devices and admin_notifications tables
4. **Status update issues**: Verify device status transitions are valid
5. **Notification failures**: Check if admin_notifications table exists and is accessible

## Common Issues and Solutions

### Issue: "Column 'diagnostic_checklist' does not exist"
**Solution**: Run the database migration to add the diagnostic_checklist column:
```sql
ALTER TABLE devices ADD COLUMN diagnostic_checklist JSONB;
ALTER TABLE devices ADD COLUMN repair_checklist JSONB;
```

### Issue: "Permission denied for table devices"
**Solution**: Check RLS policies and ensure authenticated users can update devices:
```sql
CREATE POLICY "Enable update for authenticated users" ON devices
    FOR UPDATE USING (true);
```

### Issue: "Admin notification creation fails"
**Solution**: Ensure admin_notifications table exists and is accessible:
```sql
CREATE TABLE admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID REFERENCES devices(id),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'unread',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Next Steps

1. Run the debug scripts to see the current behavior
2. Check the console output for any error messages
3. If issues persist, share the debug output for further analysis
4. The enhanced logging will help pinpoint exactly where problems occur

The debug enhancements provide complete visibility into the diagnostic checklist process and will help resolve any issues with diagnostic and repair checklist functionality.
