# DEV-002-B: Snapshot Mapping System (Bidirectional)

## 🎯 Objective
Create bidirectional mapping between DevTools actions and time travel snapshots.

## 📋 Requirements
- Map DevTools action IDs to snapshot IDs
- Reverse mapping for lookup
- Mapping cleanup for swept actions
- Memory-efficient storage

## 🔧 Files to Create/Modify
1. `packages/devtools/src/snapshot-mapper.ts` - Mapping system
2. `packages/devtools/src/command-handler.ts` - Integration
3. `packages/devtools/src/types.ts` - Mapping types

## 🚀 Implementation Steps
1. Create SnapshotMapper class
2. Implement bidirectional mapping
3. Add mapping cleanup logic
4. Integrate with command handler

## 🧪 Testing
- Mapping accuracy tests
- Memory usage tests
- Cleanup functionality tests

## ⏱️ Estimated: 1.5-2 hours
## 🎯 Priority: High
## 📊 Status: Not Started