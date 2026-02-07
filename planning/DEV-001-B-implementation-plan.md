# DEV-001-B Implementation Plan: Atom Registry Integration for Naming

## Overview
This document outlines the implementation plan for integrating the atom registry with the DevTools plugin to display atom names in DevTools actions.

## Implementation Steps

### 1. Update DevTools Configuration Types
- Add new configuration options to `DevToolsConfig` interface in `packages/devtools/src/types.ts`
- Add `showAtomNames` boolean flag to enable/disable atom name display
- Add `atomNameFormatter` function to customize atom name display

### 2. Import Atom Registry
- Import `atomRegistry` singleton in `packages/devtools/src/devtools-plugin.ts`
- Ensure proper import path to avoid circular dependencies

### 3. Enhance Action Metadata with Atom Names
- Modify the `enhanceStoreWithMetadata` method to include atom names in metadata
- Use `atomRegistry.getName(atom)` to get atom display names
- Add fallback for unregistered atoms

### 4. Update Configuration Handling
- Add new configuration options to the `DevToolsPlugin` constructor
- Implement default values for new configuration options
- Update configuration validation

### 5. Implement Fallback Strategies
- Add fallback naming for unregistered atoms
- Implement graceful degradation when registry is not available

### 6. Update Documentation
- Update README with new configuration options
- Add examples of atom name display
- Document fallback behavior

## File Modifications

### packages/devtools/src/types.ts
```typescript
export interface DevToolsConfig {
  // ... existing properties ...
  
  /** Enable display of atom names in DevTools actions */
  showAtomNames?: boolean;
  
  /** Custom formatter for atom names */
  atomNameFormatter?: (atom: any, defaultName: string) => string;
}
```

### packages/devtools/src/devtools-plugin.ts
```typescript
// Add import for atom registry
import { atomRegistry } from '../../core/src/atom-registry';

// In enhanceStoreWithMetadata method:
const metadata = {
  type: `SET ${this.getAtomName(atom)}`,
  timestamp: Date.now(),
  source: 'DevToolsPlugin',
  atomName: this.getAtomName(atom), // Add atom name to metadata
};
```

## Testing Plan

### 1. Unit Tests
- Test atom name display with registered atoms
- Test fallback behavior for unregistered atoms
- Test configuration options

### 2. Integration Tests
- Test with different atom types (primitive, computed, writable)
- Test with various naming scenarios

### 3. Edge Case Tests
- Test with registry not available
- Test with malformed atom objects
- Test with circular references

## Acceptance Criteria

- [ ] Atom names are displayed in DevTools actions when enabled
- [ ] Configuration options work correctly
- [ ] Fallback strategies work for unregistered atoms
- [ ] No breaking changes to existing API
- [ ] All tests pass with >90% coverage
- [ ] Documentation is updated