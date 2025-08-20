// Popup script for Chrome extension
document.addEventListener('DOMContentLoaded', function() {
    const appUrl = 'https://your-domain.com/whatsapp/chrome-extension';
    
    // Get DOM elements
    const statusIndicator = document.getElementById('statusIndicator');
    const statusText = document.getElementById('statusText');
    const openDashboardBtn = document.getElementById('openDashboard');
    const testConnectionBtn = document.getElementById('testConnection');
    const settingsBtn = document.getElementById('settings');
    const messageCount = document.getElementById('messageCount');
    const ticketCount = document.getElementById('ticketCount');

    // Check connection status
    async function checkConnectionStatus() {
        try {
            const response = await fetch(`${appUrl.replace('/whatsapp/chrome-extension', '/api/chrome-extension/status')}`);
            const data = await response.json();
            
            if (data.success && data.data.isConnected) {
                statusIndicator.className = 'status-indicator status-connected';
                statusText.textContent = 'Connected';
            } else {
                statusIndicator.className = 'status-indicator status-disconnected';
                statusText.textContent = 'Disconnected';
            }
        } catch (error) {
            statusIndicator.className = 'status-indicator status-disconnected';
            statusText.textContent = 'Connection Error';
        }
    }

    // Test connection
    async function testConnection() {
        try {
            const response = await fetch(`${appUrl.replace('/whatsapp/chrome-extension', '/api/chrome-extension/status')}`);
            const data = await response.json();
            
            if (data.success) {
                alert('✅ Connection successful! LATS CHANCE is ready.');
                checkConnectionStatus();
            } else {
                alert('❌ Connection failed. Please check your setup.');
            }
        } catch (error) {
            alert('❌ Connection error: ' + error.message);
        }
    }

    // Get statistics
    async function getStats() {
        try {
            // Get message count
            const messageResponse = await fetch(`${appUrl.replace('/whatsapp/chrome-extension', '/api/chrome-extension/stats/messages')}`);
            const messageData = await messageResponse.json();
            if (messageData.success) {
                messageCount.textContent = messageData.count || 0;
            }

            // Get ticket count
            const ticketResponse = await fetch(`${appUrl.replace('/whatsapp/chrome-extension', '/api/chrome-extension/stats/tickets')}`);
            const ticketData = await ticketResponse.json();
            if (ticketData.success) {
                ticketCount.textContent = ticketData.count || 0;
            }
        } catch (error) {
            console.log('Could not fetch stats:', error);
        }
    }

    // Event listeners
    openDashboardBtn.addEventListener('click', function(e) {
        e.preventDefault();
        chrome.tabs.create({ url: appUrl });
    });

    testConnectionBtn.addEventListener('click', function(e) {
        e.preventDefault();
        testConnection();
    });

    settingsBtn.addEventListener('click', function(e) {
        e.preventDefault();
        chrome.tabs.create({ url: appUrl + '?tab=settings' });
    });

    // Initialize
    checkConnectionStatus();
    getStats();

    // Update stats every 30 seconds
    setInterval(getStats, 30000);
});
