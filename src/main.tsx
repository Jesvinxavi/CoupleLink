import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

declare global {
  interface Window {
    debugLogs: string[];
  }
}

window.debugLogs = [];

// Clean up stale service workers in development
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister()
      console.log('Unregistered stale service worker in dev mode')
    }
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
