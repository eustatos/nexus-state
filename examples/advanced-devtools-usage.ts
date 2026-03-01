/**
 * Advanced DevTools usage example
 * Demonstrates action naming and stack trace capture features
 */

import { atom, createStore } from '@nexus-state/core';
import { devTools } from '@nexus-state/devtools';

// Create atoms
const countAtom = atom(0);
const userAtom = atom({ name: 'John', age: 30 });
const loadingAtom = atom(false);

// Create store with advanced DevTools configuration
const store = createStore([
  devTools({
    name: 'Advanced DevTools Example',
    enableStackTrace: true,
    traceLimit: 10,
    actionNaming: (atom, value) => {
      // Custom naming strategy
      if (atom === countAtom) {
        return typeof value === 'number' && value > 0 
          ? 'INCREMENT_COUNT' 
          : 'UPDATE_COUNT';
      }
      return `UPDATE_${atom.toString()}`;
    },
    enableGrouping: true,
    maxGroupSize: 50
  })
]);

// Example usage
console.log('Initial state:', store.getState());

// Update count with custom action name
store.set(countAtom, 1); // Will appear as "INCREMENT_COUNT" in DevTools

// Update user
store.set(userAtom, { name: 'Jane', age: 25 }); // Will appear as "UPDATE_userAtom"

// Grouped actions example
function performComplexOperation() {
  store.set(loadingAtom, true);
  store.set(countAtom, 5);
  store.set(userAtom, { name: 'Bob', age: 35 });
  store.set(loadingAtom, false);
}

performComplexOperation();

// Custom action creation
import { createAction, createActionGroup } from '@nexus-state/devtools';

const customAction = createAction('CUSTOM_ACTION', { data: 'example' });
console.log('Custom action:', customAction);

const actionGroup = createActionGroup([
  createAction('STEP_1'),
  createAction('STEP_2'),
  createAction('STEP_3')
], 'MULTI_STEP_PROCESS');

console.log('Action group:', actionGroup);

// Configuration example
import { getDevToolsConfig, updateDevToolsConfig } from '@nexus-state/devtools';

// Get current configuration
const config = getDevToolsConfig();
console.log('Current DevTools config:', config);

// Update configuration
updateDevToolsConfig({
  traceLimit: 15,
  enableGrouping: false
});

console.log('Updated DevTools config:', getDevToolsConfig());