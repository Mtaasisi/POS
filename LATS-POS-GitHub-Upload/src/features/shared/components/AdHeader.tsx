import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';

interface AdHeaderProps {
  message?: string;
}

const AdHeader: React.FC<AdHeaderProps> = ({ message }) => {
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [messageIndex, setMessageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [cardWidth, setCardWidth] = useState('max-w-4xl');
  const [currentIcon, setCurrentIcon] = useState('🎯');
  const hasAnimated = useRef(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!hasAnimated.current) {
      setMounted(true);
      hasAnimated.current = true;
    } else {
      setMounted(true); // No animation after first mount
    }
  }, []);

  // Calculate card width based on message length
  const calculateCardWidth = (text: string) => {
    const length = text.length;
    // Mobile-first approach with smaller max-widths
    if (length < 30) return 'max-w-xs sm:max-w-sm';
    if (length < 50) return 'max-w-sm sm:max-w-md';
    if (length < 80) return 'max-w-md sm:max-w-lg';
    if (length < 120) return 'max-w-lg sm:max-w-xl';
    if (length < 160) return 'max-w-xl sm:max-w-2xl';
    if (length < 200) return 'max-w-2xl sm:max-w-3xl';
    if (length < 250) return 'max-w-3xl sm:max-w-4xl';
    if (length < 300) return 'max-w-4xl sm:max-w-5xl';
    return 'max-w-5xl sm:max-w-6xl';
  };

  // Get appropriate icon based on message content
  const getIconForMessage = (text: string) => {
    if (text.includes('due today')) return '⚡';
    if (text.includes('awaiting parts')) return '📦';
    if (text.includes('testing phase')) return '📱';
    if (text.includes('waiting for pickup')) return '💼';
    if (text.includes('completion rate')) return '📈';
    if (text.includes('repair time')) return '⏱️';
    if (text.includes('satisfaction')) return '🎯';
    if (text.includes('revenue')) return '💰';
    if (text.includes('overdue')) return '⚠️';
    if (text.includes('failed')) return '🔴';
    if (text.includes('awaiting technician')) return '🟡';
    if (text.includes('completed')) return '🟢';
    if (text.includes('devices in progress')) return '👨‍🔧';
    if (text.includes('customers assisted')) return '👩‍💼';
    if (text.includes('devices assigned')) return '👨‍💻';
    if (text.includes('checklists')) return '📝';
    if (text.includes('photos')) return '🔍';
    if (text.includes('SMS updates')) return '💬';
    if (text.includes('points transactions')) return '📊';
    if (text.includes('best technician')) return '🏆';
    if (text.includes('MVP')) return '⭐';
    if (text.includes('fastest repair')) return '🚀';
    if (text.includes('team goal')) return '💪';
    if (text.includes('Welcome back')) return '👋';
    if (text.includes('excellent work')) return '🌟';
    if (text.includes('service quality')) return '✨';
    return '🎯'; // Default icon
  };

  // Remove emoji from text
  const cleanMessage = (text: string) => {
    // Remove common emoji patterns
    return text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
  };

  // Generate simple welcome messages
  const getWelcomeMessages = () => {
    if (!currentUser) return [];

    const messages = [
      `Welcome back, ${currentUser.name || currentUser.email}! 🎯`,
      `Ready to manage your repair shop today? ⚡`,
      `Let's make today productive! 💪`,
      `Your repair shop management system is ready! 🛠️`,
      `Time to check on your devices and customers! 📱`,
      `Stay organized and efficient today! 📊`,
      `Your dashboard is waiting for you! 🎯`,
      `Let's keep track of everything! 📈`,
      `Ready to serve your customers! 👥`,
      `Your repair shop is in good hands! 🏆`
    ];

    return messages;
  };

  // Add backup management link to the navigation
  const navigationItems = [
    {
      name: 'Backup Management',
      href: '/backup-management',
      icon: '🔄',
      description: 'Manage data backups'
    }
  ];

  // Get current message
  useEffect(() => {
    const messages = getWelcomeMessages();
    if (messages.length > 0) {
      const currentMsg = messages[messageIndex % messages.length];
      setCurrentMessage(currentMsg);
      setCurrentIcon(getIconForMessage(currentMsg));
      setCardWidth(calculateCardWidth(currentMsg));
    }
  }, [messageIndex, currentUser]);

  // Auto-rotate messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(prev => prev + 1);
    }, 5000); // Change message every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (!visible || !mounted) return null;

  return (
    <div className="w-full bg-gradient-to-r from-blue-500/90 to-indigo-600/90 backdrop-blur-sm border-b border-white/20 shadow-lg">
      <div className={`mx-auto ${cardWidth} px-4 py-3`}>
        <div className="flex items-center justify-center space-x-3">
          <span className="text-2xl animate-bounce">{currentIcon}</span>
          <div className="flex-1 text-center">
            <p className="text-white font-medium text-sm sm:text-base">
              {cleanMessage(currentMessage)}
            </p>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="text-white/70 hover:text-white transition-colors duration-200"
          >
            <span className="text-lg">×</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdHeader; 