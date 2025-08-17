import React, { useState } from 'react';
import { Download, FileText, Info, CheckCircle, AlertCircle } from 'lucide-react';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import { toast } from 'react-hot-toast';

const ExcelTemplateDownloadPage: React.FC = () => {
  const [downloading, setDownloading] = useState<string | null>(null);

  const downloadTemplate = (type: string, content: string, filename: string) => {
    setDownloading(type);
    
    try {
      // Add BOM for Excel compatibility
      const BOM = '\uFEFF';
      const csvContent = BOM + content;
      
      // Create the blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success(`✅ ${type} template downloaded successfully!`);
    } catch (error) {
      toast.error('❌ Download failed. Please try again.');
      console.error('Download error:', error);
    } finally {
      setDownloading(null);
    }
  };

  const productTemplate = `Product Import Template - LATS System
Instructions:
1. Fill in the required fields (marked with *)
2. Use commas to separate multiple tags
3. Prices should be numbers only (no currency symbols)
4. Stock quantities should be whole numbers
5. Category, Brand, and Supplier IDs can be left empty if not available

Required Fields (*),name*,sku*,barcode,description,price,cost_price,stock_quantity,min_stock,max_stock,category_id,brand_id,supplier_id,tags,variant_name
Sample Product 1,iPhone 14 Pro,IPH14P-128,1234567890123,Latest iPhone model with A16 chip,159999,120000,15,5,50,,,smartphone,apple,Default Variant
Sample Product 2,Samsung Galaxy S23,SAMS23-256,1234567890124,Flagship Android phone with Snapdragon,129999,100000,12,5,50,,,smartphone,samsung,Default Variant
Sample Product 3,MacBook Air M2,MBA-M2-256,1234567890125,13-inch laptop with Apple M2 chip,899999,750000,8,3,25,,,laptop,apple,Default Variant
Sample Product 4,AirPods Pro,APP-GEN2,1234567890126,Wireless earbuds with noise cancellation,299999,200000,20,10,100,,,audio,apple,Default Variant
Sample Product 5,Galaxy Watch 6,GW6-44MM,1234567890127,Smartwatch with health tracking,199999,150000,10,5,30,,,wearable,samsung,Default Variant

Field Descriptions:
name* - Product name (required)
sku* - Stock Keeping Unit (required, unique identifier)
barcode - Product barcode (optional)
description - Product description (optional)
price - Selling price in cents (e.g., 159999 = 1,599.99)
cost_price - Cost price in cents (e.g., 120000 = 1,200.00)
stock_quantity - Current stock level
min_stock - Minimum stock level for alerts
max_stock - Maximum stock level
category_id - Category UUID (optional)
brand_id - Brand UUID (optional)
supplier_id - Supplier UUID (optional)
tags - Comma-separated tags (optional)
variant_name - Product variant name (optional)`;

  const customerTemplate = `Customer Import Template - LATS System
Instructions:
1. Fill in the required fields (marked with *)
2. Phone numbers should include country code (+255 for Tanzania)
3. Gender options: male, female, other
4. Loyalty levels: bronze, silver, gold, platinum
5. Color tags: new, vip, complainer, purchased

Required Fields (*),Name*,Phone Number*,Gender,City,WhatsApp Number,Notes,Loyalty Level,Color Tag,Birth Month,Birth Day,Referral Source,Location Description,National ID,Referred By,Total Spent,Points,Is Active,Email
Sample Customer 1,John Doe,+255712345678,male,Dar es Salaam,+255712345678,Regular customer prefers phone calls,bronze,new,3,15,social media,123 Main Street Dar es Salaam,1234567890123456,Jane Smith,50000,100,true,john.doe@email.com
Sample Customer 2,Jane Smith,+255723456789,female,Arusha,+255723456789,VIP customer very satisfied,silver,vip,6,22,recommendation,456 Business Ave Arusha,2345678901234567,Mike Johnson,75000,150,true,jane.smith@email.com
Sample Customer 3,Mike Johnson,+255734567890,male,Mwanza,+255734567890,Regular customer,gold,new,12,5,physically,789 Home Road Mwanza,3456789012345678,Alice Brown,100000,200,true,mike.johnson@email.com
Sample Customer 4,Alice Brown,+255745678901,female,Dodoma,+255745678901,Social media customer,platinum,purchased,9,10,instagram,321 Social Street Dodoma,4567890123456789,John Doe,150000,300,true,alice.brown@email.com

Field Descriptions:
Name* - Customer full name (required)
Phone Number* - Phone number with country code (required)
Gender - male, female, or other
City - Customer's city
WhatsApp Number - WhatsApp number (optional)
Notes - Customer notes
Loyalty Level - bronze, silver, gold, or platinum
Color Tag - new, vip, complainer, or purchased
Birth Month - Birth month (1-12)
Birth Day - Birth day (1-31)
Referral Source - How customer found you
Location Description - Detailed address
National ID - National identification number
Referred By - Name of referring customer
Total Spent - Total amount spent
Points - Loyalty points
Is Active - true or false
Email - Customer email address`;

  const templates = [
    {
      type: 'Products',
      description: 'Import products with variants, pricing, and inventory data',
      icon: <FileText className="w-6 h-6" />,
      content: productTemplate,
      filename: 'lats_product_import_template.csv',
      requiredFields: ['name', 'sku'],
      tips: [
        'Prices are in cents (159999 = 1,599.99)',
        'SKU must be unique for each product',
        'Use commas to separate multiple tags',
        'Leave category/brand/supplier IDs empty if not available'
      ]
    },
    {
      type: 'Customers',
      description: 'Import customer data with contact information and loyalty details',
      icon: <FileText className="w-6 h-6" />,
      content: customerTemplate,
      filename: 'lats_customer_import_template.csv',
      requiredFields: ['Name', 'Phone Number'],
      tips: [
        'Phone numbers must include country code (+255)',
        'Gender options: male, female, other',
        'Loyalty levels: bronze, silver, gold, platinum',
        'Color tags: new, vip, complainer, purchased'
      ]
    }
  ];

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Excel Template Downloads</h1>
        <p className="text-gray-300">
          Download Excel templates for bulk importing data into your LATS system
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {templates.map((template) => (
          <GlassCard key={template.type} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {template.icon}
                <div>
                  <h3 className="text-xl font-semibold text-white">{template.type}</h3>
                  <p className="text-gray-300 text-sm">{template.description}</p>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium text-yellow-400">Required Fields:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {template.requiredFields.map((field) => (
                  <span
                    key={field}
                    className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded"
                  >
                    {field}
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-400">Tips:</span>
              </div>
              <ul className="text-sm text-gray-300 space-y-1">
                {template.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            <GlassButton
              onClick={() => downloadTemplate(template.type, template.content, template.filename)}
              disabled={downloading === template.type}
              className="w-full"
            >
              {downloading === template.type ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Downloading...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Download {template.type} Template
                </div>
              )}
            </GlassButton>
          </GlassCard>
        ))}
      </div>

      <GlassCard className="mt-8 p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Import Instructions</h3>
        <div className="space-y-4 text-gray-300">
          <div>
            <h4 className="font-medium text-white mb-2">1. Download Template</h4>
            <p>Click the download button above to get the Excel template for your data type.</p>
          </div>
          
          <div>
            <h4 className="font-medium text-white mb-2">2. Fill in Data</h4>
            <p>Open the downloaded CSV file in Excel or Google Sheets. Fill in your data following the sample format.</p>
          </div>
          
          <div>
            <h4 className="font-medium text-white mb-2">3. Save as CSV</h4>
            <p>Save your file as CSV format (File → Save As → CSV).</p>
          </div>
          
          <div>
            <h4 className="font-medium text-white mb-2">4. Import Data</h4>
            <p>Go to the respective page (Inventory for products, Customers for customers) and use the import feature to upload your CSV file.</p>
          </div>
          
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <h4 className="font-medium text-yellow-400 mb-2">Important Notes:</h4>
            <ul className="text-sm space-y-1">
              <li>• Always backup your data before importing</li>
              <li>• Test with a small sample first</li>
              <li>• Ensure all required fields are filled</li>
              <li>• Check data format (dates, numbers, etc.)</li>
              <li>• Remove any empty rows before importing</li>
            </ul>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default ExcelTemplateDownloadPage;
