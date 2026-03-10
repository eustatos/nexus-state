/**
 * ComputedCacheManager - Manages caching for computed atoms
 *
 * Provides cache storage, expiration checking, and statistics
 * for computed atom values.
 */

import type { ComputedCache, ComputedAtomConfig } from './types';

/**
 * Cache entry with metadata
 */
interface CacheEntry extends ComputedCache {
  /** Cache key (atom ID) */
  key: symbol;
  /** Time when cache was created */
  timestamp: number;
  /** Number of times this entry was accessed */
  accessCount: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /** Number of cached entries */
  size: number;
  /** Number of cache hits */
  hits: number;
  /** Number of cache misses */
  misses: number;
  /** Hit rate (0-1) */
  hitRate: number;
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  /** Default cache TTL in milliseconds */
  defaultTTL: number;
  /** Maximum cache size */
  maxSize: number;
}

/**
 * ComputedCacheManager provides cache management
 * for computed atoms without external dependencies
 */
export class ComputedCacheManager {
  /** Cache storage */
  private cache: Map<symbol, CacheEntry> = new Map();

  /** Configuration */
  private config: CacheConfig;

  /** Cache hit counter */
  private hits: number = 0;

  /** Cache miss counter */
  private misses: number = 0;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      defaultTTL: config?.defaultTTL ?? 5000, // 5 seconds
      maxSize: config?.maxSize ?? 100,
    };
  }

  /**
   * Get value from cache
   * @param atomId - Atom ID
   * @param ttl - Optional custom TTL
   * @returns Cached value or null if not found/expired
   */
  get(atomId: symbol, ttl?: number): any {
    const entry = this.cache.get(atomId);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check expiration
    const entryTTL = ttl ?? this.config.defaultTTL;
    if (Date.now() - entry.timestamp > entryTTL) {
      this.cache.delete(atomId);
      this.misses++;
      return null;
    }

    // Update access count and timestamp
    entry.accessCount++;
    entry.timestamp = Date.now();
    this.hits++;

    return entry.value;
  }

  /**
   * Set value in cache
   * @param atomId - Atom ID
   * @param value - Value to cache
   * @param dependenciesVersion - Optional version number
   */
  set(atomId: symbol, value: any, dependenciesVersion?: number): void {
    // Only evict if this is a new key and cache is full
    if (this.cache.size >= this.config.maxSize && !this.cache.has(atomId)) {
      this.evictOldest();
    }

    this.cache.set(atomId, {
      key: atomId,
      value,
      timestamp: Date.now(),
      accessCount: this.cache.has(atomId) ? this.cache.get(atomId)!.accessCount : 1,
      dependenciesVersion: dependenciesVersion ?? 0,
    });
  }

  /**
   * Check if cache entry exists and is valid
   * @param atomId - Atom ID
   * @param ttl - Optional custom TTL
   * @returns True if cache entry is valid
   */
  has(atomId: symbol, ttl?: number): boolean {
    const entry = this.cache.get(atomId);
    if (!entry) return false;

    const entryTTL = ttl ?? this.config.defaultTTL;
    return Date.now() - entry.timestamp <= entryTTL;
  }

  /**
   * Invalidate cache entry
   * @param atomId - Atom ID
   * @returns True if entry was invalidated
   */
  invalidate(atomId: symbol): boolean {
    return this.cache.delete(atomId);
  }

  /**
   * Clear cache entry for specific atom
   * @param atomId - Atom ID
   */
  clear(atomId?: symbol): void {
    if (atomId) {
      this.cache.delete(atomId);
    } else {
      this.cache.clear();
      this.hits = 0;
      this.misses = 0;
    }
  }

  /**
   * Get cache statistics
   * @returns Statistics object
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? this.hits / total : 0,
    };
  }

  /**
   * Get all cached atom IDs
   * @returns Array of atom IDs
   */
  getAllKeys(): symbol[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get number of cached entries
   * @returns Cache size
   */
  getSize(): number {
    return this.cache.size;
  }

  /**
   * Update cache configuration
   * @param config - New configuration
   */
  configure(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   * @returns Current configuration
   */
  getConfig(): CacheConfig {
    return { ...this.config };
  }

  /**
   * Evict oldest entry from cache
   * @returns True if entry was evicted
   */
  private evictOldest(): boolean {
    if (this.cache.size === 0) return false;

    let oldestKey: symbol | null = null;
    let oldestTimestamp = Infinity;
    let lowestAccessCount = Infinity;

    // Find entry with lowest access count and oldest timestamp
    this.cache.forEach((entry, key) => {
      // Prioritize by access count first, then by timestamp
      if (entry.accessCount < lowestAccessCount ||
          (entry.accessCount === lowestAccessCount && entry.timestamp < oldestTimestamp)) {
        lowestAccessCount = entry.accessCount;
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.cache.delete(oldestKey);
      return true;
    }

    return false;
  }

  /**
   * Check if cache entry is expired
   * @param atomId - Atom ID
   * @param ttl - TTL to check against
   * @returns True if expired
   */
  isExpired(atomId: symbol, ttl?: number): boolean {
    const entry = this.cache.get(atomId);
    if (!entry) return true;

    const entryTTL = ttl ?? this.config.defaultTTL;
    return Date.now() - entry.timestamp > entryTTL;
  }

  /**
   * Get cache entry metadata
   * @param atomId - Atom ID
   * @returns Entry metadata or null
   */
  getEntryMetadata(atomId: symbol): {
    age: number;
    accessCount: number;
    dependenciesVersion: number;
  } | null {
    const entry = this.cache.get(atomId);
    if (!entry) return null;

    return {
      age: Date.now() - entry.timestamp,
      accessCount: entry.accessCount,
      dependenciesVersion: entry.dependenciesVersion,
    };
  }

  /**
   * Warm up cache with initial values
   * @param entries - Array of entries to cache
   */
  warmup(
    entries: Array<{ atomId: symbol; value: any; dependenciesVersion?: number }>
  ): void {
    entries.forEach((entry) => {
      this.set(entry.atomId, entry.value, entry.dependenciesVersion);
    });
  }
}
