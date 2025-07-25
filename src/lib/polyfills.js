// Server-side polyfills for Next.js SSR
if (typeof globalThis !== 'undefined') {
  // Polyfill self
  if (typeof globalThis.self === 'undefined') {
    globalThis.self = globalThis;
  }
  
  // Polyfill window for server-side
  if (typeof globalThis.window === 'undefined') {
    globalThis.window = globalThis;
  }
  
  // Add global alias
  if (typeof global !== 'undefined' && typeof global.self === 'undefined') {
    global.self = global;
  }
}