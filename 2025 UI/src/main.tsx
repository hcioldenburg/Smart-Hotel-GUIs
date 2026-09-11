import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { LogbookCacheProvider } from './hooks/logbookCacheProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LogbookCacheProvider>
      <App />
    </LogbookCacheProvider>
  </StrictMode>,
)
