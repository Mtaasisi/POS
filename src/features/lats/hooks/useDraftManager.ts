import { useState, useEffect, useCallback } from 'react';
import { draftService, POSDraft } from '../lib/draftService';

interface UseDraftManagerProps {
  cartItems: any[];
  customer?: any;
  deliveryInfo?: any;
  notes?: string;
}

export const useDraftManager = ({
  cartItems,
  customer,
  deliveryInfo,
  notes
}: UseDraftManagerProps) => {
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Auto-save draft when cart changes
  useEffect(() => {
    if (cartItems.length > 0) {
      const saveDraft = () => {
        try {
          const draftId = draftService.saveDraft(cartItems, customer, deliveryInfo, notes);
          setCurrentDraftId(draftId);
          setHasUnsavedChanges(false);
        } catch (error) {
          console.error('Failed to auto-save draft:', error);
        }
      };

      // Debounce the save to avoid too frequent saves
      const timeoutId = setTimeout(saveDraft, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [cartItems, customer, deliveryInfo, notes]);

  // Check for existing draft on mount
  useEffect(() => {
    const latestDraft = draftService.getLatestDraft();
    if (latestDraft && cartItems.length === 0) {
      setCurrentDraftId(latestDraft.id);
    }
  }, []);

  // Manual save draft
  const saveDraft = useCallback((customNotes?: string) => {
    if (cartItems.length === 0) return null;
    
    try {
      const draftId = draftService.saveDraft(
        cartItems, 
        customer, 
        deliveryInfo, 
        customNotes || notes
      );
      setCurrentDraftId(draftId);
      setHasUnsavedChanges(false);
      return draftId;
    } catch (error) {
      console.error('Failed to save draft:', error);
      return null;
    }
  }, [cartItems, customer, deliveryInfo, notes]);

  // Load draft
  const loadDraft = useCallback((draft: POSDraft) => {
    setCurrentDraftId(draft.id);
    setHasUnsavedChanges(false);
    return draft;
  }, []);

  // Delete current draft
  const deleteCurrentDraft = useCallback(() => {
    if (currentDraftId) {
      const success = draftService.deleteDraft(currentDraftId);
      if (success) {
        setCurrentDraftId(null);
        setHasUnsavedChanges(false);
      }
      return success;
    }
    return false;
  }, [currentDraftId]);

  // Clear all drafts
  const clearAllDrafts = useCallback(() => {
    const success = draftService.clearAllDrafts();
    if (success) {
      setCurrentDraftId(null);
      setHasUnsavedChanges(false);
    }
    return success;
  }, []);

  // Get all drafts
  const getAllDrafts = useCallback(() => {
    return draftService.getAllDrafts();
  }, []);

  // Check if there are any drafts
  const hasDrafts = useCallback(() => {
    return draftService.hasDrafts();
  }, []);

  // Mark as having unsaved changes
  const markAsChanged = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  return {
    currentDraftId,
    hasUnsavedChanges,
    saveDraft,
    loadDraft,
    deleteCurrentDraft,
    clearAllDrafts,
    getAllDrafts,
    hasDrafts,
    markAsChanged
  };
};
