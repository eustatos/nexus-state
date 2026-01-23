// Tests for Vue adapter
import { atom, createStore } from '@nexus-state/core';
import { useAtom } from './index';
import * as vue from 'vue';

// Types for mocks
interface MockRef<T> {
  value: T;
}

// Mock vue for testing the hook
jest.mock('vue', () => ({
  ...jest.requireActual('vue'),
  ref: jest.fn(),
  watchEffect: jest.fn(),
}));

describe('useAtom', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should return a ref with the initial value of the atom', () => {
    const store = createStore();
    const testAtom = atom(42);
    
    // Mock ref to control the return value
    const refMock = jest.spyOn(vue, 'ref');
    refMock.mockImplementation((val: unknown) => ({ value: val }));
    
    const watchEffectMock = jest.spyOn(vue, 'watchEffect');
    watchEffectMock.mockImplementation((fn, options) => {
      // Call the effect function with a mock cleanup function
      const cleanup = fn(() => {});
      // Return a mock WatchHandle
      return {
        stop: () => {},
        pause: () => {},
        resume: () => {}
      } as unknown as ReturnType<typeof vue.watchEffect>;
    });
    
    const result = useAtom(testAtom, store);
    
    expect(result.value).toBe(42);
  });

  it('should update when the atom value changes', () => {
    const store = createStore();
    const testAtom = atom(0);
    
    // Mock ref to control the return value
    let refValue: { value: number } = { value: 0 };
    const refMock = jest.spyOn(vue, 'ref');
    refMock.mockImplementation((val: unknown) => {
      refValue = { value: val as number };
      return refValue;
    });
    
    const watchEffectMock = jest.spyOn(vue, 'watchEffect');
    watchEffectMock.mockImplementation((fn, options) => {
      // Call the effect function with a mock cleanup function
      const cleanup = fn(() => {});
      // Return a mock WatchHandle
      return {
        stop: () => {},
        pause: () => {},
        resume: () => {}
      } as unknown as ReturnType<typeof vue.watchEffect>;
    });
    
    const result = useAtom(testAtom, store);
    
    expect(result.value).toBe(0);
    
    // Change the atom value
    store.set(testAtom, 1);
    
    // Call watchEffect manually since we mocked it
    const onCleanup = jest.fn();
    (watchEffectMock.mock.calls[0][0] as (onCleanup: (fn: () => void) => void) => void)(onCleanup);
    
    // Check that the value was updated
    expect(result.value).toBe(1);
  });
});