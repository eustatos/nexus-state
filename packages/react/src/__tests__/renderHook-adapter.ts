/**
 * Adapter for renderHook to support multiple versions of @testing-library/react
 * 
 * - React 17 + @testing-library/react@12: renderHook not available, use workaround
 * - React 18/19 + @testing-library/react@14+: renderHook available
 * 
 * For React 17, we export a wrapper that uses renderHook from the main export
 * In CI, @testing-library/react@12 is replaced with @testing-library/react-hooks
 */

// Try to get renderHook from @testing-library/react
// In React 17 CI, this will be aliased to @testing-library/react-hooks
import * as rtl from '@testing-library/react';

export const renderHook = (rtl as any).renderHook;
export const act = (rtl as any).act;
export const cleanup = (rtl as any).cleanup;
