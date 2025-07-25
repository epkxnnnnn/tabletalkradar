// This file must be loaded before any other code that might reference browser globals
// It's loaded via NODE_OPTIONS --require to ensure it runs before any bundled code

if (typeof global !== 'undefined' && typeof window === 'undefined') {
  // We're in a Node.js environment, add browser globals
  global.self = global;
  
  // Complete location object
  const locationObj = { 
    href: 'https://localhost:3000',
    origin: 'https://localhost:3000',
    protocol: 'https:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: () => {},
    replace: () => {},
    reload: () => {},
    toString: () => 'https://localhost:3000',
  };
  
  global.location = locationObj;
  
  // Complete window object
  global.window = {
    location: locationObj,
    document: {},
    navigator: { userAgent: 'Node.js' },
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    },
    sessionStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  };
  
  // More complete document object with common methods
  global.document = {
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: () => null,
    getElementsByClassName: () => [],
    getElementsByTagName: () => [],
    createElement: () => ({}),
    body: {},
    head: {},
    documentElement: {},
    addEventListener: () => {},
    removeEventListener: () => {},
    cookie: '',
    location: locationObj,
  };
  
  // Link document to window
  global.window.document = global.document;
  
  // Ensure these are available on globalThis as well
  if (typeof globalThis !== 'undefined') {
    globalThis.self = globalThis;
    globalThis.window = global.window;
    globalThis.document = global.document;
    globalThis.location = global.location;
  }
}