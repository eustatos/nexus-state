# DevTools Demo

The DevTools Demo application demonstrates Nexus State's debugging capabilities.

## Overview

This demo application showcases:

- **State Inspection**: View all atoms and their current values
- **Time-Travel Debugging**: Navigate between different states
- **Action Tracking**: See all state changes with full history
- **Stack Traces**: Understand where state changes originate
- **Batch Updates**: Group related state changes for better organization

## Running the Demo

```bash
cd apps/demo-devtools
pnpm dev
```

## Features

### State Inspection

The DevTools panel shows all atoms in your state with their current values and names.

### Time-Travel Debugging

Navigate through the history of state changes:

1. Jump to any previous state
2. Step forward/backward through actions
3. Compare state snapshots

### Action Tracking

View all state changes with timestamps, payloads, and metadata.

### Stack Traces

Enable stack trace capture to see where state changes originate in your code.

### Batch Updates

Group related state changes into a single action for better organization.

## Source Code

The demo source is available in the repository:
[apps/demo-devtools/src/DevToolsDemo.jsx](https://github.com/nexus-state/nexus-state/blob/main/apps/demo-devtools/src/DevToolsDemo.jsx)

## Installation

```bash
npm install @nexus-state/devtools
```

See the [DevTools Integration Recipe](/recipes/devtools) for setup instructions.
