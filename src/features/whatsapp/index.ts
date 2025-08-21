// WhatsApp Feature Exports

// Services
export { whatsappService, WhatsAppService } from '../../../services/whatsappService';
export type { WhatsAppInstance, WhatsAppMessage, WhatsAppWebhook } from '../../../services/whatsappService';

// Hooks
export { useWhatsApp } from '../../../hooks/useWhatsApp';
export type { UseWhatsAppReturn } from '../../../hooks/useWhatsApp';

// Pages
export { default as WhatsAppManagementPage } from './pages/WhatsAppManagementPage';

// Configuration
export { WHATSAPP_CONFIG, getWhatsAppConfig } from '../../../config/whatsappConfig';
export type { WhatsAppEventType, WhatsAppMessageType } from '../../../config/whatsappConfig';

// Utilities
export { 
  formatPhoneNumber, 
  validatePhoneNumber, 
  validateMessageLength, 
  validateFileSize, 
  validateFileType 
} from '../../../config/whatsappConfig';
