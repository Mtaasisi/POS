import type { OrderData, OrderResult, ProviderId, StatusResult, PaymentCredentials } from './types';
import { ZenoPayProvider } from './providers/zenopayProvider';
import { MockProvider } from './providers/mockProvider';
import { getDefaultProviderId, persistActiveProvider } from './config';

type ProviderInstances = {
  [K in ProviderId]?: any;
};

const providers: ProviderInstances = {
  zenopay: new ZenoPayProvider(),
  mock: new MockProvider(),
};

let activeProviderId: ProviderId = getDefaultProviderId();

export const PaymentService = {
  setActiveProvider(provider: ProviderId) {
    activeProviderId = provider;
    persistActiveProvider(provider);
  },
  getActiveProvider(): ProviderId {
    return activeProviderId;
  },
  getProviderInstance() {
    const instance = providers[activeProviderId];
    if (!instance) throw new Error(`Payment provider not configured: ${activeProviderId}`);
    return instance as ZenoPayProvider;
  },
  async createOrder(data: OrderData, credentials?: PaymentCredentials): Promise<OrderResult> {
    return this.getProviderInstance().createOrder(data, credentials);
  },
  async checkStatus(orderId: string, credentials?: PaymentCredentials): Promise<StatusResult> {
    return this.getProviderInstance().checkStatus(orderId, credentials);
  },
};


