/**
 * Integration tests for duplicate name warnings in ScopedRegistry
 */

import { describe, it, expect, vi } from 'vitest';
import { atom, createStore } from '../../index';

describe('ScopedRegistry - Duplicate name warnings', () => {
  it('should warn when registering atom with duplicate name', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();
    const store = createStore();

    const atom1 = atom('value1', 'duplicateName');
    const atom2 = atom('value2', 'duplicateName');

    // Trigger lazy registration - warning shown on first access
    store.get(atom1);
    store.get(atom2);

    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Atom with name "duplicateName" already exists')
    );

    consoleWarnSpy.mockRestore();
  });

  it('should not warn for unique names', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();
    const store = createStore();

    const atom1 = atom('value1', 'uniqueName1');
    const atom2 = atom('value2', 'uniqueName2');
    const atom3 = atom('value3', 'uniqueName3');

    store.get(atom1);
    store.get(atom2);
    store.get(atom3);

    expect(consoleWarnSpy).not.toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  it('should not warn for atoms without explicit names', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();
    const store = createStore();

    const atom1 = atom('value1');
    const atom2 = atom('value2');

    store.get(atom1);
    store.get(atom2);

    expect(consoleWarnSpy).not.toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  it('should still register atoms with duplicate names', () => {
    const store = createStore();

    const atom1 = atom('value1', 'shared');
    const atom2 = atom('value2', 'shared');

    store.get(atom1);
    store.get(atom2);

    // Both atoms should be registered (by ID)
    const atoms = store.getRegistryAtoms();
    expect(atoms).toContain(atom1.id);
    expect(atoms).toContain(atom2.id);
  });

  it('should return first atom with setByName() when duplicates exist', () => {
    const store = createStore();

    const atom1 = atom('value1', 'shared');
    const atom2 = atom('value2', 'shared');

    store.get(atom1);
    store.get(atom2);

    // setByName should find the first registered atom
    const result = store.setByName('shared', 'new-value');
    expect(result).toBe(true);
    // The first atom gets updated
    expect(store.get(atom1)).toBe('new-value');
  });

  it('should handle many duplicate names gracefully', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();
    const store = createStore();

    const atoms = [];
    for (let i = 0; i < 5; i++) {
      atoms.push(atom(`value-${i}`, 'duplicate'));
    }

    atoms.forEach((a) => store.get(a));

    // Should warn only once
    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);

    // All atoms should be registered
    const registeredAtoms = store.getRegistryAtoms();
    expect(registeredAtoms.length).toBe(5);

    consoleWarnSpy.mockRestore();
  });

  it('should isolate duplicate names between stores', () => {
    const store1 = createStore();
    const store2 = createStore();

    const atom1 = atom('a', 'shared-name');
    const atom2 = atom('b', 'shared-name');

    store1.get(atom1);
    store2.get(atom2);

    // Each store has its own 'shared-name'
    store1.setByName('shared-name', 'store1-value');
    store2.setByName('shared-name', 'store2-value');

    expect(store1.get(atom1)).toBe('store1-value');
    expect(store2.get(atom2)).toBe('store2-value');
  });
});
