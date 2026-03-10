/**
 * StateCaptureService - Captures atom state for snapshots
 */

import type { IStateCapture, ISnapshotSerializer, IAtomRegistryAdapter } from './types.interfaces';
import type { SnapshotStateEntry } from '../types';
import type { Atom, Store } from '../../types';
import type { SnapshotCreatorConfig } from './types';

/**
 * Default implementation of state capture service
 */
export class StateCaptureService implements IStateCapture {
  private store: Store;
  private registry: IAtomRegistryAdapter;
  private serializer: ISnapshotSerializer;
  private config: SnapshotCreatorConfig;

  constructor(
    store: Store,
    registry: IAtomRegistryAdapter,
    serializer: ISnapshotSerializer,
    config: SnapshotCreatorConfig
  ) {
    this.store = store;
    this.registry = registry;
    this.serializer = serializer;
    this.config = config;
  }

  /**
   * Capture current state
   */
  captureState(atomIds?: Set<symbol>): Record<string, SnapshotStateEntry> {
    const state: Record<string, SnapshotStateEntry> = {};

    if (!atomIds) {
      // Capture all registered atoms
      const allAtoms = this.registry.getAll();
      allAtoms.forEach((atom) => {
        this.addAtomToState(atom, state);
      });
    } else {
      // Capture only specified atoms
      atomIds.forEach((atomId) => {
        try {
          const atom = this.registry.get(atomId);
          if (atom) {
            this.addAtomToState(atom, state);
          }
        } catch {
          // Skip atoms that can't be accessed
        }
      });
    }

    return state;
  }

  /**
   * Add atom to state object
   */
  addAtomToState(atom: Atom<any>, state: Record<string, SnapshotStateEntry>): void {
    try {
      const atomType = this.getAtomType(atom);

      // Filter by type
      if (!this.config.includeTypes?.includes(atomType)) return;

      // Filter by exclude list
      const atomName = atom.name || atom.id.description || String(atom.id);
      if (this.config.excludeAtoms?.includes(atomName)) return;

      const value = this.store.get(atom);

      // Cast atomType to the expected union type
      const stateType: 'primitive' | 'computed' | 'writable' =
        atomType === 'primitive' ||
        atomType === 'computed' ||
        atomType === 'writable'
          ? atomType
          : 'primitive';

      state[atomName] = {
        value: this.serializer.serialize(value),
        type: stateType,
        name: atomName,
        // Don't save atomId for generic symbols - they can't be restored
        // Only save atomId if it's a named symbol (e.g. Symbol('editor.content'))
        atomId: atom.id.description && atom.id.description !== 'atom' 
          ? atom.id.toString() 
          : undefined,
      };
    } catch {
      // Skip atoms that can't be accessed
    }
  }

  /**
   * Get atom type
   */
  private getAtomType(atom: Atom<any>): string {
    if (atom && typeof atom === 'object' && 'type' in atom) {
      return (atom as { type: string }).type;
    }
    return 'primitive';
  }
}
