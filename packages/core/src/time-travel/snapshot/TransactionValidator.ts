/**
 * TransactionValidator - Validates snapshots for transactional restoration
 *
 * Provides validation specifically for transactional restoration operations,
 * checking snapshot structure and atom entries.
 */

import type { Snapshot } from '../types';

export interface TransactionValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Error messages */
  errors: string[];
  /** Warning messages */
  warnings: string[];
}

export interface TransactionValidatorConfig {
  /** Require snapshot ID */
  requireId: boolean;
  /** Require valid metadata */
  requireMetadata: boolean;
  /** Require at least one atom */
  requireAtoms: boolean;
  /** Warn on missing atom values */
  warnOnMissingValues: boolean;
}

/**
 * TransactionValidator provides snapshot validation
 * for transactional restoration operations
 */
export class TransactionValidator {
  private config: TransactionValidatorConfig;

  constructor(config?: Partial<TransactionValidatorConfig>) {
    this.config = {
      requireId: config?.requireId ?? true,
      requireMetadata: config?.requireMetadata ?? true,
      requireAtoms: config?.requireAtoms ?? false,
      warnOnMissingValues: config?.warnOnMissingValues ?? true,
    };
  }

  /**
   * Validate snapshot for transactional restoration
   * @param snapshot Snapshot to validate
   * @returns Validation result
   */
  validate(snapshot: Snapshot): TransactionValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check null/undefined
    if (!snapshot) {
      errors.push('Snapshot is null or undefined');
      return { valid: false, errors, warnings };
    }

    // Check ID
    if (this.config.requireId && !snapshot.id) {
      errors.push('Snapshot missing ID');
    }

    // Check state
    if (!snapshot.state || typeof snapshot.state !== 'object') {
      errors.push('Snapshot state is invalid');
    }

    // Check metadata
    if (this.config.requireMetadata) {
      if (!snapshot.metadata) {
        errors.push('Snapshot missing metadata');
      } else {
        if (typeof snapshot.metadata.timestamp !== 'number') {
          errors.push('Snapshot timestamp is invalid');
        }
      }
    }

    // Check atom entries
    if (snapshot.state) {
      const entries = Object.entries(snapshot.state);

      // Check if at least one atom is required
      if (this.config.requireAtoms && entries.length === 0) {
        errors.push('Snapshot contains no atoms');
      }

      // Validate each atom entry
      entries.forEach(([key, entry]) => {
        // Check for missing values
        if (
          this.config.warnOnMissingValues &&
          !entry.value &&
          entry.value !== 0 &&
          entry.value !== false
        ) {
          warnings.push(`Atom ${key} has no value`);
        }

        // Check for missing type
        if (!entry.type) {
          errors.push(`Atom ${key} missing type`);
        }

        // Check for missing name
        if (!entry.name) {
          warnings.push(`Atom ${key} missing name`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Quick validation check
   * @param snapshot Snapshot to validate
   * @returns True if valid
   */
  isValid(snapshot: Snapshot): boolean {
    return this.validate(snapshot).valid;
  }

  /**
   * Validate and throw on error
   * @param snapshot Snapshot to validate
   * @throws Error if validation fails
   */
  validateOrThrow(snapshot: Snapshot): void {
    const result = this.validate(snapshot);
    if (!result.valid) {
      throw new Error(
        `Snapshot validation failed: ${result.errors.join(', ')}`
      );
    }
  }

  /**
   * Update configuration
   * @param config New configuration
   */
  configure(config: Partial<TransactionValidatorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): TransactionValidatorConfig {
    return { ...this.config };
  }
}
