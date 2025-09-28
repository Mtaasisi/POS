#!/usr/bin/env node

/**
 * Test Diagnostic UI Data Processing
 * This script tests the diagnostic data processing logic to ensure it matches UI expectations
 */

// Simulate the diagnostic data structure from the database
const sampleDiagnosticData = {
  device_id: "afb3c11d-83fc-4659-a05f-4f1bf9add225",
  created_at: "2025-09-23T22:42:53.237Z",
  updated_at: "2025-09-23T22:42:53.237Z",
  completed_at: "2025-09-23T22:42:53.237Z",
  overall_status: "in_progress",
  checklist_items: [
    {
      id: "1758610586179",
      notes: "",
      title: "Power Test",
      result: "passed",
      required: true,
      completed: true,
      description: "Check if device powers on"
    },
    {
      id: "1758610590762",
      notes: "Screen has minor scratches",
      title: "Display Test",
      result: "failed",
      required: true,
      completed: true,
      description: "Check screen functionality"
    }
  ],
  technician_notes: "Device has minor screen issues but overall functional",
  problem_template_id: "f584afff-d5d8-4caf-8559-957bcceae3d7"
};

// Simulate the UI data processing logic
function processDiagnosticData(deviceChecklist) {
  console.log('🔍 Processing diagnostic data...');
  console.log('Raw data:', JSON.stringify(deviceChecklist, null, 2));
  
  let summary = null;
  let overallStatus = deviceChecklist.overall_status || deviceChecklist.overallStatus;
  
  // Check if we have checklist_items (newer format)
  if (deviceChecklist.checklist_items && Array.isArray(deviceChecklist.checklist_items)) {
    const total = deviceChecklist.checklist_items.length;
    const passed = deviceChecklist.checklist_items.filter(item => item.result === 'passed').length;
    const failed = deviceChecklist.checklist_items.filter(item => item.result === 'failed').length;
    const pending = deviceChecklist.checklist_items.filter(item => !item.completed).length;
    
    summary = {
      total,
      passed,
      failed,
      pending,
      lastUpdated: deviceChecklist.updated_at || deviceChecklist.completed_at
    };
    
    // Convert checklist_items to items format for compatibility
    const items = deviceChecklist.checklist_items.map(item => ({
      test: item.title,
      result: item.result,
      notes: item.notes,
      completed: item.completed
    }));
    
    const combinedData = {
      items,
      summary,
      overallStatus,
      individualChecks: deviceChecklist.checklist_items,
      technicianNotes: deviceChecklist.technician_notes,
      source: 'device_checklist'
    };
    
    console.log('✅ Processed data:', JSON.stringify(combinedData, null, 2));
    return combinedData;
  }
  
  return null;
}

// Test the processing
console.log('🧪 Testing Diagnostic Data Processing\n');
console.log('=====================================\n');

const processedData = processDiagnosticData(sampleDiagnosticData);

if (processedData) {
  console.log('\n📊 UI Display Test:');
  console.log('==================');
  console.log(`Total Tests: ${processedData.summary?.total || 0}`);
  console.log(`Passed: ${processedData.summary?.passed || 0}`);
  console.log(`Failed: ${processedData.summary?.failed || 0}`);
  console.log(`Pending: ${processedData.summary?.pending || 0}`);
  console.log(`Overall Status: ${processedData.overallStatus}`);
  console.log(`Last Updated: ${processedData.summary?.lastUpdated ? new Date(processedData.summary.lastUpdated).toLocaleString() : 'N/A'}`);
  console.log(`Individual Checks: ${processedData.individualChecks?.length || 0} records`);
  console.log(`Technician Notes: ${processedData.technicianNotes ? 'Present' : 'Empty'}`);
  console.log(`Data Source: ${processedData.source}`);
  
  console.log('\n✅ Diagnostic data processing test completed successfully!');
  console.log('   The UI should now be able to display this data correctly.');
} else {
  console.log('\n❌ Diagnostic data processing failed!');
}
