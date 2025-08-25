/**
 * Simple Tunnel Server
 * Alternative to ngrok for exposing local webhook server
 */

import http from 'http';
import { spawn } from 'child_process';

// Function to start a simple tunnel using localtunnel
async function startTunnel() {
  console.log('🚀 Starting tunnel server...');
  
  try {
    // Try to use localtunnel if available
    const tunnel = spawn('npx', ['localtunnel', '--port', '3000'], {
      stdio: 'pipe'
    });
    
    tunnel.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('📡 Tunnel output:', output);
      
      // Look for the tunnel URL
      if (output.includes('https://')) {
        const urlMatch = output.match(/https:\/\/[^\s]+/);
        if (urlMatch) {
          const tunnelUrl = urlMatch[0];
          console.log('\n🎉 Tunnel is ready!');
          console.log(`🌐 Public URL: ${tunnelUrl}`);
          console.log('\n📋 Next steps:');
          console.log('1. Go to: https://console.green-api.com');
          console.log('2. Find your instance: 7105284900');
          console.log(`3. Set webhook URL to: ${tunnelUrl}`);
          console.log('4. Enable all webhook events');
          console.log('5. Save changes');
          console.log('6. Clear webhook queue');
          console.log('7. Send "Hi" from your phone to test!');
        }
      }
    });
    
    tunnel.stderr.on('data', (data) => {
      console.log('❌ Tunnel error:', data.toString());
    });
    
    tunnel.on('close', (code) => {
      console.log(`🔌 Tunnel process exited with code ${code}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start tunnel:', error.message);
    console.log('\n📋 Manual setup required:');
    console.log('1. Install ngrok: https://ngrok.com/download');
    console.log('2. Sign up for free account: https://dashboard.ngrok.com/signup');
    console.log('3. Get authtoken and run: ngrok config add-authtoken YOUR_TOKEN');
    console.log('4. Run: ngrok http 3000');
  }
}

// Start the tunnel
startTunnel().catch(console.error);
