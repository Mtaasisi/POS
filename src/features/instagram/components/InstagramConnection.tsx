// Instagram Connection Component
// Handles Instagram account connection and authentication

import React, { useState } from 'react';
import { 
  Instagram, 
  Key, 
  Link, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  Copy,
  RefreshCw
} from 'lucide-react';
import { InstagramSettings } from '../types/instagram';

interface InstagramConnectionProps {
  isConnected: boolean;
  settings: InstagramSettings | null;
  onConnect: (accessToken: string, instagramAccountId: string, facebookPageId: string) => Promise<boolean>;
  onDisconnect: () => void;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

const InstagramConnection: React.FC<InstagramConnectionProps> = ({
  isConnected,
  settings,
  onConnect,
  onDisconnect,
  isLoading = false,
  error = null,
  className = ''
}) => {
  const [accessToken, setAccessToken] = useState('');
  const [instagramAccountId, setInstagramAccountId] = useState('');
  const [facebookPageId, setFacebookPageId] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (!accessToken.trim() || !instagramAccountId.trim()) {
      return;
    }

    setIsConnecting(true);
    try {
      const success = await onConnect(
        accessToken.trim(), 
        instagramAccountId.trim(), 
        facebookPageId.trim()
      );
      
      if (success) {
        setAccessToken('');
        setInstagramAccountId('');
        setFacebookPageId('');
        setShowTokenInput(false);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const copyWebhookUrl = () => {
    const webhookUrl = `${window.location.origin}/webhook/instagram`;
    navigator.clipboard.writeText(webhookUrl);
  };

  const generateVerifyToken = () => {
    const token = `verify_${Math.random().toString(36).substr(2, 16)}`;
    navigator.clipboard.writeText(token);
    return token;
  };

  if (isConnected && settings) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
        <div className="p-6">
          {/* Connected Status */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <Instagram size={24} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Instagram Connected</h2>
              <p className="text-sm text-gray-600">
                Your Instagram account is successfully connected and ready for messaging.
              </p>
            </div>
            <div className="ml-auto">
              <CheckCircle size={24} className="text-green-500" />
            </div>
          </div>

          {/* Connection Details */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instagram Account ID
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900">
                  {settings.instagram_account_id}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Facebook Page ID
                </label>
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900">
                  {settings.facebook_page_id || 'Not set'}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Access Token
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900">
                {settings.access_token.substring(0, 20)}...
                <span className="text-gray-500 ml-2">
                  (Hidden for security)
                </span>
              </div>
            </div>
          </div>

          {/* Webhook Configuration */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Webhook Configuration</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Webhook URL
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900">
                    {window.location.origin}/webhook/instagram
                  </div>
                  <button
                    onClick={copyWebhookUrl}
                    className="px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md"
                    title="Copy webhook URL"
                  >
                    <Copy size={16} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Use this URL in your Facebook App webhook configuration.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Verify Token
                </label>
                <div className="flex gap-2">
                  <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900">
                    {settings.webhook_verify_token || 'Not set'}
                  </div>
                  <button
                    onClick={() => {
                      const token = generateVerifyToken();
                      onConnect(settings.access_token, settings.instagram_account_id, settings.facebook_page_id);
                    }}
                    className="px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md"
                    title="Generate new verify token"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Use this token to verify webhook requests from Instagram.
                </p>
              </div>
            </div>
          </div>

          {/* Setup Guide */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Setup Instructions</h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                  1
                </div>
                <div>
                  <p className="text-gray-900">Go to Facebook Developer Console</p>
                  <p className="text-gray-600">
                    Navigate to your app's webhook configuration
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                  2
                </div>
                <div>
                  <p className="text-gray-900">Configure Webhook</p>
                  <p className="text-gray-600">
                    Add the webhook URL and verify token shown above
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                  3
                </div>
                <div>
                  <p className="text-gray-900">Subscribe to Events</p>
                  <p className="text-gray-600">
                    Enable: messages, messaging_postbacks, messaging_optins, messaging_referral
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Disconnect Button */}
          <div className="border-t border-gray-200 pt-6">
            <button
              onClick={onDisconnect}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center gap-2"
            >
              <Link size={16} />
              Disconnect Instagram
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      <div className="p-6">
        {/* Connection Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Instagram size={24} className="text-gray-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Connect Instagram</h2>
            <p className="text-sm text-gray-600">
              Connect your Instagram Professional account to start managing DMs.
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md mb-4">
            <AlertCircle size={16} className="text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* Setup Guide */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Prerequisites</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-500" />
              <span>Instagram Professional (Business or Creator) account</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-500" />
              <span>Facebook Page connected to Instagram account</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-500" />
              <span>Facebook App with Instagram API permissions</span>
            </div>
          </div>
        </div>

        {/* Connection Form */}
        {!showTokenInput ? (
          <div className="space-y-4">
            <button
              onClick={() => setShowTokenInput(true)}
              className="w-full px-4 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center justify-center gap-2"
            >
              <Key size={20} />
              Configure Instagram Connection
            </button>
            
            <a
              href="https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
            >
              <ExternalLink size={14} />
              Instagram API Documentation
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instagram Access Token *
              </label>
              <input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="Enter your Instagram access token..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Get this from your Facebook App's Access Token Tool
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Instagram Account ID *
              </label>
              <input
                type="text"
                value={instagramAccountId}
                onChange={(e) => setInstagramAccountId(e.target.value)}
                placeholder="Enter your Instagram account ID..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Your Instagram Professional account ID
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Facebook Page ID
              </label>
              <input
                type="text"
                value={facebookPageId}
                onChange={(e) => setFacebookPageId(e.target.value)}
                placeholder="Enter your Facebook page ID (optional)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                The Facebook Page connected to your Instagram account
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleConnect}
                disabled={!accessToken.trim() || !instagramAccountId.trim() || isConnecting}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
              >
                {isConnecting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Link size={16} />
                )}
                Connect Instagram
              </button>
              
              <button
                onClick={() => setShowTokenInput(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* How to Get Credentials */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">How to Get Your Credentials</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                1
              </div>
              <div>
                <p className="font-medium">Create a Facebook App</p>
                <p>Go to developers.facebook.com and create a new app with Instagram API access</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                2
              </div>
              <div>
                <p className="font-medium">Get Access Token</p>
                <p>Use Facebook's Access Token Tool to generate a token with instagram_business_basic and instagram_business_manage_messages permissions</p>
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                3
              </div>
              <div>
                <p className="font-medium">Find Account ID</p>
                <p>Use the Graph API Explorer to call /me/accounts and find your Instagram account ID</p>
              </div>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-blue-200">
            <a
              href="https://developers.facebook.com/tools/explorer/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <ExternalLink size={14} />
              Open Graph API Explorer
            </a>
          </div>
        </div>

        {/* Webhook Setup Guide */}
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-sm font-medium text-yellow-900 mb-2">Webhook Setup Required</h3>
          <div className="space-y-2 text-sm text-yellow-800">
            <p>After connecting, you'll need to configure webhooks in your Facebook App:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Add webhook URL: <code className="bg-yellow-100 px-1 rounded">{window.location.origin}/webhook/instagram</code></li>
              <li>Generate and use a verify token</li>
              <li>Subscribe to: messages, messaging_postbacks, messaging_optins</li>
            </ul>
          </div>
        </div>

        {/* Required Permissions */}
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Required Permissions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-green-500" />
              <span>instagram_business_basic</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-green-500" />
              <span>instagram_business_manage_messages</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-green-500" />
              <span>pages_manage_metadata</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-green-500" />
              <span>pages_messaging</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstagramConnection;