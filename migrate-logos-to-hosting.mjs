import { createClient } from '@supabase/supabase-js';
import { fileUploadService } from './src/lib/fileUploadService.js';

const supabase = createClient(
  'https://jxhzveborezjhsmzsgbc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
);

async function migrateLogosToHosting() {
  try {
    console.log('🔄 Starting logo migration to hosting...');

    // Fetch all brands with base64 logos
    const { data: brands, error } = await supabase
      .from('brands')
      .select('id, name, logo_url')
      .not('logo_url', 'is', null);

    if (error) {
      console.error('❌ Error fetching brands:', error);
      return;
    }

    console.log(`📊 Found ${brands.length} brands with logos`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const brand of brands) {
      if (!brand.logo_url) continue;

      // Check if it's already a hosted URL
      if (brand.logo_url.startsWith('http')) {
        console.log(`⏭️ Skipping ${brand.name} - already hosted`);
        skippedCount++;
        continue;
      }

      // Check if it's base64
      if (brand.logo_url.startsWith('data:image/')) {
        try {
          console.log(`🔄 Migrating logo for ${brand.name}...`);

          // Convert base64 to file
          const base64Data = brand.logo_url;
          const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          
          if (!matches) {
            console.log(`⚠️ Invalid base64 format for ${brand.name}`);
            continue;
          }

          const mimeType = matches[1];
          const base64String = matches[2];
          const buffer = Buffer.from(base64String, 'base64');
          
          // Create file from buffer
          const fileExtension = mimeType.split('/')[1] || 'png';
          const fileName = `${Date.now()}-${brand.name.replace(/[^a-zA-Z0-9]/g, '-')}.${fileExtension}`;
          const filePath = `brand-logos/${fileName}`;
          
          // Create a File object from buffer
          const file = new File([buffer], fileName, { type: mimeType });

          // Upload to Supabase storage
          const uploadResult = await fileUploadService.uploadFile(file, filePath);

          if (uploadResult.success && uploadResult.url) {
            // Update the brand with the new hosted URL
            const { error: updateError } = await supabase
              .from('brands')
              .update({ logo_url: uploadResult.url })
              .eq('id', brand.id);

            if (updateError) {
              console.error(`❌ Error updating ${brand.name}:`, updateError);
            } else {
              console.log(`✅ Successfully migrated ${brand.name} to: ${uploadResult.url}`);
              migratedCount++;
            }
          } else {
            console.error(`❌ Failed to upload logo for ${brand.name}:`, uploadResult.error);
          }
        } catch (error) {
          console.error(`❌ Error migrating ${brand.name}:`, error);
        }
      } else {
        console.log(`⏭️ Skipping ${brand.name} - not base64`);
        skippedCount++;
      }
    }

    console.log('\n🎉 Migration completed!');
    console.log(`✅ Migrated: ${migratedCount} logos`);
    console.log(`⏭️ Skipped: ${skippedCount} logos`);
    console.log(`📊 Total processed: ${brands.length} brands`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run the migration
migrateLogosToHosting(); 