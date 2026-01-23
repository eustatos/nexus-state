// Tests for Vue adapter
import { atom, createStore } from '@nexus-state/core';
import { useAtom } from './index';
import * as vue from 'vue';

// Mock vue for testing the hook
jest.mock('vue', () => {
  const actualVue = jest.requireActual('vue');
  return {
    ...actualVue,
    ref: jest.fn((val: unknown) => ({ value: val })),
    watchEffect: jest.fn((fn: (onCleanup: (fn: () => void) => void) => void, _options?: unknown) => {
      // Call the effect function with a mock cleanup function
      fn(() => {});
      // Return a mock WatchHandle
      return {
        stop: () => {},
        pause: () => {},
        resume: () => {}
      };
    })
  };
});

describe('useAtom', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should return a ref with the initial value of the atom', () => {
    const store = createStore();
    const testAtom = atom(42);
    
    // Setup the mocks
    (vue.ref as jest.Mock).mockImplementation((val: unknown) => ({ value: val }));
    (vue.watchEffect as jest.Mock).mockImplementation((fn: (onCleanup: (fn: () => void) => void) => void, _options?: unknown) => {
      // Call the effect function with a mock cleanup function
      fn(() => {});
      // Return a mock WatchHandle
      return {
        stop: () => {},
        pause: () => {},
        resume: () => {}
      };
    });
    
    const result = useAtom(testAtom, store);
    
    expect(result.value).toBe(42);
  });

  it('should update when the atom value changes', () => {
    const store = createStore();
    const testAtom = atom(0);
    
    // Setup the mocks
    let refValue: { value: number } = { value: 0 };
    (vue.ref as jest.Mock).mockImplementation((val: unknown) => {
      refValue = { value: val as number };
      return refValue;
    });
    
    (vue.watchEffect as jest.Mock).mockImplementation((fn: (onCleanup: (fn: () => void) => void) => void, _options?: unknown) => {
      // Call the effect function with a mock cleanup function
      fn(() => {});
      // Return a mock WatchHandle
      return {
        stop: () => {},
        pause: () => {},
        resume: () => {}
      };
    });
    
    const result = useAtom(testAtom, store);
    
    expect(result.value).toBe(0);
    
    // Change the atom value
    store.set(testAtom, 1);
    
    // Call watchEffect manually since we mocked it
    const onCleanup = jest.fn();
    ((vue.watchEffect as jest.Mock).mock.calls[0][0] as (onCleanup: (fn: () => void) => void) => void)(onCleanup);
    
    // Check that the value was updated
    expect(result.value).toBe(1);
  });
});