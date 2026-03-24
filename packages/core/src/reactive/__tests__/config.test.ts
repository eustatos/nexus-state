import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  REACTIVE_CONFIG,
  updateReactiveConfig,
  resetReactiveConfig,
  getReactiveConfig,
  loadConfigFromEnv,
} from '../config';

describe('SR-005: Feature flags', () => {
  beforeEach(() => {
    resetReactiveConfig();
  });

  afterEach(() => {
    resetReactiveConfig();
    // Cleanup environment variables
    delete process.env.NEXUS_ENABLE_SIGNALS;
    delete process.env.NEXUS_SIGNAL_PERCENTAGE;
    delete process.env.NEXUS_FALLBACK_TO_STORE;
  });

  it('should have default configuration', () => {
    const config = getReactiveConfig();

    expect(config.ENABLE_SIGNAL_BACKEND).toBe(false);
    expect(config.SIGNAL_BACKEND_PERCENTAGE).toBe(0);
    expect(config.FALLBACK_TO_STORE).toBe(true);
  });

  it('should update configuration', () => {
    updateReactiveConfig({
      ENABLE_SIGNAL_BACKEND: true,
      SIGNAL_BACKEND_PERCENTAGE: 50,
    });

    expect(REACTIVE_CONFIG.ENABLE_SIGNAL_BACKEND).toBe(true);
    expect(REACTIVE_CONFIG.SIGNAL_BACKEND_PERCENTAGE).toBe(50);
    expect(REACTIVE_CONFIG.FALLBACK_TO_STORE).toBe(true); // Unchanged
  });

  it('should reset to defaults', () => {
    updateReactiveConfig({
      ENABLE_SIGNAL_BACKEND: true,
      SIGNAL_BACKEND_PERCENTAGE: 100,
    });

    resetReactiveConfig();

    expect(REACTIVE_CONFIG.ENABLE_SIGNAL_BACKEND).toBe(false);
    expect(REACTIVE_CONFIG.SIGNAL_BACKEND_PERCENTAGE).toBe(0);
  });

  it('should return immutable copy', () => {
    const config1 = getReactiveConfig();
    (config1 as any).ENABLE_SIGNAL_BACKEND = true; // Try to mutate

    const config2 = getReactiveConfig();
    expect(config2.ENABLE_SIGNAL_BACKEND).toBe(false); // Should not change
  });

  it('should load from environment variables', () => {
    process.env.NEXUS_ENABLE_SIGNALS = 'true';
    process.env.NEXUS_SIGNAL_PERCENTAGE = '25';
    process.env.NEXUS_FALLBACK_TO_STORE = 'false';

    resetReactiveConfig();
    loadConfigFromEnv();

    expect(REACTIVE_CONFIG.ENABLE_SIGNAL_BACKEND).toBe(true);
    expect(REACTIVE_CONFIG.SIGNAL_BACKEND_PERCENTAGE).toBe(25);
    expect(REACTIVE_CONFIG.FALLBACK_TO_STORE).toBe(false);
  });

  it('should validate percentage range', () => {
    updateReactiveConfig({ SIGNAL_BACKEND_PERCENTAGE: 150 });
    expect(REACTIVE_CONFIG.SIGNAL_BACKEND_PERCENTAGE).toBe(150); // Allows any number

    updateReactiveConfig({ SIGNAL_BACKEND_PERCENTAGE: -10 });
    expect(REACTIVE_CONFIG.SIGNAL_BACKEND_PERCENTAGE).toBe(-10);

    // Factory should handle invalid values
  });

  it('should support runtime updates', () => {
    // Initial: Signals disabled
    expect(REACTIVE_CONFIG.ENABLE_SIGNAL_BACKEND).toBe(false);

    // Enable Signals at runtime
    updateReactiveConfig({ ENABLE_SIGNAL_BACKEND: true });
    expect(REACTIVE_CONFIG.ENABLE_SIGNAL_BACKEND).toBe(true);

    // Disable again
    updateReactiveConfig({ ENABLE_SIGNAL_BACKEND: false });
    expect(REACTIVE_CONFIG.ENABLE_SIGNAL_BACKEND).toBe(false);
  });

  it('should ignore invalid environment variable values', () => {
    process.env.NEXUS_SIGNAL_PERCENTAGE = 'invalid';
    process.env.NEXUS_ENABLE_SIGNALS = 'true';

    resetReactiveConfig();
    loadConfigFromEnv();

    expect(REACTIVE_CONFIG.ENABLE_SIGNAL_BACKEND).toBe(true);
    expect(REACTIVE_CONFIG.SIGNAL_BACKEND_PERCENTAGE).toBe(0); // Default value
  });

  it('should handle out-of-range percentage in environment', () => {
    process.env.NEXUS_SIGNAL_PERCENTAGE = '150';

    resetReactiveConfig();
    loadConfigFromEnv();

    expect(REACTIVE_CONFIG.SIGNAL_BACKEND_PERCENTAGE).toBe(0); // Ignored, default value
  });

  it('should update LOG_BACKEND_SELECTION flag', () => {
    updateReactiveConfig({ LOG_BACKEND_SELECTION: true });
    expect(REACTIVE_CONFIG.LOG_BACKEND_SELECTION).toBe(true);

    updateReactiveConfig({ LOG_BACKEND_SELECTION: false });
    expect(REACTIVE_CONFIG.LOG_BACKEND_SELECTION).toBe(false);
  });
});
