// Purchase Order Draft Service
// Handles saving and loading purchase order drafts

export interface PurchaseOrderDraft {
  id: string;
  name: string;
  cartItems: any[];
  supplier: any;
  currency: any;
  expectedDelivery: string;
  paymentTerms: string;
  notes: string;
  exchangeRates?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Alias for compatibility with existing code
export type POSDraft = PurchaseOrderDraft;

class PurchaseOrderDraftService {
  private readonly STORAGE_KEY = 'lats_purchase_order_drafts';
  private readonly MAX_DRAFTS = 20;

  // Save current purchase order as draft
  saveDraft(
    name: string,
    cartItems: any[],
    supplier: any,
    currency: any,
    expectedDelivery: string,
    paymentTerms: string,
    notes: string,
    exchangeRates?: string
  ): string {
    const drafts = this.getAllDrafts();
    const draftId = `po_draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newDraft: PurchaseOrderDraft = {
      id: draftId,
      name: name.trim(),
      cartItems: [...cartItems],
      supplier: supplier ? { ...supplier } : null,
      currency: currency ? { ...currency } : null,
      expectedDelivery,
      paymentTerms,
      notes: notes || '',
      exchangeRates: exchangeRates || '',
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
      console.error('Failed to save purchase order draft:', error);
      throw new Error('Failed to save draft');
    }
  }

  // Update existing draft
  updateDraft(
    draftId: string,
    updates: Partial<Omit<PurchaseOrderDraft, 'id' | 'createdAt' | 'updatedAt'>>
  ): boolean {
    const drafts = this.getAllDrafts();
    const draftIndex = drafts.findIndex(draft => draft.id === draftId);
    
    if (draftIndex === -1) {
      return false;
    }

    drafts[draftIndex] = {
      ...drafts[draftIndex],
      ...updates,
      updatedAt: new Date()
    };

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(drafts));
      return true;
    } catch (error) {
      console.error('Failed to update purchase order draft:', error);
      return false;
    }
  }

  // Get all drafts
  getAllDrafts(): PurchaseOrderDraft[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const drafts = JSON.parse(stored);
      // Convert date strings back to Date objects
      return drafts.map((draft: any) => ({
        ...draft,
        createdAt: new Date(draft.createdAt),
        updatedAt: new Date(draft.updatedAt)
      }));
    } catch (error) {
      console.error('Failed to load purchase order drafts:', error);
      return [];
    }
  }

  // Get draft by ID
  getDraft(draftId: string): PurchaseOrderDraft | null {
    const drafts = this.getAllDrafts();
    const draft = drafts.find(d => d.id === draftId);
    return draft || null;
  }

  // Get the latest draft (most recently created/updated)
  getLatestDraft(): PurchaseOrderDraft | null {
    const drafts = this.getAllDrafts();
    if (drafts.length === 0) {
      return null;
    }
    // Since drafts are stored with newest first, return the first one
    return drafts[0];
  }

  // Delete draft
  deleteDraft(draftId: string): boolean {
    const drafts = this.getAllDrafts();
    const filteredDrafts = drafts.filter(draft => draft.id !== draftId);
    
    if (filteredDrafts.length === drafts.length) {
      return false; // Draft not found
    }

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredDrafts));
      return true;
    } catch (error) {
      console.error('Failed to delete purchase order draft:', error);
      return false;
    }
  }

  // Clear all drafts
  clearAllDrafts(): boolean {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Failed to clear purchase order drafts:', error);
      return false;
    }
  }

  // Check if there are any drafts
  hasDrafts(): boolean {
    const drafts = this.getAllDrafts();
    return drafts.length > 0;
  }

  // POS-specific save method (for compatibility with useDraftManager)
  savePOSDraft(
    cartItems: any[],
    customer?: any,
    deliveryInfo?: any,
    notes?: string
  ): string {
    const name = `POS Draft ${new Date().toLocaleString()}`;
    return this.saveDraft(
      name,
      cartItems,
      customer, // Using customer as supplier for POS context
      { code: 'TZS', name: 'Tanzanian Shilling' }, // Default currency
      '', // No expected delivery for POS
      '', // No payment terms for POS
      notes || '',
      '' // No exchange rates for POS
    );
  }

  // Auto-save current state (for background saving)
  autoSave(
    cartItems: any[],
    supplier: any,
    currency: any,
    expectedDelivery: string,
    paymentTerms: string,
    notes: string,
    exchangeRates?: string
  ): string | null {
    // Only auto-save if there are items in cart
    if (cartItems.length === 0) {
      return null;
    }

    const autoSaveName = `Auto-save ${new Date().toLocaleString()}`;
    
    try {
      return this.saveDraft(
        autoSaveName,
        cartItems,
        supplier,
        currency,
        expectedDelivery,
        paymentTerms,
        notes,
        exchangeRates
      );
    } catch (error) {
      console.error('Auto-save failed:', error);
      return null;
    }
  }

  // Get draft summary for display
  getDraftSummary(draft: PurchaseOrderDraft) {
    const totalAmount = draft.cartItems.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const itemCount = draft.cartItems.length;
    
    return {
      id: draft.id,
      name: draft.name,
      supplier: draft.supplier?.name || 'No supplier',
      itemCount,
      totalAmount,
      currency: draft.currency?.code || 'TZS',
      createdAt: draft.createdAt,
      updatedAt: draft.updatedAt
    };
  }
}

// Export singleton instance
export const purchaseOrderDraftService = new PurchaseOrderDraftService();
export const draftService = purchaseOrderDraftService; // Alias for compatibility
export default purchaseOrderDraftService;
