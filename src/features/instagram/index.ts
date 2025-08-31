// Instagram Feature Module
// Exports for Instagram DM functionality

// Pages
export { default as InstagramDMPage } from './pages/InstagramDMPage';

// Components
export { default as ConversationList } from './components/ConversationList';
export { default as MessageThread } from './components/MessageThread';
export { default as MessageComposer } from './components/MessageComposer';
export { default as InstagramConnection } from './components/InstagramConnection';
export { default as InstagramSettingsPanel } from './components/InstagramSettingsPanel';
export { default as InstagramAnalytics } from './components/InstagramAnalytics';

// Hooks
export { useInstagramDM, processInstagramWebhook } from './hooks/useInstagramDM';

// Services
export { default as instagramApiService } from './services/instagramApiService';
export { default as InstagramWebhookHandler } from './services/webhookHandler';

// Types
export type {
  InstagramUser,
  InstagramMessage,
  InstagramConversation,
  InstagramSettings,
  InstagramProfile,
  InstagramAnalytics,
  AutoReplyRule,
  MessageTemplate,
  QuickReply,
  GenericTemplate,
  ButtonTemplate,
  InstagramWebhook,
  SendMessageRequest,
  SendMessageResponse,
  ApiResponse
} from './types/instagram';