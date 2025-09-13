import { useEffect, useRef } from 'react';

/**
 * useDraftForm - A generic hook to persist form state to localStorage and restore it on mount.
 * @param key Unique key for the form (should be unique per form/page)
 * @param formData The form state object
 * @param setFormData Setter for the form state
 * @param clearOnSubmit If true, clears draft on submit
 * @param submitted If true, clears draft
 */
export function useDraftForm<T extends object>({
  key,
  formData,
  setFormData,
  clearOnSubmit = false,
  submitted = false,
}: {
  key: string;
  formData: T;
  setFormData: (data: T) => void;
  clearOnSubmit?: boolean;
  submitted?: boolean;
}) {
  const isFirstLoad = useRef(true);

  // Restore draft on mount
  useEffect(() => {
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(parsed);
      } catch (error) {
        console.warn('Failed to parse saved form data:', error);
      }
    }
  }, [key]);

  // Save draft on change
  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    localStorage.setItem(key, JSON.stringify(formData));
  }, [formData, key]);

  // Clear draft on submit
  useEffect(() => {
    if (clearOnSubmit && submitted) {
      localStorage.removeItem(key);
    }
  }, [clearOnSubmit, submitted, key]);

  // Optionally, provide a manual clear function
  const clearDraft = () => localStorage.removeItem(key);

  return { clearDraft };
} 