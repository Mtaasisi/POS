import { openDB } from 'idb';

const DB_NAME = 'clean-app-offline-sync';
const STORE_NAME = 'pending-actions';

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