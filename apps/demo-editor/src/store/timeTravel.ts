import { SimpleTimeTravel } from '@nexus-state/core'
import { editorStore } from './store'

/**
 * Time-travel configuration for the editor
 *
 * Provides state change rollback and history navigation capabilities.
 */
export const editorTimeTravel = new SimpleTimeTravel(editorStore, {
  // Maximum number of snapshots to keep in history
  maxHistory: 100,

  // Disable auto-snapshots — using debounce hook
  autoCapture: false,

  // Delta compression for memory efficiency
  deltaSnapshots: {
    enabled: true,
    fullSnapshotInterval: 10,        // Full snapshot every 10 changes
    maxDeltaChainLength: 20,         // Maximum delta chain length
    changeDetection: 'deep'          // Deep change detection
  },

  // TTL for atoms (cleanup old data)
  atomTTL: 300000, // 5 minutes

  // Tracking configuration
  trackingConfig: {
    autoTrack: true,                 // Automatically track new atoms
    trackComputed: true,             // Track computed atoms
    trackWritable: true,             // Track writable atoms
    trackPrimitive: true             // Track primitive values
  },

  // Cleanup strategy
  cleanupStrategy: 'lru',            // Least Recently Used
  gcInterval: 60000                  // Garbage collection every minute
})
