/**
 * AtomRegistryAdapter - Adapter for atom registry
 */

import type { IAtomRegistryAdapter } from './types.interfaces';
import type { Atom } from '../../../types';
import { atomRegistry } from '../../../atom-registry';

/**
 * Default implementation of atom registry adapter
 */
export class AtomRegistryAdapter implements IAtomRegistryAdapter {
  /**
   * Get all atoms
   */
  getAll(): Map<symbol, Atom<any>> {
    return atomRegistry.getAll() as Map<symbol, Atom<any>>;
  }

  /**
   * Get atom by ID
   */
  get(atomId: symbol): Atom<any> | undefined {
    return atomRegistry.get(atomId) as Atom<any> | undefined;
  }
}
