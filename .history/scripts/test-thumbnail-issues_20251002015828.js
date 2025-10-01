#!/usr/bin/env node

/**
 * Test Script to Identify Thumbnail Issues in LATS Inventory System
 * This script analyzes the codebase to identify potential thumbnail problems
 */

const fs = require('fs');
const path = require('path');

class ThumbnailIssueDetector {
  constructor() {
    this.issues = [];
    this.recommendations = [];
    this.projectRoot = path.join(__dirname, '..');
  }

  async runAnalysis() {
    console.log('🔍 Analyzing LATS codebase for thumbnail issues...\n');

    try {
      // 1. Check ProductImageDisplay component
      await this.analyzeProductImageDisplay();
      
      // 2. Check SimpleImageDisplay component
      await this.analyzeSimpleImageDisplay();
      
      // 3. Check RobustImageService
      await this.analyzeRobustImageService();
      
      // 4. Check inventory pages
      await this.analyzeInventoryPages();
      
      // 5. Display findings
      this.displayFindings();

    } catch (error) {
      console.error('❌ Analysis failed:', error);
    }
  }

  async analyzeProductImageDisplay() {
    console.log('📊 Analyzing ProductImageDisplay component...');
    
    const filePath = path.join(this.projectRoot, 'src/features/lats/components/inventory/ProductImageDisplay.tsx');
    
    if (!fs.existsSync(filePath)) {
      this.issues.push('ProductImageDisplay.tsx not found');
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for thumbnail URL handling issues
    if (content.includes('img.thumbnailUrl || img.url')) {
      this.issues.push('ProductImageDisplay: Falls back to main image when thumbnail is missing');
    }
    
    if (content.includes('thumbnailUrl: url')) {
      this.issues.push('ProductImageDisplay: Setting thumbnail URL same as main image');
    }
    
    // Check for error handling
    if (!content.includes('handleImageError')) {
      this.issues.push('ProductImageDisplay: Missing proper error handling for thumbnails');
    }
    
    console.log('✅ ProductImageDisplay analysis complete');
  }

  async analyzeSimpleImageDisplay() {
    console.log('📊 Analyzing SimpleImageDisplay component...');
    
    const filePath = path.join(this.projectRoot, 'src/components/SimpleImageDisplay.tsx');
    
    if (!fs.existsSync(filePath)) {
      this.issues.push('SimpleImageDisplay.tsx not found');
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for URL sanitization issues
    if (content.includes('ImageUrlSanitizer.sanitizeImageUrl')) {
      this.issues.push('SimpleImageDisplay: URL sanitization might break thumbnail URLs');
    }
    
    // Check for thumbnail error handling
    if (content.includes('thumbnailError')) {
      console.log('✅ SimpleImageDisplay has thumbnail error handling');
    } else {
      this.issues.push('SimpleImageDisplay: Missing thumbnail-specific error handling');
    }
    
    console.log('✅ SimpleImageDisplay analysis complete');
  }

  async analyzeRobustImageService() {
    console.log('📊 Analyzing RobustImageService...');
    
    const filePath = path.join(this.projectRoot, 'src/lib/robustImageService.ts');
    
    if (!fs.existsSync(filePath)) {
      this.issues.push('robustImageService.ts not found');
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for thumbnail generation
    if (content.includes('createThumbnail')) {
      console.log('✅ RobustImageService has thumbnail generation');
    } else {
      this.issues.push('RobustImageService: Missing thumbnail generation method');
    }
    
    // Check for fallback logic
    if (content.includes('thumbnail_url: url')) {
      this.issues.push('RobustImageService: Setting thumbnail URL same as main image (not a real thumbnail)');
    }
    
    // Check for error handling
    if (content.includes('thumbnail upload failed')) {
      console.log('✅ RobustImageService has thumbnail upload error handling');
    } else {
      this.issues.push('RobustImageService: Missing thumbnail upload error handling');
    }
    
    console.log('✅ RobustImageService analysis complete');
  }

  async analyzeInventoryPages() {
    console.log('📊 Analyzing inventory pages...');
    
    const pages = [
      'src/features/lats/pages/InventorySparePartsPage.tsx',
      'src/features/lats/pages/UnifiedInventoryPage.tsx'
    ];
    
    for (const pagePath of pages) {
      const fullPath = path.join(this.projectRoot, pagePath);
      
      if (!fs.existsSync(fullPath)) {
        this.issues.push(`${pagePath} not found`);
        continue;
      }

      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check for thumbnail URL usage
      if (content.includes('thumbnailUrl: url')) {
        this.issues.push(`${pagePath}: Using same URL for image and thumbnail`);
      }
      
      // Check for SimpleImageDisplay usage
      if (content.includes('SimpleImageDisplay')) {
        console.log(`✅ ${pagePath} uses SimpleImageDisplay`);
      }
    }
    
    console.log('✅ Inventory pages analysis complete');
  }

  displayFindings() {
    console.log('\n' + '='.repeat(60));
    console.log('🔍 THUMBNAIL ISSUES ANALYSIS RESULTS');
    console.log('='.repeat(60));
    
    if (this.issues.length > 0) {
      console.log('\n❌ ISSUES FOUND:');
      this.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    } else {
      console.log('\n✅ No major issues found in codebase analysis');
    }

    // Generate recommendations based on findings
    this.generateRecommendations();
    
    if (this.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      this.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }

    console.log('\n📋 NEXT STEPS:');
    console.log('   1. Run the database analysis script (requires Supabase credentials)');
    console.log('   2. Fix the identified code issues');
    console.log('   3. Regenerate thumbnails for existing products');
    console.log('   4. Test the fixes in development environment');
    
    console.log('\n' + '='.repeat(60));
  }

  generateRecommendations() {
    // Generate recommendations based on found issues
    if (this.issues.some(issue => issue.includes('Falls back to main image'))) {
      this.recommendations.push('Implement proper thumbnail generation instead of using main image as fallback');
    }
    
    if (this.issues.some(issue => issue.includes('same URL for image and thumbnail'))) {
      this.recommendations.push('Generate actual thumbnails instead of using same URL as main image');
    }
    
    if (this.issues.some(issue => issue.includes('URL sanitization'))) {
      this.recommendations.push('Review URL sanitization to ensure it doesn\'t break valid thumbnail URLs');
    }
    
    if (this.issues.some(issue => issue.includes('Missing thumbnail-specific error handling'))) {
      this.recommendations.push('Add specific error handling for thumbnail loading failures');
    }
    
    if (this.issues.some(issue => issue.includes('Missing thumbnail generation'))) {
      this.recommendations.push('Implement thumbnail generation in the image service');
    }
  }
}

// Run the analysis
async function main() {
  const detector = new ThumbnailIssueDetector();
  await detector.runAnalysis();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ThumbnailIssueDetector;
