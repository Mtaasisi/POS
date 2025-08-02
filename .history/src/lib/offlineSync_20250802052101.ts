import { openDB } from 'idb';
import { toast } from 'react-hot-toast';

const DB_NAME = 'clean-app-db';
const STORE_NAME = 'pending-actions';

// Global flag to track if we're using mock data
let isUsingMockData = false;
let notificationShown = false;
let lastNotificationTime = 0;

export const setMockDataMode = (enabled: boolean) => {
  const wasUsingMockData = isUsingMockData;
  isUsingMockData = enabled;
  
  // Only show notification when switching to mock mode and not already shown
  if (enabled && !wasUsingMockData && !notificationShown) {
    const now = Date.now();
    if (now - lastNotificationTime > 5000) { // 5 second cooldown
      toast.success('🔧 Using mock data for development - Supabase connection unavailable', {
        duration: 5000,
        icon: '🔧',
      });
      notificationShown = true;
      lastNotificationTime = now;
    }
  } else if (!enabled) {
    notificationShown = false; // Reset when switching back to real data
  }
};

export const getMockDataMode = () => isUsingMockData;

export const showMockDataNotification = () => {
  if (isUsingMockData && !notificationShown) {
    const now = Date.now();
    if (now - lastNotificationTime > 10000) { // 10 second cooldown
      toast.info('🔧 Using mock data - changes will not be saved to database', {
        duration: 3000,
        icon: '🔧',
      });
      notificationShown = true;
      lastNotificationTime = now;
    }
  }
};

export async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
}

export async function saveActionOffline(action: any) {
  const db = await getDB();
  await db.add(STORE_NAME, { ...action, timestamp: Date.now() });
}

export async function getPendingActions() {
  const db = await getDB();
  return db.getAll(STORE_NAME);
}

export async function clearPendingActions() {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.store.clear();
  await tx.done;
} 