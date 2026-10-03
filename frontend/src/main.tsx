import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { AppProviders } from './providers/AppProviders';
import '@fontsource-variable/manrope';
import '@fontsource-variable/dm-sans';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppProviders><App /></AppProviders>
    </BrowserRouter>
  </StrictMode>,
);
