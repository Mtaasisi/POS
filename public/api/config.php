<?php
/**
 * Configuration file for WhatsApp Hub
 * This file sets up environment variables and configuration
 */

// Set WhatsApp credentials directly
putenv('GREENAPI_INSTANCE_ID=7105306911');
putenv('GREENAPI_API_TOKEN=b3cd0d668a7c471e8ab88c14fafab28f4a66d266172a4c6294');
putenv('GREENAPI_API_URL=https://7105.api.greenapi.com');

// Set Supabase credentials with the correct service role key
putenv('VITE_SUPABASE_URL=https://jxhzveborezjhsmzsgbc.supabase.co');
putenv('SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjcxMTUyNCwiZXhwIjoyMDY4Mjg3NTI0fQ.p9HNAI1wMUjd6eqom7l11fTTAN6RwD73CSwrY8Ojnz0');

// Set other environment variables
putenv('APP_ENV=production');
putenv('DEBUG_MODE=true');
putenv('DEBUG_LOGGING=true');
putenv('DEBUG_WEBHOOK=true');

// Log that config was loaded
error_log("WhatsApp config: Configuration loaded successfully");
?>