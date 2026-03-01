import type {
  DevToolsFeatureDetectionResult,
  DevToolsConnection,
} from "./types";

// Declare global types for Redux DevTools
declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__?: {
      connect: (options: {
        name?: string;
        trace?: boolean;
        latency?: number;
        maxAge?: number;
      }) => DevToolsConnection;
    };
  }
}

/**
 * Feature detection for DevTools extension
 * @returns Object containing feature detection results
 */

export function detectDevToolsFeatures(): DevToolsFeatureDetectionResult {
  try {
    // Check for SSR environment (no window object)
    if (typeof window === "undefined") {
      return {
        isAvailable: false,
        isSSR: true,
        mode: "disabled",
        error: null,
      };
    }

    // Check for DevTools extension
    const devToolsExtension = window.__REDUX_DEVTOOLS_EXTENSION__;
    const isAvailable = !!devToolsExtension;

    return {
      isAvailable,
      isSSR: false,
      mode: isAvailable ? "active" : "fallback",
      error: isAvailable
        ? null
        : new Error("Redux DevTools extension not found"),
    };
  } catch (error) {
    return {
      isAvailable: false,
      isSSR: false,
      mode: "disabled",
      error:
        error instanceof Error
          ? error
          : new Error("Unknown error during feature detection"),
    };
  }
}
