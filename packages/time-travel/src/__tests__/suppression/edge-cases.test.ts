import { atom, createStore } from '@nexus-state/core';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import { SimpleTimeTravel } from '../../SimpleTimeTravel';

describe('Time Travel Suppression Edge Cases', () => {
  let store: ReturnType<typeof createStore>;
  let timeTravel: SimpleTimeTravel;
  let atomCounter = 0;

  beforeEach(() => {
    store = createStore();
    atomCounter = 0;
  });

  const createTestAtom = <T>(initialValue: T, name: string) => {
    return atom(initialValue, `${name}-${atomCounter++}`);
  };

  it('should handle error during restore and reset flag', () => {
    const testAtom = createTestAtom(0, 'test');

    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });
    timeTravel.capture('initial');

    // Try to jump to invalid index
    expect(() => {
      timeTravel.jumpTo(999);
    }).not.toThrow(); // Should handle gracefully

    // Flag should still be reset
    expect(timeTravel.isTraveling()).toBe(false);
  });

  it('should handle atoms not found in registry', () => {
    const testAtom = createTestAtom(0, 'test');

    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });
    timeTravel.capture('initial');

    store.set(testAtom, 10);
    timeTravel.capture('step1');

    // Manually modify snapshot to include non-existent atom
    const snapshots = timeTravel.getHistory();
    const snapshot = snapshots[0] as any;
    if (snapshot && typeof snapshot === 'object') {
      snapshot.state['non-existent-atom'] = {
        value: 42,
        type: 'primitive',
        name: 'non-existent-atom',
      };
    }

    // Should handle gracefully
    expect(() => {
      timeTravel.jumpTo(0);
    }).not.toThrow();
  });

  it('should handle circular dependency in computed atoms', () => {
    // This test ensures no infinite loops during restore
    const atom1 = createTestAtom(0, 'atom1');
    const atom2 = atom((get) => get(atom1) + 1, `atom2-${atomCounter++}`);

    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });
    timeTravel.capture('initial');

    store.set(atom1, 10);
    timeTravel.capture('step1');

    expect(() => {
      timeTravel.undo();
      timeTravel.redo();
    }).not.toThrow();
  });

  it('should handle very large state snapshots', () => {
    // Create atoms with initial values
    const atoms = Array.from({ length: 100 }, (_, i) =>
      atom(i, `large-atom-${i}`),
    );

    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });
    
    // Register atoms in store by getting them
    atoms.forEach(a => store.get(a));
    
    timeTravel.capture('initial');

    // Update all atoms to new values (i * 2)
    atoms.forEach((a, i) => {
      store.set(a, i * 2);
    });
    timeTravel.capture('updated');

    // Undo should complete in reasonable time
    const start = Date.now();
    timeTravel.undo();
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(1000); // Should complete in < 1s
    // After undo, atoms should be restored to initial values
    expect(store.get(atoms[0])).toBe(0);
    expect(store.get(atoms[50])).toBe(50); // Initial value was 50
  });

  it('should handle nested undo operations', () => {
    const testAtom = createTestAtom(0, 'test');

    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });
    
    // Access atom to trigger lazy registration
    store.get(testAtom);

    timeTravel.capture('s0');
    store.set(testAtom, 1);
    timeTravel.capture('s1');
    store.set(testAtom, 2);
    timeTravel.capture('s2');

    // First undo
    timeTravel.undo();
    expect(store.get(testAtom)).toBe(1);

    // Second undo
    timeTravel.undo();
    expect(store.get(testAtom)).toBe(0);

    // Redo back
    timeTravel.redo();
    expect(store.get(testAtom)).toBe(1);

    // Flag should be reset after all operations
    expect(timeTravel.isTraveling()).toBe(false);
  });

  it('should handle undo when history is empty', () => {
    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

    // Try to undo without any history
    const result = timeTravel.undo();
    expect(result).toBe(false);
    expect(timeTravel.isTraveling()).toBe(false);
  });

  it('should handle redo at the end of history', () => {
    const testAtom = createTestAtom(0, 'test');

    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

    timeTravel.capture('initial');
    store.set(testAtom, 10);
    timeTravel.capture('step1');

    // Undo then redo
    timeTravel.undo();
    timeTravel.redo();

    // Try to redo again (already at latest)
    const result = timeTravel.redo();
    expect(result).toBe(false);
    expect(timeTravel.isTraveling()).toBe(false);
  });

  it('should handle rapid consecutive captures', () => {
    const testAtom = createTestAtom(0, 'test');
    const subscriber = vi.fn();

    store.subscribe(testAtom, subscriber);
    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

    // Rapid captures without state changes
    timeTravel.capture('s0');
    timeTravel.capture('s1');
    timeTravel.capture('s2');

    // Change and capture
    store.set(testAtom, 10);
    timeTravel.capture('s3');

    // Undo should work correctly
    timeTravel.undo();
    expect(store.get(testAtom)).toBe(0);
    expect(timeTravel.isTraveling()).toBe(false);
  });

  it('should handle atom with complex nested object', () => {
    const complexAtom = createTestAtom(
      {
        user: { name: 'John', address: { city: 'NYC', zip: '10001' } },
        items: [1, 2, 3],
        meta: { version: 1, tags: ['a', 'b'] },
      },
      'complex',
    );

    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });
    
    // Access atom to trigger lazy registration
    store.get(complexAtom);

    timeTravel.capture('initial');

    store.set(complexAtom, {
      user: { name: 'Jane', address: { city: 'LA', zip: '90001' } },
      items: [4, 5, 6],
      meta: { version: 2, tags: ['c', 'd'] },
    });
    timeTravel.capture('updated');

    timeTravel.undo();

    const restored = store.get(complexAtom);
    expect(restored.user.name).toBe('John');
    expect(restored.user.address.city).toBe('NYC');
    expect(restored.items).toEqual([1, 2, 3]);
    expect(restored.meta.version).toBe(1);
  });

  it('should handle multiple atoms with different types', () => {
    const stringAtom = createTestAtom('hello', 'string');
    const numberAtom = createTestAtom(42, 'number');
    const booleanAtom = createTestAtom(true, 'boolean');
    const nullAtom = createTestAtom(null, 'null');
    const undefinedAtom = createTestAtom(undefined, 'undefined');
    const arrayAtom = createTestAtom([1, 2, 3], 'array');
    const objectAtom = createTestAtom({ a: 1 }, 'object');

    const subs = [
      vi.fn(),
      vi.fn(),
      vi.fn(),
      vi.fn(),
      vi.fn(),
      vi.fn(),
      vi.fn(),
    ];

    store.subscribe(stringAtom, subs[0]);
    store.subscribe(numberAtom, subs[1]);
    store.subscribe(booleanAtom, subs[2]);
    store.subscribe(nullAtom, subs[3]);
    store.subscribe(undefinedAtom, subs[4]);
    store.subscribe(arrayAtom, subs[5]);
    store.subscribe(objectAtom, subs[6]);

    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

    timeTravel.capture('initial');

    store.set(stringAtom, 'world');
    store.set(numberAtom, 100);
    store.set(booleanAtom, false);
    store.set(nullAtom, 'not-null');
    store.set(undefinedAtom, 'defined');
    store.set(arrayAtom, [4, 5, 6]);
    store.set(objectAtom, { b: 2 });

    timeTravel.capture('updated');

    // All subscribers should have been called once
    subs.forEach((sub) => expect(sub).toHaveBeenCalledTimes(1));

    // Undo
    timeTravel.undo();

    // No new notifications
    subs.forEach((sub) => expect(sub).toHaveBeenCalledTimes(1));

    // Values restored
    expect(store.get(stringAtom)).toBe('hello');
    expect(store.get(numberAtom)).toBe(42);
    expect(store.get(booleanAtom)).toBe(true);
    expect(store.get(nullAtom)).toBe(null);
    expect(store.get(undefinedAtom)).toBe(undefined);
    expect(store.get(arrayAtom)).toEqual([1, 2, 3]);
    expect(store.get(objectAtom)).toEqual({ a: 1 });
  });

  it('should handle jumpTo with negative index', () => {
    const testAtom = createTestAtom(0, 'test');

    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });
    timeTravel.capture('s0');
    store.set(testAtom, 1);
    timeTravel.capture('s1');

    // Negative index should be handled gracefully
    const result = timeTravel.jumpTo(-1);
    expect(result).toBe(false);
    expect(timeTravel.isTraveling()).toBe(false);
  });

  it('should handle clearHistory during time travel', () => {
    const testAtom = createTestAtom(0, 'test');

    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });
    timeTravel.capture('s0');
    store.set(testAtom, 1);
    timeTravel.capture('s1');

    timeTravel.undo();

    // Clear history
    timeTravel.clearHistory();

    // Should not be able to redo after clear
    expect(timeTravel.canRedo()).toBe(false);
    expect(timeTravel.isTraveling()).toBe(false);
  });

  it('should handle state with Map and Set', () => {
    const mapAtom = createTestAtom(new Map([['key1', 'value1']]), 'map');
    const setAtom = createTestAtom(new Set([1, 2, 3]), 'set');

    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });
    
    // Access atoms to trigger lazy registration
    store.get(mapAtom);
    store.get(setAtom);

    timeTravel.capture('initial');

    store.set(
      mapAtom,
      new Map([
        ['key1', 'value1'],
        ['key2', 'value2'],
      ]),
    );
    store.set(setAtom, new Set([1, 2, 3, 4, 5]));

    timeTravel.capture('updated');

    timeTravel.undo();

    const restoredMap = store.get(mapAtom);
    const restoredSet = store.get(setAtom);

    expect(restoredMap.size).toBe(1);
    expect(restoredMap.get('key1')).toBe('value1');
    expect(restoredSet.size).toBe(3);
    expect(restoredSet.has(1)).toBe(true);
  });

  it('should handle error recovery with multiple atoms', () => {
    const atom1 = createTestAtom(0, 'atom1');
    const atom2 = createTestAtom(0, 'atom2');
    const atom3 = createTestAtom(0, 'atom3');

    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });
    
    // Access atoms to trigger lazy registration
    store.get(atom1);
    store.get(atom2);
    store.get(atom3);

    timeTravel.capture('initial');

    store.set(atom1, 10);
    store.set(atom2, 20);
    store.set(atom3, 30);

    timeTravel.capture('step1');

    // Multiple undos
    timeTravel.undo();
    expect(store.get(atom1)).toBe(0);
    expect(store.get(atom2)).toBe(0);
    expect(store.get(atom3)).toBe(0);

    // Redo
    timeTravel.redo();
    expect(store.get(atom1)).toBe(10);
    expect(store.get(atom2)).toBe(20);
    expect(store.get(atom3)).toBe(30);

    // Flag should be reset
    expect(timeTravel.isTraveling()).toBe(false);
  });
});
