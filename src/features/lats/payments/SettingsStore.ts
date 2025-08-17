import { create } from 'zustand';
import type { ProviderId } from './types';
import { PaymentService } from './service';
import { persistActiveProvider } from './config';

type ProviderCredentials = {
  apiKey?: string;
  baseUrl?: string;
  webhookUrl?: string;
};

type PaymentSettingsState = {
  activeProvider: ProviderId;
  credentials: Partial<Record<ProviderId, ProviderCredentials>>;
  setActiveProvider: (provider: ProviderId) => void;
  setCredentials: (provider: ProviderId, creds: ProviderCredentials) => void;
  getEffectiveCredentials: (provider?: ProviderId) => ProviderCredentials;
};

const STORAGE_KEY = 'payments.settings';

export const usePaymentSettings = create<PaymentSettingsState>((set, get) => {
  // initialize from localStorage
  let initial: Partial<PaymentSettingsState> | null = null;
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      // Only use data properties, not methods
      initial = {
        activeProvider: parsed.activeProvider,
        credentials: parsed.credentials || {},
      };
    }
  } catch (error) {
    console.warn('Failed to load payment settings from localStorage:', error);
  }

  // Get default provider safely
  const getDefaultProvider = (): ProviderId => {
    try {
      return PaymentService.getActiveProvider();
    } catch (error) {
      console.warn('PaymentService not ready, using default provider:', error);
      return 'zenopay' as ProviderId;
    }
  };

  const defaultState: PaymentSettingsState = {
    activeProvider: initial?.activeProvider ?? getDefaultProvider(),
    credentials: initial?.credentials ?? {},
    setActiveProvider: (provider: ProviderId) => {
      try {
        PaymentService.setActiveProvider(provider);
        persistActiveProvider(provider);
      } catch (error) {
        console.warn('Failed to set active provider in PaymentService:', error);
      }
      set({ activeProvider: provider });
      // persist
      const snap = get();
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
            activeProvider: snap.activeProvider,
            credentials: snap.credentials,
          }));
        } catch (error) {
          console.warn('Failed to persist payment settings:', error);
        }
      }
    },
    setCredentials: (provider: ProviderId, creds: ProviderCredentials) => {
      const next = { ...get().credentials, [provider]: { ...get().credentials[provider], ...creds } };
      set({ credentials: next });
      const snap = get();
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
            activeProvider: snap.activeProvider,
            credentials: snap.credentials,
          }));
        } catch (error) {
          console.warn('Failed to persist payment settings:', error);
        }
      }
    },
    getEffectiveCredentials: (provider?: ProviderId) => {
      const pid = provider ?? get().activeProvider;
      return get().credentials[pid] ?? {};
    },
  };

  return defaultState;
});


