# @nexus-state/time-travel

Time travel debugging for Nexus State

## Installation

```bash
npm install @nexus-state/time-travel
```

## Usage

### Basic Usage

```typescript
import { atom, createStore } from '@nexus-state/core';
import { TimeTravelController } from '@nexus-state/time-travel';

// Create a store
const store = createStore();

// Create atoms
const countAtom = atom(0);

// Create time travel controller
const controller = new TimeTravelController(store, {
  maxHistory: 100,
  autoCapture: true,
});

// Capture snapshots
controller.capture('increment');

// Navigate through history
controller.undo();
controller.redo();
controller.jumpTo(5);

// Get history
const history = controller.getHistory();
```

### Using SimpleTimeTravel

```typescript
import { atom, createStore } from '@nexus-state/core';
import { SimpleTimeTravel } from '@nexus-state/time-travel';

const store = createStore();
const timeTravel = new SimpleTimeTravel(store, {
  maxHistory: 100,
  autoCapture: true,
});

timeTravel.capture('action');
timeTravel.undo();
timeTravel.redo();
```

### Compression

```typescript
import { Compression } from '@nexus-state/time-travel';

// Use compression strategies
const controller = new TimeTravelController(store, {
  compression: {
    strategy: 'time-based',
    maxAge: 3600000, // 1 hour
  },
});
```

## API

### TimeTravelController

- `capture(action?: string)`: Capture a snapshot
- `undo()`: Undo to previous snapshot
- `redo()`: Redo to next snapshot
- `jumpTo(index)`: Jump to specific snapshot
- `canUndo()`: Check if undo available
- `canRedo()`: Check if redo available
- `getHistory()`: Get history array
- `clearHistory()`: Clear history
- `subscribe(eventType, listener)`: Subscribe to events
- `dispose()`: Clean up resources

### SimpleTimeTravel

Simplified wrapper with the same methods as TimeTravelController.

## License

MIT
