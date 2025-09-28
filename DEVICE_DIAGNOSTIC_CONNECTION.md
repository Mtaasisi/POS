# Device-Diagnostic Database Connection

## 🔗 How Devices Connect to Diagnostics

### **Primary Connection Table: `diagnostic_checklist_results`**

```sql
CREATE TABLE diagnostic_checklist_results (
    id UUID PRIMARY KEY,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,  -- 🔗 CONNECTION TO DEVICES
    problem_template_id UUID REFERENCES diagnostic_problem_templates(id),
    checklist_items JSONB NOT NULL,
    overall_status TEXT,
    technician_notes TEXT,
    completed_by UUID REFERENCES auth_users(id),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
);
```

### **Device Table Integration: `devices.diagnostic_checklist`**

```sql
-- The devices table has a column to store diagnostic data
ALTER TABLE devices ADD COLUMN diagnostic_checklist JSONB;
```

## 🔄 Connection Flow

### **1. Device Selection**
When you click "Start Diagnosis" on any device:
- **Device ID** is passed to `DiagnosticChecklistModal`
- **Device Model** is used for template selection
- **Device Status** is updated after diagnosis completion

### **2. Diagnostic Process**
```typescript
// In DiagnosticChecklistModal.tsx
const saveChecklistResults = async () => {
  const results = {
    device_id: deviceId,           // 🔗 Links to devices table
    problem_template_id: selectedTemplate?.id,
    checklist_items: checklistItems,
    overall_status: overallStatus,
    technician_notes: technicianNotes,
    completed_at: new Date().toISOString()
  };

  // Save to diagnostic_checklist_results table
  await supabase.from('diagnostic_checklist_results').insert([results]);
  
  // Update device with diagnostic data
  await supabase.from('devices').update({ 
    diagnostic_checklist: results  // 🔗 Stores diagnostic data in device record
  }).eq('id', deviceId);
};
```

### **3. Device Status Update**
After diagnosis completion:
```typescript
// Device status is updated to 'diagnosis-started'
await onStatusUpdate(device.id, 'diagnosis-started', 'Diagnostic checklist completed');
```

## 📊 Database Relationships

### **Foreign Key Connections:**
```
devices (id) ←─── diagnostic_checklist_results (device_id)
                           ↓
                 diagnostic_problem_templates (id)
                           ↓
                 diagnostic_checklist_results (problem_template_id)
                           ↓
                     auth_users (id)
                           ↓
                 diagnostic_checklist_results (completed_by)
```

### **Data Flow:**
1. **Device** → Triggers diagnostic process
2. **Template** → Provides checklist structure
3. **Results** → Stored with device reference
4. **Device** → Updated with diagnostic data and status

## 🔍 Query Examples

### **Get All Devices with Diagnostics:**
```sql
SELECT 
    d.id,
    d.brand,
    d.model,
    d.serial_number,
    d.status,
    dcr.overall_status as diagnostic_status,
    dcr.completed_at,
    dpt.problem_name as diagnostic_template
FROM devices d
LEFT JOIN diagnostic_checklist_results dcr ON d.id = dcr.device_id
LEFT JOIN diagnostic_problem_templates dpt ON dcr.problem_template_id = dpt.id
ORDER BY dcr.completed_at DESC;
```

### **Get Device Diagnostic History:**
```sql
SELECT 
    dcr.*,
    dpt.problem_name,
    au.name as completed_by_name
FROM diagnostic_checklist_results dcr
JOIN devices d ON dcr.device_id = d.id
LEFT JOIN diagnostic_problem_templates dpt ON dcr.problem_template_id = dpt.id
LEFT JOIN auth_users au ON dcr.completed_by = au.id
WHERE d.id = 'your-device-id-here'
ORDER BY dcr.created_at DESC;
```

### **Get Devices Needing Diagnosis:**
```sql
SELECT 
    d.*
FROM devices d
WHERE d.status = 'assigned'
AND NOT EXISTS (
    SELECT 1 FROM diagnostic_checklist_results dcr 
    WHERE dcr.device_id = d.id
);
```

## 🎯 Real-World Usage

### **From Device List:**
- Click "Start Diagnosis" → Opens diagnostic modal for that specific device
- Complete checklist → Results saved with device ID
- Device status updates → Shows diagnostic completion

### **From Repair Interface:**
- Device repair detail modal → Diagnostic button
- Same device-specific diagnostic process
- Results linked to the same device record

### **From Overview:**
- Device grid → Diagnostic action button
- Device-specific diagnostic workflow
- Consistent data storage and retrieval

## ✅ Verification

### **Check Device-Diagnostic Connection:**
```sql
-- Verify devices have diagnostic data
SELECT 
    COUNT(*) as total_devices,
    COUNT(dcr.device_id) as devices_with_diagnostics,
    COUNT(dcr.device_id) * 100.0 / COUNT(*) as diagnostic_coverage_percent
FROM devices d
LEFT JOIN diagnostic_checklist_results dcr ON d.id = dcr.device_id;
```

### **Check Recent Diagnostics:**
```sql
-- Get recent diagnostic activity
SELECT 
    d.brand,
    d.model,
    d.serial_number,
    dcr.overall_status,
    dcr.completed_at,
    dpt.problem_name
FROM diagnostic_checklist_results dcr
JOIN devices d ON dcr.device_id = d.id
LEFT JOIN diagnostic_problem_templates dpt ON dcr.problem_template_id = dpt.id
ORDER BY dcr.completed_at DESC
LIMIT 10;
```

## 🎉 Summary

**YES, the diagnostic system is fully connected to each device in the database!**

- ✅ **Foreign Key Relationship**: `diagnostic_checklist_results.device_id` → `devices.id`
- ✅ **Data Storage**: Each diagnostic result is linked to a specific device
- ✅ **Status Updates**: Device status changes after diagnosis completion
- ✅ **Historical Tracking**: All diagnostic history is preserved per device
- ✅ **Real-time Integration**: Diagnostic buttons work from any device interface

Every device in your database can now have diagnostic checklists performed on it, with all results properly stored and linked!
