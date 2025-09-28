import React from 'react';
import ConfirmationDialog from './ui/ConfirmationDialog';
import AlertDialog from './ui/AlertDialog';
import PromptDialog from './ui/PromptDialog';
import { useDialog } from '../hooks/useDialog';

interface DialogProviderProps {
  children: React.ReactNode;
}

export const DialogProvider: React.FC<DialogProviderProps> = ({ children }) => {
  const {
    confirmationDialog,
    alertDialog,
    promptDialog,
    hideConfirmation,
    hideAlert,
    hidePrompt
  } = useDialog();

  const handleConfirmationConfirm = () => {
    if (confirmationDialog.onConfirm) {
      confirmationDialog.onConfirm();
    }
    hideConfirmation();
  };

  const handleConfirmationCancel = () => {
    if (confirmationDialog.onCancel) {
      confirmationDialog.onCancel();
    }
    hideConfirmation();
  };

  const handlePromptConfirm = (value: string) => {
    if (promptDialog.onConfirm) {
      promptDialog.onConfirm(value);
    }
    hidePrompt();
  };

  const handlePromptCancel = () => {
    if (promptDialog.onCancel) {
      promptDialog.onCancel();
    }
    hidePrompt();
  };

  return (
    <>
      {children}
      
      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        onClose={handleConfirmationCancel}
        onConfirm={handleConfirmationConfirm}
        title={confirmationDialog.title}
        message={confirmationDialog.message}
        type={confirmationDialog.type}
        confirmText={confirmationDialog.confirmText}
        cancelText={confirmationDialog.cancelText}
        loading={confirmationDialog.loading}
      />
      
      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={hideAlert}
        title={alertDialog.title}
        message={alertDialog.message}
        type={alertDialog.type}
        buttonText={alertDialog.confirmText}
      />
      
      <PromptDialog
        isOpen={promptDialog.isOpen}
        onClose={handlePromptCancel}
        onConfirm={handlePromptConfirm}
        title={promptDialog.title}
        message={promptDialog.message}
        placeholder={promptDialog.placeholder}
        defaultValue={promptDialog.defaultValue}
        confirmText={promptDialog.confirmText}
        cancelText={promptDialog.cancelText}
        loading={promptDialog.loading}
        type={promptDialog.type}
      />
    </>
  );
};
