import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addProductsWithImages() {
  console.log('🖼️ Adding products with images for thumbnail testing...\n');

  try {
    // First, check if we have categories and brands
    console.log('📂 Checking for categories and brands...');
    
    let { data: categories, error: catError } = await supabase
      .from('lats_categories')
      .select('*')
      .limit(1);

    if (catError || !categories || categories.length === 0) {
      console.log('📝 Creating sample category...');
      const { data: newCategory, error: newCatError } = await supabase
        .from('lats_categories')
        .insert([{ name: 'Smartphones', description: 'Mobile phones and accessories' }])
        .select()
        .single();

      if (newCatError) {
        console.error('❌ Error creating category:', newCatError);
        return;
      }
      categories = [newCategory];
    }

    let { data: brands, error: brandError } = await supabase
      .from('lats_brands')
      .select('*')
      .limit(1);

    if (brandError || !brands || brands.length === 0) {
      console.log('📝 Creating sample brand...');
      const { data: newBrand, error: newBrandError } = await supabase
        .from('lats_brands')
        .insert([{ name: 'Apple', description: 'Apple Inc. products' }])
        .select()
        .single();

      if (newBrandError) {
        console.error('❌ Error creating brand:', newBrandError);
        return;
      }
      brands = [newBrand];
    }

    let { data: suppliers, error: supplierError } = await supabase
      .from('lats_suppliers')
      .select('*')
      .limit(1);

    if (supplierError || !suppliers || suppliers.length === 0) {
      console.log('📝 Creating sample supplier...');
      const { data: newSupplier, error: newSupplierError } = await supabase
        .from('lats_suppliers')
        .insert([{ 
          name: 'Tech Supplies Ltd', 
          contact_person: 'John Doe',
          email: 'john@techsupplies.com',
          phone: '+254700000000'
        }])
        .select()
        .single();

      if (newSupplierError) {
        console.error('❌ Error creating supplier:', newSupplierError);
        return;
      }
      suppliers = [newSupplier];
    }

    console.log('✅ Categories, brands, and suppliers ready');

    // Add products with sample images
    console.log('📦 Adding products with images...');
    
    const products = [
      {
        name: 'iPhone 15 Pro',
        description: 'Latest iPhone with titanium design and A17 Pro chip',
        category_id: categories[0].id,
        brand_id: brands[0].id,
        supplier_id: suppliers[0].id,
        is_active: true,
        tags: ['smartphone', 'apple', '5g', 'premium']
      },
      {
        name: 'iPhone 14 Pro',
        description: 'Advanced camera system with A16 Bionic chip',
        category_id: categories[0].id,
        brand_id: brands[0].id,
        supplier_id: suppliers[0].id,
        is_active: true,
        tags: ['smartphone', 'apple', '5g', 'camera']
      },
      {
        name: 'MacBook Pro 14"',
        description: 'Professional laptop with M2 Pro chip',
        category_id: categories[0].id,
        brand_id: brands[0].id,
        supplier_id: suppliers[0].id,
        is_active: true,
        tags: ['laptop', 'apple', 'professional', 'm2']
      }
    ];

    const addedProducts = [];

    for (const product of products) {
      try {
        const { data: newProduct, error: productError } = await supabase
          .from('lats_products')
          .insert([product])
          .select()
          .single();

        if (productError) {
          console.log(`⚠️ Product ${product.name}: ${productError.message}`);
          continue;
        }

        console.log(`✅ Added product: ${product.name}`);
        addedProducts.push(newProduct);

        // Add product variants
        const variants = [
          {
            product_id: newProduct.id,
            sku: `${product.name.replace(/\s+/g, '-').toUpperCase()}-128`,
            name: '128GB',
            attributes: { storage: '128GB', color: 'Black' },
            cost_price: 120000,
            selling_price: 159999,
            quantity: 25,
            min_quantity: 5,
            barcode: `1234567890${addedProducts.length}1`
          },
          {
            product_id: newProduct.id,
            sku: `${product.name.replace(/\s+/g, '-').toUpperCase()}-256`,
            name: '256GB',
            attributes: { storage: '256GB', color: 'Black' },
            cost_price: 135000,
            selling_price: 179999,
            quantity: 15,
            min_quantity: 3,
            barcode: `1234567890${addedProducts.length}2`
          }
        ];

        for (const variant of variants) {
          const { error: variantError } = await supabase
            .from('lats_product_variants')
            .insert([variant]);

          if (variantError) {
            console.log(`⚠️ Variant ${variant.sku}: ${variantError.message}`);
          } else {
            console.log(`✅ Added variant: ${variant.sku}`);
          }
        }

      } catch (error) {
        console.log(`❌ Error adding product ${product.name}: ${error.message}`);
      }
    }

    // Add sample images for the products
    console.log('🖼️ Adding sample images...');
    
    const sampleImages = [
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop',
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=400&fit=crop'
    ];

    for (let i = 0; i < addedProducts.length && i < sampleImages.length; i++) {
      const product = addedProducts[i];
      const imageUrl = sampleImages[i];

      try {
        const { error: imageError } = await supabase
          .from('product_images')
          .insert([{
            product_id: product.id,
            url: imageUrl,
            thumbnail_url: imageUrl,
            file_name: `${product.name.toLowerCase().replace(/\s+/g, '-')}.jpg`,
            file_size: 102400,
            mime_type: 'image/jpeg',
            is_primary: true
          }]);

        if (imageError) {
          console.log(`⚠️ Image for ${product.name}: ${imageError.message}`);
        } else {
          console.log(`✅ Added image for: ${product.name}`);
        }
      } catch (error) {
        console.log(`❌ Error adding image for ${product.name}: ${error.message}`);
      }
    }

    console.log('\n🎉 Products with images added successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Open your application in the browser');
    console.log('2. Navigate to the POS section');
    console.log('3. Search for "iPhone" or "MacBook" to see products with thumbnails');
    console.log('4. Test adding items to cart - you should see product images');

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

// Run the script
addProductsWithImages();
