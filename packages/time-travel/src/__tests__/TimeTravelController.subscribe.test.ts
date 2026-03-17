import { describe, expect, it, vi, beforeEach } from 'vitest';
import { TimeTravelController } from '../TimeTravelController';
import { atom, createStore, atomRegistry } from '../index';

describe('TimeTravelController: subscribe', () => {
  beforeEach(() => {
    // Очищаем registry перед каждым тестом для изоляции
    atomRegistry.clear();
  });

  it('should subscribe to undo events', () => {
    const store = createStore();
    const testAtom = atom(0, 'test');
    const controller = new TimeTravelController(store);

    const undoCallback = vi.fn();
    const unsubscribe = controller.subscribe('undo', undoCallback);

    // Need at least 2 snapshots to perform undo
    store.set(testAtom, 1);
    controller.capture('action1');
    store.set(testAtom, 2);
    controller.capture('action2');

    // Perform undo
    controller.undo();

    expect(undoCallback).toHaveBeenCalledTimes(1);

    unsubscribe();
    controller.undo();
    expect(undoCallback).toHaveBeenCalledTimes(1); // Should not be called after unsubscribe
  });

  it('should subscribe to redo events', () => {
    const store = createStore();
    const testAtom = atom(0, 'test');
    const controller = new TimeTravelController(store);

    const redoCallback = vi.fn();
    const unsubscribe = controller.subscribe('redo', redoCallback);

    // Need at least 2 snapshots and perform undo first
    store.set(testAtom, 1);
    controller.capture('action1');
    store.set(testAtom, 2);
    controller.capture('action2');

    // Undo first, then redo
    controller.undo();
    controller.redo();

    expect(redoCallback).toHaveBeenCalledTimes(1);

    unsubscribe();
    controller.redo();
    expect(redoCallback).toHaveBeenCalledTimes(1); // Should not be called after unsubscribe
  });

  it('should subscribe to jump events', () => {
    const store = createStore();
    const testAtom = atom(0, 'test');
    const controller = new TimeTravelController(store);

    const jumpCallback = vi.fn();
    const unsubscribe = controller.subscribe('jump', jumpCallback);

    // Need at least 2 snapshots to jump
    store.set(testAtom, 1);
    controller.capture('action1');
    store.set(testAtom, 2);
    controller.capture('action2');
    store.set(testAtom, 3);
    controller.capture('action3');

    // Jump to first snapshot
    controller.jumpTo(0);

    expect(jumpCallback).toHaveBeenCalledTimes(1);

    unsubscribe();
    controller.jumpTo(1);
    expect(jumpCallback).toHaveBeenCalledTimes(1); // Should not be called after unsubscribe
  });

  it('should subscribe to snapshot events', () => {
    const store = createStore();
    const testAtom = atom(0, 'test');
    const controller = new TimeTravelController(store);

    const snapshotCallback = vi.fn();
    const unsubscribe = controller.subscribe('snapshot', snapshotCallback);

    store.set(testAtom, 1);
    controller.capture('action1');

    expect(snapshotCallback).toHaveBeenCalledTimes(1);

    store.set(testAtom, 2);
    controller.capture('action2');

    expect(snapshotCallback).toHaveBeenCalledTimes(2);

    unsubscribe();
    controller.capture('action3');
    expect(snapshotCallback).toHaveBeenCalledTimes(2); // Should not be called after unsubscribe
  });

  it('should have multiple subscribers for the same event', () => {
    const store = createStore();
    const testAtom = atom(0, 'test');
    const controller = new TimeTravelController(store);

    const callback1 = vi.fn();
    const callback2 = vi.fn();
    const callback3 = vi.fn();

    controller.subscribe('undo', callback1);
    controller.subscribe('undo', callback2);
    controller.subscribe('undo', callback3);

    // Need at least 2 snapshots to perform undo
    store.set(testAtom, 1);
    controller.capture('action1');
    store.set(testAtom, 2);
    controller.capture('action2');

    controller.undo();

    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
    expect(callback3).toHaveBeenCalledTimes(1);
  });

  it('should unsubscribe only the specific callback', () => {
    const store = createStore();
    const testAtom = atom(0, 'test');
    const controller = new TimeTravelController(store);

    const callback1 = vi.fn();
    const callback2 = vi.fn();
    const callback3 = vi.fn();

    const unsubscribe1 = controller.subscribe('undo', callback1);
    controller.subscribe('undo', callback2);
    controller.subscribe('undo', callback3);

    unsubscribe1();

    // Need at least 2 snapshots to perform undo
    store.set(testAtom, 1);
    controller.capture('action1');
    store.set(testAtom, 2);
    controller.capture('action2');

    controller.undo();

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledTimes(1);
    expect(callback3).toHaveBeenCalledTimes(1);
  });

  it('should handle unsubscribe when no subscribers exist', () => {
    const store = createStore();
    const controller = new TimeTravelController(store);

    const unsubscribe = controller.subscribe('undo', vi.fn());
    unsubscribe();
    unsubscribe(); // Should not throw

    expect(() => unsubscribe()).not.toThrow();
  });
});

