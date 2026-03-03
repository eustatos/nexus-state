/**
 * Adapter for renderHook to support multiple versions of @testing-library/react
 * 
 * - React 17: @testing-library/react is aliased to @testing-library/react-hooks
 * - React 18/19: @testing-library/react has renderHook built-in
 * 
 * This adapter re-exports from @testing-library/react, which in CI for React 17
 * will be aliased to @testing-library/react-hooks via vitest.config.ts
 */

// Re-export all testing utilities from @testing-library/react
// In CI for React 17, this is aliased to @testing-library/react-hooks
export {
  renderHook,
  render,
  screen,
  act,
  cleanup,
  waitFor,
  fireEvent,
} from '@testing-library/react';
