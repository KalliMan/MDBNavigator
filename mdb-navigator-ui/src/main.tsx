import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import AuthContextProvider from './contexts/auth/AuthContextProvider.tsx'
import ThemeContextProvider from './contexts/theme/ThemeContextProvider.tsx'
import { applyTheme, initialTheme } from './contexts/theme/theme.ts'
import Root from './Root.tsx'

// Before the first render, so the app never shows a frame in the wrong theme. (An inline script in index.html
// would be earlier still, but the Content Security Policy allows no inline scripts.)
applyTheme(initialTheme());

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeContextProvider>
      <BrowserRouter>
        <AuthContextProvider>
          <Root />
        </AuthContextProvider>
      </BrowserRouter>
    </ThemeContextProvider>
  </StrictMode>,
)
