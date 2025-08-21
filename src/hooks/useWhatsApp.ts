import { useState, useEffect, useCallback } from 'react';
import { whatsappService, WhatsAppInstance, WhatsAppMessage } from '../services/whatsappService';

export interface UseWhatsAppReturn {
  // Instances
  instances: WhatsAppInstance[];
  loading: boolean;
  error: string | null;
  
  // Instance management
  createInstance: (phoneNumber: string, apiToken: string) => Promise<WhatsAppInstance>;
  deleteInstance: (instanceId: string) => Promise<void>;
  getQRCode: (instanceId: string) => Promise<string>;
  getInstanceState: (instanceId: string) => Promise<string>;
  
  // Messaging
  sendTextMessage: (instanceId: string, chatId: string, message: string) => Promise<string>;
  sendFileMessage: (instanceId: string, chatId: string, fileUrl: string, caption?: string) => Promise<string>;
  sendLocationMessage: (instanceId: string, chatId: string, latitude: number, longitude: number, name?: string, address?: string) => Promise<string>;
  sendContactMessage: (instanceId: string, chatId: string, contactData: { name: string; phone: string; email?: string }) => Promise<string>;
  
  // Chat and contacts
  getChatHistory: (instanceId: string, chatId: string, count?: number) => Promise<WhatsAppMessage[]>;
  checkWhatsApp: (instanceId: string, phoneNumber: string) => Promise<boolean>;
  getContacts: (instanceId: string) => Promise<any[]>;
  
  // Utilities
  refreshInstances: () => Promise<void>;
  getInstance: (instanceId: string) => WhatsAppInstance | undefined;
}

export function useWhatsApp(): UseWhatsAppReturn {
  const [instances, setInstances] = useState<WhatsAppInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize WhatsApp service and load instances
  const initialize = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Initialize the service (this will now handle concurrent initialization)
      await whatsappService.initialize();
      
      // Load instances after successful initialization
      const loadedInstances = whatsappService.getInstances();
      setInstances(loadedInstances);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize WhatsApp service';
      setError(errorMessage);
      console.error('WhatsApp initialization error:', err);
      // Don't throw the error, just log it and continue
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh instances
  const refreshInstances = useCallback(async () => {
    try {
      setError(null);
      const loadedInstances = whatsappService.getInstances();
      setInstances(loadedInstances);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh instances');
      console.error('WhatsApp refresh error:', err);
    }
  }, []);

  // Create new instance
  const createInstance = useCallback(async (phoneNumber: string, apiToken?: string): Promise<WhatsAppInstance> => {
    try {
      setError(null);
      const instance = await whatsappService.createInstance(phoneNumber, apiToken);
      setInstances(prev => [instance, ...prev]);
      return instance;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create instance';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Delete instance
  const deleteInstance = useCallback(async (instanceId: string): Promise<void> => {
    try {
      setError(null);
      await whatsappService.deleteInstance(instanceId);
      setInstances(prev => prev.filter(instance => instance.instanceId !== instanceId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete instance';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Get QR code
  const getQRCode = useCallback(async (instanceId: string): Promise<string> => {
    try {
      setError(null);
      return await whatsappService.getQRCode(instanceId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get QR code';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Get instance state
  const getInstanceState = useCallback(async (instanceId: string): Promise<string> => {
    try {
      setError(null);
      const state = await whatsappService.getInstanceState(instanceId);
      
      // Update local instance status
      setInstances(prev => prev.map(instance => 
        instance.instanceId === instanceId 
          ? { ...instance, status: state === 'authorized' ? 'connected' : 'disconnected' }
          : instance
      ));
      
      return state;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get instance state';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Send text message
  const sendTextMessage = useCallback(async (instanceId: string, chatId: string, message: string): Promise<string> => {
    try {
      setError(null);
      return await whatsappService.sendTextMessage(instanceId, chatId, message);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Send file message
  const sendFileMessage = useCallback(async (instanceId: string, chatId: string, fileUrl: string, caption?: string): Promise<string> => {
    try {
      setError(null);
      return await whatsappService.sendFileMessage(instanceId, chatId, fileUrl, caption);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send file';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Send location message
  const sendLocationMessage = useCallback(async (instanceId: string, chatId: string, latitude: number, longitude: number, name?: string, address?: string): Promise<string> => {
    try {
      setError(null);
      return await whatsappService.sendLocationMessage(instanceId, chatId, latitude, longitude, name, address);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send location';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Send contact message
  const sendContactMessage = useCallback(async (instanceId: string, chatId: string, contactData: { name: string; phone: string; email?: string }): Promise<string> => {
    try {
      setError(null);
      return await whatsappService.sendContactMessage(instanceId, chatId, contactData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send contact';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Get chat history
  const getChatHistory = useCallback(async (instanceId: string, chatId: string, count: number = 100): Promise<WhatsAppMessage[]> => {
    try {
      setError(null);
      return await whatsappService.getChatHistory(instanceId, chatId, count);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get chat history';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Check WhatsApp availability
  const checkWhatsApp = useCallback(async (instanceId: string, phoneNumber: string): Promise<boolean> => {
    try {
      setError(null);
      return await whatsappService.checkWhatsApp(instanceId, phoneNumber);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check WhatsApp';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Get contacts
  const getContacts = useCallback(async (instanceId: string): Promise<any[]> => {
    try {
      setError(null);
      return await whatsappService.getContacts(instanceId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get contacts';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Get instance by ID
  const getInstance = useCallback((instanceId: string): WhatsAppInstance | undefined => {
    return whatsappService.getInstance(instanceId);
  }, []);

  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Set up periodic refresh of instances
  useEffect(() => {
    const interval = setInterval(() => {
      refreshInstances();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [refreshInstances]);

  return {
    instances,
    loading,
    error,
    createInstance,
    deleteInstance,
    getQRCode,
    getInstanceState,
    sendTextMessage,
    sendFileMessage,
    sendLocationMessage,
    sendContactMessage,
    getChatHistory,
    checkWhatsApp,
    getContacts,
    refreshInstances,
    getInstance,
  };
}
