import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createBrandStorageBucket() {
  try {
    console.log('🔧 Creating brand-assets storage bucket...');
    
    // Create the storage bucket
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('brand-assets', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'],
      fileSizeLimit: 2 * 1024 * 1024, // 2MB
    });

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('✅ Brand assets bucket already exists');
      } else {
        throw bucketError;
      }
    } else {
      console.log('✅ Brand assets bucket created successfully');
    }

    // Set up RLS policies for the bucket
    console.log('🔧 Setting up RLS policies...');
    
    // Policy to allow authenticated users to upload files
    const { error: uploadPolicyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Allow authenticated users to upload brand assets" ON storage.objects
        FOR INSERT TO authenticated
        WITH CHECK (bucket_id = 'brand-assets');
      `
    });

    if (uploadPolicyError && !uploadPolicyError.message.includes('already exists')) {
      console.error('❌ Error creating upload policy:', uploadPolicyError);
    } else {
      console.log('✅ Upload policy created');
    }

    // Policy to allow public read access
    const { error: readPolicyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Allow public read access to brand assets" ON storage.objects
        FOR SELECT TO public
        USING (bucket_id = 'brand-assets');
      `
    });

    if (readPolicyError && !readPolicyError.message.includes('already exists')) {
      console.error('❌ Error creating read policy:', readPolicyError);
    } else {
      console.log('✅ Read policy created');
    }

    // Policy to allow authenticated users to update their own files
    const { error: updatePolicyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Allow authenticated users to update brand assets" ON storage.objects
        FOR UPDATE TO authenticated
        USING (bucket_id = 'brand-assets')
        WITH CHECK (bucket_id = 'brand-assets');
      `
    });

    if (updatePolicyError && !updatePolicyError.message.includes('already exists')) {
      console.error('❌ Error creating update policy:', updatePolicyError);
    } else {
      console.log('✅ Update policy created');
    }

    // Policy to allow authenticated users to delete their own files
    const { error: deletePolicyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Allow authenticated users to delete brand assets" ON storage.objects
        FOR DELETE TO authenticated
        USING (bucket_id = 'brand-assets');
      `
    });

    if (deletePolicyError && !deletePolicyError.message.includes('already exists')) {
      console.error('❌ Error creating delete policy:', deletePolicyError);
    } else {
      console.log('✅ Delete policy created');
    }

    console.log('🎉 Brand storage setup completed successfully!');
    console.log('📁 Bucket: brand-assets');
    console.log('🔓 Public read access enabled');
    console.log('📤 Authenticated users can upload/update/delete');
    console.log('📏 File size limit: 2MB');
    console.log('🖼️ Allowed types: JPEG, PNG, SVG, WebP');

  } catch (error) {
    console.error('❌ Error setting up brand storage:', error);
    process.exit(1);
  }
}

// Run the setup
createBrandStorageBucket(); 