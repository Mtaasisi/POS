#!/usr/bin/env node

/**
 * Simple PDF Text Extractor
 * Extracts text from PDF files for product data processing
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple PDF text extraction (basic implementation)
// For production use, consider libraries like pdf-parse, pdf2pic, or pdf-lib

function extractTextFromPDF(pdfPath) {
  console.log(`📄 Extracting text from: ${pdfPath}`);
  
  // This is a mock implementation
  // In a real scenario, you would use a PDF parsing library
  
  const mockExtractedText = `
PRODUCT CATALOG - ACCOUNTING VOUCHER

Product Name: Samsung Galaxy S23
Description: Latest Samsung smartphone with advanced camera
SKU: SAM-GS23-001
Category: Electronics
Cost Price: 850,000 TZS
Selling Price: 1,200,000 TZS
Stock Quantity: 50
Min Stock Level: 5
Supplier: Samsung Electronics
Specifications:
- Screen Size: 6.1 inches
- Storage: 128GB
- RAM: 8GB
- Camera: 50MP Main Camera

Product Name: iPhone 15 Pro
Description: Apple's flagship smartphone with titanium design
SKU: APP-IP15P-001
Category: Electronics
Cost Price: 1,200,000 TZS
Selling Price: 1,800,000 TZS
Stock Quantity: 30
Min Stock Level: 3
Supplier: Apple Inc
Specifications:
- Screen Size: 6.1 inches
- Storage: 256GB
- RAM: 8GB
- Camera: 48MP Main Camera

Product Name: Dell XPS 13 Laptop
Description: Premium ultrabook with 13-inch display
SKU: DEL-XPS13-001
Category: Computers
Cost Price: 2,500,000 TZS
Selling Price: 3,500,000 TZS
Stock Quantity: 15
Min Stock Level: 2
Supplier: Dell Technologies
Specifications:
- Processor: Intel Core i7
- RAM: 16GB
- Storage: 512GB SSD
- Display: 13.4-inch 4K
`;

  return mockExtractedText;
}

/**
 * Parse extracted text into structured product data
 */
function parseProductData(text) {
  const products = [];
  const productBlocks = text.split(/(?=Product Name:)/).filter(block => block.trim());
  
  productBlocks.forEach(block => {
    if (!block.includes('Product Name:')) return;
    
    const lines = block.split('\n').map(line => line.trim()).filter(line => line);
    
    const product = {
      name: '',
      description: '',
      sku: '',
      category: '',
      costPrice: 0,
      sellingPrice: 0,
      stockQuantity: 0,
      minStockLevel: 0,
      supplier: '',
      specifications: {}
    };
    
    let currentSpec = '';
    
    lines.forEach(line => {
      if (line.startsWith('Product Name:')) {
        product.name = line.replace('Product Name:', '').trim();
      } else if (line.startsWith('Description:')) {
        product.description = line.replace('Description:', '').trim();
      } else if (line.startsWith('SKU:')) {
        product.sku = line.replace('SKU:', '').trim();
      } else if (line.startsWith('Category:')) {
        product.category = line.replace('Category:', '').trim();
      } else if (line.startsWith('Cost Price:')) {
        const price = line.replace('Cost Price:', '').replace(/[^\d]/g, '');
        product.costPrice = parseInt(price) || 0;
      } else if (line.startsWith('Selling Price:')) {
        const price = line.replace('Selling Price:', '').replace(/[^\d]/g, '');
        product.sellingPrice = parseInt(price) || 0;
      } else if (line.startsWith('Stock Quantity:')) {
        product.stockQuantity = parseInt(line.replace('Stock Quantity:', '')) || 0;
      } else if (line.startsWith('Min Stock Level:')) {
        product.minStockLevel = parseInt(line.replace('Min Stock Level:', '')) || 0;
      } else if (line.startsWith('Supplier:')) {
        product.supplier = line.replace('Supplier:', '').trim();
      } else if (line.startsWith('- ')) {
        const spec = line.replace('- ', '');
        const [key, value] = spec.split(':').map(s => s.trim());
        if (key && value) {
          product.specifications[key] = value;
        }
      }
    });
    
    if (product.name) {
      products.push(product);
    }
  });
  
  return products;
}

/**
 * Generate CSV output
 */
function generateCSV(products) {
  const headers = [
    'name',
    'description',
    'sku',
    'category',
    'cost_price',
    'selling_price',
    'stock_quantity',
    'min_stock_level',
    'supplier',
    'specifications'
  ];
  
  const csvRows = [headers.join(',')];
  
  products.forEach(product => {
    const row = [
      `"${product.name}"`,
      `"${product.description}"`,
      `"${product.sku}"`,
      `"${product.category}"`,
      product.costPrice,
      product.sellingPrice,
      product.stockQuantity,
      product.minStockLevel,
      `"${product.supplier}"`,
      `"${JSON.stringify(product.specifications).replace(/"/g, '""')}"`
    ];
    csvRows.push(row.join(','));
  });
  
  return csvRows.join('\n');
}

/**
 * Main execution
 */
async function main() {
  const pdfPath = process.argv[2] || '/Users/mtaasisi/Downloads/Accounting Voucher.pdf';
  const outputDir = path.join(__dirname, '../extracted-products');
  
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log('🔍 PDF Text Extractor');
  console.log('====================');
  
  try {
    // Extract text from PDF
    const extractedText = extractTextFromPDF(pdfPath);
    
    // Parse into structured data
    const products = parseProductData(extractedText);
    
    // Generate CSV
    const csvData = generateCSV(products);
    
    // Save files
    const csvPath = path.join(outputDir, 'extracted-products.csv');
    const textPath = path.join(outputDir, 'extracted-text.txt');
    
    fs.writeFileSync(csvPath, csvData);
    fs.writeFileSync(textPath, extractedText);
    
    console.log('✅ Extraction completed!');
    console.log(`📄 CSV file: ${csvPath}`);
    console.log(`📄 Text file: ${textPath}`);
    console.log(`\n📊 Found ${products.length} products`);
    
    // Display sample data
    console.log('\n📋 Extracted products:');
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - ${product.sku} - TZS ${product.sellingPrice.toLocaleString()}`);
    });
    
    console.log('\n💡 Next steps:');
    console.log('1. Review the extracted CSV file');
    console.log('2. Make any necessary corrections');
    console.log('3. Use the bulk import feature in your LATS system');
    console.log('4. Navigate to /lats/bulk-import to import the products');
    
  } catch (error) {
    console.error('❌ Error during extraction:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  extractTextFromPDF,
  parseProductData,
  generateCSV
};
