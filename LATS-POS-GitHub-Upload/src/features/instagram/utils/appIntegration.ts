// App Integration Utilities
// Helper functions for integrating Instagram DM with the existing app

import { InstagramIntegrationWidget } from '../components/InstagramIntegrationWidget';

/**
 * Integration guide for adding Instagram DM to existing app
 */

// 1. Add route to your app router
export const instagramRouteExample = `
// In your main App.tsx or router configuration
import { InstagramDMPage } from '@/features/instagram';

const routes = [
  // ... existing routes
  {
    path: '/instagram-dm',
    element: <InstagramDMPage />,
    title: 'Instagram DMs'
  }
];
`;

// 2. Add to navigation menu
export const navigationIntegrationExample = `
// In your navigation component
import { Instagram } from 'lucide-react';
import { useInstagramDM } from '@/features/instagram';

function Navigation() {
  const [instagramState] = useInstagramDM();
  
  return (
    <nav>
      {/* ... existing nav items */}
      <NavItem 
        to="/instagram-dm" 
        icon={<Instagram size={20} />}
        label="Instagram DMs"
        badge={instagramState.unreadCount > 0 ? instagramState.unreadCount : undefined}
      />
    </nav>
  );
}
`;

// 3. Add dashboard widget
export const dashboardWidgetExample = `
// In your main dashboard
import { InstagramIntegrationWidget } from '@/features/instagram';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* ... existing dashboard widgets */}
      
      <InstagramIntegrationWidget 
        onNavigateToInstagram={() => navigate('/instagram-dm')}
        showDetails={true}
      />
    </div>
  );
}
`;

// 4. Environment variables needed
export const environmentVariablesExample = `
# Add these to your .env file

# Instagram API Configuration
INSTAGRAM_ACCESS_TOKEN=your_instagram_access_token_here
INSTAGRAM_ACCOUNT_ID=your_instagram_account_id_here
FACEBOOK_PAGE_ID=your_facebook_page_id_here

# Webhook Configuration
INSTAGRAM_VERIFY_TOKEN=your_secure_verify_token_here
FACEBOOK_APP_SECRET=your_facebook_app_secret_here

# Application URLs
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
`;

// 5. Backend integration example
export const backendIntegrationExample = `
// backend/routes/instagram.js
const express = require('express');
const { expressWebhookHandler } = require('../api/instagram-webhook');

const router = express.Router();

// Webhook endpoints
router.get('/webhook', expressWebhookHandler.verify);
router.post('/webhook', expressWebhookHandler.handle);

// API endpoints for frontend
router.get('/conversations', async (req, res) => {
  // Fetch conversations from database
  // Return paginated results
});

router.post('/messages', async (req, res) => {
  // Send message via Instagram API
  // Log to database
});

module.exports = router;
`;

// Helper function to check if Instagram feature should be shown
export function shouldShowInstagramFeature(): boolean {
  // Check if Instagram is configured
  const settings = localStorage.getItem('instagram_settings');
  if (!settings) return false;
  
  try {
    const parsed = JSON.parse(settings);
    return !!(parsed.access_token && parsed.instagram_account_id);
  } catch {
    return false;
  }
}

// Integration status checker
export function getInstagramIntegrationStatus() {
  const hasCredentials = shouldShowInstagramFeature();
  const conversations = localStorage.getItem('instagram_conversations');
  const hasConversations = !!(conversations && JSON.parse(conversations).length > 0);
  
  return {
    configured: hasCredentials,
    active: hasConversations,
    last_checked: new Date().toISOString()
  };
}

// Notification integration helper
export function createInstagramNotification(conversation: any, message: any) {
  return {
    id: `instagram_${conversation.id}_${message.mid}`,
    type: 'instagram_dm',
    title: `New Instagram message`,
    message: `@${conversation.user.username}: ${message.text || 'Sent an attachment'}`,
    timestamp: new Date(message.timestamp).toISOString(),
    read: false,
    action: {
      type: 'navigate',
      url: `/instagram-dm?conversation=${conversation.id}`
    },
    user: {
      name: conversation.user.name || conversation.user.username,
      username: conversation.user.username,
      avatar: conversation.user.profile_pic
    }
  };
}

export default {
  shouldShowInstagramFeature,
  getInstagramIntegrationStatus,
  createInstagramNotification
};
