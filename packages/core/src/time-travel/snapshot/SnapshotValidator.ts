/**
 * SnapshotValidator - Validates snapshots and their contents
 */

import type { Snapshot } from "../types";
import type { ValidationResult, ValidationRule } from "./types";

export class SnapshotValidator {
  private rules: ValidationRule[] = [];
  private customValidators: Map<string, (snapshot: Snapshot) => boolean> =
    new Map();

  constructor() {
    this.setupDefaultRules();
  }

  /**
   * Setup default validation rules
   */
  private setupDefaultRules(): void {
    this.rules = [
      {
        name: "has_id",
        validate: (snapshot: Snapshot) => !!snapshot.id,
        message: "Snapshot must have an ID",
        level: "error",
      },
      {
        name: "has_timestamp",
        validate: (snapshot: Snapshot) =>
          !!snapshot.metadata?.timestamp &&
          typeof snapshot.metadata.timestamp === "number" &&
          snapshot.metadata.timestamp > 0,
        message: "Snapshot must have a valid timestamp",
        level: "error",
      },
      {
        name: "has_state",
        validate: (snapshot: Snapshot) =>
          !!snapshot.state && typeof snapshot.state === "object",
        message: "Snapshot must have a state object",
        level: "error",
      },
      {
        name: "has_atoms",
        validate: (snapshot: Snapshot) =>
          Object.keys(snapshot.state || {}).length > 0,
        message: "Snapshot should contain at least one atom",
        level: "warning",
      },
      {
        name: "valid_atom_entries",
        validate: (snapshot: Snapshot) => {
          return Object.values(snapshot.state || {}).every(
            (entry) =>
              entry &&
              typeof entry === "object" &&
              "value" in entry &&
              "type" in entry &&
              "name" in entry,
          );
        },
        message: "All atom entries must have value, type, and name",
        level: "error",
      },
      {
        name: "valid_atom_types",
        validate: (snapshot: Snapshot) => {
          const validTypes = [
            "primitive",
            "computed",
            "writable",
            "date",
            "regexp",
            "map",
            "set",
          ];
          return Object.values(snapshot.state || {}).every((entry) =>
            validTypes.includes(entry.type),
          );
        },
        message: "Atom types must be valid",
        level: "error",
      },
      {
        name: "timestamp_reasonable",
        validate: (snapshot: Snapshot) => {
          const now = Date.now();
          const timestamp = snapshot.metadata?.timestamp || 0;
          // Not in the future and not too old (older than 1 year)
          return (
            timestamp <= now && timestamp > now - 365 * 24 * 60 * 60 * 1000
          );
        },
        message: "Snapshot timestamp is unreasonable",
        level: "warning",
      },
      {
        name: "atom_count_matches",
        validate: (snapshot: Snapshot) => {
          const actualCount = Object.keys(snapshot.state || {}).length;
          const reportedCount = snapshot.metadata?.atomCount || 0;
          return actualCount === reportedCount;
        },
        message: "Actual atom count does not match metadata",
        level: "error",
      },
    ];
  }

  /**
   * Validate a single snapshot
   * @param snapshot Snapshot to validate
   * @returns Validation result
   */
  validate(snapshot: Snapshot): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    this.rules.forEach((rule) => {
      try {
        const isValid = rule.validate(snapshot);
        if (!isValid) {
          if (rule.level === "error") {
            errors.push(rule.message);
          } else {
            warnings.push(rule.message);
          }
        }
      } catch (error) {
        errors.push(`Rule ${rule.name} failed: ${error}`);
      }
    });

