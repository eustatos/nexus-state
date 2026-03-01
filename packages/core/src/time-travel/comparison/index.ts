/**
 * Comparison module - Snapshot comparison and diff functionality
 *
 * @packageDocumentation
 * Provides comprehensive snapshot comparison capabilities including:
 * - Deep value comparison with diff generation
 * - Atom-level change detection
 * - Multiple output formats (summary, detailed, JSON)
 * - Visualization and export options
 */

// Types
export * from "./types";

// Core classes
export { ValueComparator } from "./ValueComparator";
export { SnapshotComparator } from "./SnapshotComparator";
export { ComparisonFormatter } from "./ComparisonFormatter";
