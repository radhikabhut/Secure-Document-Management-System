import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './src/test/mocks/server';

// Start MSW server before tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Close server and cleanup after tests
afterAll(() => server.close());

// Reset handlers after each test to ensure test isolation
afterEach(() => {
  server.resetHandlers();
  cleanup(); // Clean up the DOM after each test
});