    // Run custom validators
    this.customValidators.forEach((validator, name) => {
      try {
        if (!validator(snapshot)) {
          warnings.push(`Custom validator "${name}" failed`);
        }
      } catch (error) {
        errors.push(`Custom validator "${name}" threw: ${error}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      info: [],
      timestamp: Date.now(),
      duration: 0,
      rulesChecked: this.rules.length,
    };
  }

  /**
   * Validate multiple snapshots
   * @param snapshots Snapshots to validate
   * @returns Array of validation results
   */
  validateMany(snapshots: Snapshot[]): ValidationResult[] {
    return snapshots.map((snapshot) => this.validate(snapshot));
  }

  /**
   * Validate snapshot sequence
   * @param snapshots Snapshots in sequence
   * @returns Validation result for the sequence
   */
  validateSequence(snapshots: Snapshot[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check each snapshot
    snapshots.forEach((snapshot, index) => {
      const result = this.validate(snapshot);
      if (!result.isValid) {
        errors.push(`Snapshot at index ${index}: ${result.errors.join(", ")}`);
      }
      warnings.push(
        ...result.warnings.map((w) => `Snapshot at index ${index}: ${w}`),
      );
    });

    // Check sequence-specific rules
    if (snapshots.length > 1) {
      // Check chronological order
      let lastTimestamp = 0;
      for (let i = 0; i < snapshots.length; i++) {
        const timestamp = snapshots[i].metadata?.timestamp || 0;
        if (timestamp < lastTimestamp) {
          errors.push(`Snapshots are not in chronological order at index ${i}`);
          break;
        }
        lastTimestamp = timestamp;
      }

      // Check for duplicate IDs
      const ids = new Set<string>();
      for (let i = 0; i < snapshots.length; i++) {
        const id = snapshots[i].id;
        if (ids.has(id)) {
          errors.push(`Duplicate snapshot ID at index ${i}: ${id}`);
        }
        ids.add(id);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      info: [],
      timestamp: Date.now(),
      duration: 0,
      rulesChecked: this.rules.length,
    };
  }

  /**
   * Add custom validation rule
   * @param name Rule name
   * @param validator Validator function
   * @param message Error message
   * @param level Error level
   */
  addRule(
    name: string,
    validator: (snapshot: Snapshot) => boolean,
    message: string,
    level: "error" | "warning" = "error",
  ): void {
    this.rules.push({
      name,
      validate: validator,
      message,
      level,
    });
  }

  /**
   * Add custom validator
   * @param name Validator name
   * @param validator Validator function
   */
  addCustomValidator(
    name: string,
    validator: (snapshot: Snapshot) => boolean,
  ): void {
    this.customValidators.set(name, validator);
  }

  /**
   * Remove validation rule
   * @param name Rule name
   */
  removeRule(name: string): void {
    this.rules = this.rules.filter((rule) => rule.name !== name);
  }

  /**
   * Remove custom validator
   * @param name Validator name
   */
  removeCustomValidator(name: string): void {
    this.customValidators.delete(name);
  }

  /**
   * Get all validation rules
   */
  getRules(): ValidationRule[] {
    return [...this.rules];
  }

  /**
   * Get all custom validators
   */
  getCustomValidators(): Map<string, (snapshot: Snapshot) => boolean> {
    return new Map(this.customValidators);
  }

  /**
   * Clear all custom validators
   */
  clearCustomValidators(): void {
    this.customValidators.clear();
  }

  /**
   * Reset to default rules
   */
  resetToDefault(): void {
    this.rules = [];
    this.customValidators.clear();
    this.setupDefaultRules();
  }

  /**
   * Check if snapshot is valid (quick check)
   * @param snapshot Snapshot to check
   */
  isValid(snapshot: Snapshot): boolean {
    return this.validate(snapshot).isValid;
  }

  /**
   * Get validation statistics
   * @param snapshots Snapshots to analyze
   */
  getStats(snapshots: Snapshot[]): {
    total: number;
    valid: number;
    invalid: number;
    warnings: number;
    averageErrorsPerSnapshot: number;
  } {
    const results = this.validateMany(snapshots);

    const valid = results.filter((r) => r.isValid).length;
    const invalid = results.filter((r) => !r.isValid).length;
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    const totalWarnings = results.reduce(
      (sum, r) => sum + r.warnings.length,
      0,
    );

    return {
      total: snapshots.length,
      valid,
      invalid,
      warnings: totalWarnings,
      averageErrorsPerSnapshot: totalErrors / snapshots.length,
    };
  }
}
