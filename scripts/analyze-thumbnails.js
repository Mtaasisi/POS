#!/usr/bin/env node

/**
 * Thumbnail Analysis Script for LATS Inventory System
 * Analyzes the current state of thumbnails and provides recommendations
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

class ThumbnailAnalyzer {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      analysis: {},
      recommendations: [],
      issues: []
    };
  }

  async runAnalysis() {
    console.log('🔍 Starting Thumbnail Analysis...\n');

    try {
      // 1. Check if product_images table exists
      await this.checkProductImagesTable();
      
      // 2. Analyze product_images data
      await this.analyzeProductImages();
      
      // 3. Check lats_products legacy data
      await this.analyzeLegacyImages();
      
      // 4. Check for broken URLs
      await this.checkBrokenUrls();
      
      // 5. Generate recommendations
      this.generateRecommendations();
      
      // 6. Save report
      await this.saveReport();
      
      // 7. Display summary
      this.displaySummary();
      
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      this.results.issues.push(`Analysis failed: ${error.message}`);
    }
  }

  async checkProductImagesTable() {
    console.log('📊 Checking product_images table...');
    
    try {
      const { data, error } = await supabase
        .from('product_images')
        .select('id')
        .limit(1);
      
      if (error) {
        this.results.analysis.productImagesTable = {
          exists: false,
          error: error.message
        };
        console.log('❌ product_images table not accessible:', error.message);
      } else {
        this.results.analysis.productImagesTable = {
          exists: true,
          accessible: true
        };
        console.log('✅ product_images table exists and is accessible');
      }
    } catch (error) {
      this.results.analysis.productImagesTable = {
        exists: false,
        error: error.message
      };
      console.log('❌ product_images table not accessible:', error.message);
    }
  }

  async analyzeProductImages() {
    if (!this.results.analysis.productImagesTable?.exists) {
      return;
    }

    console.log('📊 Analyzing product_images data...');
    
    try {
      // Get total count
      const { count: totalImages, error: countError } = await supabase
        .from('product_images')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.log('❌ Could not get image count:', countError.message);
        return;
      }

      // Get images with proper thumbnails
      const { count: withThumbnails, error: thumbError } = await supabase
        .from('product_images')
        .select('*', { count: 'exact', head: true })
        .not('thumbnail_url', 'is', null)
        .neq('thumbnail_url', '')
        .neq('thumbnail_url', 'image_url');

      // Get images without thumbnails
      const { count: withoutThumbnails, error: noThumbError } = await supabase
        .from('product_images')
        .select('*', { count: 'exact', head: true })
        .or('thumbnail_url.is.null,thumbnail_url.eq.,thumbnail_url.eq.image_url');

      // Get sample problematic records
      const { data: problematicRecords, error: sampleError } = await supabase
        .from('product_images')
        .select('id, product_id, file_name, image_url, thumbnail_url')
        .or('thumbnail_url.is.null,thumbnail_url.eq.,thumbnail_url.eq.image_url')
        .limit(10);

      this.results.analysis.productImages = {
        totalImages: totalImages || 0,
        withThumbnails: withThumbnails || 0,
        withoutThumbnails: withoutThumbnails || 0,
        problematicRecords: problematicRecords || []
      };

      console.log(`📈 Total images: ${totalImages || 0}`);
      console.log(`✅ Images with thumbnails: ${withThumbnails || 0}`);
      console.log(`❌ Images without thumbnails: ${withoutThumbnails || 0}`);
      
      if (problematicRecords && problematicRecords.length > 0) {
        console.log(`🔍 Sample problematic records: ${problematicRecords.length}`);
        problematicRecords.forEach(record => {
          console.log(`   - ID: ${record.id}, Product: ${record.product_id}, File: ${record.file_name}`);
        });
      }

    } catch (error) {
      console.log('❌ Error analyzing product_images:', error.message);
      this.results.issues.push(`Product images analysis failed: ${error.message}`);
    }
  }

  async analyzeLegacyImages() {
    console.log('📊 Analyzing legacy lats_products images...');
    
    try {
      // Get total products
      const { count: totalProducts, error: countError } = await supabase
        .from('lats_products')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.log('❌ Could not get products count:', countError.message);
        return;
      }

      // Get products with images
      const { count: productsWithImages, error: imagesError } = await supabase
        .from('lats_products')
        .select('*', { count: 'exact', head: true })
        .not('images', 'is', null);

      // Get sample products with images
      const { data: sampleProducts, error: sampleError } = await supabase
        .from('lats_products')
        .select('id, name, images')
        .not('images', 'is', null)
        .limit(5);

      this.results.analysis.legacyImages = {
        totalProducts: totalProducts || 0,
        productsWithImages: productsWithImages || 0,
        sampleProducts: sampleProducts || []
      };

      console.log(`📈 Total products: ${totalProducts || 0}`);
      console.log(`🖼️ Products with images: ${productsWithImages || 0}`);
      
      if (sampleProducts && sampleProducts.length > 0) {
        console.log(`🔍 Sample products with images:`);
        sampleProducts.forEach(product => {
          console.log(`   - ${product.name}: ${product.images?.length || 0} images`);
        });
      }

    } catch (error) {
      console.log('❌ Error analyzing legacy images:', error.message);
      this.results.issues.push(`Legacy images analysis failed: ${error.message}`);
    }
  }

  async checkBrokenUrls() {
    if (!this.results.analysis.productImagesTable?.exists) {
      return;
    }

    console.log('📊 Checking for broken URLs...');
    
    try {
      const { data: urlAnalysis, error } = await supabase
        .from('product_images')
        .select('image_url, thumbnail_url');

      if (error) {
        console.log('❌ Could not analyze URLs:', error.message);
        return;
      }

      const analysis = {
        total: urlAnalysis.length,
        base64: 0,
        blob: 0,
        http: 0,
        other: 0,
        broken: 0
      };

      urlAnalysis.forEach(record => {
        const url = record.image_url;
        if (url?.startsWith('data:')) analysis.base64++;
        else if (url?.startsWith('blob:')) analysis.blob++;
        else if (url?.startsWith('http')) analysis.http++;
        else if (url) analysis.other++;
        else analysis.broken++;
      });

      this.results.analysis.urlAnalysis = analysis;

      console.log(`📈 URL Analysis:`);
      console.log(`   - Base64: ${analysis.base64}`);
      console.log(`   - Blob: ${analysis.blob}`);
      console.log(`   - HTTP: ${analysis.http}`);
      console.log(`   - Other: ${analysis.other}`);
      console.log(`   - Broken: ${analysis.broken}`);

    } catch (error) {
      console.log('❌ Error analyzing URLs:', error.message);
      this.results.issues.push(`URL analysis failed: ${error.message}`);
    }
  }

  generateRecommendations() {
    console.log('💡 Generating recommendations...');
    
    const recommendations = [];
    const issues = [];

    // Check if product_images table exists
    if (!this.results.analysis.productImagesTable?.exists) {
      issues.push('product_images table does not exist');
      recommendations.push('Create product_images table with proper schema');
    }

    // Check thumbnail status
    if (this.results.analysis.productImages) {
      const { totalImages, withThumbnails, withoutThumbnails } = this.results.analysis.productImages;
      
      if (withoutThumbnails > 0) {
        const percentage = Math.round((withoutThumbnails / totalImages) * 100);
        issues.push(`${withoutThumbnails} images (${percentage}%) missing thumbnails`);
        recommendations.push('Regenerate thumbnails for existing images');
      }

      if (withThumbnails === 0 && totalImages > 0) {
        issues.push('No images have proper thumbnails');
        recommendations.push('Implement thumbnail generation system');
      }
    }

    // Check legacy data
    if (this.results.analysis.legacyImages) {
      const { totalProducts, productsWithImages } = this.results.analysis.legacyImages;
      
      if (productsWithImages > 0) {
        recommendations.push('Migrate legacy image data to product_images table');
      }
    }

    // Check URL issues
    if (this.results.analysis.urlAnalysis) {
      const { base64, blob, broken } = this.results.analysis.urlAnalysis;
      
      if (base64 > 0) {
        issues.push(`${base64} images stored as base64 (performance impact)`);
        recommendations.push('Move base64 images to proper storage');
      }
      
      if (broken > 0) {
        issues.push(`${broken} images have broken URLs`);
        recommendations.push('Fix or remove broken image URLs');
      }
    }

    this.results.recommendations = recommendations;
    this.results.issues = issues;

    console.log(`\n📋 Found ${issues.length} issues and ${recommendations.length} recommendations`);
  }

  async saveReport() {
    const reportPath = path.join(__dirname, 'thumbnail-analysis-report.json');
    
    try {
      await fs.promises.writeFile(reportPath, JSON.stringify(this.results, null, 2));
      console.log(`\n📄 Report saved to: ${reportPath}`);
    } catch (error) {
      console.log('❌ Could not save report:', error.message);
    }
  }

  displaySummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 THUMBNAIL ANALYSIS SUMMARY');
    console.log('='.repeat(60));
    
    if (this.results.issues.length > 0) {
      console.log('\n❌ ISSUES FOUND:');
      this.results.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    } else {
      console.log('\n✅ No major issues found');
    }

    if (this.results.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      this.results.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }

    console.log('\n📈 STATISTICS:');
    if (this.results.analysis.productImages) {
      const { totalImages, withThumbnails, withoutThumbnails } = this.results.analysis.productImages;
      console.log(`   - Total images: ${totalImages}`);
      console.log(`   - With thumbnails: ${withThumbnails}`);
      console.log(`   - Without thumbnails: ${withoutThumbnails}`);
    }

    if (this.results.analysis.legacyImages) {
      const { totalProducts, productsWithImages } = this.results.analysis.legacyImages;
      console.log(`   - Total products: ${totalProducts}`);
      console.log(`   - Products with images: ${productsWithImages}`);
    }

    console.log('\n' + '='.repeat(60));
  }
}

// Run the analysis
async function main() {
  const analyzer = new ThumbnailAnalyzer();
  await analyzer.runAnalysis();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ThumbnailAnalyzer;
