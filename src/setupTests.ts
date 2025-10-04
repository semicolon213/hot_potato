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






