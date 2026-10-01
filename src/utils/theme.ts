export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'hr_tracker_theme';

export function getInitialTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
  } catch (e) {
    console.error('Failed to read theme from localStorage', e);
  }
  return 'light'; // Default to clean light mode
}

export function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  const isDark = 
    theme === 'dark' || 
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (e) {
    console.error('Failed to save theme to localStorage', e);
  }
}
