# @nexus-state/devtools - Roadmap

> **Developer tools package roadmap - debugging, time travel, and DevTools integration**

---

## 📦 Package Overview

**Current Version:** 0.1.5  
**Status:** Pre-release (experimental)  
**Maintainer:** Nexus State DevTools Team  
**Last Updated:** 2026-02-26

### Purpose
Browser DevTools integration, time travel debugging, and development utilities for Nexus State.

### Dependencies
- `@nexus-state/core`: workspace:*
- Redux DevTools Extension (optional)

---

## 🎯 Current State (v0.1.5)

### ✅ What Works
- Redux DevTools Extension integration
- Basic action tracking
- State snapshots
- Time travel (undo/redo)
- Atom name display
- Action grouping

### ⚠️ Known Issues
- Performance issues with large state (>1000 atoms)
- Time travel bugs (jump-to-snapshot)
- Memory leaks in long debugging sessions
- No production mode (always enabled)
- Missing snapshot comparison
- No action filtering

### 📊 Metrics
| Metric | Current | Target v1.0 |
|--------|---------|-------------|
| State Serialization | 300ms (1k atoms) | <50ms |
| Memory Usage | 150MB (10k actions) | <50MB |
| Bundle Size | 12KB | <8KB |
| DevTools Tests | 25 tests | 100+ tests |

---

## 🗓️ Roadmap by Version

---

## v0.2.0 - Performance & Stability

**Target:** March 31, 2026  
**Focus:** Fix critical bugs and optimize performance

### Goals
- Fix all time travel bugs
- Optimize state serialization
- Reduce memory usage
- Production mode support

### Features

#### 🐛 Bug Fixes (Critical)
```typescript
// Fix: Jump to snapshot not working
// Current: Restores wrong state
// Fixed: Correctly restores exact snapshot

// Fix: Memory leaks in action history
// Current: Unbounded action history
// Fixed: Configurable max history size

const store = createStore({
  devtools: {
    maxHistorySize: 50, // Limit action history
    enabled: process.env.NODE_ENV === 'development'
  }
});
```

#### ⚡ Performance Optimizations
```typescript
// Lazy serialization (only serialize when DevTools opened)
const devtools = createDevToolsPlugin({
  lazySerialize: true, // Only serialize when needed
  
  // Custom serializer for large objects
  serialize: (value) => {
    if (value instanceof Map) {
      return `Map(${value.size} entries)`;
    }
    return value;
  }
});

// Incremental serialization (only changed atoms)
const devtools = createDevToolsPlugin({
  strategy: 'incremental' // vs 'full' (default)
});
```

#### 🔧 Production Mode
```typescript
// Automatically disabled in production
const store = createStore({
  devtools: {
    enabled: process.env.NODE_ENV === 'development',
    
    // Override for production debugging
    enableInProduction: false,
    
    // Conditional enable
    enabled: window.location.search.includes('debug=true')
  }
});

// Zero overhead when disabled
// No code in production bundle (tree-shaken)
```

### Breaking Changes
- None (maintaining 0.x compatibility)

---

## v1.0.0 - Production Ready DevTools

**Target:** June 30, 2026  
**Focus:** Enterprise-grade debugging experience

### Goals
- Full Redux DevTools parity
- Advanced time travel
- Production debugging support
- Performance profiling

### Features

#### 🎯 Advanced Time Travel
```typescript
const store = createStore({
  devtools: {
    timeTravel: {
      enabled: true,
      
      // Branching timelines
      branching: true, // Create timeline branches
      
      // Snapshot compression
      compression: {
        enabled: true,
        algorithm: 'delta', // or 'lz-string'
        threshold: 100 // Compress after 100 snapshots
      },
      
      // Persistence
      persist: {
        storage: 'indexeddb',
        key: 'devtools-history'
      }
    }
  }
});

// API for branching
store.devtools.createBranch('experimental-feature');
store.devtools.switchBranch('main');
store.devtools.mergeBranch('experimental-feature');
```

#### 📊 State Comparison
```typescript
// Visual diff between states
store.devtools.diff(snapshot1, snapshot2);

// Returns:
{
  added: [{ atom: userAtom, value: newUser }],
  removed: [{ atom: tempAtom, value: null }],
  changed: [
    { 
      atom: countAtom, 
      before: 5, 
      after: 10,
      path: 'countAtom'
    }
  ]
}

// In DevTools UI:
// ✅ Added: userAtom = { name: "John" }
// ❌ Removed: tempAtom
// 🔄 Changed: countAtom: 5 → 10
```

