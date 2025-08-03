-- Fix device_attachments table column names to match TypeScript types
-- TypeScript expects: filename, file_path, mime_type
-- Current table has: file_name, file_url, file_type

-- Rename columns to match TypeScript types
ALTER TABLE device_attachments RENAME COLUMN file_name TO filename;
ALTER TABLE device_attachments RENAME COLUMN file_url TO file_path;
ALTER TABLE device_attachments RENAME COLUMN file_type TO mime_type;

-- Verify the changes
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'device_attachments'
    AND column_name IN ('filename', 'file_path', 'mime_type')
ORDER BY column_name; 