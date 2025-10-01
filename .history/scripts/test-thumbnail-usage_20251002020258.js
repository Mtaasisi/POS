#!/usr/bin/env node

/**
 * Test Thumbnail Usage Script
 * This script tests if thumbnails are being used correctly in the components
 */

const fs = require('fs');
const path = require('path');

class ThumbnailUsageTester {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.results = {
      components: {},
      issues: [],
      recommendations: []
    };
  }

  async runTest() {
    console.log('🧪 Testing thumbnail usage in LATS components...\n');

    try {
      // 1. Test SimpleImageDisplay
      await this.testSimpleImageDisplay();
      
      // 2. Test ProductImageDisplay
      await this.testProductImageDisplay();
      
      // 3. Test inventory pages
      await this.testInventoryPages();
      
      // 4. Display results
      this.displayResults();

    } catch (error) {
      console.error('❌ Test failed:', error);
    }
  }

  async testSimpleImageDisplay() {
    console.log('🧪 Testing SimpleImageDisplay component...');
    
    const filePath = path.join(this.projectRoot, 'src/components/SimpleImageDisplay.tsx');
    
    if (!fs.existsSync(filePath)) {
      this.results.issues.push('SimpleImageDisplay.tsx not found');
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const componentResults = {
      usesThumbnailUrl: false,
      hasThumbnailLogic: false,
      usesDisplayUrl: false,
      hasThumbnailErrorHandling: false
    };

    // Check if component uses thumbnailUrl
    if (content.includes('sanitizedThumbnailUrl')) {
      componentResults.usesThumbnailUrl = true;
    }

    // Check if component has thumbnail logic
    if (content.includes('sanitizedThumbnailUrl !== sanitizedImageUrl')) {
      componentResults.hasThumbnailLogic = true;
    }

    // Check if component uses displayUrl
    if (content.includes('src={displayUrl}')) {
      componentResults.usesDisplayUrl = true;
    }

    // Check if component has thumbnail error handling
    if (content.includes('handleThumbnailError')) {
      componentResults.hasThumbnailErrorHandling = true;
    }

    this.results.components.SimpleImageDisplay = componentResults;

    // Check for issues
    if (!componentResults.usesThumbnailUrl) {
      this.results.issues.push('SimpleImageDisplay: Not using thumbnailUrl');
    }
    if (!componentResults.hasThumbnailLogic) {
      this.results.issues.push('SimpleImageDisplay: Missing thumbnail logic');
    }
    if (!componentResults.usesDisplayUrl) {
      this.results.issues.push('SimpleImageDisplay: Not using displayUrl for img src');
    }

    console.log('✅ SimpleImageDisplay test complete');
  }

  async testProductImageDisplay() {
    console.log('🧪 Testing ProductImageDisplay component...');
    
    const filePath = path.join(this.projectRoot, 'src/features/lats/components/inventory/ProductImageDisplay.tsx');
    
    if (!fs.existsSync(filePath)) {
      this.results.issues.push('ProductImageDisplay.tsx not found');
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const componentResults = {
      usesThumbnailUrl: false,
      hasThumbnailLogic: false,
      usesDisplayImages: false,
      hasThumbnailErrorHandling: false
    };

    // Check if component uses thumbnailUrl
    if (content.includes('img.thumbnailUrl')) {
      componentResults.usesThumbnailUrl = true;
    }

    // Check if component has thumbnail logic
    if (content.includes('img.thumbnailUrl !== img.url')) {
      componentResults.hasThumbnailLogic = true;
    }

    // Check if component uses displayImages
    if (content.includes('src={displayImages[0]}')) {
      componentResults.usesDisplayImages = true;
    }

    // Check if component has thumbnail error handling
    if (content.includes('handleThumbnailError')) {
      componentResults.hasThumbnailErrorHandling = true;
    }

    this.results.components.ProductImageDisplay = componentResults;

    // Check for issues
    if (!componentResults.usesThumbnailUrl) {
      this.results.issues.push('ProductImageDisplay: Not using thumbnailUrl');
    }
    if (!componentResults.hasThumbnailLogic) {
      this.results.issues.push('ProductImageDisplay: Missing thumbnail logic');
    }
    if (!componentResults.usesDisplayImages) {
      this.results.issues.push('ProductImageDisplay: Not using displayImages for img src');
    }

    console.log('✅ ProductImageDisplay test complete');
  }

  async testInventoryPages() {
    console.log('🧪 Testing inventory pages...');
    
    const pages = [
      'src/features/lats/pages/InventorySparePartsPage.tsx',
      'src/features/lats/pages/UnifiedInventoryPage.tsx'
    ];
    
    for (const pagePath of pages) {
      const fullPath = path.join(this.projectRoot, pagePath);
      
      if (!fs.existsSync(fullPath)) {
        this.results.issues.push(`${pagePath} not found`);
        continue;
      }

      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check if page uses SimpleImageDisplay or EnhancedInventoryTab (which uses SimpleImageDisplay)
      if (content.includes('SimpleImageDisplay') || content.includes('EnhancedInventoryTab')) {
        console.log(`✅ ${pagePath} uses SimpleImageDisplay (directly or via EnhancedInventoryTab)`);
      } else {
        this.results.issues.push(`${pagePath}: Not using SimpleImageDisplay`);
      }
    }

    console.log('✅ Inventory pages test complete');
  }

  displayResults() {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 THUMBNAIL USAGE TEST RESULTS');
    console.log('='.repeat(60));
    
    // Display component results
    console.log('\n📊 COMPONENT ANALYSIS:');
    Object.entries(this.results.components).forEach(([component, results]) => {
      console.log(`\n${component}:`);
      Object.entries(results).forEach(([key, value]) => {
        const status = value ? '✅' : '❌';
        console.log(`   ${status} ${key}: ${value}`);
      });
    });

    if (this.results.issues.length > 0) {
      console.log('\n❌ ISSUES FOUND:');
      this.results.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    } else {
      console.log('\n✅ No issues found!');
    }

    // Generate recommendations
    this.generateRecommendations();
    
    if (this.results.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      this.results.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }

    console.log('\n📋 NEXT STEPS:');
    console.log('   1. Check browser console for thumbnail loading logs');
    console.log('   2. Verify that thumbnails are being used in the UI');
    console.log('   3. Test with products that have actual thumbnail URLs');
    console.log('   4. Monitor network requests to see if thumbnail URLs are being requested');
    
    console.log('\n' + '='.repeat(60));
  }

  generateRecommendations() {
    // Generate recommendations based on test results
    if (this.results.issues.some(issue => issue.includes('Not using thumbnailUrl'))) {
      this.results.recommendations.push('Ensure components are using thumbnailUrl when available');
    }
    
    if (this.results.issues.some(issue => issue.includes('Missing thumbnail logic'))) {
      this.results.recommendations.push('Add logic to prefer thumbnails over main images');
    }
    
    if (this.results.issues.some(issue => issue.includes('Not using displayUrl'))) {
      this.results.recommendations.push('Use displayUrl (which includes thumbnail logic) for img src');
    }
  }
}

// Run the test
async function main() {
  const tester = new ThumbnailUsageTester();
  await tester.runTest();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ThumbnailUsageTester;
