import { importContacts } from './import-contacts-to-database.js';

// Chunked import configuration
const CHUNK_SIZE = 2000; // Process 2000 contacts at a time
const TOTAL_CONTACTS = 73079;

async function importInChunks() {
  console.log('🎯 LATS Contact Import Tool - Chunked Import');
  console.log('=============================================\n');
  
  console.log(`📊 Total contacts to process: ${TOTAL_CONTACTS}`);
  console.log(`📦 Chunk size: ${CHUNK_SIZE} contacts per batch`);
  console.log(`🔄 Estimated batches: ${Math.ceil(TOTAL_CONTACTS / CHUNK_SIZE)}\n`);
  
  let totalImported = 0;
  let totalDuplicates = 0;
  let totalErrors = 0;
  let currentChunk = 1;
  
  try {
    for (let startRow = 1; startRow <= TOTAL_CONTACTS; startRow += CHUNK_SIZE) {
      const endRow = Math.min(startRow + CHUNK_SIZE - 1, TOTAL_CONTACTS);
      
      console.log(`\n🔄 Processing Chunk ${currentChunk}: Rows ${startRow} to ${endRow}`);
      console.log('=' + '='.repeat(50));
      
      // Temporarily modify the import function to process specific range
      const chunkResults = await importContacts(startRow, endRow);
      
      totalImported += chunkResults.imported;
      totalDuplicates += chunkResults.duplicates;
      totalErrors += chunkResults.errors;
      
      console.log(`\n📊 Chunk ${currentChunk} Results:`);
      console.log(`   ✅ Imported: ${chunkResults.imported}`);
      console.log(`   ⚠️  Duplicates: ${chunkResults.duplicates}`);
      console.log(`   ❌ Errors: ${chunkResults.errors}`);
      console.log(`   📈 Success Rate: ${((chunkResults.imported / chunkResults.total) * 100).toFixed(1)}%`);
      
      console.log(`\n📈 Overall Progress:`);
      console.log(`   ✅ Total Imported: ${totalImported}`);
      console.log(`   ⚠️  Total Duplicates: ${totalDuplicates}`);
      console.log(`   ❌ Total Errors: ${totalErrors}`);
      console.log(`   📊 Overall Progress: ${((endRow / TOTAL_CONTACTS) * 100).toFixed(1)}%`);
      
      currentChunk++;
      
      // Add a pause between chunks
      if (endRow < TOTAL_CONTACTS) {
        console.log('\n⏳ Pausing for 5 seconds before next chunk...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    console.log('\n🎉 All chunks completed successfully!');
    console.log('=====================================');
    console.log(`📊 Final Results:`);
    console.log(`   ✅ Total Imported: ${totalImported}`);
    console.log(`   ⚠️  Total Duplicates: ${totalDuplicates}`);
    console.log(`   ❌ Total Errors: ${totalErrors}`);
    console.log(`   📈 Overall Success Rate: ${((totalImported / TOTAL_CONTACTS) * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('\n💥 Import failed:', error.message);
    console.log(`\n📊 Progress before error:`);
    console.log(`   ✅ Imported: ${totalImported}`);
    console.log(`   ⚠️  Duplicates: ${totalDuplicates}`);
    console.log(`   ❌ Errors: ${totalErrors}`);
  }
}

// Run the chunked import
importInChunks();

