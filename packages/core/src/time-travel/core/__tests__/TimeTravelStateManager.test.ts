/**
 * Tests for TimeTravelStateManager
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TimeTravelStateManager } from '../TimeTravelStateManager';

describe('TimeTravelStateManager', () => {
  let stateManager: TimeTravelStateManager;

  beforeEach(() => {
    stateManager = new TimeTravelStateManager({ autoCapture: false });
  });

  describe('isTraveling()', () => {
    it('should return false by default', () => {
      expect(stateManager.isTraveling()).toBe(false);
    });

    it('should return true after startTimeTravel()', () => {
      stateManager.startTimeTravel();
      expect(stateManager.isTraveling()).toBe(true);
    });

    it('should return false after endTimeTravel()', () => {
      stateManager.startTimeTravel();
      stateManager.endTimeTravel();
      expect(stateManager.isTraveling()).toBe(false);
    });
  });

  describe('startTimeTravel() / endTimeTravel()', () => {
    it('should toggle isTimeTraveling state', () => {
      expect(stateManager.isTraveling()).toBe(false);

      stateManager.startTimeTravel();
      expect(stateManager.isTraveling()).toBe(true);

      stateManager.endTimeTravel();
      expect(stateManager.isTraveling()).toBe(false);
    });

    it('should allow multiple start/end calls', () => {
      stateManager.startTimeTravel();
      stateManager.startTimeTravel();
      expect(stateManager.isTraveling()).toBe(true);

      stateManager.endTimeTravel();
      expect(stateManager.isTraveling()).toBe(false);
    });
  });

  describe('withTimeTravel()', () => {
    it('should execute callback with time travel state', () => {
      const result = stateManager.withTimeTravel(() => {
        expect(stateManager.isTraveling()).toBe(true);
        return 'test-result';
      });

      expect(result).toBe('test-result');
      expect(stateManager.isTraveling()).toBe(false);
    });

    it('should end time travel even if callback throws', () => {
      expect(() => {
        stateManager.withTimeTravel(() => {
          throw new Error('test error');
        });
      }).toThrow('test error');

      expect(stateManager.isTraveling()).toBe(false);
    });

    it('should return callback result', () => {
      const result = stateManager.withTimeTravel(() => 42);
      expect(result).toBe(42);
    });
  });

  describe('autoCapture', () => {
    it('should return false by default', () => {
      const manager = new TimeTravelStateManager();
      expect(manager.isAutoCaptureEnabled()).toBe(false);
    });

    it('should return configured value', () => {
      const manager = new TimeTravelStateManager({ autoCapture: true });
      expect(manager.isAutoCaptureEnabled()).toBe(true);
    });

    it('should enable auto-capture', () => {
      stateManager.enableAutoCapture();
      expect(stateManager.isAutoCaptureEnabled()).toBe(true);
    });

    it('should disable auto-capture', () => {
      stateManager.enableAutoCapture();
      stateManager.disableAutoCapture();
      expect(stateManager.isAutoCaptureEnabled()).toBe(false);
    });

    it('should set auto-capture with boolean', () => {
      stateManager.setAutoCapture(true);
      expect(stateManager.isAutoCaptureEnabled()).toBe(true);

      stateManager.setAutoCapture(false);
      expect(stateManager.isAutoCaptureEnabled()).toBe(false);
    });
  });

  describe('getState()', () => {
    it('should return current state', () => {
      const state = stateManager.getState();

      expect(state).toEqual({
        isTimeTraveling: false,
        autoCapture: false,
      });
    });

    it('should return updated state after changes', () => {
      stateManager.startTimeTravel();
      stateManager.enableAutoCapture();

      const state = stateManager.getState();

      expect(state).toEqual({
        isTimeTraveling: true,
        autoCapture: true,
      });
    });
  });

  describe('reset()', () => {
    it('should reset state to defaults', () => {
      stateManager.startTimeTravel();
      stateManager.enableAutoCapture();

      stateManager.reset();

      const state = stateManager.getState();
      expect(state).toEqual({
        isTimeTraveling: false,
        autoCapture: false,
      });
    });
  });

  describe('configure()', () => {
    it('should update autoCapture configuration', () => {
      stateManager.configure({ autoCapture: true });
      expect(stateManager.isAutoCaptureEnabled()).toBe(true);
    });

    it('should merge configuration', () => {
      stateManager.configure({ autoCapture: true });
      stateManager.configure({ autoCapture: false });
      expect(stateManager.isAutoCaptureEnabled()).toBe(false);
    });
  });
});
