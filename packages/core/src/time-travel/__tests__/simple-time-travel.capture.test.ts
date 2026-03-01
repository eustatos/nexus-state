import { describe, it, expect, beforeEach } from "vitest";
import { createStore } from "../../store";
import { SimpleTimeTravel } from "../";
import { atom } from "../../atom";
import { atomRegistry } from "../../atom-registry";

describe("SimpleTimeTravel - Capture", () => {
  beforeEach(() => {
    atomRegistry.clear();
  });

  const createTimeTravelStore = (maxHistory = 10, autoCapture = true) => {
    const store = createStore([]);

    const counterAtom = atom(0, "counter");
    const textAtom = atom("hello", "text");

    store.get(counterAtom);
    store.get(textAtom);

    const timeTravel = new SimpleTimeTravel(store, {
      maxHistory,
      autoCapture,
      atoms: [counterAtom, textAtom],
    });

    return { store, timeTravel, counterAtom, textAtom };
  };

  const toSnapshotEntry = (
    value: any,
    type: "primitive" | "computed" | "writable" = "primitive",
    name?: string,
  ) => {
    // Get the atom to extract its ID for atomId field
    const allAtoms = atomRegistry.getAll();
    let atomId = "";
    for (const [id, atom] of allAtoms) {
      const atomName = atom.name || atom.id.description || String(atom.id);
      if (atomName === name) {
        atomId = id.toString();
        break;
      }
    }
    
    return {
      value,
      type,
      name,
      atomId: atomId || undefined,
    };
  };

  it("should capture snapshot with action name", () => {
    const { store, timeTravel, counterAtom } = createTimeTravelStore(10, false);

    store.set(counterAtom, 5);
    const snapshot = timeTravel.capture("set to 5");

    expect(snapshot).toBeDefined();
    expect(snapshot?.id).toBeDefined();
    expect(snapshot?.metadata.action).toBe("set to 5");
    expect(snapshot?.state.counter).toEqual(
      toSnapshotEntry(5, "primitive", "counter"),
    );
    expect(snapshot?.state.text).toEqual(
      toSnapshotEntry("hello", "primitive", "text"),
    );
  });

  it("should capture snapshot without action name", () => {
    const { store, timeTravel, counterAtom } = createTimeTravelStore(10, false);

    store.set(counterAtom, 10);
    const snapshot = timeTravel.capture();

    expect(snapshot).toBeDefined();
    expect(snapshot?.id).toBeDefined();
    expect(snapshot?.metadata.action).toBeUndefined();
    expect(snapshot?.state.counter).toEqual(
      toSnapshotEntry(10, "primitive", "counter"),
    );
  });

  it("should not capture during time travel", () => {
    const { store, timeTravel, counterAtom } = createTimeTravelStore(10, false);

    store.set(counterAtom, 5);
    timeTravel.capture("snap1");

    (timeTravel as any).isTimeTraveling = true;
    const snapshot = timeTravel.capture("should not capture");
    (timeTravel as any).isTimeTraveling = false;

    expect(snapshot).toBeUndefined();
  });

  it("should not capture if state hasn't changed", () => {
    const { store, timeTravel, counterAtom } = createTimeTravelStore(10, false);

    store.set(counterAtom, 5);
    timeTravel.capture("snap1");

    const snapshot2 = timeTravel.capture("snap2");

    expect(snapshot2).toBeDefined();
    expect(timeTravel.getHistory().length).toBe(3);
  });

  it("should enforce max history limit", () => {
    const { store, timeTravel, counterAtom } = createTimeTravelStore(2, false);

    store.set(counterAtom, 1);
    timeTravel.capture("snap1");
    store.set(counterAtom, 2);
    timeTravel.capture("snap2");
    store.set(counterAtom, 3);
    timeTravel.capture("snap3");

    const history = timeTravel.getHistory();
    expect(history.length).toBe(2);
    expect(history[0].metadata.action).toBe("snap2");
    expect(history[1].metadata.action).toBe("snap3");
  });
});
