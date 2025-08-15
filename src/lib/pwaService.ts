// PWA Service Worker Registration and Management
class PWAService {
  private registration: ServiceWorkerRegistration | null = null;
  private deferredPrompt: any = null;

  // Register service worker
  async registerServiceWorker(): Promise<boolean> {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('PWA: Service Worker registered successfully', this.registration);
        
        // Listen for updates
        this.registration.addEventListener('updatefound', () => {
          const newWorker = this.registration!.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available
                this.showUpdateNotification();
              }
            });
          }
        });

        return true;
      } catch (error) {
        console.error('PWA: Service Worker registration failed', error);
        return false;
      }
    }
    return false;
  }

  // Handle PWA install prompt
  setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallPrompt();
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA: App was installed');
      this.deferredPrompt = null;
      this.hideInstallPrompt();
    });
  }

  // Show install prompt
  private showInstallPrompt(): void {
    const installButton = document.getElementById('pwa-install-button');
    if (installButton) {
      installButton.style.display = 'block';
    }
  }

  // Hide install prompt
  private hideInstallPrompt(): void {
    const installButton = document.getElementById('pwa-install-button');
    if (installButton) {
      installButton.style.display = 'none';
    }
  }

  // Trigger PWA installation
  async installPWA(): Promise<boolean> {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;
      return outcome === 'accepted';
    }
    return false;
  }

  // Show update notification
  private showUpdateNotification(): void {
    const updateNotification = document.createElement('div');
    updateNotification.id = 'pwa-update-notification';
    updateNotification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #3b82f6;
        color: white;
        padding: 16px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        max-width: 300px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="font-size: 20px;">🔄</div>
          <div>
            <div style="font-weight: 600; margin-bottom: 4px;">Update Available</div>
            <div style="font-size: 14px; opacity: 0.9;">A new version is ready to install</div>
          </div>
        </div>
        <div style="display: flex; gap: 8px; margin-top: 12px;">
          <button id="pwa-update-now" style="
            background: white;
            color: #3b82f6;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            font-size: 14px;
          ">Update Now</button>
          <button id="pwa-update-later" style="
            background: transparent;
            color: white;
            border: 1px solid rgba(255,255,255,0.3);
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
          ">Later</button>
        </div>
      </div>
    `;

    document.body.appendChild(updateNotification);

    // Handle update button clicks
    document.getElementById('pwa-update-now')?.addEventListener('click', () => {
      this.updatePWA();
    });

    document.getElementById('pwa-update-later')?.addEventListener('click', () => {
      this.hideUpdateNotification();
    });
  }

  // Hide update notification
  private hideUpdateNotification(): void {
    const notification = document.getElementById('pwa-update-notification');
    if (notification) {
      notification.remove();
    }
  }

  // Update PWA
  private updatePWA(): void {
    if (this.registration && this.registration.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }

  // Check if app is installed
  isAppInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  // Get PWA capabilities
  getPWACapabilities(): {
    serviceWorker: boolean;
    pushManager: boolean;
    notifications: boolean;
    backgroundSync: boolean;
    cache: boolean;
  } {
    return {
      serviceWorker: 'serviceWorker' in navigator,
      pushManager: 'PushManager' in window,
      notifications: 'Notification' in window,
      backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      cache: 'caches' in window
    };
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      return await Notification.requestPermission();
    }
    return 'denied';
  }

  // Subscribe to push notifications
  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!this.registration || !('PushManager' in window)) {
      return null;
    }

    try {
      const permission = await this.requestNotificationPermission();
      if (permission !== 'granted') {
        return null;
      }

      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(process.env.REACT_APP_VAPID_PUBLIC_KEY || '')
      });

      return subscription;
    } catch (error) {
      console.error('PWA: Failed to subscribe to push notifications', error);
      return null;
    }
  }

  // Convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Send push notification
  async sendPushNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        ...options
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  }

  // Get offline status
  isOffline(): boolean {
    return !navigator.onLine;
  }

  // Listen for online/offline events
  onOnlineStatusChange(callback: (isOnline: boolean) => void): void {
    window.addEventListener('online', () => callback(true));
    window.addEventListener('offline', () => callback(false));
  }

  // Get battery information
  async getBatteryInfo(): Promise<{
    level: number;
    charging: boolean;
    chargingTime: number;
    dischargingTime: number;
  } | null> {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        return {
          level: battery.level,
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime
        };
      } catch (error) {
        console.error('PWA: Failed to get battery info', error);
      }
    }
    return null;
  }

  // Initialize PWA
  async initialize(): Promise<void> {
    await this.registerServiceWorker();
    this.setupInstallPrompt();
    
    // Listen for online/offline events
    this.onOnlineStatusChange((isOnline) => {
      console.log('PWA: Connection status changed', isOnline ? 'Online' : 'Offline');
    });
  }
}

// Export singleton instance
export const pwaService = new PWAService();
export default pwaService;
