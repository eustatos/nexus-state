import { describe, it, expect, beforeEach } from "vitest";
import { createStore, atom, atomRegistry, createEnhancedStore } from "../index";

describe("store - atom registry integration", () => {
  beforeEach(() => {
    atomRegistry.clear();
  });

  it("should register atoms with global registry", () => {
    const store = createStore();
    const testAtom = atom(42, "registry-test");

    store.get(testAtom);

    const registeredAtom = atomRegistry.get(testAtom.id);
    expect(registeredAtom).toBe(testAtom);
  });

  it("should track atoms per store in isolated mode", () => {
    const store = createEnhancedStore([], { registryMode: "isolated" });
    const testAtom = atom(0);

    store.get(testAtom);

    const atoms = atomRegistry.getAtomsForStore(store);
    expect(atoms.length).toBeGreaterThan(0);
  });

  it("should get store for atom", () => {
    const store = createStore();
    const testAtom = atom(0);

    store.get(testAtom);

    const atomStore = atomRegistry.getStoreForAtom(testAtom.id);
    expect(atomStore).toBeDefined();
  });

  it("should get name for atom", () => {
    const store = createStore();
    const testAtom = atom(0, "named-atom");

    store.get(testAtom);

    const name = atomRegistry.getName(testAtom);
    expect(name).toBe("named-atom");
  });

  it("should attach store to registry", () => {
    const store = createStore();
    expect(() => atomRegistry.attachStore(store, "global")).not.toThrow();
  });
});
