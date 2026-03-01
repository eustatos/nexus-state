# Examples

These examples demonstrate how to use Nexus State in various scenarios.

## Basic Examples

- [Counter](/examples/counter) - A simple counter implementation with increment/decrement/reset
- [Todo List](/examples/todo-list) - A todo list application with add/toggle/remove

## Advanced Examples

- [Forms](/examples/form) - Form handling with validation
- [Async Data](/examples/async-data) - Handling asynchronous data

## React-Specific Examples

- **Computed Atoms** - See the [Computed Atoms Demo](https://github.com/nexus-state/nexus-state/blob/main/apps/demo-react/src/computed-atoms-demo/index.jsx) in the repository for examples of:
  - Form with real-time validation
  - Selective updates (components only re-render when their atoms change)
  - Multiple computed values from the same source
  - Form batch updates
  - Render counters to demonstrate selective updates

- **DevTools Integration** - See the [DevTools Demo App](/examples/devtools-demo) for:
  - State inspection
  - Time-travel debugging
  - Action tracking
  - Stack traces

## Recipe Examples

- [DevTools Integration](/recipes/devtools) - Complete guide to debugging with DevTools
- [Forms with Validation](/recipes/forms) - Advanced form handling
- [Async Atoms](/recipes/async-atoms) - Handling async data
- [Caching](/recipes/caching) - Caching strategies