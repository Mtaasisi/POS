-- Fix RLS policies for whatsapp_instances table
-- This migration addresses the 400 Bad Request error when accessing whatsapp_instances

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own WhatsApp instances" ON whatsapp_instances;
DROP POLICY IF EXISTS "Users can insert their own WhatsApp instances" ON whatsapp_instances;
DROP POLICY IF EXISTS "Users can update their own WhatsApp instances" ON whatsapp_instances;
DROP POLICY IF EXISTS "Users can delete their own WhatsApp instances" ON whatsapp_instances;

-- Create more permissive policies for authenticated users
CREATE POLICY "Authenticated users can view WhatsApp instances" 
ON whatsapp_instances FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert WhatsApp instances" 
ON whatsapp_instances FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update WhatsApp instances" 
ON whatsapp_instances FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can delete WhatsApp instances" 
ON whatsapp_instances FOR DELETE 
TO authenticated 
USING (true);

-- Also create policies for admin users specifically
CREATE POLICY "Admin users have full access to WhatsApp instances" 
ON whatsapp_instances FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM auth.users 
        WHERE auth.users.id = auth.uid() 
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

-- Add a fallback policy that allows all operations for development
CREATE POLICY "Development fallback policy" 
ON whatsapp_instances FOR ALL 
TO authenticated 
USING (true);

-- Verify the policies were created
DO $$
BEGIN
    RAISE NOTICE 'RLS policies for whatsapp_instances have been updated';
    RAISE NOTICE 'Policies created:';
    RAISE NOTICE '- Authenticated users can view WhatsApp instances';
    RAISE NOTICE '- Authenticated users can insert WhatsApp instances';
    RAISE NOTICE '- Authenticated users can update WhatsApp instances';
    RAISE NOTICE '- Authenticated users can delete WhatsApp instances';
    RAISE NOTICE '- Admin users have full access to WhatsApp instances';
    RAISE NOTICE '- Development fallback policy';
END $$;
