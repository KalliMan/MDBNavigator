export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'mdbnavigator.theme';

// The user's explicit choice; null means "follow the system setting".
export function getStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    // Storage blocked (private mode, a browser policy): follow the system setting.
    return null;
  }
}

export function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Not remembered for the next visit, but still applied now.
  }
}

export function systemDarkQuery(): MediaQueryList {
  return window.matchMedia('(prefers-color-scheme: dark)');
}

export function initialTheme(): Theme {
  return getStoredTheme() ?? (systemDarkQuery().matches ? 'dark' : 'light');
}

// The .dark class switches the color variables in index.css.
export function applyTheme(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}
