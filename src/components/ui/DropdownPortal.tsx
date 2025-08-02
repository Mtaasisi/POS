import React, { ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface DropdownPortalProps {
  children: ReactNode;
  anchorRef: React.RefObject<HTMLElement>;
  open: boolean;
  onClose?: () => void;
  width?: number | string;
}

const DropdownPortal: React.FC<DropdownPortalProps> = ({ children, anchorRef, open, onClose, width }) => {
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const portalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      });
    }
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (
        portalRef.current &&
        !portalRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose && onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return createPortal(
    <div
      ref={portalRef}
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        zIndex: 9999,
        minWidth: width || 180,
        // background: '#fffbe6', // light yellow for debug
        background: '#fff',
        // border: '2px solid red', // red border for debug
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        boxShadow: '0 4px 24px 0 rgba(0,0,0,0.10)',
        padding: 0,
      }}
    >
      {children}
    </div>,
    document.body
  );
};

export default DropdownPortal; 