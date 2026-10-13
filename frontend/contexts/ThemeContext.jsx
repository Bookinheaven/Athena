import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AuthContext } from './AuthContext';
import { getUserScopedKey } from '../services/userStateService';
import userService from '../services/userService';

export const AVAILABLE_THEMES = [
  {
    id: "system",
    name: "System Default",
    description: "Sync automatically with OS light/dark mode",
    color: "#71717a",
    accent: "#6366f1",
    isPremium: false,
  },
  {
    id: "light",
    name: "Light Mode",
    description: "Classic clean white and slate aesthetic",
    color: "#ffffff",
    accent: "#6366f1",
    isPremium: false,
  },
  {
    id: "vercel",
    name: "Vercel Monochrome",
    description: "Pure stark high-contrast developer monochrome",
    color: "#000000",
    accent: "#ffffff",
    isPremium: false,
  },
  {
    id: "dark",
    name: "Obsidian Dark",
    description: "Sleek high-contrast monochrome with violet",
    color: "#09090b",
    accent: "#8b5cf6",
    isPremium: false,
  },
  {
    id: "midnight",
    name: "Midnight Cyber",
    description: "Deep ocean blue with electric cyan neon accents",
    color: "#060913",
    accent: "#06b6d4",
    isPremium: true,
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk Neon",
    description: "Futuristic dark synthwave with magenta glow",
    color: "#080114",
    accent: "#ff007f",
    isPremium: true,
  },
  {
    id: "nord",
    name: "Nordic Frost",
    description: "Scandinavian arctic slate with frost teal accents",
    color: "#242933",
    accent: "#88c0d0",
    isPremium: true,
  },
  {
    id: "forest",
    name: "Emerald Forest",
    description: "Deep pine canopy with vibrant emerald accents",
    color: "#020d0a",
    accent: "#10b981",
    isPremium: true,
  },
  {
    id: "sunset",
    name: "Sunset Rose",
    description: "Warm dark maroon with rose gold accents",
    color: "#12070b",
    accent: "#f43f5e",
    isPremium: true,
  },
  {
    id: "solarized",
    name: "Solarized Amber",
    description: "Deep warm charcoal slate with vibrant golden accents",
    color: "#1f2833",
    accent: "#f59e0b",
    isPremium: true,
  },
  {
    id: "dracula",
    name: "Dracula Velvet",
    description: "Deep dark vampire violet with electric lavender glow",
    color: "#232135",
    accent: "#bd93f9",
    isPremium: true,
  },
  {
    id: "monokai",
    name: "Monokai Matrix",
    description: "Pitch dark forest charcoal with electric neon lime accents",
    color: "#1b221b",
    accent: "#a6e22e",
    isPremium: true,
  },
  {
    id: "amethyst",
    name: "Galactic Amethyst",
    description: "Deep cosmos ultramarine with intense violet glow",
    color: "#160f2e",
    accent: "#a855f7",
    isPremium: true,
  },
  {
    id: "coffee",
    name: "Mocha Espresso",
    description: "Warm roasted dark brown with creamy caramel highlights",
    color: "#231b15",
    accent: "#f97316",
    isPremium: true,
  },
];

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const userId = user?.id;

  const currentUserIdRef = useRef(userId);
  currentUserIdRef.current = userId;

  const [theme, setThemeState] = useState(() => {
    const saved = userId
      ? localStorage.getItem(getUserScopedKey('athena-theme', userId))
      : localStorage.getItem('athena-theme');
    return saved || user?.settings?.theme || 'dark';
  });

  const [showThemeModal, setShowThemeModal] = useState(false);

  // Sync theme when user identity or backend theme changes
  useEffect(() => {
    if (!userId) {
      const fallback = localStorage.getItem('athena-theme') || 'dark';
      setThemeState(fallback);
      return;
    }

    const backendTheme = user?.settings?.theme;
    const cachedTheme = localStorage.getItem(getUserScopedKey('athena-theme', userId));
    const targetTheme = backendTheme || cachedTheme || 'dark';

    setThemeState(targetTheme);
    localStorage.setItem(getUserScopedKey('athena-theme', userId), targetTheme);
  }, [userId, user?.settings?.theme]);

  // Apply DOM classes on theme change
  useEffect(() => {
    const activeUserId = currentUserIdRef.current;
    if (activeUserId) {
      localStorage.setItem(getUserScopedKey('athena-theme', activeUserId), theme);
    } else {
      localStorage.setItem('athena-theme', theme);
    }

    const root = document.documentElement;

    const allThemeClasses = AVAILABLE_THEMES
      .filter(t => t.id !== 'system')
      .map(t => `theme-${t.id}`);

    root.classList.remove('dark', ...allThemeClasses);

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const applySystemTheme = (e) => {
        if (e.matches) {
          root.classList.add('dark', 'theme-dark');
          root.classList.remove('theme-light');
        } else {
          root.classList.remove('dark', 'theme-dark');
          root.classList.add('theme-light');
        }
      };
      if (mediaQuery.matches) {
        root.classList.add('dark', 'theme-dark');
      } else {
        root.classList.add('theme-light');
      }
      mediaQuery.addEventListener('change', applySystemTheme);
      return () => mediaQuery.removeEventListener('change', applySystemTheme);
    } else if (theme === 'dark') {
      root.classList.add('dark', 'theme-dark');
    } else if (theme === 'light') {
      root.classList.add('theme-light');
      root.classList.remove('dark');
    } else {
      root.classList.add('dark', `theme-${theme}`);
    }
  }, [theme]);

  const setTheme = useCallback((newTheme) => {
    setThemeState(newTheme);

    const activeUserId = currentUserIdRef.current;
    if (activeUserId) {
      localStorage.setItem(getUserScopedKey('athena-theme', activeUserId), newTheme);
      userService.updateSettings({ theme: newTheme }, 'theme').catch((err) => {
        console.error('[ThemeContext] Failed to persist theme to backend:', err);
      });
    } else {
      localStorage.setItem('athena-theme', newTheme);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  }, [setTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        showThemeModal,
        setShowThemeModal,
        availableThemes: AVAILABLE_THEMES
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};