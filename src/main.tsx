import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/lexend-deca/latin-400.css';
import './styles/tokens.css';
import './styles/app.css';
import App from './App';
import { applyTheme, getData, importJSON, loadData } from './store';
import { Capacitor } from '@capacitor/core';
import { registerSW } from 'virtual:pwa-register';

// The service worker is for the web version; the Android app already ships all files inside itself.
if (!Capacitor.isNativePlatform()) registerSW({ immediate: true });
void loadData();

// Development only: lets tests load a backup without the file picker.
if (import.meta.env.DEV) (window as unknown as { __loogImport: typeof importJSON }).__loogImport = importJSON;

// Keep the browser chrome colour in step when the system theme flips under Auto.
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme(getData().settings.theme));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
