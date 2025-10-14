import '@testing-library/jest-dom';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock fetch
global.fetch = jest.fn();

// Mock import.meta for Jest
Object.defineProperty(global, 'import', {
  value: {
    meta: {
      env: {
        VITE_GOOGLE_CLIENT_ID: 'test-client-id',
        VITE_APP_SCRIPT_URL: 'https://script.google.com/macros/s/test/exec',
        VITE_GOOGLE_API_KEY: 'test-api-key',
        DEV: false,
        PROD: true,
        MODE: 'test'
      }
    }
  },
  writable: true,
});

// Mock environment variables for compatibility
process.env.VITE_APP_SCRIPT_URL = 'https://script.google.com/macros/s/test/exec';
process.env.VITE_GOOGLE_CLIENT_ID = 'test-client-id';
process.env.VITE_GOOGLE_API_KEY = 'test-api-key';
process.env.NODE_ENV = 'test';

// Mock Google API
Object.defineProperty(window, 'gapi', {
  value: {
    load: jest.fn(),
    client: {
      init: jest.fn(),
      setToken: jest.fn(),
      sheets: {
        spreadsheets: {
          get: jest.fn(),
          values: {
            get: jest.fn(),
            update: jest.fn(),
            append: jest.fn(),
            clear: jest.fn(),
          },
          batchUpdate: jest.fn(),
        },
      },
      drive: {
        files: {
          list: jest.fn(),
          create: jest.fn(),
        },
      },
      docs: {
        documents: {
          create: jest.fn(),
        },
      },
    },
  },
  writable: true,
});






