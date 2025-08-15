import React, { useState, useEffect } from 'react';
import SearchDropdown from './SearchDropdown';
import { Command } from 'lucide-react';

const GlobalSearchShortcut: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+K (Windows/Linux) or Cmd+K (Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setIsOpen(true);
      }

      // Close on Escape
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20">
      <div className="w-full max-w-2xl mx-4">
        <SearchDropdown 
          placeholder="Search anything..."
          className="w-full"
          onClose={() => setIsOpen(false)}
        />
        
        {/* Close button */}
        <button
          onClick={() => setIsOpen(false)}
          className="mt-4 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <Command size={16} />
          <span className="text-sm">Press Esc to close</span>
        </button>
      </div>
    </div>
  );
};

export default GlobalSearchShortcut;