describe('TimeTravelController: subscribeToSnapshots', () => {
  it('should subscribe to snapshot creation events', () => {
    const store = createStore();
    const testAtom = atom(0, 'test');
    const controller = new TimeTravelController(store);

    const snapshotCallback = vi.fn();
    const unsubscribe = controller.subscribeToSnapshots(snapshotCallback);

    store.set(testAtom, 1);
    controller.capture('action1');

    expect(snapshotCallback).toHaveBeenCalledTimes(1);

    store.set(testAtom, 2);
    controller.capture('action2');

    expect(snapshotCallback).toHaveBeenCalledTimes(2);

    unsubscribe();
    controller.capture('action3');
    expect(snapshotCallback).toHaveBeenCalledTimes(2); // Should not be called after unsubscribe
  });

  it('should have multiple snapshot subscribers', () => {
    const store = createStore();
    const testAtom = atom(0, 'test');
    const controller = new TimeTravelController(store);

    const callback1 = vi.fn();
    const callback2 = vi.fn();
    const callback3 = vi.fn();

    controller.subscribeToSnapshots(callback1);
    controller.subscribeToSnapshots(callback2);
    controller.subscribeToSnapshots(callback3);

    store.set(testAtom, 1);
    controller.capture('action1');

    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
    expect(callback3).toHaveBeenCalledTimes(1);
  });

  it('should unsubscribe snapshot subscriber', () => {
    const store = createStore();
    const testAtom = atom(0, 'test');
    const controller = new TimeTravelController(store);

    const callback1 = vi.fn();
    const callback2 = vi.fn();
    const callback3 = vi.fn();

    const unsubscribe1 = controller.subscribeToSnapshots(callback1);
    controller.subscribeToSnapshots(callback2);
    controller.subscribeToSnapshots(callback3);

    unsubscribe1();

    store.set(testAtom, 1);
    controller.capture('action1');

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledTimes(1);
    expect(callback3).toHaveBeenCalledTimes(1);
  });

  it('should notify both snapshot subscribers and event subscribers on capture', () => {
    const store = createStore();
    const testAtom = atom(0, 'test');
    const controller = new TimeTravelController(store);

    const snapshotEventCallback = vi.fn();
    const snapshotSubscriberCallback = vi.fn();

    controller.subscribe('snapshot', snapshotEventCallback);
    controller.subscribeToSnapshots(snapshotSubscriberCallback);

    store.set(testAtom, 1);
    controller.capture('action1');

    expect(snapshotEventCallback).toHaveBeenCalledTimes(1);
    expect(snapshotSubscriberCallback).toHaveBeenCalledTimes(1);
  });
});

