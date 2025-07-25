// Server-side polyfills
if (typeof globalThis.self === 'undefined') {
  globalThis.self = globalThis;
}