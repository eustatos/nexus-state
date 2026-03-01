## Task 1: Fix HistoryManager.add() Queue Logic with maxHistory Limit

**Filename:** `task-001-fix-historymanager-add-logic.md`

### Context

The current implementation of `HistoryManager.add()` has a critical logic error when handling the `maxHistory` limit. It pushes the current snapshot to past BEFORE checking the limit, then incorrectly trims the past array without preserving the correct history order.

### Current Problem

```typescript
add(snapshot: Snapshot): void {
  if (this.current) {
    this.past.push(this.current); // Current becomes past BEFORE limit check
  }
  this.current = snapshot;
  this.future = [];

  // Wrong: trims past without considering that current is separate
  if (this.past.length >= this.maxHistory) {
    this.past = this.past.slice(1); // Loses oldest snapshot
  }
}
```

### Requirements

1. Fix the logic to properly maintain history queue with `maxHistory` limit
2. Ensure that total history (past + current) never exceeds `maxHistory`
3. Preserve the correct order of snapshots for undo/redo operations
4. Add comprehensive tests for edge cases:
   - `maxHistory = 1`
   - `maxHistory = 0` (should disable history)
   - Adding when past is at limit
   - Adding when both past and future exist
5. Update all related methods (undo, redo, jumpTo) to work with new logic
6. Maintain backward compatibility with existing API

### Expected Behavior

- When adding new snapshot, push current to past first
- Then trim past to `maxHistory - 1` (reserving one slot for current)
- Never lose the most recent snapshots
- Clear future on new addition

### Technical Notes

- Use array slicing from the end: `this.past.slice(-(this.maxHistory - 1))`
- Consider edge case when `maxHistory <= 1`
- Add logging for debugging history state changes
- Update `getStats()` to reflect accurate counts

### Definition of Done

- [x] Fixed `add()` method with correct queue management
- [x] All tests passing for edge cases (27 tests)
- [ ] Updated documentation (in progress)
- [ ] Performance benchmark shows no degradation
- [ ] Code review completed

### SPR Requirements

- Follow single responsibility principle - keep method focused on adding snapshots
- Maintain clean code practices with proper error handling
- Add meaningful comments for complex logic
- Use descriptive variable names

---

**Note:** After completing this task, mark it as completed and provide a brief summary of changes made.
