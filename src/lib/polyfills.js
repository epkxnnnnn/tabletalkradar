// Global polyfills for server-side rendering
// This must run before any client-side code that uses browser globals

if (typeof globalThis !== 'undefined') {
  // Use globalThis as the universal global object
  if (typeof globalThis.self === 'undefined') {
    globalThis.self = globalThis;
  }
  
  if (typeof globalThis.window === 'undefined') {
    globalThis.window = {};
  }
  
  if (typeof globalThis.document === 'undefined') {
    globalThis.document = {};
  }
  
  if (typeof globalThis.navigator === 'undefined') {
    globalThis.navigator = { userAgent: 'node.js' };
  }
  
  if (typeof globalThis.location === 'undefined') {
    globalThis.location = { href: '' };
  }
}

// Fallback for older Node versions
if (typeof global !== 'undefined' && typeof globalThis === 'undefined') {
  global.globalThis = global;
  global.self = global;
  global.window = {};
  global.document = {};
  global.navigator = { userAgent: 'node.js' };
  global.location = { href: '' };
}