import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// Debug flag - set to false to disable all logging
const DEBUG_NAVIGATION = false;

export const useNavigationHistory = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [previousPage, setPreviousPage] = useState<string | null>(null);

  // Track navigation history
  useEffect(() => {
    const currentPath = location.pathname;
    
    if (DEBUG_NAVIGATION) {
      console.log('📍 NavigationHistory: Current path:', currentPath);
    }
    
    const savedHistory = localStorage.getItem('navigationHistory');
    let history: string[] = [];
    
    if (savedHistory) {
      try {
        history = JSON.parse(savedHistory);
        if (DEBUG_NAVIGATION) {
          console.log('📚 NavigationHistory: Loaded history:', history);
        }
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
      if (DEBUG_NAVIGATION) {
        console.log('💾 NavigationHistory: Updated history:', history);
      }
    } else if (DEBUG_NAVIGATION) {
      console.log('🔄 NavigationHistory: Same page, not adding to history');
    }
    
    // Set previous page (second to last in history)
    if (history.length > 1) {
      const newPreviousPage = history[history.length - 2];
      if (newPreviousPage !== previousPage) {
        setPreviousPage(newPreviousPage);
        if (DEBUG_NAVIGATION) {
          console.log('⬅️ NavigationHistory: Previous page set to:', newPreviousPage);
        }
      }
    }
  }, [location.pathname, previousPage]);

  const handleBackClick = useCallback(() => {
    if (previousPage) {
      if (DEBUG_NAVIGATION) {
        console.log('⬅️ NavigationHistory: Navigating back to:', previousPage);
      }
      navigate(previousPage);
    } else {
      // Fallback to dashboard if no previous page
      if (DEBUG_NAVIGATION) {
        console.log('🔄 NavigationHistory: No previous page, falling back to dashboard');
      }
      navigate('/dashboard');
    }
  }, [previousPage, navigate]);

  return {
    previousPage,
    handleBackClick,
    navigate
  };
};
