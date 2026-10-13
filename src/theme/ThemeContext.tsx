import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { darkTheme } from './dark';
import { whiteTheme } from './white';
import { ThemeTokens, ThemeMode } from './types';
import { getProgress, setProgress as saveProgress } from '../storage/gameStorage';

interface ThemeContextType {
  mode: ThemeMode;
  theme: ThemeTokens;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  mode: 'white',
  theme: whiteTheme,
  setMode: () => {},
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>('white');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      const progress = await getProgress();
      // Ensure only 'dark' or 'white'
      if (progress.theme === 'dark') {
        setModeState('dark');
      } else {
        setModeState('white'); // default
      }
      setIsLoaded(true);
    };
    loadTheme();
  }, []);

  const setMode = async (newMode: ThemeMode) => {
    setModeState(newMode);
    const progress = await getProgress();
    progress.theme = newMode;
    await saveProgress(progress);
  };

  if (!isLoaded) return null;

  const theme = mode === 'white' ? whiteTheme : darkTheme;

  return (
    <ThemeContext.Provider value={{ mode, theme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
};
