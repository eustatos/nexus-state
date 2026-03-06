/**
 * ComparisonService - Compares snapshots and visualizes differences
 *
 * Handles snapshot comparison, diff visualization, and export.
 */

import type { Snapshot } from '../types';
import {
  SnapshotComparator,
  ComparisonFormatter,
  type SnapshotComparison,
  type ComparisonOptions,
  type VisualizationFormat,
  type ExportFormat,
  type ComparisonFormat,
} from '../comparison';

export interface ComparisonServiceConfig {
  /** Default comparison options */
  defaultOptions?: ComparisonOptions;
  /** Default visualization format */
  defaultVisualizationFormat?: VisualizationFormat;
  /** Default comparison format */
  defaultComparisonFormat?: ComparisonFormat;
}

export interface ComparisonResult {
  /** Whether snapshots are different */
  different: boolean;
  /** Comparison details */
  comparison: SnapshotComparison;
  /** Formatted diff (if requested) */
  formattedDiff?: string;
}

/**
 * ComparisonService provides snapshot comparison
 * and visualization capabilities
 */
export class ComparisonService {
  private comparator: SnapshotComparator;
  private formatter: ComparisonFormatter;
  private config: ComparisonServiceConfig;

  constructor(config?: Partial<ComparisonServiceConfig>) {
    this.config = {
      defaultOptions: config?.defaultOptions,
      defaultVisualizationFormat: config?.defaultVisualizationFormat || 'tree' as VisualizationFormat,
      defaultComparisonFormat: config?.defaultComparisonFormat || 'summary' as ComparisonFormat,
    };

    this.comparator = new SnapshotComparator();
    this.formatter = new ComparisonFormatter();
  }

  /**
   * Compare two snapshots
   * @param snapshot1 First snapshot
   * @param snapshot2 Second snapshot
   * @param options Comparison options
   * @returns Comparison result
   */
  compare(
    snapshot1: Snapshot,
    snapshot2: Snapshot,
    options?: ComparisonOptions
  ): ComparisonResult {
    const compareOptions = options || this.config.defaultOptions;

    const comparison = this.comparator.compare(snapshot1, snapshot2, compareOptions);

    return {
      different: comparison.summary.hasChanges,
      comparison,
    };
  }

  /**
   * Compare and format the diff
   * @param snapshot1 First snapshot
   * @param snapshot2 Second snapshot
   * @param format Output format
   * @param options Comparison options
   * @returns Formatted comparison result
   */
  compareAndFormat(
    snapshot1: Snapshot,
    snapshot2: Snapshot,
    format?: ComparisonFormat,
    options?: ComparisonOptions
  ): ComparisonResult {
    const result = this.compare(snapshot1, snapshot2, options);
    const outputFormat = format || this.config.defaultComparisonFormat || 'summary';

    result.formattedDiff = this.formatter.format(result.comparison, outputFormat);

    return result;
  }

  /**
   * Visualize snapshot differences
   * @param comparison Comparison result
   * @param format Output format
   * @returns Formatted visualization
   */
  visualize(
    comparison: SnapshotComparison,
    format?: ComparisonFormat
  ): string {
    const outputFormat = format || this.config.defaultComparisonFormat || 'summary';
    return this.formatter.format(comparison, outputFormat);
  }

  /**
   * Export comparison result
   * @param comparison Comparison result
   * @param format Export format
   * @returns Exported string
   */
  export(
    comparison: SnapshotComparison,
    format: ExportFormat = 'json'
  ): string {
    return this.formatter.export(comparison, format);
  }

  /**
   * Get atoms that changed between snapshots
   * @param snapshot1 First snapshot
   * @param snapshot2 Second snapshot
   * @returns Array of changed atom names
   */
  getChangedAtoms(
    snapshot1: Snapshot,
    snapshot2: Snapshot
  ): Array<{
    name: string;
    oldValue: unknown;
    newValue: unknown;
  }> {
    const comparison = this.compare(snapshot1, snapshot2);
    return comparison.comparison.atoms
      .filter((atom) => atom.status === 'modified')
      .map((change) => ({
        name: change.atomName,
        oldValue: change.oldValue,
        newValue: change.newValue,
      }));
  }

  /**
   * Get atoms added in snapshot2 compared to snapshot1
   * @param snapshot1 First snapshot
   * @param snapshot2 Second snapshot
   * @returns Array of added atom names
   */
  getAddedAtoms(snapshot1: Snapshot, snapshot2: Snapshot): string[] {
    const comparison = this.compare(snapshot1, snapshot2);
    return comparison.comparison.atoms
      .filter((atom) => atom.status === 'added')
      .map((atom) => atom.atomName);
  }

  /**
   * Get atoms removed in snapshot2 compared to snapshot1
   * @param snapshot1 First snapshot
   * @param snapshot2 Second snapshot
   * @returns Array of removed atom names
   */
  getRemovedAtoms(snapshot1: Snapshot, snapshot2: Snapshot): string[] {
    const comparison = this.compare(snapshot1, snapshot2);
    return comparison.comparison.atoms
      .filter((atom) => atom.status === 'removed')
      .map((atom) => atom.atomName);
  }

  /**
   * Check if snapshots are equal
   * @param snapshot1 First snapshot
   * @param snapshot2 Second snapshot
   * @returns True if snapshots are equal
   */
  areEqual(snapshot1: Snapshot, snapshot2: Snapshot): boolean {
    return !this.compare(snapshot1, snapshot2).different;
  }

  /**
   * Get the comparator
   */
  getComparator(): SnapshotComparator {
    return this.comparator;
  }

  /**
   * Get the formatter
   */
  getFormatter(): ComparisonFormatter {
    return this.formatter;
  }

  /**
   * Get configuration
   */
  getConfig(): ComparisonServiceConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   * @param config New configuration
   */
  configure(config: Partial<ComparisonServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
