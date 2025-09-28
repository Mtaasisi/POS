/**
 * SMS Configuration Helper
 * This script helps configure SMS settings in the database
 */

// Instructions for manual configuration
console.log(`
🔧 SMS Configuration Helper

To configure the SMS system, you need to add these settings to your database:

1. Go to your Supabase dashboard
2. Navigate to the 'settings' table
3. Add these records:

INSERT INTO settings (key, value) VALUES 
('sms_provider_api_key', 'your_api_key_here'),
('sms_api_url', 'https://your-sms-provider.com/api/send'),
('sms_price', '15');

4. Replace the values with your actual SMS provider details

Common SMS Providers in Tanzania:
- Mobishastra: https://mshastra.com/sendurl.aspx
- SMS Tanzania: https://api.smstanzania.com/send
- BulkSMS: https://api.bulksms.com/send

Example configuration for Mobishastra:
INSERT INTO settings (key, value) VALUES 
('sms_provider_api_key', 'your_mobishastra_api_key'),
('sms_api_url', 'https://mshastra.com/sendurl.aspx'),
('sms_price', '15');

After configuration:
1. Restart your application
2. Go to SMS Control Center
3. Test with a small SMS
4. Check SMS logs for success/failure

For testing, you can use a test phone number like: 255700000000
`);

// If running in browser, provide interactive configuration
if (typeof window !== 'undefined') {
  window.configureSMS = async function(apiKey, apiUrl, price = 15) {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert([
          { key: 'sms_provider_api_key', value: apiKey },
          { key: 'sms_api_url', value: apiUrl },
          { key: 'sms_price', value: price.toString() }
        ], { onConflict: 'key' });

      if (error) {
        console.error('❌ Configuration failed:', error.message);
        return false;
      }

      console.log('✅ SMS configuration saved successfully!');
      console.log('🔄 Please refresh the page to apply changes');
      return true;
    } catch (error) {
      console.error('❌ Configuration error:', error.message);
      return false;
    }
  };

  console.log(`
🌐 Browser Configuration Available!

You can now configure SMS settings using:
configureSMS('your_api_key', 'https://your-provider.com/api', 15)

Example:
configureSMS('abc123', 'https://mshastra.com/sendurl.aspx', 15)
`);
}
