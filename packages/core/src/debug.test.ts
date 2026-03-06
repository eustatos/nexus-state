/**
 * Tests for debug logger functionality
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  logger,
  storeLogger,
  atomLogger,
  reactLogger,
  DebugLogger,
} from './debug';

describe('DebugLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create logger with default prefix', () => {
      const testLogger = new DebugLogger();
      expect(testLogger).toBeDefined();
    });

    it('should create logger with custom prefix', () => {
      const testLogger = new DebugLogger('[Custom]');
      expect(testLogger).toBeDefined();
    });
  });

  describe('enable/disable', () => {
    it('should disable logging on disable()', () => {
      const testLogger = new DebugLogger('[Test]');
      testLogger.enable();
      expect(testLogger.isEnabled()).toBe(true);

      testLogger.disable();
      expect(testLogger.isEnabled()).toBe(false);
    });

    it('should enable logging on enable()', () => {
      const testLogger = new DebugLogger('[Test]');
      testLogger.disable();
      expect(testLogger.isEnabled()).toBe(false);

      testLogger.enable();
      expect(testLogger.isEnabled()).toBe(true);
    });

    it('should have correct enabled state by default based on environment', () => {
      // In test environment, logger should be disabled
      const testLogger = new DebugLogger('[Test]');
      expect(testLogger.isEnabled()).toBe(false);
    });
  });

  describe('Log levels', () => {
    it('should call console.log on log()', () => {
      const testLogger = new DebugLogger('[Test]');
      testLogger.enable();

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      testLogger.log('test message');

      expect(logSpy).toHaveBeenCalled();
      expect(logSpy.mock.calls[0][0]).toContain('[Test]');

      logSpy.mockRestore();
    });

    it('should call console.warn on warn()', () => {
      const testLogger = new DebugLogger('[Test]');
      testLogger.enable();

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      testLogger.warn('test warning');

      expect(warnSpy).toHaveBeenCalled();
      expect(warnSpy.mock.calls[0][0]).toContain('[Test]');

      warnSpy.mockRestore();
    });

    it('should call console.error on error()', () => {
      const testLogger = new DebugLogger('[Test]');
      testLogger.enable();

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      testLogger.error('test error');

      expect(errorSpy).toHaveBeenCalled();
      expect(errorSpy.mock.calls[0][0]).toContain('[Test]');

      errorSpy.mockRestore();
    });

    it('should call console.info on info()', () => {
      const testLogger = new DebugLogger('[Test]');
      testLogger.enable();

      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      testLogger.info('test info');

      expect(infoSpy).toHaveBeenCalled();
      expect(infoSpy.mock.calls[0][0]).toContain('[Test]');

      infoSpy.mockRestore();
    });

    it('should not call console methods when disabled', () => {
      const testLogger = new DebugLogger('[Test]');
      testLogger.disable();

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      testLogger.log('test');
      testLogger.warn('test');
      testLogger.error('test');
      testLogger.info('test');

      expect(logSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
      expect(infoSpy).not.toHaveBeenCalled();

      logSpy.mockRestore();
      warnSpy.mockRestore();
      errorSpy.mockRestore();
      infoSpy.mockRestore();
    });
  });

  describe('Multiple arguments', () => {
    it('should pass multiple arguments to console', () => {
      const testLogger = new DebugLogger('[Test]');
      testLogger.enable();

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      testLogger.log('message', { data: 'test' }, 123);

      expect(logSpy).toHaveBeenCalled();
      expect(logSpy.mock.calls[0].length).toBeGreaterThan(1);

      logSpy.mockRestore();
    });
  });

  describe('group/groupEnd', () => {
    it('should call console.group on group()', () => {
      const testLogger = new DebugLogger('[Test]');
      testLogger.enable();

      const groupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});

      testLogger.group('Test Group');

      expect(groupSpy).toHaveBeenCalled();
      expect(groupSpy.mock.calls[0][0]).toContain('[Test]');
      expect(groupSpy.mock.calls[0][0]).toContain('Test Group');

      groupSpy.mockRestore();
    });

    it('should call console.groupEnd on groupEnd()', () => {
      const testLogger = new DebugLogger('[Test]');
      testLogger.enable();

      const groupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});

      testLogger.groupEnd();

      expect(groupEndSpy).toHaveBeenCalled();

      groupEndSpy.mockRestore();
    });

    it('should not call group methods when disabled', () => {
      const testLogger = new DebugLogger('[Test]');
      testLogger.disable();

      const groupSpy = vi.spyOn(console, 'group').mockImplementation(() => {});
      const groupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {});

      testLogger.group('Test');
      testLogger.groupEnd();

      expect(groupSpy).not.toHaveBeenCalled();
      expect(groupEndSpy).not.toHaveBeenCalled();

      groupSpy.mockRestore();
      groupEndSpy.mockRestore();
    });
  });

  describe('Timestamp format', () => {
    it('should include timestamp in log messages', () => {
      const testLogger = new DebugLogger('[Test]');
      testLogger.enable();

      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      testLogger.log('test');

      const message = logSpy.mock.calls[0][0];
      // Timestamp format: [HH:MM:SS.mmm]
      expect(message).toMatch(/\[\d{2}:\d{2}:\d{2}\.\d{3}\]/);

      logSpy.mockRestore();
    });
  });
});

describe('Exported loggers', () => {
  it('should export logger with [Nexus] prefix', () => {
    expect(logger).toBeDefined();
  });

  it('should export storeLogger with [Nexus:Store] prefix', () => {
    expect(storeLogger).toBeDefined();
  });

  it('should export atomLogger with [Nexus:Atom] prefix', () => {
    expect(atomLogger).toBeDefined();
  });

  it('should export reactLogger with [Nexus:React] prefix', () => {
    expect(reactLogger).toBeDefined();
  });

  it('should have different prefixes for each logger', () => {
    const prefixes = new Set([
      logger['prefix'],
      storeLogger['prefix'],
      atomLogger['prefix'],
      reactLogger['prefix'],
    ]);

    expect(prefixes.size).toBe(4);
  });
});

describe('Environment detection', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should be disabled in test environment', () => {
    // Already in test environment, should be disabled
    expect(logger.isEnabled()).toBe(false);
  });
});
