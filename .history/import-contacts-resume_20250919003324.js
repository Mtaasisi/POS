import { importContacts } from './import-contacts-to-database.js';

// Resume import configuration - start from beginning but skip duplicates efficiently
const CHUNK_SIZE = 1000; // Larger chunks since we're skipping duplicates
const MAX_RETRIES = 2;
const RETRY_DELAY = 3000; // 3 seconds between retries

async function importResumeFromStart() {
  console.log('🎯 LATS Contact Import Tool - Resume Import (Skip Duplicates)');
  console.log('============================================================\n');
  
  console.log(`📊 Total contacts to process: 73079`);
  console.log(`📦 Chunk size: ${CHUNK_SIZE} contacts per batch`);
  console.log(`🔄 Estimated batches: ${Math.ceil(73079 / CHUNK_SIZE)}`);
  console.log(`🛡️  Max retries per chunk: ${MAX_RETRIES}`);
  console.log(`⚡ Strategy: Skip duplicates efficiently, import new contacts only\n`);
  
  let totalImported = 0;
  let totalDuplicates = 0;
  let totalErrors = 0;
  let currentChunk = 1;
  let failedChunks = [];
  
  try {
    for (let startRow = 1; startRow <= 73079; startRow += CHUNK_SIZE) {
      const endRow = Math.min(startRow + CHUNK_SIZE - 1, 73079);
      
      console.log(`\n🔄 Processing Chunk ${currentChunk}: Rows ${startRow} to ${endRow}`);
      console.log('=' + '='.repeat(50));
      
      let chunkSuccess = false;
      let chunkResults = null;
      
      // Retry logic for each chunk
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          console.log(`   Attempt ${attempt}/${MAX_RETRIES}...`);
          
          chunkResults = await importContacts(startRow, endRow);
          chunkSuccess = true;
          break;
          
        } catch (error) {
          console.log(`   ❌ Attempt ${attempt} failed: ${error.message}`);
          
          if (attempt < MAX_RETRIES) {
            console.log(`   ⏳ Waiting ${RETRY_DELAY/1000} seconds before retry...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          }
        }
      }
      
      if (chunkSuccess && chunkResults) {
        totalImported += chunkResults.imported;
        totalDuplicates += chunkResults.duplicates;
        totalErrors += chunkResults.errors;
        
        console.log(`\n📊 Chunk ${currentChunk} Results:`);
        console.log(`   ✅ Imported: ${chunkResults.imported}`);
        console.log(`   ⚠️  Duplicates: ${chunkResults.duplicates}`);
        console.log(`   ❌ Errors: ${chunkResults.errors}`);
        console.log(`   📈 Success Rate: ${((chunkResults.imported / chunkResults.total) * 100).toFixed(1)}%`);
        
      } else {
        console.log(`\n❌ Chunk ${currentChunk} failed after ${MAX_RETRIES} attempts`);
        failedChunks.push({ chunk: currentChunk, startRow, endRow });
      }
      
      console.log(`\n📈 Overall Progress:`);
      console.log(`   ✅ Total Imported: ${totalImported}`);
      console.log(`   ⚠️  Total Duplicates: ${totalDuplicates}`);
      console.log(`   ❌ Total Errors: ${totalErrors}`);
      console.log(`   📊 Overall Progress: ${((endRow / 73079) * 100).toFixed(1)}%`);
      
      currentChunk++;
      
      // Shorter pause between chunks since we're skipping duplicates
      if (endRow < 73079) {
        console.log('\n⏳ Pausing for 5 seconds before next chunk...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    console.log('\n🎉 All chunks completed!');
    console.log('========================');
    console.log(`📊 Final Results:`);
    console.log(`   ✅ Total Imported: ${totalImported}`);
    console.log(`   ⚠️  Total Duplicates: ${totalDuplicates}`);
    console.log(`   ❌ Total Errors: ${totalErrors}`);
    console.log(`   📈 Overall Success Rate: ${((totalImported / 73079) * 100).toFixed(1)}%`);
    
    if (failedChunks.length > 0) {
      console.log(`\n❌ Failed Chunks (${failedChunks.length}):`);
      failedChunks.forEach(chunk => {
        console.log(`   Chunk ${chunk.chunk}: Rows ${chunk.startRow}-${chunk.endRow}`);
      });
      console.log('\n💡 You can retry failed chunks manually later.');
    }
    
  } catch (error) {
    console.error('\n💥 Import process failed:', error.message);
    console.log(`\n📊 Progress before error:`);
    console.log(`   ✅ Imported: ${totalImported}`);
    console.log(`   ⚠️  Duplicates: ${totalDuplicates}`);
    console.log(`   ❌ Errors: ${totalErrors}`);
  }
}

// Run the resume import
importResumeFromStart();
