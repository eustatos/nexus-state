/**
 * ArchiveManager - Manages archiving and restoration of atoms
 *
 * Handles archiving tracked atoms for potential restoration later.
 */

import type { TrackedAtom } from './types';

export interface ArchivedAtom extends TrackedAtom {
  /** Archive timestamp */
  archivedAt: number;
  /** Archive reason */
  reason?: string;
  /** Original status before archiving */
  originalStatus: string;
}

export interface ArchiveStats {
  /** Total archived atoms */
  totalArchived: number;
  /** Atoms by reason */
  byReason: Record<string, number>;
  /** Oldest archive timestamp */
  oldestArchive?: number;
  /** Newest archive timestamp */
  newestArchive?: number;
}

export interface ArchiveConfig {
  /** Enable archiving */
  enabled: boolean;
  /** Max archived atoms to keep */
  maxArchived: number;
  /** Auto-cleanup old archives */
  autoCleanup: boolean;
  /** Archive TTL in milliseconds */
  archiveTTL: number;
}

/**
 * ArchiveManager provides atom archiving
 * for the tracking system
 */
export class ArchiveManager {
  private archivedAtoms: Map<symbol, ArchivedAtom> = new Map();
  private config: ArchiveConfig;

  constructor(config?: Partial<ArchiveConfig>) {
    this.config = {
      enabled: config?.enabled ?? true,
      maxArchived: config?.maxArchived ?? 1000,
      autoCleanup: config?.autoCleanup ?? false,
      archiveTTL: config?.archiveTTL ?? 3600000, // 1 hour
    };
  }

  /**
   * Archive an atom
   * @param atom Atom to archive
   * @param reason Archive reason
   * @returns True if archived successfully
   */
  archive(atom: TrackedAtom, reason?: string): boolean {
    if (!this.config.enabled) {
      return false;
    }

    const archivedAtom: ArchivedAtom = {
      ...atom,
      archivedAt: Date.now(),
      reason,
      originalStatus: atom.status || 'active',
    };

    this.archivedAtoms.set(atom.id, archivedAtom);

    // Cleanup old archives if needed
    if (this.config.autoCleanup) {
      this.cleanupOldArchives();
    }

    return true;
  }

  /**
   * Restore an archived atom
   * @param atomId Atom ID to restore
   * @returns Restored atom or undefined
   */
  restore(atomId: symbol): TrackedAtom | undefined {
    const archivedAtom = this.archivedAtoms.get(atomId);
    if (!archivedAtom) {
      return undefined;
    }

    // Create restored atom
    const restored: TrackedAtom = {
      ...archivedAtom,
      status: archivedAtom.originalStatus,
    };

    // Remove from archive
    this.archivedAtoms.delete(atomId);

    return restored;
  }

  /**
   * Get archived atom by ID
   * @param atomId Atom ID
   * @returns Archived atom or undefined
   */
  getArchived(atomId: symbol): ArchivedAtom | undefined {
    return this.archivedAtoms.get(atomId);
  }

  /**
   * Get all archived atoms
   * @returns Array of archived atoms
   */
  getAllArchived(): ArchivedAtom[] {
    return Array.from(this.archivedAtoms.values());
  }

  /**
   * Get archived atoms by reason
   * @param reason Archive reason
   * @returns Array of archived atoms
   */
  getByReason(reason: string): ArchivedAtom[] {
    return this.getAllArchived().filter((a) => a.reason === reason);
  }

  /**
   * Get expired archives
   * @returns Array of expired archived atoms
   */
  getExpiredArchives(): ArchivedAtom[] {
    const now = Date.now();
    return this.getAllArchived().filter(
      (a) => now - a.archivedAt > this.config.archiveTTL
    );
  }

  /**
   * Remove archived atom
   * @param atomId Atom ID
   * @returns True if removed successfully
   */
  remove(atomId: symbol): boolean {
    return this.archivedAtoms.delete(atomId);
  }

  /**
   * Cleanup old archives
   * @returns Number of archives removed
   */
  cleanupOldArchives(): number {
    const now = Date.now();
    let removed = 0;

    // Remove expired archives
    for (const [id, atom] of this.archivedAtoms.entries()) {
      if (now - atom.archivedAt > this.config.archiveTTL) {
        this.archivedAtoms.delete(id);
        removed++;
      }
    }

    // Remove excess archives if over limit
    while (
      this.archivedAtoms.size > this.config.maxArchived &&
      this.archivedAtoms.size > 0
    ) {
      // Find oldest archive
      let oldestId: symbol | null = null;
      let oldestTime = Infinity;

      for (const [id, atom] of this.archivedAtoms.entries()) {
        if (atom.archivedAt < oldestTime) {
          oldestTime = atom.archivedAt;
          oldestId = id;
        }
      }

      if (oldestId) {
        this.archivedAtoms.delete(oldestId);
        removed++;
      } else {
        break;
      }
    }

    return removed;
  }

  /**
   * Get archive statistics
   * @returns Archive stats
   */
  getStats(): ArchiveStats {
    const archived = this.getAllArchived();
    const byReason: Record<string, number> = {};

    for (const atom of archived) {
      const reason = atom.reason || 'unknown';
      byReason[reason] = (byReason[reason] || 0) + 1;
    }

    let oldestArchive: number | undefined;
    let newestArchive: number | undefined;

    if (archived.length > 0) {
      oldestArchive = Math.min(...archived.map((a) => a.archivedAt));
      newestArchive = Math.max(...archived.map((a) => a.archivedAt));
    }

    return {
      totalArchived: archived.length,
      byReason,
      oldestArchive,
      newestArchive,
    };
  }

  /**
   * Clear all archives
   */
  clear(): void {
    this.archivedAtoms.clear();
  }

  /**
   * Get archived count
   * @returns Number of archived atoms
   */
  getCount(): number {
    return this.archivedAtoms.size;
  }

  /**
   * Get configuration
   */
  getConfig(): ArchiveConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   * @param config New configuration
   */
  configure(config: Partial<ArchiveConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
