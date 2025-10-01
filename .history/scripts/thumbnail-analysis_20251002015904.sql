-- Thumbnail Analysis Script for LATS Inventory System
-- This script analyzes the current state of thumbnails in the database

-- 1. Check if product_images table exists and its structure
SELECT 
    'product_images_table_check' as analysis_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_images') 
        THEN 'EXISTS' 
        ELSE 'MISSING' 
    END as table_status;

-- 2. Analyze product_images table (if it exists)
DO $$
DECLARE
    rec RECORD;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_images') THEN
        -- Count total images
        RAISE NOTICE '=== PRODUCT_IMAGES TABLE ANALYSIS ===';
        
        -- Total images count
        PERFORM (
            SELECT 'Total images: ' || COUNT(*)::text 
            FROM product_images
        );
        
        -- Images with thumbnails vs without
        PERFORM (
            SELECT 'Images with thumbnails: ' || COUNT(*)::text 
            FROM product_images 
            WHERE thumbnail_url IS NOT NULL AND thumbnail_url != ''
        );
        
        -- Images without thumbnails
        PERFORM (
            SELECT 'Images without thumbnails: ' || COUNT(*)::text 
            FROM product_images 
            WHERE thumbnail_url IS NULL OR thumbnail_url = ''
        );
        
        -- Images where thumbnail_url equals image_url (not real thumbnails)
        PERFORM (
            SELECT 'Images with same URL for thumbnail: ' || COUNT(*)::text 
            FROM product_images 
            WHERE thumbnail_url = image_url
        );
        
        -- Sample of problematic records
        RAISE NOTICE '=== SAMPLE PROBLEMATIC RECORDS ===';
        FOR rec IN (
            SELECT id, product_id, file_name, 
                   CASE 
                       WHEN thumbnail_url IS NULL THEN 'NULL thumbnail'
                       WHEN thumbnail_url = '' THEN 'EMPTY thumbnail'
                       WHEN thumbnail_url = image_url THEN 'SAME as main image'
                       ELSE 'HAS thumbnail'
                   END as thumbnail_status
            FROM product_images 
            WHERE thumbnail_url IS NULL OR thumbnail_url = '' OR thumbnail_url = image_url
            LIMIT 10
        ) LOOP
            RAISE NOTICE 'ID: %, Product: %, File: %, Status: %', 
                        rec.id, rec.product_id, rec.file_name, rec.thumbnail_status;
        END LOOP;
        
    ELSE
        RAISE NOTICE 'product_images table does not exist';
    END IF;
END $$;

-- 3. Check lats_products table for legacy image data
SELECT 
    'lats_products_images_check' as analysis_type,
    COUNT(*) as total_products,
    COUNT(CASE WHEN images IS NOT NULL AND array_length(images, 1) > 0 THEN 1 END) as products_with_images,
    COUNT(CASE WHEN images IS NULL OR array_length(images, 1) = 0 THEN 1 END) as products_without_images
FROM lats_products;

-- 4. Sample products with images from lats_products
SELECT 
    'Sample products with images' as analysis_type,
    id,
    name,
    array_length(images, 1) as image_count,
    images[1] as first_image_url
FROM lats_products 
WHERE images IS NOT NULL AND array_length(images, 1) > 0
LIMIT 5;

-- 5. Check for broken or invalid image URLs
SELECT 
    'broken_urls_check' as analysis_type,
    COUNT(*) as total_images,
    COUNT(CASE WHEN image_url LIKE 'data:%' THEN 1 END) as base64_images,
    COUNT(CASE WHEN image_url LIKE 'blob:%' THEN 1 END) as blob_images,
    COUNT(CASE WHEN image_url LIKE 'http%' THEN 1 END) as http_images,
    COUNT(CASE WHEN image_url NOT LIKE 'data:%' AND image_url NOT LIKE 'blob:%' AND image_url NOT LIKE 'http%' THEN 1 END) as other_images
FROM product_images
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_images');

-- 6. Storage bucket analysis (if accessible)
SELECT 
    'storage_analysis' as analysis_type,
    'Check Supabase storage bucket: product-images' as note,
    'Run this query in Supabase dashboard to check storage usage' as instruction;

-- 7. Recommendations based on findings
SELECT 
    'recommendations' as analysis_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'product_images') THEN
            CASE 
                WHEN (SELECT COUNT(*) FROM product_images WHERE thumbnail_url IS NULL OR thumbnail_url = '' OR thumbnail_url = image_url) > 0 
                THEN 'NEEDS_THUMBNAIL_REGENERATION'
                ELSE 'THUMBNAILS_OK'
            END
        ELSE 'NEEDS_PRODUCT_IMAGES_TABLE'
    END as recommendation;
