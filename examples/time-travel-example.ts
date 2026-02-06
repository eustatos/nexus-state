/**
 * Example usage of the Time Travel functionality
 */

import { 
  createStore, 
  atom, 
  StateSnapshotManager, 
  StateRestorer, 
  ComputedAtomHandler 
} from '@nexus-state/core';
import { atomRegistry } from '@nexus-state/core';

// Create some atoms
const countAtom = atom(0, 'count');
const nameAtom = atom('John Doe', 'name');

// Create a computed atom
const greetingAtom = atom(
  (get) => `Hello, ${get(nameAtom)}! You have ${get(countAtom)} items.`,
  'greeting'
);

// Create a store
const store = createStore();

// Create time travel components
const snapshotManager = new StateSnapshotManager(atomRegistry);
const stateRestorer = new StateRestorer(atomRegistry);
const computedAtomHandler = new ComputedAtomHandler(atomRegistry);

// Function to create a snapshot
function createSnapshot(actionName: string) {
  const snapshot = snapshotManager.createSnapshot(actionName);
  console.log(`Snapshot created: ${snapshot.id} (${actionName})`);
  return snapshot;
}

// Function to restore state from a snapshot
function restoreFromSnapshot(snapshotId: string) {
  const snapshot = snapshotManager.getSnapshotById(snapshotId);
  if (snapshot) {
    const success = stateRestorer.restoreFromSnapshot(snapshot);
    if (success) {
      console.log(`State restored from snapshot: ${snapshotId}`);
    } else {
      console.error(`Failed to restore state from snapshot: ${snapshotId}`);
    }
    return success;
  } else {
    console.error(`Snapshot not found: ${snapshotId}`);
    return false;
  }
}

// Function to demonstrate time travel
function demonstrateTimeTravel() {
  console.log('=== Time Travel Example ===');
  
  // Initial state
  console.log('Initial state:');
  console.log('Count:', store.get(countAtom));
  console.log('Name:', store.get(nameAtom));
  console.log('Greeting:', store.get(greetingAtom));
  
  // Create initial snapshot
  createSnapshot('INITIAL_STATE');
  
  // Make some changes
  console.log('
--- Making changes ---');
  store.set(countAtom, 1);
  store.set(nameAtom, 'Jane Doe');
  console.log('Updated state:');
  console.log('Count:', store.get(countAtom));
  console.log('Name:', store.get(nameAtom));
  console.log('Greeting:', store.get(greetingAtom));
  
  // Create snapshot after changes
  const snapshot1 = createSnapshot('UPDATE_USER');
  
  // Make more changes
  console.log('
--- Making more changes ---');
  store.set(countAtom, 5);
  store.set(nameAtom, 'Bob Smith');
  console.log('Updated state:');
  console.log('Count:', store.get(countAtom));
  console.log('Name:', store.get(nameAtom));
  console.log('Greeting:', store.get(greetingAtom));
  
  // Create another snapshot
  const snapshot2 = createSnapshot('UPDATE_USER_AGAIN');
  
  // Make final changes
  console.log('
--- Making final changes ---');
  store.set(countAtom, 10);
  store.set(nameAtom, 'Alice Johnson');
  console.log('Final state:');
  console.log('Count:', store.get(countAtom));
  console.log('Name:', store.get(nameAtom));
  console.log('Greeting:', store.get(greetingAtom));
  
  // Create final snapshot
  const snapshot3 = createSnapshot('FINAL_UPDATE');
  
  // Demonstrate time travel
  console.log('
--- Time Travel Demo ---');
  console.log('Current state:');
  console.log('Count:', store.get(countAtom));
  console.log('Name:', store.get(nameAtom));
  console.log('Greeting:', store.get(greetingAtom));
  
  // Travel back to snapshot1
  console.log('
--- Traveling back to first update ---');
  restoreFromSnapshot(snapshot1.id);
  console.log('Restored state:');
  console.log('Count:', store.get(countAtom));
  console.log('Name:', store.get(nameAtom));
  console.log('Greeting:', store.get(greetingAtom));
  
  // Travel back to initial state
  console.log('
--- Traveling back to initial state ---');
  const snapshots = snapshotManager.getAllSnapshots();
  if (snapshots.length > 0) {
    restoreFromSnapshot(snapshots[0].id);
    console.log('Restored state:');
    console.log('Count:', store.get(countAtom));
    console.log('Name:', store.get(nameAtom));
    console.log('Greeting:', store.get(greetingAtom));
  }
  
  // Travel forward to snapshot2
  console.log('
--- Traveling forward to second update ---');
  restoreFromSnapshot(snapshot2.id);
  console.log('Restored state:');
  console.log('Count:', store.get(countAtom));
  console.log('Name:', store.get(nameAtom));
  console.log('Greeting:', store.get(greetingAtom));
}

// Run the demonstration
demonstrateTimeTravel();

// Export for potential use in other modules
export { 
  store, 
  snapshotManager, 
  stateRestorer, 
  computedAtomHandler,
  createSnapshot,
  restoreFromSnapshot,
  demonstrateTimeTravel
};