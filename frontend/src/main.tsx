import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { RuntimeConfigProvider } from './contexts/RuntimeConfigContext';
import { registerServiceWorker } from './registerServiceWorker';

createRoot(document.getElementById('root')!).render(
  <RuntimeConfigProvider>
    <AuthProvider>
      <App />
    </AuthProvider>
  </RuntimeConfigProvider>
);

registerServiceWorker();
