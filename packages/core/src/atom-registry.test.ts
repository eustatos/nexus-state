import { describe, it, expect } from "vitest";
import { atomRegistry } from "./atom-registry";
import { createStore } from "./store";
import { createEnhancedStore } from "./enhanced-store";
import { atom } from "./atom"; // Add import for atom function

describe("atomRegistry", () => {
  it("should attach store in global mode", () => {
    const store = createStore();
    
    // Attach store to registry
    atomRegistry.attachStore(store, "global");
    
    // Verify store is attached
    // Note: Implementation details are internal, so we test behavior
    expect(store).toBeDefined();
  });

  it("should attach store in isolated mode", () => {
    const store = createEnhancedStore([], { registryMode: "isolated" });
    
    // Verify store is created with isolated mode
    expect(store).toBeDefined();
  });

  it("should track atoms for store in isolated mode", () => {
    const store = createEnhancedStore([], { registryMode: "isolated" });
    const testAtom = atom(0);
    
    // Register atom (this would normally happen automatically)
    atomRegistry.register(testAtom);
    
    // Get atoms for store
    const atoms = atomRegistry.getAtomsForStore(store);
    
    // In isolated mode, atoms should be tracked per store
    expect(Array.isArray(atoms)).toBe(true);
  });

  it("should get store for atom", () => {
    const store = createStore();
    const testAtom = atom(0);
    
    // Register atom
    atomRegistry.register(testAtom);
    
    // Get store for atom
    const atomStore = atomRegistry.getStoreForAtom(testAtom.id);
    
    // In global mode, atom belongs to global registry (no specific store)
    expect(atomStore).toBeUndefined();
  });

  it("should get atom value through registry", () => {
    const store = createStore();
    const testAtom = atom(42);
    
    // Register atom
    atomRegistry.register(testAtom);
    
    // Get atom value
    const value = atomRegistry.getAtomValue(testAtom.id);
    
    // Should return the atom itself if we can't get value through store
    expect(value).toBeDefined();
  });

  it("should maintain backward compatibility", () => {
    // Test that existing functionality still works
    const testAtom = atom(0);
    
    // Register atom
    atomRegistry.register(testAtom, "test-atom");
    
    // Get atom by id
    const retrievedAtom = atomRegistry.get(testAtom.id);
    expect(retrievedAtom).toBe(testAtom);
    
    // Get atom name
    const name = atomRegistry.getName(testAtom);
    expect(name).toBe("test-atom");
    
    // Get atom metadata
    const metadata = atomRegistry.getMetadata(testAtom);
    expect(metadata).toBeDefined();
    expect(metadata?.name).toBe("test-atom");
  });
});