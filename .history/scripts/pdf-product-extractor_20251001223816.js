#!/usr/bin/env node

/**
 * PDF Product Data Extractor
 * Extracts product information from PDF files and converts to importable format
 */

const fs = require('fs');
const path = require('path');

// Mock PDF data structure - you'll need to replace this with actual PDF parsing
const mockPdfData = {
  title: "Product Catalog",
  products: [
    {
      name: "Samsung Galaxy S23",
      description: "Latest Samsung smartphone with advanced camera",
      sku: "SAM-GS23-001",
      category: "Electronics",
      costPrice: 850000,
      sellingPrice: 1200000,
      stockQuantity: 50,
      minStockLevel: 5,
      supplier: "Samsung Electronics",
      specifications: {
        "Screen Size": "6.1 inches",
        "Storage": "128GB",
        "RAM": "8GB",
        "Camera": "50MP Main Camera"
      }
    },
    {
      name: "iPhone 15 Pro",
      description: "Apple's flagship smartphone with titanium design",
      sku: "APP-IP15P-001",
      category: "Electronics", 
      costPrice: 1200000,
      sellingPrice: 1800000,
      stockQuantity: 30,
      minStockLevel: 3,
      supplier: "Apple Inc",
      specifications: {
        "Screen Size": "6.1 inches",
        "Storage": "256GB",
        "RAM": "8GB",
        "Camera": "48MP Main Camera"
      }
    },
    {
      name: "Dell XPS 13 Laptop",
      description: "Premium ultrabook with 13-inch display",
      sku: "DEL-XPS13-001",
      category: "Computers",
      costPrice: 2500000,
      sellingPrice: 3500000,
      stockQuantity: 15,
      minStockLevel: 2,
      supplier: "Dell Technologies",
      specifications: {
        "Processor": "Intel Core i7",
        "RAM": "16GB",
        "Storage": "512GB SSD",
        "Display": "13.4-inch 4K"
      }
    }
  ]
};

/**
 * Extract product data from PDF (mock implementation)
 * In a real implementation, you would use libraries like:
 * - pdf-parse
 * - pdf2pic + OCR
 * - pdf-lib
 */
function extractProductDataFromPdf(pdfPath) {
  console.log(`📄 Extracting data from PDF: ${pdfPath}`);
  
  // TODO: Implement actual PDF parsing
  // For now, return mock data
  return mockPdfData;
}

/**
 * Convert extracted data to CSV format for bulk import
 */
function convertToCSV(extractedData) {
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
  
  extractedData.products.forEach(product => {
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
 * Convert extracted data to JSON format for API import
 */
function convertToJSON(extractedData) {
  return {
    products: extractedData.products.map(product => ({
      name: product.name,
      description: product.description,
      sku: product.sku,
      categoryId: null, // Will be mapped during import
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      stockQuantity: product.stockQuantity,
      minStockLevel: product.minStockLevel,
      supplierId: null, // Will be mapped during import
      attributes: product.specifications,
      isActive: true,
      variants: [{
        sku: product.sku,
        name: 'Default',
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        stockQuantity: product.stockQuantity,
        minStockLevel: product.minStockLevel,
        attributes: product.specifications
      }]
    }))
  };
}

/**
 * Generate import script for the LATS system
 */
function generateImportScript(jsonData) {
  const script = `
// Auto-generated product import script
import { supabase } from '../lib/supabaseClient';

const productsToImport = ${JSON.stringify(jsonData, null, 2)};

export async function importProductsFromPDF() {
  console.log('🚀 Starting bulk product import...');
  
  const results = [];
  
  for (const product of productsToImport.products) {
    try {
      console.log(\`📦 Importing: \${product.name}\`);
      
      // Create product
      const { data: createdProduct, error: productError } = await supabase
        .from('lats_products')
        .insert([{
          name: product.name,
          description: product.description,
          sku: product.sku,
          cost_price: product.costPrice,
          selling_price: product.sellingPrice,
          stock_quantity: product.stockQuantity,
          min_stock_level: product.minStockLevel,
          is_active: product.isActive,
          attributes: product.attributes,
          total_quantity: product.stockQuantity,
          total_value: product.stockQuantity * product.costPrice
        }])
        .select()
        .single();
        
      if (productError) {
        console.error(\`❌ Error creating product \${product.name}:\`, productError);
        continue;
      }
      
      // Create default variant
      const { error: variantError } = await supabase
        .from('lats_product_variants')
        .insert([{
          product_id: createdProduct.id,
          sku: product.variants[0].sku,
          name: product.variants[0].name,
          cost_price: product.variants[0].costPrice,
          selling_price: product.variants[0].sellingPrice,
          quantity: product.variants[0].stockQuantity,
          min_quantity: product.variants[0].minStockLevel,
          attributes: product.variants[0].attributes
        }]);
        
      if (variantError) {
        console.error(\`❌ Error creating variant for \${product.name}:\`, variantError);
      } else {
        console.log(\`✅ Successfully imported: \${product.name}\`);
        results.push({ product: product.name, status: 'success' });
      }
      
    } catch (error) {
      console.error(\`❌ Unexpected error importing \${product.name}:\`, error);
      results.push({ product: product.name, status: 'error', error: error.message });
    }
  }
  
  console.log('📊 Import Summary:', results);
  return results;
}

// Run the import
importProductsFromPDF().then(results => {
  console.log('🎉 Import completed!');
  console.log('Results:', results);
});
`;
  
  return script;
}

/**
 * Main execution function
 */
async function main() {
  const pdfPath = process.argv[2] || '/Users/mtaasisi/Downloads/Accounting Voucher.pdf';
  const outputDir = path.join(__dirname, '../extracted-products');
  
  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  console.log('🔍 PDF Product Data Extractor');
  console.log('============================');
  
  try {
    // Extract data from PDF
    const extractedData = extractProductDataFromPdf(pdfPath);
    
    // Convert to different formats
    const csvData = convertToCSV(extractedData);
    const jsonData = convertToJSON(extractedData);
    const importScript = generateImportScript(jsonData);
    
    // Save files
    const csvPath = path.join(outputDir, 'extracted-products.csv');
    const jsonPath = path.join(outputDir, 'extracted-products.json');
    const scriptPath = path.join(outputDir, 'import-products.js');
    
    fs.writeFileSync(csvPath, csvData);
    fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));
    fs.writeFileSync(scriptPath, importScript);
    
    console.log('✅ Extraction completed!');
    console.log(`📄 CSV file: ${csvPath}`);
    console.log(`📄 JSON file: ${jsonPath}`);
    console.log(`📄 Import script: ${scriptPath}`);
    console.log(`\n📊 Found ${extractedData.products.length} products`);
    
    // Display sample data
    console.log('\n📋 Sample products:');
    extractedData.products.slice(0, 3).forEach((product, index) => {
      console.log(`${index + 1}. ${product.name} - ${product.sku} - TZS ${product.sellingPrice.toLocaleString()}`);
    });
    
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
  extractProductDataFromPdf,
  convertToCSV,
  convertToJSON,
  generateImportScript
};
