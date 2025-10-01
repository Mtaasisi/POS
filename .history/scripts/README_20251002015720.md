# LATS Thumbnail Analysis and Fix Scripts

This directory contains scripts to analyze and fix thumbnail issues in the LATS inventory system.

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   cd scripts
   npm install
   ```

2. **Set up environment variables:**
   Make sure your `.env` file in the project root contains:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Run the analysis:**
   ```bash
   npm run analyze
   ```

## 📋 Available Scripts

### 1. Analysis Script (`analyze-thumbnails.js`)
Analyzes the current state of thumbnails in your database and generates a comprehensive report.

**What it does:**
- Checks if `product_images` table exists
- Analyzes thumbnail status (missing, broken, etc.)
- Checks legacy image data in `lats_products`
- Identifies broken or invalid URLs
- Generates recommendations

**Usage:**
```bash
npm run analyze
```

**Output:**
- Console report with statistics
- JSON report saved to `thumbnail-analysis-report.json`

### 2. Fix Script (`fix-thumbnails.js`)
Fixes basic thumbnail issues by updating database records.

**What it does:**
- Updates thumbnail URLs for images where thumbnail equals main image
- Handles simple URL transformations
- Updates database records

**Usage:**
```bash
npm run fix
```

### 3. Regeneration Script (`regenerate-thumbnails.js`)
Creates proper thumbnails by downloading and processing images.

**What it does:**
- Downloads original images
- Generates proper thumbnails using Sharp
- Uploads thumbnails to Supabase storage
- Updates database with new thumbnail URLs

**Requirements:**
- Sharp library for image processing
- Valid image URLs that can be downloaded

**Usage:**
```bash
npm run regenerate
```

## 🔧 Installation

1. **Navigate to scripts directory:**
   ```bash
   cd scripts
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Verify environment variables:**
   Make sure your `.env` file is properly configured.

## 📊 Understanding the Analysis

The analysis script checks for several issues:

### Database Issues
- Missing `product_images` table
- Inconsistent data between tables
- Missing thumbnail URLs

### Image Issues
- Images without thumbnails
- Thumbnails that are the same as main images
- Broken or invalid URLs
- Base64 images (performance impact)

### Legacy Data
- Products using old `images` column instead of `product_images` table
- Inconsistent image storage

## 🛠️ Fixing Issues

### Step 1: Run Analysis
```bash
npm run analyze
```

### Step 2: Review the Report
Check the generated `thumbnail-analysis-report.json` for detailed findings.

### Step 3: Apply Fixes
```bash
# For basic fixes
npm run fix

# For complete thumbnail regeneration
npm run regenerate
```

### Step 4: Verify Results
```bash
npm run analyze
```

## ⚠️ Important Notes

1. **Backup First:** Always backup your database before running fix scripts
2. **Test Environment:** Test these scripts in a development environment first
3. **Image URLs:** The regeneration script requires valid, accessible image URLs
4. **Storage Limits:** Ensure you have sufficient storage space for thumbnails
5. **Rate Limits:** The scripts include delays to avoid overwhelming the system

## 🐛 Troubleshooting

### Common Issues

1. **"Missing Supabase credentials"**
   - Check your `.env` file
   - Ensure variables are named correctly

2. **"product_images table not accessible"**
   - Check database permissions
   - Verify table exists

3. **"Could not download image"**
   - Check if image URLs are accessible
   - Verify network connectivity

4. **"Could not generate thumbnail"**
   - Install Sharp: `npm install sharp`
   - Check image format compatibility

### Getting Help

If you encounter issues:
1. Check the console output for specific error messages
2. Review the generated report file
3. Check your database permissions and table structure
4. Verify your Supabase configuration

## 📈 Expected Results

After running the scripts, you should see:
- ✅ All images have proper thumbnail URLs
- ✅ Thumbnails are different from main images
- ✅ No broken or invalid URLs
- ✅ Improved performance in inventory display

## 🔄 Maintenance

Run the analysis script periodically to:
- Monitor thumbnail health
- Identify new issues
- Track improvements
- Ensure system stability
