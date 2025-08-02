import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'original' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Get theme from localStorage or default to 'original'
    const savedTheme = localStorage.getItem('app-theme') as Theme;
    return savedTheme || 'original';
  });

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('app-theme', newTheme);
    
    // Apply theme to document body
    if (newTheme === 'dark') {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('original-theme');
    } else {
      document.body.classList.add('original-theme');
      document.body.classList.remove('dark-theme');
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'original' ? 'dark' : 'original';
    setTheme(newTheme);
  };

  useEffect(() => {
    // Apply initial theme
    setTheme(theme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}; 