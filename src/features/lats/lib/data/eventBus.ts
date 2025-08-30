import React from 'react';

// Event Bus for LATS Module
export type LatsEventType =
  | 'lats:category.created'
  | 'lats:category.updated'
  | 'lats:category.deleted'

  | 'lats:supplier.created'
  | 'lats:supplier.updated'
  | 'lats:supplier.deleted'
  | 'lats:product.created'
  | 'lats:product.updated'
  | 'lats:product.deleted'
  | 'lats:stock.updated'
  | 'lats:purchase-order.created'
  | 'lats:purchase-order.updated'
  | 'lats:purchase-order.received'
  | 'lats:spare-part.created'
  | 'lats:spare-part.updated'
  | 'lats:spare-part.deleted'
  | 'lats:spare-part.used'
  | 'lats:cart.updated'
  | 'lats:sale.completed'
  | 'lats:pos.inventory.updated';

export interface LatsEvent {
  type: LatsEventType;
  data: any;
  timestamp: string;
  source?: string;
}

type EventHandler = (event: LatsEvent) => void;

class LatsEventBus {
  private handlers: Map<LatsEventType, EventHandler[]> = new Map();
  private globalHandlers: EventHandler[] = [];

  // Subscribe to a specific event type
  subscribe(eventType: LatsEventType, handler: EventHandler): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    
    this.handlers.get(eventType)!.push(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(eventType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  // Subscribe to all events
  subscribeToAll(handler: EventHandler): () => void {
    this.globalHandlers.push(handler);
    
    return () => {
      const index = this.globalHandlers.indexOf(handler);
      if (index > -1) {
        this.globalHandlers.splice(index, 1);
      }
    };
  }

  // Emit an event
  emit(eventType: LatsEventType, data: any, source?: string): void {
    const event: LatsEvent = {
      type: eventType,
      data,
      timestamp: new Date().toISOString(),
      source
    };

    // Notify specific handlers
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error(`Error in event handler for ${eventType}:`, error);
        }
      });
    }

    // Notify global handlers
    this.globalHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in global event handler:', error);
      }
    });

    // Log in development
    if (import.meta.env.DEV) {
      console.log(`[LATS EventBus] ${eventType}:`, event);
    }
  }

  // Clear all handlers
  clear(): void {
    this.handlers.clear();
    this.globalHandlers = [];
  }

  // Get all handlers for debugging
  getHandlers(): { [key: string]: number } {
    const result: { [key: string]: number } = {};
    this.handlers.forEach((handlers, eventType) => {
      result[eventType] = handlers.length;
    });
    result['global'] = this.globalHandlers.length;
    return result;
  }
}

// Create singleton instance
export const latsEventBus = new LatsEventBus();

// Convenience functions for common events
export const emitStockUpdate = (productId: string, variantId: string, quantity: number) => {
  latsEventBus.emit('lats:stock.updated', { productId, variantId, quantity });
};

export const emitProductUpdate = (productId: string, product: any) => {
  latsEventBus.emit('lats:product.updated', { productId, product });
};

export const emitCartUpdate = (cart: any) => {
  latsEventBus.emit('lats:cart.updated', { cart });
};

export const emitSaleCompleted = (sale: any) => {
  latsEventBus.emit('lats:sale.completed', { sale });
};

// React hook for subscribing to events
export const useLatsEvent = (eventType: LatsEventType, handler: EventHandler) => {
  React.useEffect(() => {
    const unsubscribe = latsEventBus.subscribe(eventType, handler);
    return unsubscribe;
  }, [eventType, handler]);
};

// React hook for subscribing to all events
export const useLatsEvents = (handler: EventHandler) => {
  React.useEffect(() => {
    const unsubscribe = latsEventBus.subscribeToAll(handler);
    return unsubscribe;
  }, [handler]);
};
