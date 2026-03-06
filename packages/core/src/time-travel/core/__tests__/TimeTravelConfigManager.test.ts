/**
 * Tests for TimeTravelConfigManager
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TimeTravelConfigManager } from '../TimeTravelConfigManager';

describe('TimeTravelConfigManager', () => {
  let configManager: TimeTravelConfigManager;

  beforeEach(() => {
    configManager = new TimeTravelConfigManager();
  });

  describe('constructor', () => {
    it('should create with default values', () => {
      const config = configManager.getConfig();

      expect(config.maxHistory).toBe(50);
      expect(config.autoCapture).toBe(false);
      expect(config.ttl).toBe(300000);
      expect(config.cleanupInterval).toBe(60000);
    });

    it('should accept custom maxHistory', () => {
      const manager = new TimeTravelConfigManager({ maxHistory: 100 });
      expect(manager.getMaxHistory()).toBe(100);
    });

    it('should accept custom autoCapture', () => {
      const manager = new TimeTravelConfigManager({ autoCapture: true });
      expect(manager.getAutoCapture()).toBe(true);
    });

    it('should accept custom ttl', () => {
      const manager = new TimeTravelConfigManager({ ttl: 600000 });
      expect(manager.getTTL()).toBe(600000);
    });

    it('should accept custom cleanupInterval', () => {
      const manager = new TimeTravelConfigManager({ cleanupInterval: 120000 });
      expect(manager.getCleanupInterval()).toBe(120000);
    });

    it('should accept deltaSnapshots config', () => {
      const manager = new TimeTravelConfigManager({
        deltaSnapshots: { enabled: true, fullSnapshotInterval: 10 },
      });
      expect(manager.isDeltaSnapshotsEnabled()).toBe(true);
    });
  });

  describe('getConfig()', () => {
    it('should return a copy of configuration', () => {
      const config1 = configManager.getConfig();
      const config2 = configManager.getConfig();

      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2);
    });

    it('should return all configuration values', () => {
      const config = configManager.getConfig();

      expect(config).toHaveProperty('maxHistory');
      expect(config).toHaveProperty('autoCapture');
      expect(config).toHaveProperty('ttl');
      expect(config).toHaveProperty('cleanupInterval');
    });
  });

  describe('getValue()', () => {
    it('should return specific config value', () => {
      expect(configManager.getValue('maxHistory')).toBe(50);
      expect(configManager.getValue('autoCapture')).toBe(false);
      expect(configManager.getValue('ttl')).toBe(300000);
    });
  });

  describe('configure()', () => {
    it('should update configuration', () => {
      configManager.configure({ maxHistory: 100 });
      expect(configManager.getMaxHistory()).toBe(100);
    });

    it('should merge configuration', () => {
      configManager.configure({ maxHistory: 100 });
      configManager.configure({ autoCapture: true });

      const config = configManager.getConfig();
      expect(config.maxHistory).toBe(100);
      expect(config.autoCapture).toBe(true);
    });

    it('should override existing configuration', () => {
      configManager.configure({ maxHistory: 100 });
      configManager.configure({ maxHistory: 200 });

      expect(configManager.getMaxHistory()).toBe(200);
    });
  });

  describe('getMaxHistory()', () => {
    it('should return default maxHistory', () => {
      expect(configManager.getMaxHistory()).toBe(50);
    });

    it('should return custom maxHistory', () => {
      const manager = new TimeTravelConfigManager({ maxHistory: 25 });
      expect(manager.getMaxHistory()).toBe(25);
    });
  });

  describe('getAutoCapture()', () => {
    it('should return default autoCapture', () => {
      expect(configManager.getAutoCapture()).toBe(false);
    });

    it('should return custom autoCapture', () => {
      const manager = new TimeTravelConfigManager({ autoCapture: true });
      expect(manager.getAutoCapture()).toBe(true);
    });
  });

  describe('getTTL()', () => {
    it('should return default TTL', () => {
      expect(configManager.getTTL()).toBe(300000);
    });

    it('should return custom TTL', () => {
      const manager = new TimeTravelConfigManager({ ttl: 120000 });
      expect(manager.getTTL()).toBe(120000);
    });
  });

  describe('getCleanupInterval()', () => {
    it('should return default cleanup interval', () => {
      expect(configManager.getCleanupInterval()).toBe(60000);
    });

    it('should return custom cleanup interval', () => {
      const manager = new TimeTravelConfigManager({ cleanupInterval: 30000 });
      expect(manager.getCleanupInterval()).toBe(30000);
    });
  });

  describe('isDeltaSnapshotsEnabled()', () => {
    it('should return false by default', () => {
      expect(configManager.isDeltaSnapshotsEnabled()).toBe(false);
    });

    it('should return true when enabled', () => {
      const manager = new TimeTravelConfigManager({
        deltaSnapshots: { enabled: true },
      });
      expect(manager.isDeltaSnapshotsEnabled()).toBe(true);
    });

    it('should return false when explicitly disabled', () => {
      const manager = new TimeTravelConfigManager({
        deltaSnapshots: { enabled: false },
      });
      expect(manager.isDeltaSnapshotsEnabled()).toBe(false);
    });
  });

  describe('reset()', () => {
    it('should reset to default values', () => {
      configManager.configure({
        maxHistory: 100,
        autoCapture: true,
        ttl: 600000,
        cleanupInterval: 120000,
      });

      configManager.reset();

      expect(configManager.getMaxHistory()).toBe(50);
      expect(configManager.getAutoCapture()).toBe(false);
      expect(configManager.getTTL()).toBe(300000);
      expect(configManager.getCleanupInterval()).toBe(60000);
    });
  });
});
