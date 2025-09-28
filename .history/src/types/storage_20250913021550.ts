export type ShelfType = 'standard' | 'refrigerated' | 'display' | 'storage' | 'specialty';

export interface StorageRoom {
  id: string;
  storeLocationId: string;
  name: string;
  code: string;
  floorLevel: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoreShelf {
  id: string;
  storeLocationId: string;
  storageRoomId: string;
  name: string;
  code: string;
  rowNumber: number;
  columnNumber: number;
  shelfType: ShelfType;
  maxCapacity?: number;
  floorLevel: number;
  isActive: boolean;
  isAccessible: boolean;
  requiresLadder: boolean;
  isRefrigerated: boolean; // Generated column
  priorityOrder: number; // Generated column
  createdAt: string;
  updatedAt: string;
}

export interface StorageRoomWithShelves extends StorageRoom {
  shelves: StoreShelf[];
}

export interface CreateStorageRoomRequest {
  storeLocationId: string;
  name: string;
  code: string;
  floorLevel?: number;
}

export interface UpdateStorageRoomRequest {
  name?: string;
  code?: string;
  floorLevel?: number;
}

export interface CreateStoreShelfRequest {
  storeLocationId: string;
  storageRoomId: string;
  name: string;
  code: string;
  rowNumber: number;
  columnNumber: number;
  shelfType?: ShelfType;
  maxCapacity?: number;
  floorLevel?: number;
  isActive?: boolean;
  isAccessible?: boolean;
  requiresLadder?: boolean;
}

export interface UpdateStoreShelfRequest {
  name?: string;
  code?: string;
  rowNumber?: number;
  columnNumber?: number;
  shelfType?: ShelfType;
  maxCapacity?: number;
  floorLevel?: number;
  isActive?: boolean;
  isAccessible?: boolean;
  requiresLadder?: boolean;
}
