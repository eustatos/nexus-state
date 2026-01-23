// Tests for Vue adapter
import { atom, createStore } from '@nexus-state/core';
import { useAtom } from './index';
import * as vue from 'vue';

// Types for mocks
interface MockRef<T> {
  value: T;
}

interface WatchHandle {
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

type OnCleanup = (cleanupFn: () => void) => void;
type WatchEffect = (onCleanup: OnCleanup) => void;

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
    const refMock = jest.spyOn(vue, 'ref') as jest.MockedFunction<
      <T>(value: T) => MockRef<T>
    >;
    refMock.mockImplementation(<T>(val: T): MockRef<T> => ({ value: val }));
    
    const watchEffectMock = jest.spyOn(vue, 'watchEffect') as jest.MockedFunction<
      (effect: WatchEffect) => WatchHandle
    >;
    watchEffectMock.mockImplementation((fn): WatchHandle => {
      fn(jest.fn()); // onCleanup function
      return {
        pause: jest.fn(),
        resume: jest.fn(),
        stop: jest.fn()
      };
    });
    
    const result = useAtom(testAtom, store);
    
    expect(result.value).toBe(42);
  });

  it('should update when the atom value changes', () => {
    const store = createStore();
    const testAtom = atom(0);
    
    // Mock ref to control the return value
    let refValue: { value: number } = { value: 0 };
    const refMock = jest.spyOn(vue, 'ref') as jest.MockedFunction<
      <T>(value: T) => MockRef<T>
    >;
    refMock.mockImplementation(<T>(val: T): MockRef<T> => {
      refValue = { value: val as unknown as number };
      return refValue as unknown as MockRef<T>;
    });
    
    const watchEffectMock = jest.spyOn(vue, 'watchEffect') as jest.MockedFunction<
      (effect: WatchEffect) => WatchHandle
    >;
    watchEffectMock.mockImplementation((fn): WatchHandle => {
      fn(jest.fn()); // onCleanup function
      return {
        pause: jest.fn(),
        resume: jest.fn(),
        stop: jest.fn()
      };
    });
    
    const result = useAtom(testAtom, store);
    
    expect(result.value).toBe(0);
    
    // Change the atom value
    store.set(testAtom, 1);
    
    // Call watchEffect manually since we mocked it
    const onCleanup = jest.fn();
    (watchEffectMock.mock.calls[0][0] as WatchEffect)(onCleanup);
    
    // Check that the value was updated
    expect(result.value).toBe(1);
  });
});