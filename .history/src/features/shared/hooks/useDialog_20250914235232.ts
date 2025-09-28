import { useState, useCallback } from 'react';

export interface DialogState {
  isOpen: boolean;
  title: string;
  message: string;
  type?: 'warning' | 'danger' | 'info' | 'success';
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export interface PromptState {
  isOpen: boolean;
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  type?: 'text' | 'textarea';
  onConfirm?: (value: string) => void;
  onCancel?: () => void;
}

export const useDialog = () => {
  const [confirmationDialog, setConfirmationDialog] = useState<DialogState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'warning'
  });

  const [alertDialog, setAlertDialog] = useState<DialogState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  const [promptDialog, setPromptDialog] = useState<PromptState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'text'
  });

  // Confirmation dialog
  const showConfirmation = useCallback((
    title: string,
    message: string,
    onConfirm: () => void,
    options?: {
      type?: 'warning' | 'danger' | 'info' | 'success';
      confirmText?: string;
      cancelText?: string;
      onCancel?: () => void;
    }
  ) => {
    setConfirmationDialog({
      isOpen: true,
      title,
      message,
      type: options?.type || 'warning',
      confirmText: options?.confirmText || 'Confirm',
      cancelText: options?.cancelText || 'Cancel',
      onConfirm,
      onCancel: options?.onCancel
    });
  }, []);

  const hideConfirmation = useCallback(() => {
    setConfirmationDialog(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Alert dialog
  const showAlert = useCallback((
    title: string,
    message: string,
    options?: {
      type?: 'warning' | 'danger' | 'info' | 'success';
      buttonText?: string;
    }
  ) => {
    setAlertDialog({
      isOpen: true,
      title,
      message,
      type: options?.type || 'info',
      confirmText: options?.buttonText || 'OK'
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertDialog(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Prompt dialog
  const showPrompt = useCallback((
    title: string,
    message: string,
    onConfirm: (value: string) => void,
    options?: {
      placeholder?: string;
      defaultValue?: string;
      confirmText?: string;
      cancelText?: string;
      type?: 'text' | 'textarea';
      onCancel?: () => void;
    }
  ) => {
    setPromptDialog({
      isOpen: true,
      title,
      message,
      placeholder: options?.placeholder || 'Enter value...',
      defaultValue: options?.defaultValue || '',
      confirmText: options?.confirmText || 'Confirm',
      cancelText: options?.cancelText || 'Cancel',
      type: options?.type || 'text',
      onConfirm,
      onCancel: options?.onCancel
    });
  }, []);

  const hidePrompt = useCallback(() => {
    setPromptDialog(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Convenience methods that match browser APIs
  const confirm = useCallback((message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      showConfirmation(
        'Confirm Action',
        message,
        () => {
          hideConfirmation();
          resolve(true);
        },
        {
          onCancel: () => {
            hideConfirmation();
            resolve(false);
          }
        }
      );
    });
  }, [showConfirmation, hideConfirmation]);

  const alert = useCallback((message: string, title = 'Alert') => {
    showAlert(title, message);
  }, [showAlert]);

  const prompt = useCallback((
    message: string, 
    defaultValue = '', 
    title = 'Input Required'
  ): Promise<string | null> => {
    return new Promise((resolve) => {
      showPrompt(
        title,
        message,
        (value) => {
          hidePrompt();
          resolve(value);
        },
        {
          defaultValue,
          onCancel: () => {
            hidePrompt();
            resolve(null);
          }
        }
      );
    });
  }, [showPrompt, hidePrompt]);

  return {
    // Dialog states
    confirmationDialog,
    alertDialog,
    promptDialog,
    
    // Show methods
    showConfirmation,
    showAlert,
    showPrompt,
    
    // Hide methods
    hideConfirmation,
    hideAlert,
    hidePrompt,
    
    // Convenience methods (browser API replacements)
    confirm,
    alert,
    prompt
  };
};
