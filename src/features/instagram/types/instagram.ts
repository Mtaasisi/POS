// Instagram Messaging API Types
// Based on Instagram Platform API documentation

export interface InstagramUser {
  id: string;
  name?: string;
  username: string;
  profile_pic?: string;
  follower_count?: number;
  is_user_follow_business: boolean;
  is_business_follow_user: boolean;
  is_verified_user?: boolean;
}

export interface InstagramMessage {
  mid: string;
  text?: string;
  attachments?: InstagramAttachment[];
  quick_reply?: {
    payload: string;
  };
  timestamp: number;
}

export interface InstagramAttachment {
  type: 'image' | 'video' | 'audio' | 'file' | 'template';
  payload: {
    url?: string;
    template_type?: string;
    elements?: GenericTemplateElement[];
  };
}

export interface QuickReply {
  content_type: 'text';
  title: string;
  payload: string;
}

export interface GenericTemplateElement {
  title: string;
  image_url?: string;
  subtitle?: string;
  default_action?: {
    type: 'web_url';
    url: string;
  };
  buttons?: TemplateButton[];
}

export interface TemplateButton {
  type: 'web_url' | 'postback';
  title: string;
  url?: string;
  payload?: string;
}

export interface ButtonTemplate {
  template_type: 'button';
  text: string;
  buttons: TemplateButton[];
}

export interface InstagramWebhook {
  object: 'instagram';
  entry: InstagramEntry[];
}

export interface InstagramEntry {
  id: string; // Instagram Professional account ID
  time: number;
  messaging?: InstagramMessaging[];
  changes?: InstagramChange[];
}

export interface InstagramMessaging {
  sender: {
    id: string; // Instagram-scoped ID
  };
  recipient: {
    id: string; // Instagram Professional account ID
  };
  timestamp: number;
  message?: InstagramMessage;
  postback?: {
    title: string;
    payload: string;
  };
  read?: {
    watermark: number;
  };
}

export interface InstagramChange {
  field: string;
  value: {
    id: string;
    text?: string;
    media_type?: string;
    media_url?: string;
    comment_id?: string;
    parent_id?: string;
  };
}

export interface SendMessageRequest {
  recipient: {
    id: string; // Instagram-scoped ID
  };
  messaging_type: 'RESPONSE' | 'UPDATE' | 'MESSAGE_TAG';
  message: {
    text?: string;
    attachment?: {
      type: 'template';
      payload: GenericTemplate | ButtonTemplate;
    };
    quick_replies?: QuickReply[];
  };
  tag?: string;
}

export interface GenericTemplate {
  template_type: 'generic';
  elements: GenericTemplateElement[];
}

export interface SendMessageResponse {
  recipient_id: string;
  message_id: string;
}

export interface InstagramConversation {
  id: string;
  user: InstagramUser;
  messages: InstagramMessage[];
  last_message_time: number;
  unread_count: number;
  status: 'active' | 'archived' | 'blocked';
  created_at: string;
  updated_at: string;
}

export interface InstagramProfile {
  id: string;
  username: string;
  name?: string;
  biography?: string;
  profile_picture_url?: string;
  followers_count?: number;
  follows_count?: number;
  media_count?: number;
  website?: string;
  account_type: 'BUSINESS' | 'CREATOR' | 'PERSONAL';
}

export interface InstagramSettings {
  access_token: string;
  instagram_account_id: string;
  facebook_page_id: string;
  webhook_url: string;
  webhook_verify_token: string;
  is_connected: boolean;
  auto_reply_enabled: boolean;
  welcome_message?: string;
  business_hours?: {
    enabled: boolean;
    timezone: string;
    schedule: {
      [key: string]: {
        start: string;
        end: string;
        enabled: boolean;
      };
    };
  };
  ice_breakers?: IceBreaker[];
  persistent_menu?: PersistentMenu;
}

export interface IceBreaker {
  question: string;
  payload: string;
}

export interface PersistentMenu {
  locale: string;
  composer_input_disabled: boolean;
  call_to_actions: MenuAction[];
}

export interface MenuAction {
  type: 'postback' | 'web_url';
  title: string;
  payload?: string;
  url?: string;
}

export interface InstagramAnalytics {
  total_conversations: number;
  active_conversations: number;
  messages_sent: number;
  messages_received: number;
  response_rate: number;
  average_response_time: number; // in minutes
  daily_stats: {
    date: string;
    messages_sent: number;
    messages_received: number;
    new_conversations: number;
  }[];
}

export interface AutoReplyRule {
  id: string;
  trigger_keywords: string[];
  response_type: 'text' | 'quick_reply' | 'template';
  response_content: string | QuickReply[] | GenericTemplate;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  type: 'text' | 'quick_reply' | 'generic' | 'button';
  content: string | QuickReply[] | GenericTemplate | ButtonTemplate;
  category: string;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

// API Response Types
export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Error Types
export interface InstagramApiError {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id: string;
  };
}
