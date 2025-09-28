import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  maxHeight?: string;
  actions?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, maxWidth = 'lg', maxHeight, actions }) => {
  if (!isOpen) return null;
  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(2px)'
      }}
    >
      <div
        className="modal-content"
        style={{
          background: '#fff',
          border: '1px solid #e5e7eb',
          boxShadow: '0 12px 48px 0 rgba(0,0,0,0.18)',
          width: '100%',
          maxWidth: maxWidth === 'sm' ? 500 : 
                    maxWidth === 'md' ? 800 : 
                    maxWidth === 'lg' ? 1000 : 
                    maxWidth === 'xl' ? 1200 : 
                    maxWidth === '2xl' ? 1400 : 
                    maxWidth === '3xl' ? 1600 :
                    maxWidth === 'full' ? '95vw' : 1000,
          maxHeight: maxHeight || '90vh',
          borderRadius: 15,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          margin: '0 1rem',
          padding: 1,
          position: 'relative',
        }}
      >
        {title && <div className="font-bold text-xl mb-4 text-gray-900" style={{paddingTop: 32, paddingRight: 32, paddingBottom: 0, paddingLeft: 32}}>{title}</div>}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingTop: title ? 16 : 32,
            paddingRight: 35,
            paddingBottom: 35,
            paddingLeft: 35,
          }}
        >
          {children}
        </div>
        {actions && (
          <div
            style={{
              flexShrink: 0,
              width: '100%',
              background: '#fff',
              boxShadow: '0 -2px 8px rgba(0,0,0,0.05)',
              borderTop: '1px solid #e5e7eb',
              zIndex: 1,
              display: 'flex',
              justifyContent: 'flex-start',
              padding: 15,
            }}
          >
            {actions}
          </div>
        )}
        <button
          onClick={onClose}
          className="absolute top-3 right-5 text-2xl text-gray-500 hover:text-gray-800 bg-transparent border-none cursor-pointer"
          style={{ lineHeight: 1 }}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default Modal; 