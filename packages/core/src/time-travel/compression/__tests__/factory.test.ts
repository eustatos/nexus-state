/**
 * Compression factory tests
 */

import { describe, it, expect } from 'vitest';
import { CompressionFactory } from '../factory';
import { NoCompressionStrategy } from '../strategy';
import { TimeBasedCompression } from '../time-based';
import { SizeBasedCompression } from '../size-based';
import { SignificanceBasedCompression } from '../significance-based';

describe('CompressionFactory', () => {
  describe('create', () => {
    it('should return existing strategy instance', () => {
      const existing = new NoCompressionStrategy();
      const result = CompressionFactory.create({
        strategy: existing,
      });

      expect(result).toBe(existing);
    });

    it('should create NoCompressionStrategy', () => {
      const result = CompressionFactory.create({
        strategy: 'none',
      });

      expect(result).toBeInstanceOf(NoCompressionStrategy);
    });

    it('should create TimeBasedCompression', () => {
      const result = CompressionFactory.create({
        strategy: 'time',
        time: {
          keepRecentForMs: 60000,
          keepEvery: 5,
        },
      });

      expect(result).toBeInstanceOf(TimeBasedCompression);
    });

    it('should create SizeBasedCompression', () => {
      const result = CompressionFactory.create({
        strategy: 'size',
        size: {
          maxSnapshots: 100,
          keepEvery: 3,
        },
      });

      expect(result).toBeInstanceOf(SizeBasedCompression);
    });

    it('should create SignificanceBasedCompression', () => {
      const result = CompressionFactory.create({
        strategy: 'significance',
        significance: {
          minChangeThreshold: 0.5,
          maxConsecutiveSimilar: 10,
        },
      });

      expect(result).toBeInstanceOf(SignificanceBasedCompression);
    });

    it('should throw for unknown strategy', () => {
      expect(() =>
        CompressionFactory.create({
          strategy: 'unknown' as any,
        })
      ).toThrow('Unknown compression strategy');
    });

    it('should pass enabled option to strategy', () => {
      const result = CompressionFactory.create({
        strategy: 'none',
        enabled: false,
      });

      const config = (result as NoCompressionStrategy).getConfig();
      expect(config.enabled).toBe(false);
    });

    it('should pass minSnapshots option to strategy', () => {
      const result = CompressionFactory.create({
        strategy: 'none',
        minSnapshots: 5,
      });

      const config = (result as NoCompressionStrategy).getConfig();
      expect(config.minSnapshots).toBe(5);
    });

    it('should pass time options to TimeBasedCompression', () => {
      const result = CompressionFactory.create({
        strategy: 'time',
        time: {
          keepRecentForMs: 120000,
          keepEvery: 10,
        },
      });

      const config = (result as TimeBasedCompression).getConfig();
      expect(config.keepRecentForMs).toBe(120000);
      expect(config.keepEvery).toBe(10);
    });

    it('should pass size options to SizeBasedCompression', () => {
      const result = CompressionFactory.create({
        strategy: 'size',
        size: {
          maxSnapshots: 50,
          keepEvery: 2,
        },
      });

      const config = (result as SizeBasedCompression).getConfig();
      expect(config.maxSnapshots).toBe(50);
      expect(config.keepEvery).toBe(2);
    });

    it('should pass significance options to SignificanceBasedCompression', () => {
      const result = CompressionFactory.create({
        strategy: 'significance',
        significance: {
          minChangeThreshold: 0.8,
          maxConsecutiveSimilar: 5,
        },
      });

      const config = (result as SignificanceBasedCompression).getConfig();
      expect(config.minChangeThreshold).toBe(0.8);
      expect(config.maxConsecutiveSimilar).toBe(5);
    });
  });
});