#### 🔍 Action Filtering & Search
```typescript
// Filter actions by type
store.devtools.filter({
  type: 'SET_ATOM',
  atomId: 'userAtom',
  timeRange: [startTime, endTime]
});

// Search actions by content
store.devtools.search('user'); // Find all actions mentioning "user"

// Export filtered actions
const actions = store.devtools.exportActions({ format: 'json' });
```

#### 📈 Performance Profiling
```typescript
const store = createStore({
  devtools: {
    profiling: {
      enabled: true,
      
      // Track performance metrics
      metrics: [
        'renderTime',      // Component re-render time
        'computeTime',     // Computed atom calculation time
        'subscribeTime',   // Subscription overhead
        'serializeTime'    // Serialization time
      ],
      
      // Performance thresholds
      thresholds: {
        slowRender: 16,    // >16ms re-render warning
        slowCompute: 5,    // >5ms computation warning
      }
    }
  }
});

// In DevTools:
// ⚠️ Slow computation detected in `expensiveAtom`: 12ms
// 💡 Suggestion: Consider memoization or lazy evaluation
```

#### 🎨 Custom Action Names
```typescript
// Auto-generate descriptive action names
const devtools = createDevToolsPlugin({
  actionNaming: {
    strategy: 'auto', // or 'manual' or custom function
    
    // Custom naming function
    nameAction: (atom, value, type) => {
      if (atom.debugLabel) {
        return `${type}: ${atom.debugLabel}`;
      }
      return `${type}: Atom(${atom.id})`;
    }
  }
});

// In DevTools:
// Instead of: "SET_ATOM"
// Shows:      "SET: User Profile"
```

#### 🎭 State Replay
```typescript
// Replay actions from production logs
const productionActions = await fetch('/api/error-report/123');

store.devtools.replay(productionActions, {
  speed: 1.0,        // Real-time
  breakpoints: [],   // Pause on specific actions
  onAction: (action) => {
    console.log('Replaying:', action);
  }
});

// Use case: Reproduce bugs from production
```

### API Additions
- `devtools.createBranch()` - Timeline branching
- `devtools.diff()` - State comparison
- `devtools.filter()` - Action filtering
- `devtools.profile()` - Performance profiling
- `devtools.replay()` - Action replay
- `devtools.export()` - Export state/actions

---

## v1.1.0 - Advanced Debugging

**Target:** September 30, 2026  
**Focus:** Next-gen debugging features

### Features

#### 🕵️ Dependency Graph Visualization
```typescript
// Visualize atom dependencies
store.devtools.visualize({
  type: 'dependency-graph',
  atoms: [userAtom, profileAtom, settingsAtom],
  
  // Graph options
  layout: 'hierarchical', // or 'force-directed'
  highlightPath: true,    // Highlight dependency path
  showSubscribers: true   // Show component subscribers
});

// In DevTools:
//     userAtom
//        ├─→ profileAtom
//        │      └─→ displayNameAtom
//        └─→ settingsAtom
//
// Subscribers:
//   - UserProfile component
//   - Header component
```

#### 📸 Snapshot Management
```typescript
// Named snapshots for testing
store.devtools.createSnapshot('before-login');
store.devtools.createSnapshot('after-login');

// Compare snapshots
const diff = store.devtools.compareSnapshots(
  'before-login',
  'after-login'
);

// Export snapshot for tests
const snapshot = store.devtools.exportSnapshot('after-login');
// Use in test: store.loadSnapshot(snapshot);
```

#### 🎯 Atom Inspector
```typescript
// Deep inspection of atom state
store.devtools.inspect(userAtom);

// Returns:
{
  atom: userAtom,
  value: { name: 'John', age: 30 },
  subscribers: [
    { component: 'UserProfile', renderCount: 5 },
    { component: 'Header', renderCount: 2 }
  ],
  dependencies: [], // For computed atoms
  dependents: [profileAtom, settingsAtom],
  history: [
    { timestamp: 123, value: { name: 'John', age: 29 } },
    { timestamp: 456, value: { name: 'John', age: 30 } }
  ],
  performance: {
    avgRenderTime: '0.3ms',
    totalReads: 47,
    totalWrites: 3
  }
}
```

