import { importContacts } from './import-contacts-to-database.js';

// Robust chunked import configuration
const CHUNK_SIZE = 500; // Smaller chunks to avoid timeouts
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds between retries

async function importInChunksRobust() {
  console.log('🎯 LATS Contact Import Tool - Robust Chunked Import');
  console.log('==================================================\n');
  
  console.log(`📊 Total contacts to process: 73079`);
  console.log(`📦 Chunk size: ${CHUNK_SIZE} contacts per batch`);
  console.log(`🔄 Estimated batches: ${Math.ceil(73079 / CHUNK_SIZE)}`);
  console.log(`🛡️  Max retries per chunk: ${MAX_RETRIES}\n`);
  
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
      
      // Add a longer pause between chunks to avoid overwhelming the database
      if (endRow < 73079) {
        console.log('\n⏳ Pausing for 10 seconds before next chunk...');
        await new Promise(resolve => setTimeout(resolve, 10000));
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

// Run the robust chunked import
importInChunksRobust();
