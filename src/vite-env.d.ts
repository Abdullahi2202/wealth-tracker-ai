
/// <reference types="vite/client" />

// Make Capacitor optionally available on window for TypeScript global scope
interface CapacitorGlobal {
  isNativePlatform: () => boolean;
}

declare interface Window {
  Capacitor?: CapacitorGlobal;
}
