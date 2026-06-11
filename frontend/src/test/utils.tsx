import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Create a custom query client for tests to prevent caching issues between tests
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Turn off retries for faster test execution
      gcTime: 0,
    },
  },
});

interface CustomRenderOptions extends RenderOptions {
  route?: string;
  // We can add initial Zustand state options here in the future if needed
}

const customRender = (
  ui: ReactElement,
  { route = '/', ...options }: CustomRenderOptions = {}
) => {
  window.history.pushState({}, 'Test page', route);

  const queryClient = createTestQueryClient();

  const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  return render(ui, { wrapper: AllTheProviders, ...options });
};

// Re-export everything
export * from '@testing-library/react';
// Override render method
export { customRender as render };
