/**
 * AtomTrackingService - Service for atom tracking operations
 *
 * Handles track, untrack, isTracked, and getTrackedAtoms operations.
 */

import type { Atom } from '../../types';
import type { TrackedAtom } from './types';
import type { TrackedAtomsRepository } from './TrackedAtomsRepository';
import type { TrackingEventManager } from './TrackingEventManager';
import type { ITrackingOperations, TrackResult, UntrackResult } from './types/interfaces';

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
export class AtomTrackingService implements ITrackingOperations {
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
  track<Value>(_atom: Atom<Value>, trackedAtom: TrackedAtom): TrackResult {
    try {
      const success = this.repository.track(trackedAtom);

      if (success) {
        this.eventManager.emitAtomTracked(trackedAtom);
        return { success: true };
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
   * @param atomId Atom ID to untrack
   * @returns Untrack result
   */
  untrack(atomId: symbol): UntrackResult {
    try {
      const success = this.repository.untrack(atomId);

      if (success) {
        return { success: true };
      }

      return {
        success: false,
        error: 'Atom not found',
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
   * @returns Tracked atom or null
   */
  getTrackedAtom(atomId: symbol): TrackedAtom | null {
    return this.repository.get(atomId) ?? null;
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
