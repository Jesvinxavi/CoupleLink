import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { logger } from './lib/logger'

// Clean up stale service workers in development
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => {
      for (const registration of registrations) {
        registration.unregister()
      }
    })
    .catch((error) => {
      logger.warn('main', 'Failed to unregister service workers', error)
    })
}

const rootElement = document.getElementById('root')

if (!rootElement) {
  logger.error('main', 'Root element not found')
} else {
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  } catch (error) {
    logger.error('main', 'Failed to render application', error)
    rootElement.innerHTML = '<div>Something went wrong. Please refresh.</div>'
  }
}

