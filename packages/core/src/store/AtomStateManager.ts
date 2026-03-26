/**
 * AtomStateManager - Manages atom state storage and retrieval
 *
 * Handles storage, creation, and retrieval of atom states.
 */

import type { Atom, PrimitiveAtom, ComputedAtom, WritableAtom } from '../types';
import { isPrimitiveAtom, isComputedAtom, isWritableAtom } from '../types';
import { atomRegistry } from '../atom-registry';
import { storeLogger as logger } from '../debug';

/**
 * Internal state for an atom
 */
export type AtomState<Value> = {
  /** The current value of the atom */
  value: Value;
  /** Set of subscribers to notify when the value changes */
  subscribers: Set<Subscriber<Value>>;
  /** Set of dependent atoms that depend on this atom */
  dependents: Set<Atom<any>>;
};

export type Subscriber<Value> = (value: Value) => void;

/**
 * AtomStateManager provides atom state storage
 */
export class AtomStateManager {
  private states: Map<Atom<any>, AtomState<any>> = new Map();
  private currentAtom: Atom<any> | null = null;

  /**
   * Get or create state for atom
   * @param atom Atom to get state for
   * @param getter Function to get initial value
   * @returns Atom state
   */
  getOrCreateState<Value>(
    atom: Atom<Value>,
    getter: () => Value
  ): AtomState<Value> {
    let atomState = this.states.get(atom) as AtomState<Value> | undefined;

    if (!atomState) {
      logger.log(
        '[StateManager] Creating state for atom:',
        (atom as Atom<Value & { name?: string }>).name || 'unnamed',
        'type:',
        atom.type
      );

      // Get initial value
      const initialValue = this.evaluateAtom(atom, getter);

      atomState = {
        value: initialValue,
        subscribers: new Set(),
        dependents: new Set(),
      };

      this.states.set(atom, atomState as AtomState<Value>);
    }

    return atomState;
  }

  /**
   * Evaluate atom to get initial value
   * @param atom Atom to evaluate
   * @param _getter Getter function
   * @returns Evaluated value
   */
  private evaluateAtom<Value>(
    atom: Atom<Value>,
    _getter: () => Value
  ): Value {
    const previousAtom = this.currentAtom;
    this.currentAtom = atom;

    try {
      if (isPrimitiveAtom(atom)) {
        return (atom as PrimitiveAtom<Value>).read();
      } else if (isComputedAtom(atom) || isWritableAtom(atom)) {
        return (atom as ComputedAtom<Value> | WritableAtom<Value>).read(
          this.createGetter()
        );
      } else {
        throw new Error('Unknown atom type');
      }
    } finally {
      this.currentAtom = previousAtom;
    }
  }

  /**
   * Create getter function for atom evaluation
   */
  private createGetter(): <V>(atom: Atom<V>) => V {
    return <V>(atom: Atom<V>): V => {
      // Ensure atom is registered (lazy registration)
      const lazyMeta = atom._lazyRegistration;
      if (lazyMeta && !lazyMeta.registered) {
        lazyMeta.registered = true;
        lazyMeta.registeredAt = Date.now();
        lazyMeta.accessCount = 1;
        atomRegistry.register(atom, atom.name);
      } else if (lazyMeta) {
        lazyMeta.accessCount++;
      }

      const state = this.getOrCreateState(atom, () => {
        if (isPrimitiveAtom(atom)) {
          return (atom as PrimitiveAtom<V>).read();
        }
        throw new Error('Cannot evaluate atom without getter');
      });

      // Track dependency
      if (this.currentAtom && this.currentAtom !== atom) {
        state.dependents.add(this.currentAtom);
      }

      return state.value;
    };
  }

  /**
   * Get state for atom
   * @param atom Atom to get state for
   * @returns Atom state or undefined
   */
  getState<Value>(atom: Atom<Value>): AtomState<Value> | undefined {
    return this.states.get(atom) as AtomState<Value> | undefined;
  }

  /**
   * Set value for atom
   * @param atom Atom to set value for
   * @param value New value
   */
  setValue<Value>(atom: Atom<Value>, value: Value): void {
    const atomState = this.states.get(atom) as AtomState<Value> | undefined;
    if (atomState) {
      atomState.value = value;
    }
  }

  /**
   * Get value for atom
   * @param atom Atom to get value for
   * @returns Current value
   */
  getValue<Value>(atom: Atom<Value>): Value | undefined {
    const atomState = this.states.get(atom) as AtomState<Value> | undefined;
    return atomState?.value;
  }

  /**
   * Get all states
   * @returns Map of all atom states
   */
  getAllStates(): Map<Atom<any>, AtomState<any>> {
    return new Map(this.states);
  }

  /**
   * Get state as record for serialization
   * @returns Record of atom names to values
   */
  getStateAsRecord(): Record<string, unknown> {
    const state: Record<string, unknown> = {};

    this.states.forEach((atomState, atom) => {
      const atomName = atomRegistry.getName(atom);
      const key = atomName || atom.toString();
      state[key] = atomState.value;
    });

    return state;
  }

  /**
   * Get current atom being evaluated
   */
  getCurrentAtom(): Atom<any> | null {
    return this.currentAtom;
  }

  /**
   * Set current atom being evaluated
   * @param atom Current atom
   */
  setCurrentAtom(atom: Atom<any> | null): void {
    this.currentAtom = atom;
  }

  /**
   * Clear all states
   */
  clear(): void {
    this.states.clear();
    this.currentAtom = null;
  }
}
