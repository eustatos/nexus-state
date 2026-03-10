/**
 * TrackedAtomsRepository - Repository for tracked atoms
 *
 * Handles storage, retrieval, addition, and removal of tracked atoms.
 */

import type { Atom } from '../../types';
import type { TrackedAtom } from './types';

export interface RepositoryStats {
  /** Total tracked atoms */
  total: number;
  /** Atoms by type */
  byType: Record<string, number>;
  /** Atoms by status */
  byStatus: Record<string, number>;
}

/**
 * TrackedAtomsRepository provides atom storage and retrieval
 * for the tracking system
 */
export class TrackedAtomsRepository {
  private atoms: Map<symbol, TrackedAtom> = new Map();
  private atomsByName: Map<string, Set<symbol>> = new Map();

  /**
   * Track an atom
   * @param atom Atom to track
   * @returns True if tracked successfully
   */
  track(atom: TrackedAtom): boolean {
    if (this.atoms.has(atom.id)) {
      return false;
    }

    this.atoms.set(atom.id, atom);

    // Index by name
    if (!this.atomsByName.has(atom.name)) {
      this.atomsByName.set(atom.name, new Set());
    }
    this.atomsByName.get(atom.name)!.add(atom.id);

    return true;
  }

  /**
   * Untrack an atom
   * @param atomId Atom ID
   * @returns True if untracked successfully
   */
  untrack(atomId: symbol): boolean {
    const atom = this.atoms.get(atomId);
    if (!atom) {
      return false;
    }

    this.atoms.delete(atomId);

    // Remove from name index
    const nameSet = this.atomsByName.get(atom.name);
    if (nameSet) {
      nameSet.delete(atomId);
      if (nameSet.size === 0) {
        this.atomsByName.delete(atom.name);
      }
    }

    return true;
  }

  /**
   * Get atom by ID
   * @param atomId Atom ID
   * @returns Atom or undefined
   */
  get(atomId: symbol): TrackedAtom | undefined {
    return this.atoms.get(atomId);
  }

  /**
   * Get atoms by name
   * @param name Atom name
   * @returns Array of atoms
   */
  getByName(name: string): TrackedAtom[] {
    const ids = this.atomsByName.get(name);
    if (!ids) {
      return [];
    }
    return Array.from(ids)
      .map((id) => this.atoms.get(id))
      .filter((atom): atom is TrackedAtom => atom !== undefined);
  }

  /**
   * Get all tracked atoms
   * @returns Array of atoms
   */
  getAll(): TrackedAtom[] {
    return Array.from(this.atoms.values());
  }

  /**
   * Get all atom IDs
   * @returns Array of atom IDs
   */
  getAllIds(): symbol[] {
    return Array.from(this.atoms.keys());
  }

  /**
   * Check if atom is tracked
   * @param atomId Atom ID
   * @returns True if tracked
   */
  isTracked(atomId: symbol): boolean {
    return this.atoms.has(atomId);
  }

  /**
   * Check if atom is tracked by name
   * @param name Atom name
   * @returns True if tracked
   */
  isTrackedByName(name: string): boolean {
    return this.atomsByName.has(name);
  }

  /**
   * Get count of tracked atoms
   * @returns Number of atoms
   */
  getCount(): number {
    return this.atoms.size;
  }

  /**
   * Get repository statistics
   * @returns Repository stats
   */
  getStats(): RepositoryStats {
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const atom of this.atoms.values()) {
      // Count by type
      const type = atom.type || 'unknown';
      byType[type] = (byType[type] || 0) + 1;

      // Count by status
      const status = atom.status || 'active';
      byStatus[status] = (byStatus[status] || 0) + 1;
    }

    return {
      total: this.atoms.size,
      byType,
      byStatus,
    };
  }

  /**
   * Update atom
   * @param atomId Atom ID
   * @param updates Updates to apply
   * @returns True if updated successfully
   */
  update(atomId: symbol, updates: Partial<TrackedAtom>): boolean {
    const atom = this.atoms.get(atomId);
    if (!atom) {
      return false;
    }

    Object.assign(atom, updates);
    return true;
  }

  /**
   * Clear all atoms
   */
  clear(): void {
    this.atoms.clear();
    this.atomsByName.clear();
  }

  /**
   * Get atoms by status
   * @param status Atom status
   * @returns Array of atoms
   */
  getByStatus(status: string): TrackedAtom[] {
    return this.getAll().filter((atom) => atom.status === status);
  }

  /**
   * Get atoms by type
   * @param type Atom type
   * @returns Array of atoms
   */
  getByType(type: string): TrackedAtom[] {
    return this.getAll().filter((atom) => atom.type === type);
  }

  /**
   * Find atoms by predicate
   * @param predicate Predicate function
   * @returns Array of matching atoms
   */
  find(predicate: (atom: TrackedAtom) => boolean): TrackedAtom[] {
    return this.getAll().filter(predicate);
  }

  /**
   * Get or create atom by ID
   * @param atomId Atom ID
   * @param factory Factory function to create atom if not exists
   * @returns Existing or created atom
   */
  getOrCreate(atomId: symbol, factory: () => TrackedAtom): TrackedAtom {
    let atom = this.get(atomId);
    if (!atom) {
      atom = factory();
      this.track(atom);
    }
    return atom;
  }
}
