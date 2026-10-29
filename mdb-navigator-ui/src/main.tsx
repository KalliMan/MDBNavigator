import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import AuthContextProvider from './contexts/auth/AuthContextProvider.tsx'
import Root from './Root.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthContextProvider>
        <Root />
      </AuthContextProvider>
    </BrowserRouter>
  </StrictMode>,
)
