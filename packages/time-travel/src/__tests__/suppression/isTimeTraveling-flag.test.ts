import { atom, createStore } from '@nexus-state/core';
import { describe, expect, it, beforeEach } from 'vitest';
import { SimpleTimeTravel } from '../../SimpleTimeTravel';

describe('TT-001: isTimeTraveling flag', () => {
  let store: ReturnType<typeof createStore>;
  let timeTravel: SimpleTimeTravel;
  let testAtom: ReturnType<typeof atom>;

  beforeEach(() => {
    store = createStore();
    testAtom = atom(0, 'test');
    timeTravel = new SimpleTimeTravel(store, { autoCapture: false });
  });

  it('should return false when not traveling', () => {
    expect(timeTravel.isTraveling()).toBe(false);
  });

  it('should reset flag after jumpTo completes', () => {
    // Capture initial state
    store.set(testAtom, 1);
    timeTravel.capture('step1');

    store.set(testAtom, 2);
    timeTravel.capture('step2');

    // Jump to previous state
    timeTravel.jumpTo(0);

    // Flag should be reset after jump completes
    expect(timeTravel.isTraveling()).toBe(false);
  });

  it('should reset flag even if jumpTo returns false for invalid index', () => {
    timeTravel.capture('initial');

    const result = timeTravel.jumpTo(-1); // Invalid index

    expect(result).toBe(false);
    expect(timeTravel.isTraveling()).toBe(false);
  });
});
