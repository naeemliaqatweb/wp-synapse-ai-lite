import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import SettingsApp from './SettingsApp.jsx'
import PricingApp from './PricingApp.jsx'
import './index.css'

// Add Google Fonts
const link = document.createElement('link');
link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
link.rel = 'stylesheet';
document.head.appendChild(link);

const rootEl = document.getElementById('wp-synapse-ai-lite-root');
const settingsRootEl = document.getElementById('wp-synapse-ai-lite-settings-root');

if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

if (settingsRootEl) {
  ReactDOM.createRoot(settingsRootEl).render(
    <React.StrictMode>
      <SettingsApp />
    </React.StrictMode>,
  )
}

const pricingRootEl = document.getElementById('wp-synapse-ai-lite-pricing-root');
if (pricingRootEl) {
  ReactDOM.createRoot(pricingRootEl).render(
    <React.StrictMode>
      <PricingApp />
    </React.StrictMode>,
  )
}