#### 🔔 Smart Notifications
```typescript
const devtools = createDevToolsPlugin({
  notifications: {
    // Warn about performance issues
    slowComputations: true,
    
    // Warn about potential bugs
    circularDependencies: true,
    memoryLeaks: true,
    
    // Custom notifications
    custom: [
      {
        name: 'Large State Warning',
        condition: (state) => Object.keys(state).length > 1000,
        message: 'State has >1000 atoms. Consider cleanup.',
        severity: 'warning'
      }
    ]
  }
});
```

#### 🎨 Custom DevTools Panels
```typescript
// Add custom panels to DevTools
store.devtools.addPanel({
  name: 'User Activity',
  icon: '👤',
  
  render: (container) => {
    const userActions = store.devtools.getActions({
      filter: (action) => action.atom.tags?.includes('user')
    });
    
    container.innerHTML = `
      <h3>User Actions: ${userActions.length}</h3>
      <ul>${userActions.map(a => `<li>${a.type}</li>`).join('')}</ul>
    `;
  }
});
```

---

## v1.2.0 - Standalone DevTools

**Target:** December 31, 2026  
**Focus:** Independent DevTools application

### Features

#### 🖥️ Standalone Chrome Extension
```typescript
// Instead of Redux DevTools Extension dependency
// Nexus State gets its own Chrome extension

// Features:
// - Better UI (designed for atoms)
// - Faster performance
// - Offline support
// - Multi-tab debugging
```

#### 🌐 Web-based DevTools
```typescript
// Standalone web app for debugging
// http://devtools.nexus-state.dev

// Connect remote apps
const store = createStore({
  devtools: {
    remote: {
      enabled: true,
      url: 'ws://devtools.nexus-state.dev',
      appId: 'my-app-123'
    }
  }
});

// Use cases:
// - Debug mobile apps from desktop
// - Debug production apps (with auth)
// - Team debugging (shared session)
```

#### 📱 React Native DevTools
```typescript
// Native mobile debugging
import { createDevToolsPlugin } from '@nexus-state/devtools/native';

const store = createStore({
  plugins: [
    createDevToolsPlugin({
      // Shake device to open
      activation: 'shake',
      
      // Or button in debug menu
      debugMenu: true
    })
  ]
});
```

---

## v2.0.0 - AI-Powered Debugging

**Target:** Q2 2027  
**Status:** Vision / Exploration

### Potential Features

#### 🤖 AI Suggestions
```typescript
// AI explains why state changed
const explanation = await store.devtools.ai.explain({
  action: lastAction,
  context: 'unexpected'
});

// Returns:
// "This state change was triggered by UserProfile component
//  calling setUser() in a useEffect hook. The effect ran 3 times
//  due to missing dependency array. Suggestion: Add [userId] 
//  to useEffect dependencies."
```

#### 🔮 Predictive Debugging
```typescript
// AI predicts potential bugs
const warnings = await store.devtools.ai.analyze();

// Returns:
[
  {
    type: 'potential-memory-leak',
    confidence: 0.89,
    location: 'UserProfile component',
    suggestion: 'Subscription not cleaned up in useEffect'
  },
  {
    type: 'performance-issue',
    confidence: 0.76,
    location: 'expensiveAtom',
    suggestion: 'Consider memoization or lazy evaluation'
  }
]
```

#### 🎯 Auto-fix Suggestions
```typescript
// AI generates fix for common issues
const fix = await store.devtools.ai.suggestFix(issue);

// Returns:
{
  description: 'Add cleanup to useEffect',
  diff: `
    useEffect(() => {
      const unsub = store.subscribe(atom, callback);
  +   return () => unsub();
    }, []);
  `,
  confidence: 0.95
}
```

---

## 🚫 Non-Goals

### Will NOT Support
- ❌ Visual state editing (too dangerous in production)
- ❌ Redux middleware compatibility (different architecture)
- ❌ Built-in error reporting (use Sentry/Datadog)
- ❌ Network request tracking (use browser DevTools)

### Design Principles
1. **Zero production overhead** - Tree-shake in production
2. **Performance first** - Debugging shouldn't slow app
3. **Privacy** - No data sent to external servers (unless explicit)
4. **Extensible** - Custom panels and plugins
5. **Framework agnostic** - Works with React/Vue/Svelte

