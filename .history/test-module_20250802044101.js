// Test module exports
import('./src/lib/inventoryApi.ts')
  .then(module => {
    console.log('Module loaded successfully');
    console.log('Available exports:', Object.keys(module));
    console.log('deleteInventoryCategory type:', typeof module.deleteInventoryCategory);
    console.log('deleteInventoryCategory exists:', 'deleteInventoryCategory' in module);
  })
  .catch(error => {
    console.error('Error loading module:', error);
  }); 