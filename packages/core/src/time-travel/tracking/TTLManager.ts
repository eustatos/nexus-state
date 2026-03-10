/**
 * TTLManager - Manages time-to-live for tracked atoms
 *
 * Handles TTL configuration, status updates, and expiration checking.
 */

import type { TrackedAtom, AtomStatus } from './types';

export interface TTLConfig {
  /** Default TTL in milliseconds */
  defaultTTL: number;
  /** Idle timeout in milliseconds */
  idleTimeout: number;
  /** Stale timeout in milliseconds */
  staleTimeout: number;
  /** TTL by atom type */
  ttlByType: Record<string, number>;
}

export interface TTLResult {
  /** Atom ID */
  atomId: symbol;
  /** Atom name */
  atomName: string;
  /** Current status */
  status: AtomStatus;
  /** Time since last access in milliseconds */
  timeSinceAccess: number;
  /** TTL in milliseconds */
  ttl: number;
  /** Is expired */
  isExpired: boolean;
}

/**
 * TTLManager provides TTL management
 * for tracked atoms
 */
export class TTLManager {
  private config: TTLConfig;

  constructor(config?: Partial<TTLConfig>) {
    this.config = {
      defaultTTL: config?.defaultTTL ?? 300000, // 5 minutes
      idleTimeout: config?.idleTimeout ?? 60000, // 1 minute
      staleTimeout: config?.staleTimeout ?? 180000, // 3 minutes
      ttlByType: config?.ttlByType ?? {},
    };
  }

  /**
   * Get TTL for an atom based on its type
   * @param atom Atom to check
   * @returns TTL in milliseconds
   */
  getTTLForAtom(atom: TrackedAtom): number {
    // Check type-specific TTL
    if (atom.type && this.config.ttlByType[atom.type]) {
      return this.config.ttlByType[atom.type];
    }

    // Check atom-specific TTL
    if (atom.ttl) {
      return atom.ttl;
    }

    // Return default TTL
    return this.config.defaultTTL;
  }

  /**
   * Check if atom is expired
   * @param atom Atom to check
   * @returns True if expired
   */
  isExpired(atom: TrackedAtom): boolean {
    const now = Date.now();
    const lastAccess = atom.lastAccessedAt || atom.createdAt || 0;
    const ttl = this.getTTLForAtom(atom);

    return now - lastAccess > ttl;
  }

  /**
   * Check if atom is idle (not accessed recently)
   * @param atom Atom to check
   * @returns True if idle
   */
  isIdle(atom: TrackedAtom): boolean {
    const now = Date.now();
    const lastAccess = atom.lastAccessedAt || atom.createdAt || 0;

    return now - lastAccess > this.config.idleTimeout;
  }

  /**
   * Check if atom is stale (approaching expiration)
   * @param atom Atom to check
   * @returns True if stale
   */
  isStale(atom: TrackedAtom): boolean {
    const now = Date.now();
    const lastAccess = atom.lastAccessedAt || atom.createdAt || 0;

    return now - lastAccess > this.config.staleTimeout;
  }

  /**
   * Get atom status
   * @param atom Atom to check
   * @returns Atom status
   */
  getStatus(atom: TrackedAtom): AtomStatus {
    if (this.isStale(atom)) {
      return 'stale';
    }
    if (this.isIdle(atom)) {
      return 'idle';
    }
    return 'active';
  }

  /**
   * Update atom status
   * @param atom Atom to update
   * @returns Updated status
   */
  updateStatus(atom: TrackedAtom): AtomStatus {
    const status = this.getStatus(atom);
    atom.status = status;
    return status;
  }

  /**
   * Update statuses for multiple atoms
   * @param atoms Atoms to update
   * @returns Map of atom IDs to statuses
   */
  updateStatuses(atoms: TrackedAtom[]): Map<symbol, AtomStatus> {
    const statuses = new Map<symbol, AtomStatus>();

    for (const atom of atoms) {
      const status = this.updateStatus(atom);
      statuses.set(atom.id, status);
    }

    return statuses;
  }

  /**
   * Get TTL result with details
   * @param atom Atom to check
   * @returns TTL result
   */
  getTTLResult(atom: TrackedAtom): TTLResult {
    const now = Date.now();
    const lastAccess = atom.lastAccessedAt || atom.createdAt || 0;
    const ttl = this.getTTLForAtom(atom);
    const status = this.getStatus(atom);

    return {
      atomId: atom.id,
      atomName: atom.name,
      status,
      timeSinceAccess: now - lastAccess,
      ttl,
      isExpired: status === 'stale',
    };
  }

  /**
   * Get expired atoms from a list
   * @param atoms Atoms to check
   * @returns Array of expired atoms
   */
  getExpiredAtoms(atoms: TrackedAtom[]): TrackedAtom[] {
    return atoms.filter((atom) => this.isExpired(atom));
  }

  /**
   * Get stale atoms from a list
   * @param atoms Atoms to check
   * @returns Array of stale atoms
   */
  getStaleAtoms(atoms: TrackedAtom[]): TrackedAtom[] {
    return atoms.filter((atom) => this.isStale(atom));
  }

  /**
   * Get idle atoms from a list
   * @param atoms Atoms to check
   * @returns Array of idle atoms
   */
  getIdleAtoms(atoms: TrackedAtom[]): TrackedAtom[] {
    return atoms.filter((atom) => this.isIdle(atom));
  }

  /**
   * Get configuration
   */
  getConfig(): TTLConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   * @param config New configuration
   */
  configure(config: Partial<TTLConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Reset atom access time (mark as active)
   * @param atom Atom to reset
   */
  resetAccessTime(atom: TrackedAtom): void {
    atom.lastAccessedAt = Date.now();
    atom.status = 'active';
  }
}
