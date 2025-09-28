// Simple test to verify failed device transitions
// This simulates the logic from RepairStatusUpdater.tsx

const statusTransitions = [
  {
    from: 'failed',
    to: 'returned-to-customer-care',
    label: 'Send to Customer Care',
    description: 'Send failed device to customer care for customer notification',
    requiresNotes: true,
    allowedRoles: ['technician', 'admin']
  },
  {
    from: 'failed',
    to: 'done',
    label: 'Return to Customer',
    description: 'Mark failed device as done (customer notified)',
    requiresNotes: true,
    allowedRoles: ['admin', 'customer-care']
  }
];

// Test function to get available transitions for failed devices
function getAvailableTransitions(deviceStatus, userRole, deviceAssignedTo, userId) {
  return statusTransitions.filter(transition => {
    // Check if transition is from current status
    if (transition.from !== deviceStatus) return false;
    
    // Check if user role is allowed
    if (!transition.allowedRoles.includes(userRole)) return false;
    
    // Check if user is assigned technician (for technician role)
    if (userRole === 'technician' && deviceAssignedTo !== userId) {
      return false;
    }
    
    return true;
  });
}

// Test cases
console.log('🧪 Testing Failed Device Transitions\n');

// Test 1: Technician assigned to device
console.log('Test 1: Technician assigned to device');
const transitions1 = getAvailableTransitions('failed', 'technician', 'user123', 'user123');
console.log('Available transitions:', transitions1.map(t => t.label));
console.log('Expected: ["Send to Customer Care"]');
console.log('✅ Pass:', transitions1.length === 1 && transitions1[0].label === 'Send to Customer Care');
console.log('');

// Test 2: Admin user
console.log('Test 2: Admin user');
const transitions2 = getAvailableTransitions('failed', 'admin', 'user123', 'admin456');
console.log('Available transitions:', transitions2.map(t => t.label));
console.log('Expected: ["Send to Customer Care", "Return to Customer"]');
console.log('✅ Pass:', transitions2.length === 2);
console.log('');

// Test 3: Customer care user
console.log('Test 3: Customer care user');
const transitions3 = getAvailableTransitions('failed', 'customer-care', 'user123', 'care456');
console.log('Available transitions:', transitions3.map(t => t.label));
console.log('Expected: ["Return to Customer"]');
console.log('✅ Pass:', transitions3.length === 1 && transitions3[0].label === 'Return to Customer');
console.log('');

// Test 4: Technician not assigned to device
console.log('Test 4: Technician not assigned to device');
const transitions4 = getAvailableTransitions('failed', 'technician', 'other123', 'user123');
console.log('Available transitions:', transitions4.map(t => t.label));
console.log('Expected: []');
console.log('✅ Pass:', transitions4.length === 0);
console.log('');

console.log('🎉 All tests completed! The failed device transitions should now work correctly.');
