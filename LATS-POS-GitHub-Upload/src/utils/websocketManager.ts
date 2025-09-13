// WebSocket Manager for handling real-time connections with retry logic

interface WebSocketConfig {
  url: string;
  maxRetries?: number;
  baseDelay?: number;
  onMessage?: (data: any) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

class WebSocketManager {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private retryCount = 0;
  private maxRetries: number;
  private baseDelay: number;
  private isConnecting = false;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(config: WebSocketConfig) {
    this.config = config;
    this.maxRetries = config.maxRetries || 5;
    this.baseDelay = config.baseDelay || 1000;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting) {
        reject(new Error('Connection already in progress'));
        return;
      }

      this.isConnecting = true;

      try {
        this.ws = new WebSocket(this.config.url);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected successfully');
          this.isConnecting = false;
          this.retryCount = 0;
          this.config.onOpen?.();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.config.onMessage?.(data);
          } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket connection closed:', event.code, event.reason);
          this.isConnecting = false;
          this.config.onClose?.();
          
          // Attempt to reconnect if not a normal closure
          if (event.code !== 1000) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.isConnecting = false;
          this.config.onError?.(error);
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  private scheduleReconnect(): void {
    if (this.retryCount >= this.maxRetries) {
      console.error('❌ Max retry attempts reached for WebSocket connection');
      return;
    }

    const delay = this.baseDelay * Math.pow(2, this.retryCount);
    console.log(`🔄 Scheduling WebSocket reconnection in ${delay}ms (attempt ${this.retryCount + 1}/${this.maxRetries})`);

    this.reconnectTimer = setTimeout(() => {
      this.retryCount++;
      this.connect().catch((error) => {
        console.error('❌ Reconnection failed:', error);
        this.scheduleReconnect();
      });
    }, delay);
  }

  send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('⚠️ WebSocket not connected, cannot send message');
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Normal closure');
      this.ws = null;
    }

    this.isConnecting = false;
    this.retryCount = 0;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getStatus(): string {
    if (!this.ws) return 'DISCONNECTED';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'CONNECTING';
      case WebSocket.OPEN:
        return 'CONNECTED';
      case WebSocket.CLOSING:
        return 'CLOSING';
      case WebSocket.CLOSED:
        return 'CLOSED';
      default:
        return 'UNKNOWN';
    }
  }
}

export default WebSocketManager;
