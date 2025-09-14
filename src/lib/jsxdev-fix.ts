// Global fix for jsxDEV not a function error
// This ensures jsxDEV is always available in all environments

if (typeof window !== 'undefined') {
  // Fix for browser environment
  if (!window.jsxDEV) {
    window.jsxDEV = function() { return null; };
  }
}

// Also fix for Node.js environment if needed
if (typeof global !== 'undefined') {
  if (!global.jsxDEV) {
    global.jsxDEV = function() { return null; };
  }
}

// Export for module usage
export const jsxDEV = function() { return null; };

// Make it available globally
if (typeof window !== 'undefined') {
  (window as any).jsxDEV = jsxDEV;
} 