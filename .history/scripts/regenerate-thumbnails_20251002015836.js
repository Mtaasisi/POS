#!/usr/bin/env node

/**
 * Thumbnail Regeneration Script for LATS Inventory System
 * Creates proper thumbnails for existing images using image processing
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

class ThumbnailRegenerator {
  constructor() {
    this.regenerated = 0;
    this.errors = 0;
    this.skipped = 0;
    this.results = [];
    this.tempDir = path.join(__dirname, 'temp-thumbnails');
    
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async runRegeneration() {
    console.log('🔄 Starting Thumbnail Regeneration Process...\n');

    try {
      // 1. Check if product_images table exists
      const tableExists = await this.checkProductImagesTable();
      if (!tableExists) {
        console.log('❌ product_images table does not exist. Cannot proceed.');
        return;
      }

      // 2. Get images that need thumbnail regeneration
      const imagesToProcess = await this.getImagesForRegeneration();
      console.log(`📊 Found ${imagesToProcess.length} images for thumbnail regeneration\n`);

      if (imagesToProcess.length === 0) {
        console.log('✅ No images need thumbnail regeneration!');
        return;
      }

      // 3. Process images in batches
      await this.processImagesInBatches(imagesToProcess);

      // 4. Clean up temp files
      await this.cleanup();

      // 5. Display results
      this.displayResults();

    } catch (error) {
      console.error('❌ Regeneration process failed:', error);
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

  async getImagesForRegeneration() {
    console.log('🔍 Finding images that need thumbnail regeneration...');
    
    try {
      // Get images that either have no thumbnail or have the same URL as main image
      const { data, error } = await supabase
        .from('product_images')
        .select('id, product_id, file_name, image_url, thumbnail_url')
        .or('thumbnail_url.is.null,thumbnail_url.eq.,thumbnail_url.eq.image_url')
        .not('image_url', 'is', null)
        .neq('image_url', '');

      if (error) {
        console.log('❌ Error fetching images:', error.message);
        return [];
      }

      // Filter out base64 and blob URLs (they need special handling)
      const filteredData = (data || []).filter(img => 
        img.image_url && 
        !img.image_url.startsWith('data:') && 
        !img.image_url.startsWith('blob:')
      );

      console.log(`📊 Found ${filteredData.length} valid images for processing`);
      return filteredData;

    } catch (error) {
      console.log('❌ Error fetching images:', error.message);
      return [];
    }
  }

  async processImagesInBatches(images) {
    const batchSize = 5; // Smaller batch size for image processing
    const totalBatches = Math.ceil(images.length / batchSize);
    
    console.log(`📦 Processing ${images.length} images in ${totalBatches} batches of ${batchSize}...\n`);

    for (let i = 0; i < images.length; i += batchSize) {
      const batch = images.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      
      console.log(`🔄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} images)...`);
      
      await this.processBatch(batch);
      
      // Longer delay between batches for image processing
      if (i + batchSize < images.length) {
        console.log('⏳ Waiting 3 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  }

  async processBatch(batch) {
    const promises = batch.map(image => this.regenerateThumbnail(image));
    const results = await Promise.allSettled(promises);
    
    results.forEach((result, index) => {
      const image = batch[index];
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          this.regenerated++;
          console.log(`   ✅ Regenerated: ${image.file_name}`);
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

  async regenerateThumbnail(image) {
    try {
      // Download the original image
      const imageBuffer = await this.downloadImage(image.image_url);
      if (!imageBuffer) {
        return { success: false, reason: 'Could not download image' };
      }

      // Generate thumbnail using Sharp
      const thumbnailBuffer = await this.generateThumbnailBuffer(imageBuffer);
      if (!thumbnailBuffer) {
        return { success: false, reason: 'Could not generate thumbnail' };
      }

      // Upload thumbnail to Supabase storage
      const thumbnailUrl = await this.uploadThumbnail(thumbnailBuffer, image);
      if (!thumbnailUrl) {
        return { success: false, reason: 'Could not upload thumbnail' };
      }

      // Update database with new thumbnail URL
      const { error } = await supabase
        .from('product_images')
        .update({ thumbnail_url: thumbnailUrl })
        .eq('id', image.id);

      if (error) {
        throw new Error(`Database update failed: ${error.message}`);
      }

      return { success: true, thumbnailUrl };

    } catch (error) {
      throw new Error(`Regeneration failed: ${error.message}`);
    }
  }

  async downloadImage(imageUrl) {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const buffer = await response.arrayBuffer();
      return Buffer.from(buffer);
    } catch (error) {
      console.log(`   ⚠️ Could not download image: ${imageUrl}`);
      return null;
    }
  }

  async generateThumbnailBuffer(imageBuffer) {
    try {
      // Generate thumbnail with Sharp
      const thumbnailBuffer = await sharp(imageBuffer)
        .resize(200, 200, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      return thumbnailBuffer;
    } catch (error) {
      console.log(`   ⚠️ Could not generate thumbnail: ${error.message}`);
      return null;
    }
  }

  async uploadThumbnail(thumbnailBuffer, originalImage) {
    try {
      // Generate thumbnail filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      const thumbnailFileName = `thumb_${timestamp}_${randomId}.jpg`;
      
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(thumbnailFileName, thumbnailBuffer, {
          cacheControl: '31536000', // 1 year cache
          upsert: false,
          contentType: 'image/jpeg'
        });

      if (error) {
        throw new Error(`Storage upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(thumbnailFileName);

      return urlData.publicUrl;

    } catch (error) {
      console.log(`   ⚠️ Could not upload thumbnail: ${error.message}`);
      return null;
    }
  }

  async cleanup() {
    try {
      // Remove temp directory
      if (fs.existsSync(this.tempDir)) {
        fs.rmSync(this.tempDir, { recursive: true, force: true });
        console.log('🧹 Cleaned up temporary files');
      }
    } catch (error) {
      console.log('⚠️ Could not clean up temp files:', error.message);
    }
  }

  displayResults() {
    console.log('\n' + '='.repeat(60));
    console.log('🔄 THUMBNAIL REGENERATION RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ Regenerated: ${this.regenerated}`);
    console.log(`⏭️ Skipped: ${this.skipped}`);
    console.log(`❌ Errors: ${this.errors}`);
    console.log(`📊 Total processed: ${this.regenerated + this.skipped + this.errors}`);
    
    if (this.errors > 0) {
      console.log('\n⚠️ Some thumbnails could not be regenerated. Check the logs above for details.');
    }
    
    if (this.regenerated > 0) {
      console.log('\n✅ Thumbnail regeneration completed successfully!');
      console.log('💡 You may want to run the analysis script again to verify the results.');
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

// Run the regeneration process
async function main() {
  const regenerator = new ThumbnailRegenerator();
  await regenerator.runRegeneration();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ThumbnailRegenerator;
