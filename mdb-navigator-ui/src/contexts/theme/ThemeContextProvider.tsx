import { useCallback, useEffect, useMemo, useState } from "react";
import { applyTheme, getStoredTheme, initialTheme, storeTheme, systemDarkQuery, Theme } from "./theme";
import { ThemeContext } from "./useTheme";

// Light or dark theme. It is the user's choice from the top bar (kept in localStorage), otherwise the system setting.
export default function ThemeContextProvider({ children }: React.PropsWithChildren) {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  // Until the user picks a theme, follow the system setting as it changes (for example a dark mode at night).
  useEffect(() => {
    const query = systemDarkQuery();
    function handleChange() {
      if (!getStoredTheme()) {
        setTheme(query.matches ? 'dark' : 'light');
      }
    }
    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    storeTheme(next);
    setTheme(next);
  }, [theme]);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
