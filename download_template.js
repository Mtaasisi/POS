// Product Import Template Download Script
// Copy and paste this code into your browser's developer console (F12)

function downloadProductTemplate() {
    const template = `name,sku,barcode,description,price,cost_price,stock_quantity,min_stock,max_stock,category_id,brand_id,supplier_id,tags,variant_name
iPhone 14 Pro,IPH14P-128,1234567890123,Latest iPhone model with A16 chip,159999,120000,15,5,50,,,smartphone,apple,Default Variant
Samsung Galaxy S23,SAMS23-256,1234567890124,Flagship Android phone with Snapdragon,129999,100000,12,5,50,,,smartphone,samsung,Default Variant
MacBook Air M2,MBA-M2-256,1234567890125,13-inch laptop with Apple M2 chip,899999,750000,8,3,25,,,laptop,apple,Default Variant
AirPods Pro,APP-GEN2,1234567890126,Wireless earbuds with noise cancellation,299999,200000,20,10,100,,,audio,apple,Default Variant
Galaxy Watch 6,GW6-44MM,1234567890127,Smartwatch with health tracking,199999,150000,10,5,30,,,wearable,samsung,Default Variant`;

    // Add BOM for Excel compatibility
    const BOM = '\uFEFF';
    const csvContent = BOM + template;
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lats_product_import_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    console.log('✅ Product template downloaded successfully!');
    console.log('📁 File: lats_product_import_template.csv');
    console.log('📋 Open in Excel or Google Sheets to fill in your product data.');
}

// Run the download function
downloadProductTemplate();
