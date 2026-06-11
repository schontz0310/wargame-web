// Global localStorage polyfill to prevent server-side errors
if (typeof window === 'undefined') {
  // Server-side - create a mock localStorage
  (globalThis as unknown as { localStorage: unknown }).localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    length: 0,
    key: () => null
  };
} else if (typeof window.localStorage === 'undefined') {
  // Client-side but localStorage not available - create mock
  (window as unknown as { localStorage: unknown }).localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    length: 0,
    key: () => null
  };
}
