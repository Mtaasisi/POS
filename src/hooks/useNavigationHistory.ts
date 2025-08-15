import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export const useNavigationHistory = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [previousPage, setPreviousPage] = useState<string | null>(null);

  // Track navigation history
  useEffect(() => {
    const currentPath = location.pathname;
    console.log('📍 NavigationHistory: Current path:', currentPath);
    
    const savedHistory = localStorage.getItem('navigationHistory');
    let history: string[] = [];
    
    if (savedHistory) {
      try {
        history = JSON.parse(savedHistory);
        console.log('📚 NavigationHistory: Loaded history:', history);
      } catch (error) {
        console.error('❌ NavigationHistory: Error parsing navigation history:', error);
      }
    }
    
    // Don't add the same page twice in a row
    if (history.length === 0 || history[history.length - 1] !== currentPath) {
      history.push(currentPath);
      // Keep only last 10 pages to avoid memory issues
      if (history.length > 10) {
        history = history.slice(-10);
      }
      localStorage.setItem('navigationHistory', JSON.stringify(history));
      console.log('💾 NavigationHistory: Updated history:', history);
    } else {
      console.log('🔄 NavigationHistory: Same page, not adding to history');
    }
    
    // Set previous page (second to last in history)
    if (history.length > 1) {
      setPreviousPage(history[history.length - 2]);
      console.log('⬅️ NavigationHistory: Previous page set to:', history[history.length - 2]);
    }
  }, [location.pathname]);

  const handleBackClick = () => {
    if (previousPage) {
      console.log('⬅️ NavigationHistory: Navigating back to:', previousPage);
      navigate(previousPage);
    } else {
      // Fallback to dashboard if no previous page
      console.log('🔄 NavigationHistory: No previous page, falling back to dashboard');
      navigate('/dashboard');
    }
  };

  return {
    previousPage,
    handleBackClick,
    navigate
  };
};
