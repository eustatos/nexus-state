/**
 * DependencyTracker - Tracks and notifies atom dependencies
 *
 * Handles dependency tracking and BFS-based dependent notification.
 */

import type { Atom, ComputedAtom, WritableAtom } from '../types';
import { isComputedAtom, isWritableAtom } from '../types';
import { storeLogger as logger } from '../debug';
import type { AtomState } from './AtomStateManager';

export type AtomStateGetter = <Value>(atom: Atom<Value>) => AtomState<Value> | undefined;
export type ValueGetter = <Value>(atom: Atom<Value>) => Value | undefined;

export interface DependencyNotificationResult {
  /** Number of atoms notified */
  notifiedCount: number;
  /** Number of atoms recomputed */
  recomputedCount: number;
  /** Atoms that were recomputed */
  recomputedAtoms: string[];
}

/**
 * DependencyTracker provides dependency management
 */
export class DependencyTracker {
  /**
   * Add dependent relationship
   * @param atom Atom that is depended upon
   * @param dependent Atom that depends on atom
   * @returns True if dependency was added
   */
  addDependency<Value>(
    atomState: AtomState<Value>,
    dependent: Atom<any>
  ): boolean {
    const previousSize = atomState.dependents.size;
    atomState.dependents.add(dependent);
    const added = atomState.dependents.size > previousSize;
    logger.log(
      '[DependencyTracker] Added dependency:',
      dependent.name || 'unnamed',
      '->',
      'dependent size:',
      atomState.dependents.size
    );
    return added;
  }

  /**
   * Notify dependents of atom change using BFS
   * @param atom Changed atom
   * @param getState Function to get atom state
   * @param _getValue Function to get atom value
   * @param recompute Function to recompute computed atom
   * @returns Notification result
   */
  notifyDependents(
    atom: Atom<any>,
    getState: AtomStateGetter,
    _getValue: ValueGetter,
    recompute: (atom: Atom<any>) => any
  ): DependencyNotificationResult {
    const atomState = getState(atom);
    if (!atomState) {
      return {
        notifiedCount: 0,
        recomputedCount: 0,
        recomputedAtoms: [],
      };
    }

    logger.log(
      '[DependencyTracker] Notifying dependents of:',
      atom.name || 'unnamed',
      'count:',
      atomState.dependents.size
    );

    const toNotify = new Set<Atom<unknown>>(atomState.dependents);
    const notified = new Set<Atom<unknown>>();
    const recomputedAtoms: string[] = [];
    let recomputedCount = 0;

    while (toNotify.size > 0) {
      const current = toNotify.values().next().value as Atom<any>;
      toNotify.delete(current);

      if (notified.has(current)) continue;
      notified.add(current);

      logger.log(
        '[DependencyTracker] Notifying dependent:',
        current.name || 'unnamed'
      );

      const currentState = getState(current);
      if (currentState && (isComputedAtom(current) || isWritableAtom(current))) {
        logger.log('[DependencyTracker] Dependent type:', current.type);

        // Recompute the value
        const newValue = recompute(current);

        if (currentState.value !== newValue) {
          logger.log(
            '[DependencyTracker] Value changed, updating dependent:',
            current.name || 'unnamed'
          );

          currentState.value = newValue;
          recomputedCount++;
          recomputedAtoms.push(current.name || 'unnamed');

          // Notify subscribers
          currentState.subscribers.forEach((subscriber) => {
            try {
              subscriber(newValue);
            } catch (error) {
              logger.error('Subscriber error:', error);
            }
          });

          // Add dependents to queue
          currentState.dependents.forEach((dep) => {
            if (!notified.has(dep)) {
              toNotify.add(dep);
            }
          });
        } else {
          logger.log(
            '[DependencyTracker] Value not changed, skipping:',
            current.name || 'unnamed'
          );
        }
      }
    }

    return {
      notifiedCount: notified.size,
      recomputedCount,
      recomputedAtoms,
    };
  }

  /**
   * Get all dependents of atom
   * @param atom Atom to get dependents for
   * @param getState Function to get atom state
   * @returns Array of dependent atoms
   */
  getDependents(
    atom: Atom<any>,
    getState: AtomStateGetter
  ): Atom<any>[] {
    const atomState = getState(atom);
    if (!atomState) {
      return [];
    }
    return Array.from(atomState.dependents);
  }

  /**
   * Remove dependent from atom
   * @param atom Atom to remove dependent from
   * @param dependent Dependent to remove
   * @returns True if removed
   */
  removeDependency<Value>(
    atomState: AtomState<Value>,
    dependent: Atom<any>
  ): boolean {
    return atomState.dependents.delete(dependent);
  }

  /**
   * Clear all dependencies
   * @param _getState Function to get atom state
   */
  clearAllDependencies(_getState: AtomStateGetter): void {
    // This would need access to all atoms
    // Typically called during cleanup
  }
}
