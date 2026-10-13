import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeId = 'cyberpunk' | 'emerald' | 'midnight' | 'slate';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  badge: string;
  desc: string;
  accentColor: string;
  chartColors: {
    allowed: string;
    blocked: string;
    highRisk: string;
    accent: string;
  };
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    badge: '🟣',
    desc: 'Deep violet, neon cyan & fuchsia glow',
    accentColor: '#06B6D4',
    chartColors: {
      allowed: '#10B981',
      blocked: '#F43F5E',
      highRisk: '#D946EF',
      accent: '#06B6D4',
    },
  },
  emerald: {
    id: 'emerald',
    name: 'Fintech Emerald',
    badge: '🟢',
    desc: 'Obsidian black & high-contrast terminal green',
    accentColor: '#10B981',
    chartColors: {
      allowed: '#10B981',
      blocked: '#EF4444',
      highRisk: '#F59E0B',
      accent: '#34D399',
    },
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Navy',
    badge: '🔵',
    desc: 'Royal sapphire navy & electric ice blue',
    accentColor: '#3B82F6',
    chartColors: {
      allowed: '#10B981',
      blocked: '#EF4444',
      highRisk: '#F59E0B',
      accent: '#60A5FA',
    },
  },
  slate: {
    id: 'slate',
    name: 'Titanium Slate',
    badge: '🔘',
    desc: 'Graphite steel & modern dark minimalism',
    accentColor: '#38BDF8',
    chartColors: {
      allowed: '#10B981',
      blocked: '#EF4444',
      highRisk: '#F59E0B',
      accent: '#38BDF8',
    },
  },
};

interface ThemeContextType {
  theme: ThemeId;
  themeConfig: ThemeConfig;
  setTheme: (theme: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'cyberpunk',
  themeConfig: THEMES.cyberpunk,
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const saved = localStorage.getItem('agentguard_theme') as ThemeId;
    return saved && THEMES[saved] ? saved : 'cyberpunk';
  });

  const setTheme = (newTheme: ThemeId) => {
    setThemeState(newTheme);
    localStorage.setItem('agentguard_theme', newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, themeConfig: THEMES[theme], setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