---

## 📊 Success Metrics

### Quality Gates (must pass for each release)

#### v1.0.0
- [ ] Redux DevTools full parity
- [ ] <8KB bundle size
- [ ] <50ms serialization (1000 atoms)
- [ ] Zero production overhead
- [ ] 100+ tests
- [ ] Memory leaks fixed

#### v1.5.0
- [ ] Standalone Chrome extension
- [ ] Visual dependency graph
- [ ] Performance profiling
- [ ] State replay working

#### v2.0.0
- [ ] AI-powered suggestions
- [ ] Predictive debugging
- [ ] Auto-fix generation

---

## 🔬 Technical Challenges

### Challenge 1: Serialization Performance

**Problem:** Serializing large state is slow

**Solutions:**
1. **Lazy serialization** - Only serialize when DevTools opened
2. **Incremental serialization** - Only changed atoms
3. **Custom serializers** - Skip large objects
4. **Web Worker** - Offload serialization to worker thread

```typescript
// Web Worker serialization (v1.2+)
const devtools = createDevToolsPlugin({
  serialization: {
    worker: true, // Use Web Worker
    batchSize: 100 // Serialize in batches
  }
});
```

### Challenge 2: Time Travel with Computed Atoms

**Problem:** Restoring snapshots with computed atoms is complex

**Current Approach:** Re-compute all computed atoms on restore

**Future Approach:** Cache computed results in snapshot

```typescript
// Snapshot includes computed values
{
  primitiveAtoms: { userAtom: { name: 'John' } },
  computedAtoms: { 
    fullNameAtom: 'John Doe', // Cached result
    meta: { dependencies: [userAtom] }
  }
}
```

### Challenge 3: Production Debugging

**Problem:** Can't debug production without exposing sensitive data

**Solution:** Secure remote debugging

```typescript
const devtools = createDevToolsPlugin({
  remote: {
    enabled: process.env.ENABLE_REMOTE_DEBUGGING === 'true',
    url: 'wss://secure-devtools.company.com',
    
    // Authentication
    auth: {
      token: process.env.DEVTOOLS_TOKEN,
      allowedDomains: ['*.company.com']
    },
    
    // Data sanitization
    sanitize: (value) => {
      // Remove sensitive data before sending
      if (value.password) delete value.password;
      return value;
    }
  }
});
```

---

## 🐛 Bug Triage Priority

### P0 - Critical
- DevTools crashes browser
- Memory leaks in production
- Security vulnerabilities
- Data loss in time travel

### P1 - High
- Time travel bugs
- Serialization errors
- Performance regressions
- Redux DevTools integration broken

### P2 - Medium
- UI/UX issues
- Missing features
- Documentation gaps
- Action naming improvements

### P3 - Low
- Nice-to-have features
- Visual improvements
- Additional metrics

---

## 📞 Contributing to DevTools

### How to Propose Features
1. Check this roadmap
2. Open GitHub Discussion with "DevTools: " prefix
3. Describe debugging use case
4. Wait for maintainer feedback

### Testing Requirements
- All features must have tests
- Performance benchmarks required
- Production mode must be tested
- Memory leaks must be checked

---

## 🔗 Related Packages

### Dependencies
- `@nexus-state/core` - Core state management

### Complementary Packages
- `@nexus-state/react` - React DevTools integration
- `@nexus-state/vue` - Vue DevTools integration

### Alternatives
- Redux DevTools Extension (fallback)
- Browser DevTools (basic debugging)

---

## 📚 Resources

### Documentation
- [DevTools Guide](../../docs/api/devtools.md)
- [Advanced DevTools](../../docs/api/devtools-advanced.md)
- [Time Travel Guide](../../docs/guides/time-travel.md)

### Community
- [GitHub Discussions](https://github.com/eustatos/nexus-state/discussions)
- [Discord #devtools Channel](https://discord.gg/nexus-state)

---

**Roadmap Owner:** DevTools Team  
**Review Cadence:** Monthly  
**Next Review:** 2026-03-26

---

> 💡 **Feedback Welcome:** Have ideas for better debugging? Share in [GitHub Discussions](https://github.com/eustatos/nexus-state/discussions)!
