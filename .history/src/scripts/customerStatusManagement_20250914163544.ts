/**
 * Customer Status Management Script
 * 
 * This script can be run periodically (e.g., via cron job or scheduled task)
 * to automatically manage customer status based on activity.
 */

import { runCustomerStatusManagement } from '../lib/customerStatusService';

async function main() {
  try {
    console.log('🚀 Starting customer status management...');
    
    const result = await runCustomerStatusManagement();
    
    console.log('✅ Customer status management completed successfully!');
    console.log(`📊 Deactivated ${result.deactivatedCount} inactive customers`);
    console.log(`⏰ Processed at: ${new Date(result.processedAt).toLocaleString()}`);
    
    // Exit with success code
    process.exit(0);
  } catch (error) {
    console.error('❌ Customer status management failed:', error);
    
    // Exit with error code
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

export { main as runCustomerStatusScript };
