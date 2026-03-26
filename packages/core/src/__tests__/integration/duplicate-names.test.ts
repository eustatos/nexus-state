/**
 * Integration tests for AtomRegistry duplicate name warnings
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { atom, createStore } from '../../index';
import { atomRegistry } from '../../atom-registry';

describe('AtomRegistry - Duplicate name warnings', () => {
  beforeEach(() => {
    atomRegistry.clear();
  });

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

    const atom1 = atom('value1');  // auto-generated name
    const atom2 = atom('value2');  // auto-generated name
    
    store.get(atom1);
    store.get(atom2);

    expect(consoleWarnSpy).not.toHaveBeenCalled();

    consoleWarnSpy.mockRestore();
  });

  it('should warn multiple times for multiple duplicates', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();
    const store = createStore();

    const atom1 = atom('v1', 'name1');
    const atom2 = atom('v2', 'name1');  // Warning 1
    const atom3 = atom('v3', 'name1');  // Warning 2
    
    store.get(atom1);
    store.get(atom2);
    store.get(atom3);

    expect(consoleWarnSpy).toHaveBeenCalledTimes(2);

    consoleWarnSpy.mockRestore();
  });

  it('should still register atoms with duplicate names', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();
    const store = createStore();

    const atom1 = atom('value1', 'shared');
    const atom2 = atom('value2', 'shared');
    
    // Trigger lazy registration
    store.get(atom1);
    store.get(atom2);

    // Both atoms should be registered
    expect(atomRegistry.get(atom1.id)).toBe(atom1);
    expect(atomRegistry.get(atom2.id)).toBe(atom2);

    consoleWarnSpy.mockRestore();
  });

  it('should return first atom with getByName() when duplicates exist', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();
    const store = createStore();

    const atom1 = atom('value1', 'shared');
    const atom2 = atom('value2', 'shared');
    
    // Trigger lazy registration
    store.get(atom1);
    store.get(atom2);

    const found = atomRegistry.getByName('shared');

    expect(found).toBe(atom1);
    expect(found).not.toBe(atom2);

    consoleWarnSpy.mockRestore();
  });

  it('should warn when registering atom with duplicate name via registry directly', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();
    const store = createStore();

    const atom1 = atom('value1', 'directName');
    const atom2 = { id: Symbol('atom2'), type: 'primitive' as const };
    
    // Trigger lazy registration for atom1
    store.get(atom1);

    // Register second atom with same name via registry directly
    atomRegistry.register(atom2, 'directName');

    expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Atom with name "directName" already exists')
    );

    consoleWarnSpy.mockRestore();
  });

  it('should handle many duplicate names gracefully', () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation();
    const store = createStore();

    const atoms = [];
    // Create 5 atoms with same name
    for (let i = 0; i < 5; i++) {
      atoms.push(atom(`value-${i}`, 'sameName'));
    }
    
    // Trigger lazy registration
    atoms.forEach(a => store.get(a));

    // Should have 4 warnings (first atom doesn't trigger warning)
    expect(consoleWarnSpy).toHaveBeenCalledTimes(4);

    // All atoms should be registered
    expect(atomRegistry.size()).toBe(5);

    consoleWarnSpy.mockRestore();
  });
});
