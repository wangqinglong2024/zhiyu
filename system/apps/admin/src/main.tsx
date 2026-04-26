import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, Toaster, TooltipProvider } from '@zhiyu/ui';
import { I18nextProvider, getI18n } from '@zhiyu/i18n/client';
import { loadFontsFor } from '@zhiyu/i18n/fonts';
import { getCurrentLocale } from '@zhiyu/i18n/client';
import App from './App.js';
import '@zhiyu/ui/styles/global.css';

const i18n = getI18n();
loadFontsFor(getCurrentLocale());

const el = document.getElementById('root');
if (!el) throw new Error('root element missing');
createRoot(el).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <TooltipProvider>
          <App />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </I18nextProvider>
  </React.StrictMode>,
);
