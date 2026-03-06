/**
 * ComputedEvaluator - Evaluates computed and writable atoms
 *
 * Handles atom evaluation and recomputation.
 */

import type { Atom, PrimitiveAtom, ComputedAtom, WritableAtom } from '../types';
import { isPrimitiveAtom, isComputedAtom, isWritableAtom } from '../types';
import { storeLogger as logger } from '../debug';

export type Getter = <Value>(atom: Atom<Value>) => Value;

/**
 * ComputedEvaluator provides atom evaluation
 */
export class ComputedEvaluator {
  private evaluationStack: Set<symbol> = new Set();

  /**
   * Evaluate atom to get value
   * @param atom Atom to evaluate
   * @param get Getter function
   * @returns Evaluated value
   */
  evaluate<Value>(atom: Atom<Value>, get: Getter): Value {
    logger.log(
      '[ComputedEvaluator] Evaluating atom:',
      atom.name || 'unnamed',
      'type:',
      atom.type
    );

    // Check for circular dependencies
    if (this.evaluationStack.has(atom.id)) {
      logger.warn(
        '[ComputedEvaluator] Circular dependency detected:',
        atom.name || 'unnamed'
      );
    }

    this.evaluationStack.add(atom.id);

    try {
      if (isPrimitiveAtom(atom)) {
        return (atom as PrimitiveAtom<Value>).read();
      } else if (isComputedAtom(atom)) {
        return (atom as ComputedAtom<Value>).read(get);
      } else if (isWritableAtom(atom)) {
        return (atom as WritableAtom<Value>).read(get);
      } else {
        throw new Error('Unknown atom type');
      }
    } finally {
      this.evaluationStack.delete(atom.id);
    }
  }

  /**
   * Recompute computed or writable atom
   * @param atom Atom to recompute
   * @param get Getter function
   * @returns Recomputed value
   */
  recompute<Value>(atom: Atom<Value>, get: Getter): Value {
    logger.log(
      '[ComputedEvaluator] Recomputing atom:',
      atom.name || 'unnamed'
    );

    if (isComputedAtom(atom)) {
      const newValue = (atom as ComputedAtom<Value>).read(get);
      logger.log(
        '[ComputedEvaluator] Recomputed atom:',
        atom.name || 'unnamed',
        'value:',
        newValue
      );
      return newValue;
    } else if (isWritableAtom(atom)) {
      const newValue = (atom as WritableAtom<Value>).read(get);
      logger.log(
        '[ComputedEvaluator] Recomputed writable atom:',
        atom.name || 'unnamed',
        'value:',
        newValue
      );
      return newValue;
    } else {
      throw new Error('Cannot recompute non-computed atom');
    }
  }

  /**
   * Create getter function
   * @param evaluateFn Function to evaluate atom
   * @returns Getter function
   */
  createGetter(evaluateFn: <V>(atom: Atom<V>) => V): Getter {
    return <Value>(atom: Atom<Value>): Value => {
      return evaluateFn(atom);
    };
  }

  /**
   * Check if atom is currently being evaluated
   * @param atom Atom to check
   * @returns True if evaluating
   */
  isEvaluating(atom: Atom<any>): boolean {
    return this.evaluationStack.has(atom.id);
  }

  /**
   * Get evaluation stack size
   * @returns Stack size
   */
  getEvaluationStackSize(): number {
    return this.evaluationStack.size;
  }

  /**
   * Clear evaluation stack
   */
  clearEvaluationStack(): void {
    this.evaluationStack.clear();
  }
}
