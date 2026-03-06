/**
 * StoreWrapper tests
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { StoreWrapper } from '../StoreWrapper';
import { SnapshotService } from '../SnapshotService';
import type { Store, Atom } from '../../types';

describe('StoreWrapper', () => {
  let storeWrapper: StoreWrapper;
  let mockStore: Store;
  let snapshotService: SnapshotService;

  beforeEach(() => {
    mockStore = {
      get: vi.fn(),
      set: vi.fn(),
      batch: vi.fn(),
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      getAtom: vi.fn(),
      getAtoms: vi.fn(),
    } as unknown as Store;

    snapshotService = new SnapshotService(mockStore);
    storeWrapper = new StoreWrapper(mockStore, snapshotService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should create with default config', () => {
      const wrapper = new StoreWrapper(mockStore, snapshotService);
      const config = wrapper.getConfig();

      expect(config.autoCapture).toBe(false);
      expect(config.captureDebounceTime).toBe(100);
      expect(config.ignoreAtoms).toEqual([]);
    });

    it('should create with custom config', () => {
      const wrapper = new StoreWrapper(mockStore, snapshotService, {
        autoCapture: true,
        captureDebounceTime: 200,
        ignoreAtoms: ['atom1', 'atom2'],
      });

      const config = wrapper.getConfig();
      expect(config.autoCapture).toBe(true);
      expect(config.captureDebounceTime).toBe(200);
      expect(config.ignoreAtoms).toEqual(['atom1', 'atom2']);
    });
  });

  describe('configure', () => {
    it('should update configuration', () => {
      storeWrapper.configure({ autoCapture: true });

      const config = storeWrapper.getConfig();
      expect(config.autoCapture).toBe(true);
    });
  });

  describe('getIsWrapped', () => {
    it('should return false initially', () => {
      expect(storeWrapper.getIsWrapped()).toBe(false);
    });

    it('should return true after wrap', () => {
      storeWrapper.wrap();
      expect(storeWrapper.getIsWrapped()).toBe(true);
    });

    it('should return false after unwrap', () => {
      storeWrapper.wrap();
      storeWrapper.unwrap();
      expect(storeWrapper.getIsWrapped()).toBe(false);
    });
  });

  describe('wrap', () => {
    it('should wrap store.set', () => {
      const originalSet = mockStore.set;
      storeWrapper.wrap();

      expect(mockStore.set).not.toBe(originalSet);
    });

    it('should not wrap twice', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      storeWrapper.wrap();
      const firstSet = mockStore.set;
      storeWrapper.wrap();

      expect(mockStore.set).toBe(firstSet);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Already wrapped')
      );

      consoleSpy.mockRestore();
    });

    it('should call original set and schedule capture when autoCapture is enabled', () => {
      vi.useFakeTimers();

      const wrapper = new StoreWrapper(mockStore, snapshotService, {
        autoCapture: true,
        captureDebounceTime: 10,
      });

      wrapper.wrap();

      const atom = { id: Symbol('test'), name: 'testAtom' } as Atom<string>;
      mockStore.set(atom, 'value');

      expect(vi.getTimerCount()).toBe(1);
      vi.advanceTimersByTime(10);

      wrapper.unwrap();
      vi.useRealTimers();
    });
  });

  describe('unwrap', () => {
    it('should restore original store.set', () => {
      const originalSet = mockStore.set;
      storeWrapper.wrap();
      storeWrapper.unwrap();

      expect(mockStore.set).toBe(originalSet);
    });

    it('should warn if not wrapped', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      storeWrapper.unwrap();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Not wrapped')
      );

      consoleSpy.mockRestore();
    });

    it('should clear pending captures', () => {
      vi.useFakeTimers();

      const wrapper = new StoreWrapper(mockStore, snapshotService, {
        autoCapture: true,
      });

      wrapper.wrap();

      const atom = { id: Symbol('test'), name: 'testAtom' } as Atom<string>;
      mockStore.set(atom, 'value');

      wrapper.unwrap();

      expect(vi.getTimerCount()).toBe(0);

      vi.useRealTimers();
    });
  });

  describe('capture', () => {
    it('should capture snapshot manually', () => {
      const snapshotId = storeWrapper.capture('manual-action');

      expect(snapshotId).toBeDefined();
    });

    it('should capture without action', () => {
      const snapshotId = storeWrapper.capture();

      expect(snapshotId).toBeDefined();
    });

    it('should return undefined on capture failure', () => {
      const errorStore = {
        get: vi.fn(() => {
          throw new Error('Get error');
        }),
      } as unknown as Store;

      const errorService = new SnapshotService(errorStore);
      const wrapper = new StoreWrapper(errorStore, errorService);

      const snapshotId = wrapper.capture('test');

      expect(snapshotId).toBeUndefined();
    });
  });

  describe('scheduleCapture', () => {
    it('should ignore atoms in ignore list', () => {
      vi.useFakeTimers();

      const wrapper = new StoreWrapper(mockStore, snapshotService, {
        autoCapture: true,
        ignoreAtoms: ['ignoredAtom'],
      });

      wrapper.wrap();

      const atom = { id: Symbol('test'), name: 'ignoredAtom' } as Atom<string>;
      mockStore.set(atom, 'value');

      expect(vi.getTimerCount()).toBe(0);

      wrapper.unwrap();
      vi.useRealTimers();
    });

    it('should debounce multiple captures', () => {
      vi.useFakeTimers();

      const wrapper = new StoreWrapper(mockStore, snapshotService, {
        autoCapture: true,
        captureDebounceTime: 50,
      });

      wrapper.wrap();

      const atom1 = { id: Symbol('test1'), name: 'atom1' } as Atom<string>;
      const atom2 = { id: Symbol('test2'), name: 'atom2' } as Atom<string>;

      mockStore.set(atom1, 'value1');
      mockStore.set(atom2, 'value2');

      expect(vi.getTimerCount()).toBe(1);

      vi.advanceTimersByTime(50);

      wrapper.unwrap();
      vi.useRealTimers();
    });
  });

  describe('performCapture', () => {
    it('should capture pending atoms', () => {
      vi.useFakeTimers();

      const wrapper = new StoreWrapper(mockStore, snapshotService, {
        autoCapture: true,
        captureDebounceTime: 10,
      });

      wrapper.wrap();

      const atom = { id: Symbol('test'), name: 'testAtom' } as Atom<string>;
      mockStore.set(atom, 'value');

      vi.advanceTimersByTime(10);

      wrapper.unwrap();
      vi.useRealTimers();
    });

    it('should handle capture errors', () => {
      vi.useFakeTimers();

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const errorStore = {
        get: vi.fn(() => {
          throw new Error('Get error');
        }),
        set: vi.fn(),
      } as unknown as Store;

      const errorService = new SnapshotService(errorStore);
      const wrapper = new StoreWrapper(errorStore, errorService, {
        autoCapture: true,
        captureDebounceTime: 10,
      });

      wrapper.wrap();

      const atom = { id: Symbol('test'), name: 'testAtom' } as Atom<string>;
      errorStore.set(atom, 'value');

      vi.advanceTimersByTime(10);

      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
      wrapper.unwrap();
      vi.useRealTimers();
    });
  });

  describe('dispose', () => {
    it('should unwrap on dispose', () => {
      storeWrapper.wrap();
      storeWrapper.dispose();

      expect(storeWrapper.getIsWrapped()).toBe(false);
    });

    it('should handle dispose when not wrapped', () => {
      expect(() => storeWrapper.dispose()).not.toThrow();
    });
  });

  describe('integration', () => {
    it('should work with auto-capture enabled', () => {
      vi.useFakeTimers();

      const wrapper = new StoreWrapper(mockStore, snapshotService, {
        autoCapture: true,
        captureDebounceTime: 10,
      });

      wrapper.wrap();

      const atom = { id: Symbol('test'), name: 'testAtom' } as Atom<string>;
      mockStore.set(atom, 'value');

      vi.advanceTimersByTime(10);

      expect(wrapper.getIsWrapped()).toBe(true);

      wrapper.unwrap();
      vi.useRealTimers();
    });

    it('should handle multiple wrap/unwrap cycles', () => {
      storeWrapper.wrap();
      storeWrapper.unwrap();
      storeWrapper.wrap();
      storeWrapper.unwrap();

      expect(storeWrapper.getIsWrapped()).toBe(false);
    });
  });
});
