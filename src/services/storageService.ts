import { 
  StorageRoom, 
  StoreShelf, 
  StorageRoomWithShelves,
  CreateStorageRoomRequest,
  UpdateStorageRoomRequest,
  CreateStoreShelfRequest,
  UpdateStoreShelfRequest
} from '../types/storage';

const API_BASE = process.env.REACT_APP_API_BASE || '/api';

class StorageService {
  // Storage Rooms
  async getStorageRooms(storeLocationId?: string): Promise<StorageRoom[]> {
    const params = storeLocationId ? `?storeLocationId=${storeLocationId}` : '';
    const response = await fetch(`${API_BASE}/storage/rooms${params}`);
    if (!response.ok) throw new Error('Failed to fetch storage rooms');
    return response.json();
  }

  async getStorageRoom(id: string): Promise<StorageRoomWithShelves> {
    const response = await fetch(`${API_BASE}/storage/rooms/${id}`);
    if (!response.ok) throw new Error('Failed to fetch storage room');
    return response.json();
  }

  async createStorageRoom(data: CreateStorageRoomRequest): Promise<StorageRoom> {
    const response = await fetch(`${API_BASE}/storage/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create storage room');
    return response.json();
  }

  async updateStorageRoom(id: string, data: UpdateStorageRoomRequest): Promise<StorageRoom> {
    const response = await fetch(`${API_BASE}/storage/rooms/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update storage room');
    return response.json();
  }

  async deleteStorageRoom(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/storage/rooms/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete storage room');
  }

  // Store Shelves
  async getStoreShelves(storageRoomId?: string): Promise<StoreShelf[]> {
    const params = storageRoomId ? `?storageRoomId=${storageRoomId}` : '';
    const response = await fetch(`${API_BASE}/storage/shelves${params}`);
    if (!response.ok) throw new Error('Failed to fetch store shelves');
    return response.json();
  }

  async getStoreShelf(id: string): Promise<StoreShelf> {
    const response = await fetch(`${API_BASE}/storage/shelves/${id}`);
    if (!response.ok) throw new Error('Failed to fetch store shelf');
    return response.json();
  }

  async createStoreShelf(data: CreateStoreShelfRequest): Promise<StoreShelf> {
    const response = await fetch(`${API_BASE}/storage/shelves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create store shelf');
    return response.json();
  }

  async updateStoreShelf(id: string, data: UpdateStoreShelfRequest): Promise<StoreShelf> {
    const response = await fetch(`${API_BASE}/storage/shelves/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update store shelf');
    return response.json();
  }

  async deleteStoreShelf(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/storage/shelves/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete store shelf');
  }

  // Utility methods
  async validateShelfCode(code: string, excludeId?: string): Promise<boolean> {
    const params = excludeId ? `?code=${code}&excludeId=${excludeId}` : `?code=${code}`;
    const response = await fetch(`${API_BASE}/storage/shelves/validate${params}`);
    if (!response.ok) throw new Error('Failed to validate shelf code');
    const result = await response.json();
    return result.isValid;
  }

  async getShelfTypes(): Promise<{ value: string; label: string }[]> {
    return [
      { value: 'standard', label: 'Standard' },
      { value: 'refrigerated', label: 'Refrigerated' },
      { value: 'display', label: 'Display' },
      { value: 'storage', label: 'Storage' },
      { value: 'specialty', label: 'Specialty' }
    ];
  }
}

export const storageService = new StorageService();
