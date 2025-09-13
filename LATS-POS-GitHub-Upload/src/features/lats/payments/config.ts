import type { ProviderId } from './types';

const LOCAL_STORAGE_KEY = 'payments.activeProvider';

export function getDefaultProviderId(): ProviderId {
  const fromStorage = (typeof window !== 'undefined')
    ? (window.localStorage.getItem(LOCAL_STORAGE_KEY) as ProviderId | null)
    : null;

  if (fromStorage) return fromStorage;

  const fromEnv = (import.meta as any)?.env?.VITE_PAYMENTS_PROVIDER as ProviderId | undefined;
  if (fromEnv) return fromEnv;

  return 'zenopay';
}

export function persistActiveProvider(providerId: ProviderId): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOCAL_STORAGE_KEY, providerId);
}


