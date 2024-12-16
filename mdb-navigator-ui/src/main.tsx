import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { DatabaseContextProvider } from './contexts/DatabaseContextProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DatabaseContextProvider>
      <App />
    </DatabaseContextProvider>
  </StrictMode>,
)
