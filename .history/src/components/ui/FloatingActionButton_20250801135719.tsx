import React, { useState, useEffect, useRef } from 'react';
import { Plus, UserPlus, Smartphone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface FloatingActionButtonProps {
  onAddCustomer: () => void;
  onAddDevice: () => void;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onAddCustomer, onAddDevice }) => {
  const { currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="fixed z-50 bottom-6 right-6 flex flex-col items-end gap-2">
      {open && (
        <div className="mb-2 flex flex-col gap-2 animate-in slide-in-from-bottom-2on-300">
          {/* Show Add Customer only for admin and customer-care */}
          {(currentUser?.role === 'admin' || currentUser?.role === 'customer-care') && (
            <button
              onClick={() => { setOpen(false); onAddCustomer(); }}
              className="flex items-center gap-3 px-6 py-4 bg-white/90 backdrop-blur-md shadow-xl rounded-xl hover:bg-blue-50 text-blue-700 font-semibold text-lg transition-all duration-300 ease-out hover:scale-105 hover:shadow-2xl hover:shadow-blue-500 border border-blue-200 hover:border-blue-300/50 transform hover:-translate-y-1 min-w-[180px]"
            >
              <UserPlus size={24} className="animate-pulse" />
              Add Customer
            </button>
          )}
          {/* Show Add Device only for admin and customer-care */}
          {(currentUser?.role === 'admin' || currentUser?.role === 'customer-care') && (
            <button
              onClick={() => { setOpen(false); onAddDevice(); }}
              className="flex items-center gap-3 px-6 py-4 bg-white/90 backdrop-blur-md shadow-xl rounded-xl hover:bg-green-50 text-green-700 font-semibold text-lg transition-all duration-300 ease-out hover:scale-105 hover:shadow-2xl hover:shadow-green-500 border border-green-200 hover:border-green-300/50 transform hover:-translate-y-1 min-w-[180px]"
            >
              <Smartphone size={24} className="animate-pulse" />
              Add Device
            </button>
          )}
        </div>
      )}
      {/* Only show the floating action button if user has permissions */}
      {(currentUser?.role === 'admin' || currentUser?.role === 'customer-care') && (
        <button
          onClick={() => setOpen(o => !o)}
          className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:via-blue-700 hover:to-indigo-700 text-white flex items-center justify-center shadow-2xl hover:shadow-3xl hover:shadow-blue-500/40 text-3xl transition-all duration-300 ease-out transform hover:scale-110 hover:rotate-12 hover:scale-95 hover:border-white/40 backdrop-blur-sm"
          aria-label="Quick Add"
        >
          <Plus 
            size={32} 
            className={`transition-transform duration-300 ${open ? 'rotate-45' : 'rotate-0'}`}
          />
        </button>
      )}
    </div>
  );
};

export default FloatingActionButton; 