import { atom, createStore } from '@nexus-state/core'
import { devTools } from '@nexus-state/devtools'

// Create store with devtools plugin
const store = createStore()

// Apply devtools plugin
const devtoolsPlugin = devTools()
devtoolsPlugin.apply(store)

// ============================================================================
// ATOMS
// ============================================================================

// Basic atoms
export const countAtom = atom(0, 'counter')
export const nameAtom = atom('John Doe', 'userName')
export const todosAtom = atom(['Learn Nexus State', 'Build app'], 'todos')
export const themeAtom = atom('light', 'theme')

// Computed atoms
export const doubleCountAtom = atom((get) => get(countAtom) * 2, 'doubleCount')
export const isEvenAtom = atom((get) => get(countAtom) % 2 === 0, 'isEven')
export const todoCountAtom = atom((get) => get(todosAtom).length, 'todoCount')

// Export store for use in components
export default store