describe('TimeTravelController: restoreSnapshot', () => {
  it('should call restoreSnapshot on jumpTo', () => {
    const store = createStore();
    const testAtom = atom('initial', 'testAtom');
    const controller = new TimeTravelController(store);

    // Capture initial state
    controller.capture('initial');

    // Change value and capture
    store.set(testAtom, 'value1');
    controller.capture('action1');

    // jumpTo should trigger restore
    const result = controller.jumpTo(0);
    expect(result).toBe(true);
  });

  it('should call restoreSnapshot on undo', () => {
    const store = createStore();
    const testAtom = atom('start', 'testAtom');
    const controller = new TimeTravelController(store);

    // Capture initial state
    controller.capture('initial');

    // Change value and capture
    store.set(testAtom, 'changed');
    controller.capture('changed');

    // Undo should trigger restore
    const result = controller.undo();
    expect(result).toBe(true);
  });

  it('should call restoreSnapshot on redo', () => {
    const store = createStore();
    const testAtom = atom('start', 'testAtom');
    const controller = new TimeTravelController(store);

    // Capture initial state
    controller.capture('initial');

    // Change value and capture
    store.set(testAtom, 'changed');
    controller.capture('changed');

    // Undo then redo
    controller.undo();
    const result = controller.redo();
    expect(result).toBe(true);
  });

  it('should handle multiple atoms in snapshot', () => {
    const store = createStore();
    const atom1 = atom(0, 'atom1');
    const atom2 = atom('', 'atom2');
    const controller = new TimeTravelController(store);

    // Capture initial state with multiple atoms
    controller.capture('initial');

    // Change values and capture
    store.set(atom1, 1);
    store.set(atom2, 'hello');
    controller.capture('step1');

    // Jump should work with multiple atoms
    const result = controller.jumpTo(0);
    expect(result).toBe(true);
  });

  it('should trigger notifications after restoration', () => {
    const store = createStore();
    const testAtom = atom(0, 'testAtom');
    const controller = new TimeTravelController(store);

    const undoCallback = vi.fn();
    const redoCallback = vi.fn();
    const jumpCallback = vi.fn();

    controller.subscribe('undo', undoCallback);
    controller.subscribe('redo', redoCallback);
    controller.subscribe('jump', jumpCallback);

    // Setup history
    controller.capture('initial');
    store.set(testAtom, 1);
    controller.capture('step1');
    store.set(testAtom, 2);
    controller.capture('step2');

    // Test undo notification
    controller.undo();
    expect(undoCallback).toHaveBeenCalledTimes(1);

    // Test redo notification
    controller.redo();
    expect(redoCallback).toHaveBeenCalledTimes(1);

    // Test jump notification
    controller.jumpTo(0);
    expect(jumpCallback).toHaveBeenCalledTimes(1);
  });
});

describe('TimeTravelController: importState', () => {
  beforeEach(() => {
    atomRegistry.clear();
  });

  it('should import state without errors', () => {
    const store = createStore();
    const controller = new TimeTravelController(store);

    const newState = {
      someKey: 'someValue',
    };

    const result = controller.importState(newState);

    expect(result).toBe(true);
  });

  it('should handle import with non-existent atoms', () => {
    const store = createStore();
    const controller = new TimeTravelController(store);

    const newState = {
      nonExistentAtom: 'value',
    };

    const result = controller.importState(newState);

    expect(result).toBe(true); // Should not throw
  });

  it('should handle empty import', () => {
    const store = createStore();
    const controller = new TimeTravelController(store);

    const result = controller.importState({});

    expect(result).toBe(true);
  });
});

