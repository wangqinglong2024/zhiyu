import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, Toaster, TooltipProvider } from '@zhiyu/ui';
import App from './App.js';
import '@zhiyu/ui/styles/global.css';

const el = document.getElementById('root');
if (!el) throw new Error('root element missing');
createRoot(el).render(
  <React.StrictMode>
    <ThemeProvider>
      <TooltipProvider>
        <App />
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
