// Draft service for POS cart management
export interface POSDraft {
  id: string;
  cartItems: any[];
  customer?: any;
  deliveryInfo?: any;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

class DraftService {
  private readonly STORAGE_KEY = 'lats_pos_drafts';
  private readonly MAX_DRAFTS = 10;

  // Save current cart as draft
  saveDraft(cartItems: any[], customer?: any, deliveryInfo?: any, notes?: string): string {
    const drafts = this.getAllDrafts();
    const draftId = `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newDraft: POSDraft = {
      id: draftId,
      cartItems: [...cartItems],
      customer: customer ? { ...customer } : undefined,
      deliveryInfo: deliveryInfo ? { ...deliveryInfo } : undefined,
      notes: notes || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add new draft to the beginning
    drafts.unshift(newDraft);

    // Keep only the latest MAX_DRAFTS
    if (drafts.length > this.MAX_DRAFTS) {
      drafts.splice(this.MAX_DRAFTS);
    }

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(drafts));
      return draftId;
    } catch (error) {
      console.error('Failed to save draft:', error);
      throw new Error('Failed to save draft');
    }
  }

  // Get all drafts
  getAllDrafts(): POSDraft[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const drafts = JSON.parse(stored);
      return Array.isArray(drafts) ? drafts : [];
    } catch (error) {
      console.error('Failed to load drafts:', error);
      return [];
    }
  }

  // Get a specific draft by ID
  getDraft(draftId: string): POSDraft | null {
    const drafts = this.getAllDrafts();
    return drafts.find(draft => draft.id === draftId) || null;
  }

  // Get the most recent draft
  getLatestDraft(): POSDraft | null {
    const drafts = this.getAllDrafts();
    return drafts.length > 0 ? drafts[0] : null;
  }

  // Delete a specific draft
  deleteDraft(draftId: string): boolean {
    const drafts = this.getAllDrafts();
    const filteredDrafts = drafts.filter(draft => draft.id !== draftId);
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredDrafts));
      return true;
    } catch (error) {
      console.error('Failed to delete draft:', error);
      return false;
    }
  }

  // Clear all drafts
  clearAllDrafts(): boolean {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Failed to clear drafts:', error);
      return false;
    }
  }

  // Update an existing draft
  updateDraft(draftId: string, updates: Partial<POSDraft>): boolean {
    const drafts = this.getAllDrafts();
    const draftIndex = drafts.findIndex(draft => draft.id === draftId);
    
    if (draftIndex === -1) return false;

    drafts[draftIndex] = {
      ...drafts[draftIndex],
      ...updates,
      updatedAt: new Date()
    };

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(drafts));
      return true;
    } catch (error) {
      console.error('Failed to update draft:', error);
      return false;
    }
  }

  // Check if there are any drafts
  hasDrafts(): boolean {
    return this.getAllDrafts().length > 0;
  }

  // Get draft count
  getDraftCount(): number {
    return this.getAllDrafts().length;
  }
}

export const draftService = new DraftService();
