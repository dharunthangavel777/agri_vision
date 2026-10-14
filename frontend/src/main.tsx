import { createRoot } from 'react-dom/client';
import './core/i18n/index.ts';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <App />
);
