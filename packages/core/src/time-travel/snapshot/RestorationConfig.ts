/**
 * RestorationConfig - Manages restoration configuration
 */

import type {
  SnapshotRestorerConfig,
  TransactionalRestorerConfig,
  RestorationConfig as RestorationConfigType,
} from './types';

// Use Pick to avoid conflicts in overlapping properties
export interface MergedRestorationConfig
  extends Pick<SnapshotRestorerConfig, Exclude<keyof SnapshotRestorerConfig, 'onAtomNotFound' | 'batchRestore'>>,
    Pick<TransactionalRestorerConfig, Exclude<keyof TransactionalRestorerConfig, 'batchSize' | 'validateBeforeRestore' | 'rollbackOnError'>>,
    Pick<RestorationConfigType, 'onAtomNotFound' | 'batchRestore' | 'batchSize' | 'validateBeforeRestore' | 'rollbackOnError'> {}

/**
 * RestorationConfig provides unified configuration management
 * for restoration operations
 */
export class RestorationConfigManager {
  private snapshotConfig: SnapshotRestorerConfig;
  private transactionalConfig: TransactionalRestorerConfig;
  private restorationConfig: RestorationConfigType;

  constructor(
    snapshotConfig?: Partial<SnapshotRestorerConfig>,
    transactionalConfig?: Partial<TransactionalRestorerConfig>,
    restorationConfig?: Partial<RestorationConfigType>
  ) {
    this.snapshotConfig = {
      validateBeforeRestore: snapshotConfig?.validateBeforeRestore ?? true,
      strictMode: snapshotConfig?.strictMode ?? false,
      onAtomNotFound: snapshotConfig?.onAtomNotFound ?? 'skip',
      transform: snapshotConfig?.transform ?? null,
      batchRestore: snapshotConfig?.batchRestore ?? true,
      skipErrors: snapshotConfig?.skipErrors ?? true,
    };

    this.transactionalConfig = {
      enableTransactions: transactionalConfig?.enableTransactions ?? true,
      rollbackOnError: transactionalConfig?.rollbackOnError ?? true,
      validateBeforeRestore: transactionalConfig?.validateBeforeRestore ?? true,
      batchSize: transactionalConfig?.batchSize ?? 0,
      timeout: transactionalConfig?.timeout ?? 5000,
      onError: transactionalConfig?.onError ?? 'rollback',
      maxCheckpoints: transactionalConfig?.maxCheckpoints ?? 10,
      checkpointTimeout: transactionalConfig?.checkpointTimeout ?? 300000,
    };

    this.restorationConfig = {
      validateBeforeRestore: restorationConfig?.validateBeforeRestore ?? true,
      strictMode: restorationConfig?.strictMode ?? false,
      onAtomNotFound: restorationConfig?.onAtomNotFound ?? 'warn',
      batchRestore: restorationConfig?.batchRestore ?? true,
      batchSize: restorationConfig?.batchSize ?? 10,
      rollbackOnError: restorationConfig?.rollbackOnError ?? true,
      checkpointTimeout: restorationConfig?.checkpointTimeout ?? 5000,
      maxCheckpoints: restorationConfig?.maxCheckpoints ?? 50,
    };
  }

  /**
   * Get snapshot restorer configuration
   */
  getSnapshotConfig(): SnapshotRestorerConfig {
    return { ...this.snapshotConfig };
  }

  /**
   * Get transactional restorer configuration
   */
  getTransactionalConfig(): TransactionalRestorerConfig {
    return { ...this.transactionalConfig };
  }

  /**
   * Get restoration configuration
   */
  getRestorationConfig(): RestorationConfigType {
    return { ...this.restorationConfig };
  }

  /**
   * Get merged configuration
   */
  getMergedConfig(): MergedRestorationConfig {
    return {
      ...this.snapshotConfig,
      ...this.transactionalConfig,
      ...this.restorationConfig,
    } as MergedRestorationConfig;
  }

  /**
   * Update snapshot configuration
   * @param config Configuration to merge
   */
  updateSnapshotConfig(config: Partial<SnapshotRestorerConfig>): void {
    this.snapshotConfig = { ...this.snapshotConfig, ...config };
  }

