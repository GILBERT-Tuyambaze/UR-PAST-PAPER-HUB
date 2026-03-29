import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { loadRuntimeConfig } from './lib/config';
import { AuthProvider } from './contexts/AuthContext';
import { registerServiceWorker } from './registerServiceWorker';

// Load runtime configuration before rendering the app
async function initializeApp() {
  try {
    await loadRuntimeConfig();
  } catch (error) {
    console.warn(
      'Failed to load runtime configuration, using defaults:',
      error
    );
  }

  // Render the app
  createRoot(document.getElementById('root')!).render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );

  registerServiceWorker();
}

// Initialize the app
initializeApp();
