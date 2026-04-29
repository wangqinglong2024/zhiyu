import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { applyInitialTheme, ToastProvider, useToast } from '@zhiyu/ui-kit';
import { router } from './app/router.tsx';
import { subscribeAdminApiError } from './lib/http.ts';
import '@zhiyu/ui-kit/tokens.css';

applyInitialTheme();

const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function GlobalErrorBridge() {
  const toast = useToast();
  useEffect(() => {
    return subscribeAdminApiError((err) => {
      // 已登录但权限不足
      if (err.status === 403) {
        toast.error('权限不足：当前账号无访问该资源的权限');
        return;
      }
      // 网络/未知错误
      if (err.status === 0) {
        toast.error('网络异常，请检查网络后重试');
        return;
      }
      // 其他业务错误（避免 401 重复，因为 401 已自动跳转）
      if (err.status === 401) return;
      const msg = err.message && err.message !== `http_${err.status}` ? err.message : `请求失败（${err.status}）`;
      toast.error(msg);
    });
  }, [toast]);
  return null;
}

const root = document.getElementById('root');
if (!root) throw new Error('#root not found');

createRoot(root).render(
  <StrictMode>
    <QueryClientProvider client={qc}>
      <ToastProvider>
        <GlobalErrorBridge />
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>
  </StrictMode>,
);
