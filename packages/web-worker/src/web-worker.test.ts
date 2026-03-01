// Tests for @nexus-state/web-worker
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { atom, createStore } from '@nexus-state/core';
import { atomWithWorker, workerAtom, createWorkerStore } from '../index';

// Mock Worker class
class MockWorker implements Worker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  addEventListener: any;
  removeEventListener: any;
  dispatchEvent: any;
  onmessageerror: any | null = null;
  private messages: any[] = [];

  postMessage(data: any) {
    this.messages.push(data);
  }

  simulateMessage(data: any) {
    // Trigger the onmessage handler if it's set
    // This simulates the worker sending a message
    if (this.onmessage) {
      this.onmessage({ data } as MessageEvent);
    }
  }

  // Direct method to trigger message handling without relying on onmessage
  triggerMessage(data: any) {
    if (this.onmessage) {
      this.onmessage({ data } as MessageEvent);
    }
  }

  // Directly set the atom value - used when onmessage is cleared
  setAtomValue(atom: any, value: any) {
    // Find the store that contains this atom and update it
    // This is used for testing purposes when onmessage is cleared
  }

  simulateError(error: Error) {
    if (this.onerror) {
      this.onerror({ error } as ErrorEvent);
    }
  }

  terminate() {
    // Mock terminate
  }
}

// Override Worker globally
global.Worker = MockWorker as any;

describe('workerAtom', () => {
  let store: ReturnType<typeof createStore>;
  let worker: MockWorker;

  beforeEach(() => {
    store = createStore();
    worker = new MockWorker();
  });

  it('should create a worker atom with initial value', () => {
    const workerInstance = workerAtom({
      worker,
      initialValue: 0,
    });

    expect(store.get(workerInstance)).toBe(0);
  });

  it('should create atom through atomWithWorker', () => {
    const workerInstance = atomWithWorker.worker({
      worker,
      initialValue: 42,
    });

    expect(store.get(workerInstance)).toBe(42);
  });

  it('should listen for messages from worker', () => {
    const workerInstance = workerAtom({
      worker,
      initialValue: 0,
    });

    let receivedValue: number | null = null;

    const unsubscribe = store.subscribe(workerInstance, (value) => {
      receivedValue = value;
    });

    // Simulate message from worker
    worker.simulateMessage({ type: 'UPDATE', value: 100 });

    expect(receivedValue).toBe(100);
  });

  it('should handle different message types', () => {
    const workerInstance = workerAtom({
      worker,
      initialValue: 0,
    });

    // Simulate unknown message type
    expect(() => {
      worker.simulateMessage({ type: 'UNKNOWN', value: 100 });
    }).not.toThrow();

    // Initial value should remain
    expect(store.get(workerInstance)).toBe(0);
  });

  it('should handle worker errors', () => {
    const workerInstance = workerAtom({
      worker,
      initialValue: 0,
    });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    worker.simulateError(new Error('Worker error'));

    expect(consoleSpy).toHaveBeenCalledWith('Web Worker error:', expect.any(Error));

    // Atom value should remain unchanged
    expect(store.get(workerInstance)).toBe(0);

    consoleSpy.mockRestore();
  });

  it('should allow multiple updates from worker', () => {
    const workerInstance = workerAtom({
      worker,
      initialValue: 0,
    });

    let callCount = 0;
    store.subscribe(workerInstance, () => {
      callCount++;
    });

    worker.simulateMessage({ type: 'UPDATE', value: 1 });
    expect(callCount).toBe(1);

    worker.simulateMessage({ type: 'UPDATE', value: 2 });
    expect(callCount).toBe(2);

    worker.simulateMessage({ type: 'UPDATE', value: 3 });
    expect(callCount).toBe(3);
  });

  it('should work with complex initial values', () => {
    const complexValue = {
      name: 'Test',
      count: 42,
      active: true,
      nested: { value: 'deep' },
    };

    const workerInstance = workerAtom({
      worker,
      initialValue: complexValue,
    });

    expect(store.get(workerInstance)).toEqual(complexValue);

    // Update from worker
    worker.simulateMessage({
      type: 'UPDATE',
      value: { ...complexValue, count: 100 },
    });

    expect(store.get(workerInstance)).toEqual({
      name: 'Test',
      count: 100,
      active: true,
      nested: { value: 'deep' },
    });
  });
});

describe('createWorkerStore', () => {
  it('should create a store for web worker', () => {
    const workerStore = createWorkerStore();

    const testAtom = atom(0, 'test');
    expect(workerStore.get(testAtom)).toBe(0);

    workerStore.set(testAtom, 42);
    expect(workerStore.get(testAtom)).toBe(42);
  });

  it('should work independently from main store', () => {
    const mainStore = createStore();
    const workerStore = createWorkerStore();

    const atom1 = atom(0, 'atom1');
    const atom2 = atom(0, 'atom2');

    mainStore.set(atom1, 10);
    workerStore.set(atom2, 20);

    expect(mainStore.get(atom1)).toBe(10);
    expect(workerStore.get(atom2)).toBe(20);

    expect(mainStore.get(atom2)).toBe(0);
    expect(workerStore.get(atom1)).toBe(0);
  });

  it('should support subscriptions in worker store', () => {
    const workerStore = createWorkerStore();
    const testAtom = atom(0, 'test-worker');

    let lastValue: number | null = null;
    workerStore.subscribe(testAtom, (value) => {
      lastValue = value;
    });

    workerStore.set(testAtom, 100);
    expect(lastValue).toBe(100);
  });
});

describe('integration with core', () => {
  let store: ReturnType<typeof createStore>;
  let worker: MockWorker;

  beforeEach(() => {
    store = createStore();
    worker = new MockWorker();
  });

  it('should work with computed atoms', () => {
    const workerInstance = workerAtom({
      worker,
      initialValue: 10,
    });

    const doubleAtom = atom((get: any) => get(workerInstance) * 2);

    expect(store.get(doubleAtom)).toBe(20);

    // Update from worker
    worker.simulateMessage({ type: 'UPDATE', value: 15 });
    expect(store.get(doubleAtom)).toBe(30);
  });

  it('should work with multiple worker atoms', () => {
    const worker1 = new MockWorker();
    const worker2 = new MockWorker();

    const atom1 = workerAtom({
      worker: worker1,
      initialValue: 0,
    });

    const atom2 = workerAtom({
      worker: worker2,
      initialValue: 100,
    });

    expect(store.get(atom1)).toBe(0);
    expect(store.get(atom2)).toBe(100);

    worker1.simulateMessage({ type: 'UPDATE', value: 5 });
    worker2.simulateMessage({ type: 'UPDATE', value: 200 });

    expect(store.get(atom1)).toBe(5);
    expect(store.get(atom2)).toBe(200);
  });

  it('should handle store isolation with worker atoms', () => {
    const worker = new MockWorker();
    const store1 = createStore();
    const store2 = createStore();

    const atom = workerAtom({
      worker,
      initialValue: 0,
    });

    store1.set(atom, 10);
    store2.set(atom, 20);

    expect(store1.get(atom)).toBe(10);
    expect(store2.get(atom)).toBe(20);
  });
});
