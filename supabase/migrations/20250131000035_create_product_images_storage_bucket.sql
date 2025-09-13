-- Create storage bucket for product images
-- This migration creates the product-images bucket that the app expects

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- Create RLS policies for the storage bucket

-- Policy 1: Allow public read access to images
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'product-images');

-- Policy 2: Allow authenticated users to upload images
CREATE POLICY "Authenticated upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- Policy 3: Allow authenticated users to update images
CREATE POLICY "Authenticated update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- Policy 4: Allow authenticated users to delete images
CREATE POLICY "Authenticated delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'product-images' 
  AND auth.role() = 'authenticated'
);

-- Add comment to document the bucket
COMMENT ON TABLE storage.objects IS 'Storage objects for product images in product-images bucket';