  /**
   * Update transactional configuration
   * @param config Configuration to merge
   */
  updateTransactionalConfig(
    config: Partial<TransactionalRestorerConfig>
  ): void {
    this.transactionalConfig = { ...this.transactionalConfig, ...config };
  }

  /**
   * Update restoration configuration
   * @param config Configuration to merge
   */
  updateRestorationConfig(config: Partial<RestorationConfigType>): void {
    this.restorationConfig = { ...this.restorationConfig, ...config };
  }

  /**
   * Update all configurations
   * @param config Configuration to merge
   */
  updateAll(
    config: Partial<SnapshotRestorerConfig> &
      Partial<TransactionalRestorerConfig> &
      Partial<RestorationConfigType>
  ): void {
    this.updateSnapshotConfig(config);
    this.updateTransactionalConfig(config);
    this.updateRestorationConfig(config);
  }

  /**
   * Reset to default values
   */
  resetToDefaults(): void {
    this.snapshotConfig = {
      validateBeforeRestore: true,
      strictMode: false,
      onAtomNotFound: 'skip',
      transform: null,
      batchRestore: true,
      skipErrors: true,
    };

    this.transactionalConfig = {
      enableTransactions: true,
      rollbackOnError: true,
      validateBeforeRestore: true,
      batchSize: 0,
      timeout: 5000,
      onError: 'rollback',
      maxCheckpoints: 10,
      checkpointTimeout: 300000,
    };

    this.restorationConfig = {
      validateBeforeRestore: true,
      strictMode: false,
      onAtomNotFound: 'warn',
      batchRestore: true,
      batchSize: 10,
      rollbackOnError: true,
      checkpointTimeout: 5000,
      maxCheckpoints: 50,
    };
  }

  /**
   * Validate configuration
   * @returns Validation result
   */
  validate(): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate snapshot config
    if (
      this.snapshotConfig.onAtomNotFound !== 'skip' &&
      this.snapshotConfig.onAtomNotFound !== 'warn' &&
      this.snapshotConfig.onAtomNotFound !== 'throw'
    ) {
      errors.push('Invalid onAtomNotFound value');
    }

    // Validate transactional config
    if (this.transactionalConfig.batchSize! < 0) {
      errors.push('batchSize must be non-negative');
    }

    if (this.transactionalConfig.timeout! < 0) {
      errors.push('timeout must be non-negative');
    }

    if (this.transactionalConfig.maxCheckpoints! < 1) {
      errors.push('maxCheckpoints must be at least 1');
    }

    if (this.transactionalConfig.checkpointTimeout! < 0) {
      errors.push('checkpointTimeout must be non-negative');
    }

    // Validate restoration config
    if (this.restorationConfig.batchSize! < 0) {
      errors.push('restoration batchSize must be non-negative');
    }

    if (this.restorationConfig.maxCheckpoints! < 1) {
      errors.push('restoration maxCheckpoints must be at least 1');
    }

    // Warnings
    if (this.transactionalConfig.timeout! > 60000) {
      warnings.push(
        'Large timeout value may cause long-running restorations'
      );
    }

    if (this.transactionalConfig.maxCheckpoints! > 100) {
      warnings.push(
        'Large maxCheckpoints value may consume significant memory'
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get configuration as JSON-serializable object
   */
  toJSON(): Record<string, unknown> {
    return {
      snapshot: this.snapshotConfig,
      transactional: this.transactionalConfig,
      restoration: this.restorationConfig,
    };
  }

  /**
   * Create config from JSON
   * @param json JSON object
   * @returns New RestorationConfigManager instance
   */
  static fromJSON(
    json: Record<string, unknown>
  ): RestorationConfigManager {
    const config = new RestorationConfigManager();

    if (typeof json === 'object' && json !== null) {
      if ('snapshot' in json && typeof json.snapshot === 'object') {
        config.updateSnapshotConfig(json.snapshot as Partial<SnapshotRestorerConfig>);
      }
      if ('transactional' in json && typeof json.transactional === 'object') {
        config.updateTransactionalConfig(json.transactional as Partial<TransactionalRestorerConfig>);
      }
      if ('restoration' in json && typeof json.restoration === 'object') {
        config.updateRestorationConfig(json.restoration as Partial<RestorationConfigType>);
      }
    }

    return config;
  }
}
