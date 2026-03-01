// Tests for Vue adapter
import { atom, createStore } from '@nexus-state/core';
import { useAtom } from './index';
import * as vue from 'vue';

// Mock vue for testing the hook
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue');
  return {
    ...actual,
    ref: vi.fn((val: unknown) => ({ value: val })),
    watchEffect: vi.fn((fn: (onCleanup: (fn: () => void) => void) => void) => {
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
    vi.clearAllMocks();
  });

  it('should return a ref with the initial value of the atom', () => {
    const store = createStore();
    const testAtom = atom(42);
    
    // Setup the mocks
    (vue.ref as any).mockImplementation((val: unknown) => ({ value: val }));
    (vue.watchEffect as any).mockImplementation((fn: (onCleanup: (fn: () => void) => void) => void) => {
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
    (vue.ref as any).mockImplementation((val: unknown) => {
      refValue = { value: val as number };
      return refValue;
    });
    
    (vue.watchEffect as any).mockImplementation((fn: (onCleanup: (fn: () => void) => void) => void) => {
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
    const onCleanup = vi.fn();
    ((vue.watchEffect as any).mock.calls[0][0] as (onCleanup: (fn: () => void) => void) => void)(onCleanup);
    
    // Check that the value was updated
    expect(result.value).toBe(1);
  });
});
