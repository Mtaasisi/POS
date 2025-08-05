import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

// Create local directory structure
const createLocalDirectories = () => {
  const directories = [
    'public',
    'public/brand-logos',
    'public/brand-logos/backup'
  ];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  });
};

// Download brand logos from Supabase and save locally
const downloadBrandLogos = async () => {
  try {
    console.log('🔍 Fetching brands from database...');
    
    const { data: brands, error } = await supabase
      .from('brands')
      .select('id, name, logo_url')
      .eq('is_active', true);

    if (error) {
      console.error('❌ Error fetching brands:', error);
      return;
    }

    console.log(`📊 Found ${brands.length} active brands`);

    let downloadedCount = 0;
    let skippedCount = 0;

    for (const brand of brands) {
      if (!brand.logo_url) {
        console.log(`⏭️  Skipping ${brand.name} - no logo URL`);
        skippedCount++;
        continue;
      }

      try {
        // Extract filename from URL or create one
        let filename = '';
        if (brand.logo_url.includes('/')) {
          filename = brand.logo_url.split('/').pop();
        } else {
          filename = `${brand.id}-${brand.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
        }

        // Clean filename
        filename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        
        const localPath = path.join('public/brand-logos', filename);
        
        // Check if file already exists
        if (fs.existsSync(localPath)) {
          console.log(`✅ ${brand.name} logo already exists: ${filename}`);
          downloadedCount++;
          continue;
        }

        // Download the image
        const response = await fetch(brand.logo_url);
        if (!response.ok) {
          console.log(`⚠️  Could not download ${brand.name} logo: ${response.status}`);
          skippedCount++;
          continue;
        }

        const buffer = await response.arrayBuffer();
        fs.writeFileSync(localPath, Buffer.from(buffer));
        
        console.log(`✅ Downloaded ${brand.name} logo: ${filename}`);
        downloadedCount++;

      } catch (error) {
        console.log(`❌ Error downloading ${brand.name} logo:`, error.message);
        skippedCount++;
      }
    }

    console.log(`\n📈 Summary:`);
    console.log(`   ✅ Downloaded: ${downloadedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   📁 Total: ${downloadedCount + skippedCount}`);

  } catch (error) {
    console.error('❌ Error in download process:', error);
  }
};

// Create a manifest file for easy upload
const createUploadManifest = () => {
  const manifest = {
    timestamp: new Date().toISOString(),
    description: 'Brand logos for Hostinger upload',
    instructions: [
      '1. Upload all files from public/brand-logos/ to your Hostinger public_html/brand-logos/ folder',
      '2. Ensure the folder structure matches: public_html/brand-logos/',
      '3. Update the database logo_url fields to point to your domain',
      '4. Example: /public/brand-logos/logo.png becomes https://yourdomain.com/brand-logos/logo.png'
    ],
    files: []
  };

  try {
    const logosDir = 'public/brand-logos';
    if (fs.existsSync(logosDir)) {
      const files = fs.readdirSync(logosDir);
      manifest.files = files.filter(file => !file.startsWith('.'));
    }

    fs.writeFileSync('upload-manifest.json', JSON.stringify(manifest, null, 2));
    console.log('📄 Created upload-manifest.json with instructions');
  } catch (error) {
    console.error('❌ Error creating manifest:', error);
  }
};

// Generate SQL update script for Hostinger URLs
const generateSQLUpdate = () => {
  try {
    const logosDir = 'public/brand-logos';
    if (!fs.existsSync(logosDir)) {
      console.log('❌ No brand-logos directory found');
      return;
    }

    const files = fs.readdirSync(logosDir).filter(file => !file.startsWith('.'));
    
    let sqlContent = `-- Brand Logo URL Updates for Hostinger
-- Generated on: ${new Date().toISOString()}
-- Replace 'yourdomain.com' with your actual domain

`;

    files.forEach(file => {
      const brandId = file.split('-')[0];
      if (brandId) {
        sqlContent += `UPDATE brands SET logo_url = 'https://yourdomain.com/brand-logos/${file}' WHERE id = '${brandId}';\n`;
      }
    });

    fs.writeFileSync('update-brand-urls.sql', sqlContent);
    console.log('📄 Created update-brand-urls.sql for database updates');
  } catch (error) {
    console.error('❌ Error generating SQL:', error);
  }
};

// Main execution
const main = async () => {
  console.log('🚀 Starting brand logo local storage setup...\n');
  
  // Create directories
  createLocalDirectories();
  
  // Download logos
  await downloadBrandLogos();
  
  // Create manifest
  createUploadManifest();
  
  // Generate SQL update script
  generateSQLUpdate();
  
  console.log('\n✅ Setup complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Check the public/brand-logos/ folder for downloaded logos');
  console.log('2. Review upload-manifest.json for upload instructions');
  console.log('3. Use update-brand-urls.sql to update database URLs after upload');
  console.log('4. Upload the brand-logos folder to your Hostinger hosting');
};

main().catch(console.error); 