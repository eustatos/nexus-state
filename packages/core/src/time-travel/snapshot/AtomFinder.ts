/**
 * AtomFinder - Finds atoms in the registry by name or ID
 */

import type { Atom } from '../../types';
import { atomRegistry } from '../../atom-registry';
import { storeLogger as logger } from '../../debug';

export interface FindAtomResult {
  /** Found atom */
  atom: Atom<unknown> | null;
  /** How the atom was found */
  foundBy: 'name' | 'id' | 'fallback-name' | null;
  /** Search details */
  searchDetails: {
    searchedByName: boolean;
    searchedById: boolean;
    searchedByFallback: boolean;
  };
}

/**
 * AtomFinder provides functionality to find atoms in the registry
 * using various strategies (by name, by ID, by fallback name matching)
 */
export class AtomFinder {
  /**
   * Find atom by snapshot entry
   * @param key Atom key in snapshot
   * @param entry Snapshot state entry
   * @returns Find result with atom and search details
   */
  find(key: string, entry: { name?: string; atomId?: string | symbol }): FindAtomResult {
    const searchDetails = {
      searchedByName: false,
      searchedById: false,
      searchedByFallback: false,
    };

    // Try to find atom by name FIRST (more reliable than ID for serialized snapshots)
    // ID can be ambiguous when multiple atoms have the same Symbol description
    if (entry.name) {
      searchDetails.searchedByName = true;
      const atom = this.findByName(entry.name);
      if (atom) {
        logger.log(
          `[AtomFinder] Found by name: ${entry.name}, id=${atom.id?.toString()}`
        );
        return {
          atom,
          foundBy: 'name',
          searchDetails,
        };
      }
    }

    // Try to find atom by ID if name didn't work
    if (entry.atomId) {
      searchDetails.searchedById = true;
      const atom = this.findById(entry.atomId);
      if (atom) {
        logger.log(
          `[AtomFinder] Found by id: ${String(entry.atomId)}, atom.name=${atom.name}`
        );
        return {
          atom,
          foundBy: 'id',
          searchDetails,
        };
      }
    }

    // If still not found, try fallback name search
    if (entry.name) {
      searchDetails.searchedByFallback = true;
      const atom = this.findByFallbackName(entry.name);
      if (atom) {
        logger.log(
          `[AtomFinder] Found by fallback name: ${entry.name}, id=${atom.id?.toString()}`
        );
        return {
          atom,
          foundBy: 'fallback-name',
          searchDetails,
        };
      }
    }

    logger.log(`[AtomFinder] Atom not found: ${key}`);
    return {
      atom: null,
      foundBy: null,
      searchDetails,
    };
  }

  /**
   * Find atom by name
   * @param name Atom name
   * @returns Atom or null
   */
  findByName(name: string): Atom<unknown> | null {
    return atomRegistry.getByName(name) as Atom<unknown> | null;
  }

  /**
   * Find atom by ID
   * @param atomId Atom ID (string or symbol)
   * @returns Atom or null
   */
  findById(atomId: string | symbol): Atom<unknown> | null {
    try {
      const allAtoms = atomRegistry.getAll() as Map<symbol, Atom<unknown>>;

      // If atomId is already a symbol, try direct lookup
      if (typeof atomId !== 'string') {
        return allAtoms.get(atomId) || null;
      }

      // Try to parse the symbol from string
      // Symbol.toString() returns "Symbol(description)" or "Symbol()"
      const match = atomId.match(/Symbol\((.*)\)$/);
      if (match) {
        const description = match[1] || undefined;
        // Find ALL atoms with matching description
        const matchingAtoms: Array<[symbol, Atom<unknown>]> = [];
        for (const [id, atom] of allAtoms) {
          if (id.description === description) {
            matchingAtoms.push([id, atom]);
          }
        }
        
        // If only one match, return it
        if (matchingAtoms.length === 1) {
          return matchingAtoms[0][1];
        }
        
        // If multiple matches, log warning and return first
        if (matchingAtoms.length > 1) {
          logger.warn(
            `[AtomFinder] Multiple atoms with same description "${description}": ${matchingAtoms.length} found`
          );
          // Return the most recently registered (last in map)
          return matchingAtoms[matchingAtoms.length - 1][1];
        }
      }

      // Try direct description match
      for (const [id, atom] of allAtoms) {
        if (id.description === atomId) {
          return atom;
        }
      }
    } catch (error) {
      logger.error('[AtomFinder] Failed to find atom by ID:', error);
    }

    return null;
  }

  /**
   * Find atom by fallback name matching
   * (for unnamed atoms or when name is the only reliable identifier)
   * @param name Atom name to search
   * @returns Atom or null
   */
  findByFallbackName(name: string): Atom<unknown> | null {
    const allAtoms = atomRegistry.getAll() as Map<symbol, Atom<unknown>>;
    for (const [_id, storedAtom] of allAtoms) {
      const storedName = storedAtom.name || storedAtom.id?.description || 'atom';
      if (storedName === name) {
        return storedAtom;
      }
    }
    return null;
  }

  /**
   * Find atom by ID string (legacy method for compatibility)
   * @param atomIdString Atom ID string
   * @returns Atom or null
   */
  findByIdString(atomIdString: string): Atom<unknown> | null {
    return this.findById(atomIdString);
  }
}
