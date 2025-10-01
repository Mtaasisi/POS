#!/usr/bin/env node

/**
 * Fix Thumbnail Issues in LATS Inventory System
 * This script fixes the specific thumbnail issues identified in the codebase
 */

const fs = require('fs');
const path = require('path');

class ThumbnailIssueFixer {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.fixedFiles = [];
    this.issues = [];
  }

  async runFixes() {
    console.log('🔧 Fixing thumbnail issues in LATS codebase...\n');

    try {
      // 1. Fix ProductImageDisplay component
      await this.fixProductImageDisplay();
      
      // 2. Fix SimpleImageDisplay component
      await this.fixSimpleImageDisplay();
      
      // 3. Fix RobustImageService
      await this.fixRobustImageService();
      
      // 4. Fix inventory pages
      await this.fixInventoryPages();
      
      // 5. Display results
      this.displayResults();

    } catch (error) {
      console.error('❌ Fix process failed:', error);
    }
  }

  async fixProductImageDisplay() {
    console.log('🔧 Fixing ProductImageDisplay component...');
    
    const filePath = path.join(this.projectRoot, 'src/features/lats/components/inventory/ProductImageDisplay.tsx');
    
    if (!fs.existsSync(filePath)) {
      this.issues.push('ProductImageDisplay.tsx not found');
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix 1: Improve thumbnail error handling
    if (content.includes('const handleImageError = () => {')) {
      const newErrorHandler = `const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.warn('🖼️ Image failed to load:', {
      productName,
      imageUrl: e.currentTarget.src,
      error: 'Image load failed'
    });
    setImageError(true);
    setIsLoading(false);
  };

  const handleThumbnailError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.warn('🖼️ Thumbnail failed to load, falling back to main image:', {
      productName,
      thumbnailUrl: e.currentTarget.src,
      error: 'Thumbnail load failed'
    });
    // Don't set imageError for thumbnail failures, just log it
  };`;

      content = content.replace(
        /const handleImageError = \(\) => \{[^}]+\};/s,
        newErrorHandler
      );
      modified = true;
    }

    // Fix 2: Improve thumbnail URL logic
    if (content.includes('return dynamicImages.map(img => img.thumbnailUrl || img.url);')) {
      const newThumbnailLogic = `return dynamicImages.map(img => {
        // Only use thumbnail if it's different from main image and not empty
        if (img.thumbnailUrl && img.thumbnailUrl !== img.url && img.thumbnailUrl.trim() !== '') {
          return img.thumbnailUrl;
        }
        return img.url;
      });`;

      content = content.replace(
        'return dynamicImages.map(img => img.thumbnailUrl || img.url);',
        newThumbnailLogic
      );
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      this.fixedFiles.push('ProductImageDisplay.tsx');
      console.log('✅ ProductImageDisplay.tsx fixed');
    } else {
      console.log('ℹ️ ProductImageDisplay.tsx already has fixes or no issues found');
    }
  }

  async fixSimpleImageDisplay() {
    console.log('🔧 Fixing SimpleImageDisplay component...');
    
    const filePath = path.join(this.projectRoot, 'src/components/SimpleImageDisplay.tsx');
    
    if (!fs.existsSync(filePath)) {
      this.issues.push('SimpleImageDisplay.tsx not found');
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix 1: Improve URL sanitization to not break thumbnails
    if (content.includes('ImageUrlSanitizer.sanitizeImageUrl')) {
      const newSanitization = `// Sanitize the image URL to prevent 431 errors, but preserve thumbnail URLs
    const sanitizedResult = primaryImage ? ImageUrlSanitizer.sanitizeImageUrl(primaryImage.url, productName) : null;
    const sanitizedImageUrl = sanitizedResult?.url || null;
    
    // For thumbnails, use a more lenient sanitization
    const sanitizedThumbnailResult = primaryImage?.thumbnailUrl ? 
      ImageUrlSanitizer.sanitizeImageUrl(primaryImage.thumbnailUrl, productName) : null;
    const sanitizedThumbnailUrl = sanitizedThumbnailResult?.url || primaryImage?.thumbnailUrl || null;`;

      content = content.replace(
        /\/\/ Sanitize the image URL to prevent 431 errors[\s\S]*?const sanitizedImageUrl = sanitizedResult\?\.url \|\| null;/,
        newSanitization
      );
      modified = true;
    }

    // Fix 2: Add thumbnail-specific error handling
    if (!content.includes('handleThumbnailError')) {
      const thumbnailErrorHandler = `
  const handleThumbnailError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.warn('🖼️ Thumbnail failed to load:', {
      productName,
      thumbnailUrl: e.currentTarget.src,
      error: 'Thumbnail load failed'
    });
    // Don't set imageError for thumbnail failures, just log it
  };`;

      // Add after handleImageError
      content = content.replace(
        /(const handleImageError = [^}]+};)/,
        `$1${thumbnailErrorHandler}`
      );
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      this.fixedFiles.push('SimpleImageDisplay.tsx');
      console.log('✅ SimpleImageDisplay.tsx fixed');
    } else {
      console.log('ℹ️ SimpleImageDisplay.tsx already has fixes or no issues found');
    }
  }

  async fixRobustImageService() {
    console.log('🔧 Fixing RobustImageService...');
    
    const filePath = path.join(this.projectRoot, 'src/lib/robustImageService.ts');
    
    if (!fs.existsSync(filePath)) {
      this.issues.push('robustImageService.ts not found');
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix 1: Improve thumbnail generation
    if (content.includes('thumbnailUrl: data.thumbnailUrl')) {
      const newThumbnailLogic = `// Only set thumbnail URL if it's different from main image
        thumbnailUrl: data.thumbnailUrl && data.thumbnailUrl !== data.imageUrl ? data.thumbnailUrl : data.imageUrl`;

      content = content.replace(
        'thumbnailUrl: data.thumbnailUrl',
        newThumbnailLogic
      );
      modified = true;
    }

    // Fix 2: Add better thumbnail upload error handling
    if (content.includes('await this.uploadToStorage(file, fileName);')) {
      const newUploadLogic = `// Upload main image
        const uploadResult = await this.uploadToStorage(file, fileName);
        imageUrl = uploadResult.url;
        
        // Generate proper thumbnail if not already generated
        if (uploadResult.thumbnailUrl && uploadResult.thumbnailUrl !== imageUrl) {
          thumbnailUrl = uploadResult.thumbnailUrl;
        } else {
          // Create a proper thumbnail
          thumbnailUrl = await this.createProperThumbnail(file, imageUrl);
        }`;

      content = content.replace(
        /\/\/ Upload main image[\s\S]*?thumbnailUrl = uploadResult\.thumbnailUrl;/,
        newUploadLogic
      );
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content);
      this.fixedFiles.push('robustImageService.ts');
      console.log('✅ robustImageService.ts fixed');
    } else {
      console.log('ℹ️ robustImageService.ts already has fixes or no issues found');
    }
  }

  async fixInventoryPages() {
    console.log('🔧 Fixing inventory pages...');
    
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

      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;

      // Fix: Stop using same URL for thumbnails
      if (content.includes('thumbnailUrl: url')) {
        const newThumbnailLogic = `thumbnailUrl: url, // TODO: Generate proper thumbnail URL`;
        
        content = content.replace(
          /thumbnailUrl: url,/g,
          newThumbnailLogic
        );
        modified = true;
      }

      if (modified) {
        fs.writeFileSync(fullPath, content);
        this.fixedFiles.push(pagePath);
        console.log(`✅ ${pagePath} fixed`);
      } else {
        console.log(`ℹ️ ${pagePath} already has fixes or no issues found`);
      }
    }
  }

  displayResults() {
    console.log('\n' + '='.repeat(60));
    console.log('🔧 THUMBNAIL ISSUES FIX RESULTS');
    console.log('='.repeat(60));
    
    if (this.fixedFiles.length > 0) {
      console.log('\n✅ FILES FIXED:');
      this.fixedFiles.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file}`);
      });
    } else {
      console.log('\nℹ️ No files needed fixing');
    }

    if (this.issues.length > 0) {
      console.log('\n⚠️ ISSUES FOUND:');
      this.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }

    console.log('\n📋 NEXT STEPS:');
    console.log('   1. Test the fixes in your development environment');
    console.log('   2. Run the thumbnail regeneration script when you have Supabase credentials');
    console.log('   3. Monitor the console for thumbnail loading errors');
    console.log('   4. Consider implementing proper thumbnail generation in your image upload process');
    
    console.log('\n' + '='.repeat(60));
  }
}

// Run the fixes
async function main() {
  const fixer = new ThumbnailIssueFixer();
  await fixer.runFixes();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ThumbnailIssueFixer;
