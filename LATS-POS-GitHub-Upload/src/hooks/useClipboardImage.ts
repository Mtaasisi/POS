import { useState, useEffect, useCallback } from 'react';

interface UseClipboardImageReturn {
  hasClipboardImage: boolean;
  pasteFromClipboard: () => Promise<File[]>;
  isCheckingClipboard: boolean;
}

export const useClipboardImage = (): UseClipboardImageReturn => {
  const [hasClipboardImage, setHasClipboardImage] = useState(false);
  const [isCheckingClipboard, setIsCheckingClipboard] = useState(false);

  // Check clipboard for images
  const checkClipboard = useCallback(async () => {
    setIsCheckingClipboard(true);
    try {
      // Check if clipboard API is available
      if (!navigator.clipboard || !navigator.clipboard.read) {
        setHasClipboardImage(false);
        return;
      }

      // Request permission to read clipboard
      const permission = await navigator.permissions.query({ 
        name: 'clipboard-read' as PermissionName 
      });
      
      if (permission.state === 'denied') {
        setHasClipboardImage(false);
        return;
      }

      // Read clipboard contents
      const clipboardItems = await navigator.clipboard.read();
      
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/')) {
            setHasClipboardImage(true);
            return;
          }
        }
      }
      
      setHasClipboardImage(false);
    } catch (error) {
      // Clipboard API not available or permission denied - this is normal browser behavior
      // Don't log this error as it's expected when document is not focused
      setHasClipboardImage(false);
    } finally {
      setIsCheckingClipboard(false);
    }
  }, []);

  // Paste images from clipboard
  const pasteFromClipboard = useCallback(async (): Promise<File[]> => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) {
        throw new Error('Clipboard API not available');
      }

      const clipboardItems = await navigator.clipboard.read();
      const imageFiles: File[] = [];

      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/')) {
            const blob = await clipboardItem.getType(type);
            const file = new File([blob], `clipboard-image-${Date.now()}.${type.split('/')[1]}`, {
              type: type
            });
            imageFiles.push(file);
          }
        }
      }

      // Reset clipboard state after successful paste
      if (imageFiles.length > 0) {
        setHasClipboardImage(false);
      }

      return imageFiles;
    } catch (error) {
      // Clipboard errors are common and expected - don't log them
      throw error;
    }
  }, []);

  // Check clipboard periodically and on focus
  useEffect(() => {
    // Initial check
    checkClipboard();

    // Check clipboard when window gains focus (user might have copied something)
    const handleFocus = () => {
      checkClipboard();
    };

    // Check clipboard when paste event occurs (fallback detection)
    const handlePaste = (event: ClipboardEvent) => {
      const items = event.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.startsWith('image/')) {
            setHasClipboardImage(true);
            return;
          }
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('paste', handlePaste);

    // Check clipboard every 2 seconds (in case user copies from another app)
    const interval = setInterval(checkClipboard, 2000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('paste', handlePaste);
      clearInterval(interval);
    };
  }, [checkClipboard]);

  return {
    hasClipboardImage,
    pasteFromClipboard,
    isCheckingClipboard
  };
};
