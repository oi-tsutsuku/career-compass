import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { AppProvider } from './context/AppContext'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element not found. Check index.html has <div id="root"></div>')

createRoot(rootEl).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
)
