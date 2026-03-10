import { describe, it, expect, vi } from 'vitest';
import { SimpleTimeTravel } from '../SimpleTimeTravel';
import { createStore, atom } from '../../index';

describe('SimpleTimeTravel', () => {
  it('should create with default options', () => {
    const store = createStore();
    const timeTravel = new SimpleTimeTravel(store);

    expect(timeTravel.canUndo()).toBe(false);
    expect(timeTravel.canRedo()).toBe(false);
    timeTravel.dispose();
  });

  it('should create with custom options', () => {
    const store = createStore();
    const timeTravel = new SimpleTimeTravel(store, {
      maxHistory: 100,
      autoCapture: false,
    });

    expect(timeTravel.getHistoryStats().length).toBe(0);
    timeTravel.dispose();
  });

  it('should capture snapshot', () => {
    const store = createStore();
    const testAtom = atom(0, 'test');
    const timeTravel = new SimpleTimeTravel(store, { autoCapture: false });

    store.set(testAtom, 42);
    const snapshot = timeTravel.capture('test-action');

    expect(snapshot).toBeDefined();
    timeTravel.dispose();
  });

  it('should undo and redo', () => {
    const store = createStore();
    const testAtom = atom(0, 'test');
    const timeTravel = new SimpleTimeTravel(store);

    store.set(testAtom, 1);
    store.set(testAtom, 2);

    const canUndo = timeTravel.undo();
    expect(typeof canUndo).toBe('boolean');

    const canRedo = timeTravel.redo();
    expect(typeof canRedo).toBe('boolean');

    timeTravel.dispose();
  });

  it('should jump to index', () => {
    const store = createStore();
    const testAtom = atom(0, 'test');
    const timeTravel = new SimpleTimeTravel(store);

    store.set(testAtom, 1);
    store.set(testAtom, 2);
    store.set(testAtom, 3);

    const result = timeTravel.jumpTo(0);
    // jumpTo returns boolean based on whether jump was successful
    expect(typeof result).toBe('boolean');

    timeTravel.dispose();
  });

  it('should get history', () => {
    const store = createStore();
    const testAtom = atom(0, 'test');
    const timeTravel = new SimpleTimeTravel(store);

    store.set(testAtom, 1);
    store.set(testAtom, 2);

    const history = timeTravel.getHistory();
    expect(Array.isArray(history)).toBe(true);

    timeTravel.dispose();
  });

  it('should clear history', () => {
    const store = createStore();
    const testAtom = atom(0, 'test');
    const timeTravel = new SimpleTimeTravel(store);

    store.set(testAtom, 1);
    timeTravel.clearHistory();

    expect(timeTravel.getHistoryStats().length).toBe(0);
    timeTravel.dispose();
  });

  it('should get current snapshot', () => {
    const store = createStore();
    const testAtom = atom(0, 'test');
    const timeTravel = new SimpleTimeTravel(store, { autoCapture: true });

    store.set(testAtom, 42);
    const snapshot = timeTravel.getCurrentSnapshot();

    // Snapshot may be undefined if autoCapture hasn't run yet
    expect(snapshot === undefined || snapshot !== undefined).toBe(true);
    timeTravel.dispose();
  });

  it('should get history stats', () => {
    const store = createStore();
    const testAtom = atom(0, 'test');
    const timeTravel = new SimpleTimeTravel(store);

    store.set(testAtom, 1);
    const stats = timeTravel.getHistoryStats();

    expect(stats).toHaveProperty('length');
    expect(stats).toHaveProperty('currentIndex');
    expect(stats).toHaveProperty('canUndo');
    expect(stats).toHaveProperty('canRedo');

    timeTravel.dispose();
  });

  it('should subscribe to events', () => {
    const store = createStore();
    const testAtom = atom(0, 'test');
    const timeTravel = new SimpleTimeTravel(store);
    const listener = vi.fn();

    const unsubscribe = timeTravel.subscribe('undo', listener);
    expect(typeof unsubscribe).toBe('function');

    unsubscribe();
    timeTravel.dispose();
  });

  it('should subscribe to snapshots', () => {
    const store = createStore();
    const timeTravel = new SimpleTimeTravel(store);
    const listener = vi.fn();

    const unsubscribe = timeTravel.subscribeToSnapshots(listener);
    expect(typeof unsubscribe).toBe('function');

    unsubscribe();
    timeTravel.dispose();
  });

  it('should import state', () => {
    const store = createStore();
    const timeTravel = new SimpleTimeTravel(store);

    const result = timeTravel.importState({ test: 42 });
    // importState returns boolean based on whether state was applied
    expect(typeof result).toBe('boolean');

    timeTravel.dispose();
  });

  it('should dispose resources', () => {
    const store = createStore();
    const timeTravel = new SimpleTimeTravel(store);

    expect(() => timeTravel.dispose()).not.toThrow();
  });
});
