import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import SettingsApp from './SettingsApp.jsx'
import PricingApp from './PricingApp.jsx'
import PermissionsApp from './PermissionsApp.jsx'
import { FeatureProvider } from './components/FeatureContext'
import './index.css'

// Add Google Fonts
const link = document.createElement('link');
link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
link.rel = 'stylesheet';
document.head.appendChild(link);

const rootEl = document.getElementById('wp-synapse-ai-root');
const settingsRootEl = document.getElementById('wp-synapse-ai-settings-root');

if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <FeatureProvider>
        <App />
      </FeatureProvider>
    </React.StrictMode>,
  )
}

if (settingsRootEl) {
  ReactDOM.createRoot(settingsRootEl).render(
    <React.StrictMode>
      <FeatureProvider>
        <SettingsApp />
      </FeatureProvider>
    </React.StrictMode>,
  )
}

const pricingRootEl = document.getElementById('wp-synapse-ai-pricing-root');
if (pricingRootEl) {
  ReactDOM.createRoot(pricingRootEl).render(
    <React.StrictMode>
      <FeatureProvider>
        <PricingApp />
      </FeatureProvider>
    </React.StrictMode>,
  )
}
const permissionsRootEl = document.getElementById('wp-synapse-ai-permissions-root');
if (permissionsRootEl) {
  ReactDOM.createRoot(permissionsRootEl).render(
    <React.StrictMode>
      <FeatureProvider>
        <PermissionsApp />
      </FeatureProvider>
    </React.StrictMode>,
  )
}
