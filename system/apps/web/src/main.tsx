import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, Toaster, TooltipProvider } from '@zhiyu/ui';
import { I18nextProvider, getI18n } from '@zhiyu/i18n/client';
import { loadFontsFor } from '@zhiyu/i18n/fonts';
import { getCurrentLocale } from '@zhiyu/i18n/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { RouterProvider } from '@tanstack/react-router';
import { queryClient, queryPersister } from './query-client.js';
import { router } from './router.js';
import './telemetry.js';
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
          <QueryClientProvider client={queryClient}>
            <PersistQueryClientProvider
              client={queryClient}
              persistOptions={{ persister: queryPersister, maxAge: 24 * 60 * 60 * 1000 }}
            >
              <RouterProvider router={router} />
              <Toaster />
            </PersistQueryClientProvider>
          </QueryClientProvider>
        </TooltipProvider>
      </ThemeProvider>
    </I18nextProvider>
  </React.StrictMode>,
);
