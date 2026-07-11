import { describe, it, expect } from 'vitest';
import { PluginSystem } from './PluginSystem';
import { atom } from '../atom';

describe('PluginSystem', () => {
  describe('O(1) early-return optimization', () => {
    it('executeOnGetHooks returns value immediately when no hooks', () => {
      const ps = new PluginSystem();
      const testAtom = atom(0);
      const value = { foo: 'bar' };
      const result = ps.executeOnGetHooks(testAtom, value);
      expect(result).toBe(value); // same reference
    });

    it('executeOnSetHooks returns value immediately when no hooks', () => {
      const ps = new PluginSystem();
      const testAtom = atom(0);
      const value = { foo: 'bar' };
      const result = ps.executeOnSetHooks(testAtom, value);
      expect(result).toBe(value); // same reference
    });

    it('executeAfterSetHooks is no-op when no hooks', () => {
      const ps = new PluginSystem();
      const testAtom = atom(0);
      // Should not throw, should be a no-op
      expect(() => {
        ps.executeAfterSetHooks(testAtom, { foo: 'bar' });
      }).not.toThrow();
    });

    it('returns same reference for primitive values with no hooks', () => {
      const ps = new PluginSystem();
      const testAtom = atom(42);

      expect(ps.executeOnGetHooks(testAtom, 42)).toBe(42);
      expect(ps.executeOnSetHooks(testAtom, 'hello')).toBe('hello');
    });

    it('primitives pass through onSet when hooks return undefined', () => {
      const ps = new PluginSystem();
      const testAtom = atom(0);

      ps.applyPlugin(() => ({
        onSet: () => undefined,
      }));

      const result = ps.executeOnSetHooks(testAtom, 42);
      expect(result).toBe(42);
    });
  });

  describe('hook execution with registered hooks', () => {
    it('executeOnGetHooks calls hooks when registered', () => {
      const ps = new PluginSystem();
      const testAtom = atom(5);
      const multiplier = 2;

      ps.applyPlugin(() => ({
        onGet: (_, value) => (value as number) * multiplier,
      }));

      expect(ps.executeOnGetHooks(testAtom, 5)).toBe(10);
    });

    it('executeOnSetHooks calls hooks when registered', () => {
      const ps = new PluginSystem();
      const testAtom = atom(0);

      ps.applyPlugin(() => ({
        onSet: (_, value) => (value as number) * 2,
      }));

      expect(ps.executeOnSetHooks(testAtom, 5)).toBe(10);
    });

    it('executeAfterSetHooks calls hooks when registered', () => {
      const ps = new PluginSystem();
      const testAtom = atom(0);
      let called = false;
      let receivedValue: unknown;

      ps.applyPlugin(() => ({
        afterSet: (_atom, value) => {
          called = true;
          receivedValue = value;
        },
      }));

      ps.executeAfterSetHooks(testAtom, 10);

      expect(called).toBe(true);
      expect(receivedValue).toBe(10);
    });
  });

  describe('clear removes hooks and restores O(1) behavior', () => {
    it('after clear, executeOnGetHooks returns value immediately', () => {
      const ps = new PluginSystem();
      const testAtom = atom(0);

      ps.applyPlugin(() => ({
        onGet: (_, value) => (value as number) * 2,
      }));

      expect(ps.executeOnGetHooks(testAtom, 5)).toBe(10);

      ps.clear();

      expect(ps.executeOnGetHooks(testAtom, 5)).toBe(5);
    });

    it('after clear, executeOnSetHooks returns value immediately', () => {
      const ps = new PluginSystem();
      const testAtom = atom(0);

      ps.applyPlugin(() => ({
        onSet: (_, value) => (value as number) * 2,
      }));

      expect(ps.executeOnSetHooks(testAtom, 5)).toBe(10);

      ps.clear();

      expect(ps.executeOnSetHooks(testAtom, 5)).toBe(5);
    });

    it('after clear, executeAfterSetHooks is no-op', () => {
      const ps = new PluginSystem();
      const testAtom = atom(0);
      let called = false;

      ps.applyPlugin(() => ({
        afterSet: () => {
          called = true;
        },
      }));

      ps.clear();
      ps.executeAfterSetHooks(testAtom, 10);

      expect(called).toBe(false);
    });
  });
});
