import React, { useState } from 'react';
import { Database, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';

const DatabaseSetupPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const createBrandsTable = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Create the brands table
      const { error: tableError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS brands (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            logo_url TEXT,
            description TEXT,
            category TEXT CHECK (category IN ('phone', 'laptop', 'tablet', 'desktop', 'printer', 'other')),
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_by UUID REFERENCES auth_users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });

      if (tableError) {
        throw new Error(`Table creation failed: ${tableError.message}`);
      }

      // Create indexes
      const { error: indexError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE INDEX IF NOT EXISTS idx_brands_name ON brands(name);
          CREATE INDEX IF NOT EXISTS idx_brands_category ON brands(category);
          CREATE INDEX IF NOT EXISTS idx_brands_active ON brands(is_active);
        `
      });

      if (indexError) {
        console.warn('Index creation failed:', indexError.message);
      }

      // Insert default brands
      const { error: insertError } = await supabase.rpc('exec_sql', {
        sql: `
          INSERT INTO brands (name, logo_url, category, description) VALUES
            ('Apple', '/logos/apple.svg', 'phone', 'Apple Inc. devices including iPhone, iPad, and Mac'),
            ('Samsung', '/logos/samsung.svg', 'phone', 'Samsung Electronics devices'),
            ('Google', '/logos/google.svg', 'phone', 'Google Pixel devices'),
            ('Microsoft', '/logos/microsoft.svg', 'laptop', 'Microsoft Surface and Windows devices'),
            ('Lenovo', '/logos/lenovo.svg', 'laptop', 'Lenovo laptops and desktops'),
            ('HP', '/logos/hp.svg', 'laptop', 'Hewlett-Packard devices'),
            ('Dell', '/logos/dell.svg', 'laptop', 'Dell computers and laptops'),
            ('Huawei', '/logos/huawei.svg', 'phone', 'Huawei smartphones and tablets'),
            ('Xiaomi', '/logos/xiaomi.svg', 'phone', 'Xiaomi smartphones and IoT devices'),
            ('OnePlus', '/logos/oneplus.svg', 'phone', 'OnePlus smartphones'),
            ('Sony', '/logos/sony.svg', 'phone', 'Sony mobile devices'),
            ('LG', '/logos/lg.svg', 'phone', 'LG smartphones and TVs'),
            ('Motorola', '/logos/motorola.svg', 'phone', 'Motorola smartphones'),
            ('Nokia', '/logos/nokia.svg', 'phone', 'Nokia mobile devices'),
            ('Tecno', '/logos/tecno.svg', 'phone', 'Tecno mobile devices'),
            ('Infinix', '/logos/infinix.svg', 'phone', 'Infinix smartphones'),
            ('Itel', '/logos/itel.svg', 'phone', 'Itel mobile devices'),
            ('HTC', '/logos/htc.svg', 'phone', 'HTC smartphones'),
            ('Asus', '/logos/asus.svg', 'laptop', 'ASUS laptops and computers'),
            ('Acer', '/logos/acer.svg', 'laptop', 'Acer laptops and desktops'),
            ('Canon', '/logos/canon.svg', 'printer', 'Canon printers and cameras'),
            ('Epson', '/logos/epson.svg', 'printer', 'Epson printers and scanners'),
            ('Brother', '/logos/brother.svg', 'printer', 'Brother printers and scanners')
          ON CONFLICT (name) DO NOTHING;
        `
      });

      if (insertError) {
        console.warn('Default brands insertion failed:', insertError.message);
      }

      // Create trigger function
      const { error: triggerError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE OR REPLACE FUNCTION update_brands_updated_at()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;

          CREATE TRIGGER trigger_update_brands_updated_at
            BEFORE UPDATE ON brands
            FOR EACH ROW
            EXECUTE FUNCTION update_brands_updated_at();
        `
      });

      if (triggerError) {
        console.warn('Trigger creation failed:', triggerError.message);
      }

      setResult({
        success: true,
        message: 'Brands table created successfully with default data!'
      });

    } catch (error: any) {
      console.error('Database setup error:', error);
      setResult({
        success: false,
        message: `Failed to create brands table: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const checkBrandsTable = async () => {
    try {
      const { data, error } = await supabase
        .from('lats_brands')
        .select('count')
        .limit(1);

      if (error) {
        return false;
      }
      return true;
    } catch {
      return false;
    }
  };

  const updateBrandsToMultipleCategories = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Apply the migration to support multiple categories
      const { error: migrationError } = await supabase.rpc('exec_sql', {
        sql: `
          -- First, let's create a backup of the current brands data
          CREATE TABLE IF NOT EXISTS lats_brands_backup AS SELECT * FROM lats_brands;

          -- Update the brands table to use categories as JSON array
          ALTER TABLE lats_brands 
          DROP CONSTRAINT IF EXISTS lats_brands_category_check;

          -- Change category column to JSON type to store multiple categories
          ALTER TABLE lats_brands 
          ALTER COLUMN category TYPE JSONB USING 
            CASE 
              WHEN category IS NULL THEN '[]'::jsonb
              WHEN category = '' THEN '[]'::jsonb
              ELSE jsonb_build_array(category)
            END;

          -- Add a check constraint to ensure categories is always an array
          ALTER TABLE lats_brands 
          ADD CONSTRAINT lats_brands_categories_check 
          CHECK (jsonb_typeof(category) = 'array');

          -- Update existing brands with common multiple categories
          UPDATE lats_brands SET category = '["phone", "laptop", "tablet"]'::jsonb WHERE name ILIKE '%Apple%';
          UPDATE lats_brands SET category = '["phone", "laptop", "tablet", "desktop"]'::jsonb WHERE name ILIKE '%Samsung%';
          UPDATE lats_brands SET category = '["phone", "laptop", "tablet"]'::jsonb WHERE name ILIKE '%Google%';
          UPDATE lats_brands SET category = '["laptop", "desktop", "tablet"]'::jsonb WHERE name ILIKE '%Microsoft%';
          UPDATE lats_brands SET category = '["laptop", "desktop"]'::jsonb WHERE name ILIKE '%Lenovo%';
          UPDATE lats_brands SET category = '["laptop", "desktop", "printer"]'::jsonb WHERE name ILIKE '%HP%';
          UPDATE lats_brands SET category = '["laptop", "desktop"]'::jsonb WHERE name ILIKE '%Dell%';
          UPDATE lats_brands SET category = '["phone", "laptop", "tablet"]'::jsonb WHERE name ILIKE '%Huawei%';
          UPDATE lats_brands SET category = '["phone", "laptop", "tablet"]'::jsonb WHERE name ILIKE '%Xiaomi%';
          UPDATE lats_brands SET category = '["phone"]'::jsonb WHERE name ILIKE '%OnePlus%';
          UPDATE lats_brands SET category = '["phone", "laptop", "tablet"]'::jsonb WHERE name ILIKE '%Sony%';
          UPDATE lats_brands SET category = '["phone", "laptop", "tablet"]'::jsonb WHERE name ILIKE '%LG%';
          UPDATE lats_brands SET category = '["phone"]'::jsonb WHERE name ILIKE '%Motorola%';
          UPDATE lats_brands SET category = '["phone"]'::jsonb WHERE name ILIKE '%Nokia%';
          UPDATE lats_brands SET category = '["phone"]'::jsonb WHERE name ILIKE '%Tecno%';
          UPDATE lats_brands SET category = '["phone"]'::jsonb WHERE name ILIKE '%Infinix%';
          UPDATE lats_brands SET category = '["phone"]'::jsonb WHERE name ILIKE '%Itel%';
          UPDATE lats_brands SET category = '["phone"]'::jsonb WHERE name ILIKE '%HTC%';
          UPDATE lats_brands SET category = '["laptop", "desktop"]'::jsonb WHERE name ILIKE '%Asus%';
          UPDATE lats_brands SET category = '["laptop", "desktop"]'::jsonb WHERE name ILIKE '%Acer%';
          UPDATE lats_brands SET category = '["printer"]'::jsonb WHERE name ILIKE '%Canon%';
          UPDATE lats_brands SET category = '["printer"]'::jsonb WHERE name ILIKE '%Epson%';
          UPDATE lats_brands SET category = '["printer"]'::jsonb WHERE name ILIKE '%Brother%';

          -- Update any remaining brands that don't have categories set
          UPDATE lats_brands SET category = '["other"]'::jsonb WHERE category IS NULL OR category = '[]'::jsonb;

          -- Create an index for better performance when querying by categories
          CREATE INDEX IF NOT EXISTS idx_lats_brands_categories ON lats_brands USING GIN (category);

          -- Add a function to check if a brand has a specific category
          CREATE OR REPLACE FUNCTION brand_has_category(brand_categories JSONB, search_category TEXT)
          RETURNS BOOLEAN AS $$
          BEGIN
            RETURN brand_categories ? search_category;
          END;
          $$ LANGUAGE plpgsql IMMUTABLE;
        `
      });

      if (migrationError) {
        throw new Error(`Migration failed: ${migrationError.message}`);
      }

      setResult({ success: true, message: 'Successfully updated brands table to support multiple categories!' });
    } catch (error: any) {
      setResult({ success: false, message: `Migration error: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const createCategoriesTable = async () => {
    setLoading(true);
    setResult(null);

    try {
      // Create the categories table
      const { error: tableError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS categories (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            color TEXT NOT NULL DEFAULT '#6B7280',
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });

      if (tableError) {
        throw new Error(`Table creation failed: ${tableError.message}`);
      }

      // Create indexes
      const { error: indexError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
          CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
        `
      });

      if (indexError) {
        console.warn('Index creation failed:', indexError.message);
      }

      // Insert default categories
      const { error: insertError } = await supabase.rpc('exec_sql', {
        sql: `
          INSERT INTO categories (name, description, color) VALUES
            ('Phone', 'Mobile phones and smartphones', '#3B82F6'),
            ('Laptop', 'Portable computers and notebooks', '#10B981'),
            ('Tablet', 'Tablet computers and iPads', '#8B5CF6'),
            ('Desktop', 'Desktop computers and workstations', '#F59E0B'),
            ('Printer', 'Printers and scanners', '#EF4444'),
            ('Smartwatch', 'Smartwatches and fitness trackers', '#EC4899'),
            ('Headphones', 'Headphones and earphones', '#6366F1'),
            ('Speaker', 'Speakers and audio devices', '#EAB308'),
            ('Camera', 'Cameras and photography equipment', '#14B8A6'),
            ('Gaming', 'Gaming consoles and accessories', '#06B6D4'),
            ('Accessories', 'Device accessories and peripherals', '#F97316'),
            ('Monitor', 'Computer monitors and displays', '#059669'),
            ('Keyboard', 'Computer keyboards and input devices', '#7C3AED'),
            ('Mouse', 'Computer mice and pointing devices', '#475569'),
            ('Webcam', 'Web cameras and video devices', '#E11D48'),
            ('Microphone', 'Microphones and audio input devices', '#0284C7'),
            ('Router', 'Network routers and networking equipment', '#84CC16'),
            ('Modem', 'Internet modems and connectivity devices', '#C026D3'),
            ('Scanner', 'Document scanners and scanning devices', '#EA580C'),
            ('Projector', 'Projectors and display devices', '#4F46E5'),
            ('Server', 'Server computers and enterprise hardware', '#6B7280'),
            ('Network', 'Network equipment and infrastructure', '#3B82F6'),
            ('Storage', 'Storage devices and data solutions', '#10B981'),
            ('Other', 'Other device categories', '#6B7280')
          ON CONFLICT (name) DO NOTHING;
        `
      });

      if (insertError) {
        console.warn('Default categories insertion failed:', insertError.message);
      }

      // Create trigger function for updated_at
      const { error: triggerError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE OR REPLACE FUNCTION update_categories_updated_at()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;

          CREATE TRIGGER trigger_update_categories_updated_at
            BEFORE UPDATE ON categories
            FOR EACH ROW
            EXECUTE FUNCTION update_categories_updated_at();
        `
      });

      if (triggerError) {
        console.warn('Trigger creation failed:', triggerError.message);
      }

      // Enable RLS
      const { error: rlsError } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

          -- Create policies
          CREATE POLICY "Categories are viewable by authenticated users" ON categories
            FOR SELECT USING (auth.role() = 'authenticated');

          CREATE POLICY "Categories are insertable by admin users" ON categories
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');

          CREATE POLICY "Categories are updatable by admin users" ON categories
            FOR UPDATE USING (auth.role() = 'authenticated');

          CREATE POLICY "Categories are deletable by admin users" ON categories
            FOR DELETE USING (auth.role() = 'authenticated');
        `
      });

      if (rlsError) {
        console.warn('RLS setup failed:', rlsError.message);
      }

      setResult({
        success: true,
        message: 'Categories table created successfully with default categories!'
      });
    } catch (error) {
      setResult({
        success: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => window.history.back()}
            className="p-2 rounded-lg bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Database Setup</h1>
            <p className="text-gray-600">Set up required database tables for the application</p>
          </div>
        </div>

        {/* Setup Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Brands Table Setup */}
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Database className="h-8 w-8 text-blue-500" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Brands Table</h2>
                <p className="text-sm text-gray-600">Create brands table for brand management</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p className="mb-2">This will create:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-500">
                  <li>Brands table with all necessary fields</li>
                  <li>Indexes for fast lookups</li>
                  <li>Default brands (Apple, Samsung, Google, etc.)</li>
                  <li>Automatic timestamp updates</li>
                </ul>
              </div>

              <button
                onClick={createBrandsTable}
                disabled={loading}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                  loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Creating Table...</span>
                  </>
                ) : (
                  <>
                    <Database className="h-5 w-5" />
                    <span>Create Brands Table</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Status Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Setup Status</h2>
                <p className="text-sm text-gray-600">Check database table status</p>
              </div>
            </div>

            <div className="space-y-4">
              {result && (
                <div className={`p-4 rounded-lg ${
                  result.success 
                    ? 'bg-green-100 border border-green-300 text-green-800' 
                    : 'bg-red-100 border border-red-300 text-red-800'
                }`}>
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-medium">{result.message}</span>
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-600">
                <p className="mb-2">After setup, you can:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-500">
                  <li>Access brand management at /brand-management</li>
                  <li>Add and edit brands through the UI</li>
                  <li>Use brand suggestions in device forms</li>
                  <li>Filter brands by category</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Multiple Categories Migration */}
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Database className="h-8 w-8 text-orange-500" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Multiple Categories</h2>
                <p className="text-sm text-gray-600">Update brands to support multiple categories</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <p className="mb-2">This will update:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-500">
                  <li>Convert single category to JSON array</li>
                  <li>Update existing brands with multiple categories</li>
                  <li>Add proper indexing for performance</li>
                  <li>Create backup of current data</li>
                </ul>
              </div>

              <button
                onClick={updateBrandsToMultipleCategories}
                disabled={loading}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                  loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Updating Categories...</span>
                  </>
                ) : (
                  <>
                    <Database className="h-5 w-5" />
                    <span>Update to Multiple Categories</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Categories Table Setup */}
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Database className="h-8 w-8 text-green-500" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Categories Table</h2>
              <p className="text-sm text-gray-600">Create categories table for category management</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p className="mb-2">This will create:</p>
              <ul className="list-disc list-inside space-y-1 text-gray-500">
                <li>Categories table with all necessary fields</li>
                <li>Indexes for fast lookups</li>
                <li>Default categories (Phone, Laptop, Tablet, etc.)</li>
                <li>Automatic timestamp updates</li>
                <li>Row Level Security (RLS) policies</li>
              </ul>
            </div>

            <button
              onClick={createCategoriesTable}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Creating Categories Table...</span>
                </>
              ) : (
                <>
                  <Database className="h-5 w-5" />
                  <span>Create Categories Table</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Setup Instructions</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p>1. <strong>Click "Create Brands Table"</strong> to set up the brands database table</p>
            <p>2. <strong>Click "Create Categories Table"</strong> to set up the categories database table</p>
            <p>3. <strong>Wait for completion</strong> - the process may take a few seconds</p>
            <p>4. <strong>Check the status</strong> - you'll see a success or error message</p>
            <p>5. <strong>Navigate to brand management</strong> at /brand-management to start using the feature</p>
            <p>6. <strong>Navigate to category management</strong> at /category-management to manage categories</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseSetupPage; 