describe('TimeTravelController: restoreSnapshot integration', () => {
  beforeEach(() => {
    atomRegistry.clear();
  });

  it('should restore primitive atom value after jumpTo', () => {
    const store = createStore();
    const testAtom = atom('initial', 'testAtom');
    const controller = new TimeTravelController(store);

    // Сначала установим значение в store, затем capture
    store.set(testAtom, 'initial');
    controller.capture('initial');

    // Change value and capture
    store.set(testAtom, 'changed');
    controller.capture('changed');

    // Change value again
    store.set(testAtom, 'final');
    expect(store.get(testAtom)).toBe('final');

    // Jump to first snapshot
    controller.jumpTo(0);
    expect(store.get(testAtom)).toBe('initial');

    // Jump to second snapshot
    controller.jumpTo(1);
    expect(store.get(testAtom)).toBe('changed');
  });

  it('should restore with undo and redo', () => {
    const store = createStore();
    const testAtom = atom('start', 'testAtom');
    const controller = new TimeTravelController(store);

    store.set(testAtom, 'start');
    controller.capture('initial');

    store.set(testAtom, 'step1');
    controller.capture('step1');

    store.set(testAtom, 'step2');
    controller.capture('step2');

    // Undo to step1
    controller.undo();
    expect(store.get(testAtom)).toBe('step1');

    // Undo to initial
    controller.undo();
    expect(store.get(testAtom)).toBe('start');

    // Redo to step1
    controller.redo();
    expect(store.get(testAtom)).toBe('step1');

    // Redo to step2
    controller.redo();
    expect(store.get(testAtom)).toBe('step2');
  });

  it('should restore multiple atoms', () => {
    const store = createStore();
    const nameAtom = atom('John', 'name');
    const ageAtom = atom(25, 'age');
    const controller = new TimeTravelController(store);

    store.set(nameAtom, 'John');
    store.set(ageAtom, 25);
    controller.capture('initial');

    store.set(nameAtom, 'Jane');
    store.set(ageAtom, 30);
    controller.capture('updated');

    // Jump back
    controller.jumpTo(0);
    expect(store.get(nameAtom)).toBe('John');
    expect(store.get(ageAtom)).toBe(25);

    // Jump forward
    controller.jumpTo(1);
    expect(store.get(nameAtom)).toBe('Jane');
    expect(store.get(ageAtom)).toBe(30);
  });

  it('should restore object values', () => {
    const store = createStore();
    const configAtom = atom({ theme: 'light', lang: 'en' }, 'config');
    const controller = new TimeTravelController(store);

    store.set(configAtom, { theme: 'light', lang: 'en' });
    controller.capture('initial');

    store.set(configAtom, { theme: 'dark', lang: 'ru' });
    controller.capture('updated');

    controller.jumpTo(0);
    expect(store.get(configAtom)).toEqual({ theme: 'light', lang: 'en' });

    controller.jumpTo(1);
    expect(store.get(configAtom)).toEqual({ theme: 'dark', lang: 'ru' });
  });

  it('should restore array values', () => {
    const store = createStore();
    const itemsAtom = atom([1, 2, 3], 'items');
    const controller = new TimeTravelController(store);

    store.set(itemsAtom, [1, 2, 3]);
    controller.capture('initial');

    store.set(itemsAtom, [4, 5, 6]);
    controller.capture('updated');

    controller.jumpTo(0);
    expect(store.get(itemsAtom)).toEqual([1, 2, 3]);

    controller.jumpTo(1);
    expect(store.get(itemsAtom)).toEqual([4, 5, 6]);
  });

  it('should restore falsy values correctly', () => {
    const store = createStore();
    const boolAtom = atom(true, 'bool');
    const numAtom = atom(10, 'num');
    const strAtom = atom('initial', 'str');
    const controller = new TimeTravelController(store);

    store.set(boolAtom, true);
    store.set(numAtom, 10);
    store.set(strAtom, 'initial');
    controller.capture('initial');

    store.set(boolAtom, false);
    store.set(numAtom, 0);
    store.set(strAtom, '');
    controller.capture('falsy');

    controller.jumpTo(0);
    expect(store.get(boolAtom)).toBe(true);
    expect(store.get(numAtom)).toBe(10);
    expect(store.get(strAtom)).toBe('initial');

    controller.jumpTo(1);
    expect(store.get(boolAtom)).toBe(false);
    expect(store.get(numAtom)).toBe(0);
    expect(store.get(strAtom)).toBe('');
  });

  it('should restore null and undefined values', () => {
    const store = createStore();
    const nullAtom = atom<string | null>('not null', 'nullAtom');
    const undefAtom = atom<number | undefined>(42, 'undefAtom');
    const controller = new TimeTravelController(store);

    store.set(nullAtom, 'not null');
    store.set(undefAtom, 42);
    controller.capture('initial');

    store.set(nullAtom, null);
    store.set(undefAtom, undefined);
    controller.capture('nullish');

    controller.jumpTo(0);
    expect(store.get(nullAtom)).toBe('not null');
    expect(store.get(undefAtom)).toBe(42);

    controller.jumpTo(1);
    expect(store.get(nullAtom)).toBe(null);
    expect(store.get(undefAtom)).toBe(undefined);
  });

  it('should handle empty collections', () => {
    const store = createStore();
    const arrayAtom = atom<number[]>([1, 2, 3], 'array');
    const objectAtom = atom<{ key: string }>({ key: 'value' }, 'object');
    const controller = new TimeTravelController(store);

    store.set(arrayAtom, [1, 2, 3]);
    store.set(objectAtom, { key: 'value' });
    controller.capture('initial');

    store.set(arrayAtom, []);
    store.set(objectAtom, {});
    controller.capture('empty');

    controller.jumpTo(0);
    expect(store.get(arrayAtom)).toEqual([1, 2, 3]);
    expect(store.get(objectAtom)).toEqual({ key: 'value' });

    controller.jumpTo(1);
    expect(store.get(arrayAtom)).toEqual([]);
    expect(store.get(objectAtom)).toEqual({});
  });
});

