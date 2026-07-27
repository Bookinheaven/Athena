import { createContext, useContext, useState, useEffect } from 'react';

export const AVAILABLE_THEMES = [
  {
    id: "light",
    name: "Light Mode",
    description: "Classic clean white and slate aesthetic",
    color: "#ffffff",
    accent: "#6366f1",
    isPremium: false,
  },
  {
    id: "dark",
    name: "Obsidian Dark",
    description: "Sleek high-contrast monochrome with violet",
    color: "#09090b",
    accent: "#7c3aed",
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
  {
    id: "vercel",
    name: "Vercel Monochrome",
    description: "Pure stark high-contrast developer monochrome",
    color: "#000000",
    accent: "#ffffff",
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
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('athena-theme');
    return savedTheme || 'light';
  });

  const [showThemeModal, setShowThemeModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('athena-theme', theme);
    const root = document.documentElement;

    const allThemeClasses = AVAILABLE_THEMES
      .filter(t => t.id !== 'light' && t.id !== 'dark')
      .map(t => `theme-${t.id}`);

    root.classList.remove('dark', ...allThemeClasses);

    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme !== 'light') {
      root.classList.add('dark', `theme-${theme}`);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, showThemeModal, setShowThemeModal, availableThemes: AVAILABLE_THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};