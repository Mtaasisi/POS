// Test file to verify inventoryApi exports
import('./src/lib/inventoryApi.ts')
  .then(module => {
    console.log('Available exports:', Object.keys(module));
    console.log('deleteInventoryCategory exists:', typeof module.deleteInventoryCategory);
  })
  .catch(error => {
    console.error('Error importing inventoryApi:', error);
  }); 