describe('TimeTravelController: auto-initialization', () => {
  beforeEach(() => {
    atomRegistry.clear();
  });

  it('should auto-initialize atoms on first capture', () => {
    const store = createStore();
    const testAtom = atom('initial', 'testAtom');
    const controller = new TimeTravelController(store);

    // Не вызываем store.set() или store.get()
    controller.capture('init');

    const snapshot = controller.getHistory()[0];
    expect(snapshot.state.testAtom?.value).toBe('initial');
  });

  it('should auto-initialize multiple atoms', () => {
    const store = createStore();
    const atom1 = atom('value1', 'atom1');
    const atom2 = atom(42, 'atom2');
    const atom3 = atom(true, 'atom3');
    const controller = new TimeTravelController(store);

    controller.capture('init');

    const snapshot = controller.getHistory()[0];
    expect(snapshot.state.atom1?.value).toBe('value1');
    expect(snapshot.state.atom2?.value).toBe(42);
    expect(snapshot.state.atom3?.value).toBe(true);
  });

  it('should handle computed atoms gracefully', () => {
    const store = createStore();
    const baseAtom = atom(10, 'base');
    const computedAtom = atom((get) => get(baseAtom) * 2, 'computed');
    const controller = new TimeTravelController(store);

    controller.capture('init');

    const snapshot = controller.getHistory()[0];
    expect(snapshot.state.base?.value).toBe(10);
    expect(snapshot.state.computed?.value).toBe(20);
  });

  it('should continue capture even if some atoms fail to initialize', () => {
    const store = createStore();
    const goodAtom = atom('good', 'goodAtom');
    const badAtom = atom((get) => {
      throw new Error('Initialization error');
    }, 'badAtom');
    const controller = new TimeTravelController(store);

    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();

    expect(() => controller.capture('init')).not.toThrow();

    const snapshot = controller.getHistory()[0];
    expect(snapshot.state.goodAtom?.value).toBe('good');
    expect(snapshot.state.badAtom).toBeUndefined();

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to initialize atom'),
      expect.any(Error)
    );

    consoleWarnSpy.mockRestore();
  });

  it('should work with explicitly initialized atoms', () => {
    const store = createStore();
    const testAtom = atom('initial', 'testAtom');
    const controller = new TimeTravelController(store);

    // Явная инициализация (старый способ)
    store.set(testAtom, 'changed');

    controller.capture('init');

    const snapshot = controller.getHistory()[0];
    expect(snapshot.state.testAtom?.value).toBe('changed');  // Использует значение из store, не initialValue
  });

  it('should respect autoInitializeAtoms: false option', () => {
    const store = createStore();
    const testAtom = atom('initial', 'testAtom');
    const controller = new TimeTravelController(store, { autoInitializeAtoms: false });

    controller.capture('init');

    const snapshot = controller.getHistory()[0];
    // Пусто, т.к. авто-инициализация отключена
    expect(Object.keys(snapshot.state).length).toBe(0);
  });

  it('should handle nested computed atoms', () => {
    const store = createStore();
    const baseAtom = atom(2, 'base');
    const doubleAtom = atom((get) => get(baseAtom) * 2, 'double');
    const quadAtom = atom((get) => get(doubleAtom) * 2, 'quad');
    const controller = new TimeTravelController(store);

    controller.capture('init');

    const snapshot = controller.getHistory()[0];
    expect(snapshot.state.base?.value).toBe(2);
    expect(snapshot.state.double?.value).toBe(4);
    expect(snapshot.state.quad?.value).toBe(8);
  });

  it('should handle atoms with falsy values', () => {
    const store = createStore();
    const boolAtom = atom(false, 'bool');
    const numAtom = atom(0, 'num');
    const strAtom = atom('', 'str');
    const nullAtom = atom(null, 'null');
    const controller = new TimeTravelController(store);

    controller.capture('init');

    const snapshot = controller.getHistory()[0];
    expect(snapshot.state.bool?.value).toBe(false);
    expect(snapshot.state.num?.value).toBe(0);
    expect(snapshot.state.str?.value).toBe('');
    expect(snapshot.state.null?.value).toBe(null);
  });
});
