/**
 * AtomTrackingService - Service for atom tracking operations
 *
 * Handles track, untrack, isTracked, and getTrackedAtoms operations.
 */

import type { Atom } from '../../types';
import type { TrackedAtom } from './types';
import type { TrackedAtomsRepository } from './TrackedAtomsRepository';
import type { TrackingEventManager } from './TrackingEventManager';

export interface TrackingResult {
  /** Whether operation was successful */
  success: boolean;
  /** Tracked atom (if tracked) */
  atom?: TrackedAtom;
  /** Error message (if failed) */
  error?: string;
}

/**
 * AtomTrackingService provides atom tracking operations
 */
export class AtomTrackingService {
  private repository: TrackedAtomsRepository;
  private eventManager: TrackingEventManager;

  constructor(
    repository: TrackedAtomsRepository,
    eventManager: TrackingEventManager
  ) {
    this.repository = repository;
    this.eventManager = eventManager;
  }

  /**
   * Track an atom
   * @param _atom Atom to track
   * @param trackedAtom Tracked atom data
   * @returns Tracking result
   */
  track<Value>(_atom: Atom<Value>, trackedAtom: TrackedAtom): TrackingResult {
    try {
      const success = this.repository.track(trackedAtom);

      if (success) {
        this.eventManager.emitAtomTracked(trackedAtom);
        return { success: true, atom: trackedAtom };
      }

      return {
        success: false,
        error: 'Atom already tracked',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Untrack an atom
   * @param atomId Atom ID
   * @returns Tracking result
   */
  untrack(atomId: symbol): TrackingResult {
    try {
      const atom = this.repository.get(atomId);
      if (!atom) {
        return {
          success: false,
          error: 'Atom not found',
        };
      }

      const success = this.repository.untrack(atomId);

      if (success) {
        this.eventManager.emitAtomUntracked(atom);
        return { success: true, atom };
      }

      return {
        success: false,
        error: 'Failed to untrack atom',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Check if atom is tracked
   * @param atomId Atom ID
   * @returns True if tracked
   */
  isTracked(atomId: symbol): boolean {
    return this.repository.isTracked(atomId);
  }

  /**
   * Get tracked atom by ID
   * @param atomId Atom ID
   * @returns Tracked atom or undefined
   */
  getTrackedAtom(atomId: symbol): TrackedAtom | undefined {
    return this.repository.get(atomId);
  }

  /**
   * Get tracked atom by name
   * @param name Atom name
   * @returns First matching atom or undefined
   */
  getAtomByName(name: string): TrackedAtom | undefined {
    const atoms = this.repository.getByName(name);
    return atoms.length > 0 ? atoms[0] : undefined;
  }

  /**
   * Get all tracked atoms
   * @returns Array of tracked atoms
   */
  getTrackedAtoms(): TrackedAtom[] {
    return this.repository.getAll();
  }

  /**
   * Get count of tracked atoms
   * @returns Number of atoms
   */
  getCount(): number {
    return this.repository.getCount();
  }

  /**
   * Get repository
   */
  getRepository(): TrackedAtomsRepository {
    return this.repository;
  }
}
