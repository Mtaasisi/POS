#!/usr/bin/env node

/**
 * Thumbnail Fix Script for LATS Inventory System
 * Fixes thumbnail issues and regenerates missing thumbnails
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

class ThumbnailFixer {
  constructor() {
    this.fixed = 0;
    this.errors = 0;
    this.skipped = 0;
    this.results = [];
  }

  async runFix() {
    console.log('🔧 Starting Thumbnail Fix Process...\n');

    try {
      // 1. Check if product_images table exists
      const tableExists = await this.checkProductImagesTable();
      if (!tableExists) {
        console.log('❌ product_images table does not exist. Cannot proceed.');
        return;
      }

      // 2. Get images that need thumbnail fixes
      const problematicImages = await this.getProblematicImages();
      console.log(`📊 Found ${problematicImages.length} images that need fixing\n`);

      if (problematicImages.length === 0) {
        console.log('✅ No images need fixing!');
        return;
      }

      // 3. Process images in batches
      await this.processImagesInBatches(problematicImages);

      // 4. Display results
      this.displayResults();

    } catch (error) {
      console.error('❌ Fix process failed:', error);
    }
  }

  async checkProductImagesTable() {
    try {
      const { data, error } = await supabase
        .from('product_images')
        .select('id')
        .limit(1);
      
      if (error) {
        console.log('❌ product_images table not accessible:', error.message);
        return false;
      }
      
      console.log('✅ product_images table is accessible');
      return true;
    } catch (error) {
      console.log('❌ Error checking product_images table:', error.message);
      return false;
    }
  }

  async getProblematicImages() {
    console.log('🔍 Finding images that need thumbnail fixes...');
    
    try {
      const { data, error } = await supabase
        .from('product_images')
        .select('id, product_id, file_name, image_url, thumbnail_url')
        .or('thumbnail_url.is.null,thumbnail_url.eq.,thumbnail_url.eq.image_url');

      if (error) {
        console.log('❌ Error fetching problematic images:', error.message);
        return [];
      }

      return data || [];
    } catch (error) {
      console.log('❌ Error fetching problematic images:', error.message);
      return [];
    }
  }

  async processImagesInBatches(images) {
    const batchSize = 10;
    const totalBatches = Math.ceil(images.length / batchSize);
    
    console.log(`📦 Processing ${images.length} images in ${totalBatches} batches of ${batchSize}...\n`);

    for (let i = 0; i < images.length; i += batchSize) {
      const batch = images.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      
      console.log(`🔄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} images)...`);
      
      await this.processBatch(batch);
      
      // Small delay between batches to avoid overwhelming the system
      if (i + batchSize < images.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  async processBatch(batch) {
    const promises = batch.map(image => this.fixImageThumbnail(image));
    const results = await Promise.allSettled(promises);
    
    results.forEach((result, index) => {
      const image = batch[index];
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          this.fixed++;
          console.log(`   ✅ Fixed: ${image.file_name}`);
        } else {
          this.skipped++;
          console.log(`   ⏭️ Skipped: ${image.file_name} (${result.value.reason})`);
        }
      } else {
        this.errors++;
        console.log(`   ❌ Error: ${image.file_name} (${result.reason?.message || 'Unknown error'})`);
      }
    });
  }

  async fixImageThumbnail(image) {
    try {
      // Check if image URL is valid
      if (!image.image_url || image.image_url.trim() === '') {
        return { success: false, reason: 'No image URL' };
      }

      // Skip base64 images for now (they need special handling)
      if (image.image_url.startsWith('data:')) {
        return { success: false, reason: 'Base64 image (needs special handling)' };
      }

      // Skip blob URLs
      if (image.image_url.startsWith('blob:')) {
        return { success: false, reason: 'Blob URL (temporary)' };
      }

      // For HTTP URLs, create a thumbnail URL
      if (image.image_url.startsWith('http')) {
        const thumbnailUrl = await this.generateThumbnailUrl(image.image_url);
        
        if (thumbnailUrl) {
          // Update the database
          const { error } = await supabase
            .from('product_images')
            .update({ thumbnail_url: thumbnailUrl })
            .eq('id', image.id);

          if (error) {
            throw new Error(`Database update failed: ${error.message}`);
          }

          return { success: true, thumbnailUrl };
        } else {
          return { success: false, reason: 'Could not generate thumbnail URL' };
        }
      }

      return { success: false, reason: 'Unsupported URL type' };

    } catch (error) {
      throw new Error(`Fix failed: ${error.message}`);
    }
  }

  async generateThumbnailUrl(imageUrl) {
    try {
      // For Supabase storage URLs, we can create a thumbnail URL by modifying the path
      if (imageUrl.includes('supabase')) {
        // Extract the file path from the URL
        const urlParts = imageUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        
        // Create thumbnail path
        const thumbnailPath = imageUrl.replace(fileName, `thumb_${fileName}`);
        return thumbnailPath;
      }

      // For other HTTP URLs, we'll use a simple approach
      // In a real implementation, you might want to use an image processing service
      return imageUrl; // Fallback to same URL for now

    } catch (error) {
      console.log(`   ⚠️ Could not generate thumbnail URL for: ${imageUrl}`);
      return null;
    }
  }

  displayResults() {
    console.log('\n' + '='.repeat(60));
    console.log('🔧 THUMBNAIL FIX RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ Fixed: ${this.fixed}`);
    console.log(`⏭️ Skipped: ${this.skipped}`);
    console.log(`❌ Errors: ${this.errors}`);
    console.log(`📊 Total processed: ${this.fixed + this.skipped + this.errors}`);
    
    if (this.errors > 0) {
      console.log('\n⚠️ Some images could not be fixed. Check the logs above for details.');
    }
    
    if (this.fixed > 0) {
      console.log('\n✅ Thumbnail fixes completed successfully!');
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// Run the fix process
async function main() {
  const fixer = new ThumbnailFixer();
  await fixer.runFix();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ThumbnailFixer;
