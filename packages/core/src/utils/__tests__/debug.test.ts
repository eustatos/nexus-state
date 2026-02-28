import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We need to test the debug module dynamically
// Since IS_DEV is evaluated at module load time, we test the behavior
// based on the current environment

describe('createDebugger', () => {
  let originalConsoleLog: typeof console.log;
  let logCalls: any[][] = [];

  beforeEach(() => {
    logCalls = [];
    originalConsoleLog = console.log;
    console.log = (...args: any[]) => {
      logCalls.push(args);
    };
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  it('should create a debugger function', () => {
    const debug = createDebugger('TEST');
    expect(typeof debug).toBe('function');
  });

  it('should handle undefined values', () => {
    const debug = createDebugger('TEST');
    expect(() => debug(undefined)).not.toThrow();
  });

  it('should handle null values', () => {
    const debug = createDebugger('TEST');
    expect(() => debug(null)).not.toThrow();
  });

  it('should handle circular objects without crashing', () => {
    const debug = createDebugger('TEST');
    const circular: any = { name: 'test' };
    circular.self = circular;
    expect(() => debug(circular)).not.toThrow();
  });

  it('should handle multiple arguments', () => {
    const debug = createDebugger('TEST');
    // In dev mode, this should log; in prod mode, it's a no-op
    // We just test that it doesn't throw
    expect(() => debug('arg1', 'arg2', 'arg3', 123, { key: 'value' })).not.toThrow();
  });

  it('should create different debuggers with different scopes', () => {
    const debug1 = createDebugger('SCOPE1');
    const debug2 = createDebugger('SCOPE2');
    
    // Both should be callable without errors
    expect(() => {
      debug1('message1');
      debug2('message2');
    }).not.toThrow();
  });

  it('should return undefined (no-op behavior)', () => {
    const debug = createDebugger('TEST');
    const result = debug('message');
    expect(result).toBeUndefined();
  });

  it('should log with correct scope format in dev mode', () => {
    const isDev = process.env.NODE_ENV === 'development';
    const debug = createDebugger('MYSCOPE');
    debug('test');
    
    if (isDev) {
      // In dev mode, should have logged with [MYSCOPE] prefix
      expect(logCalls.length).toBeGreaterThan(0);
      expect(logCalls[0][0]).toContain('[MYSCOPE]');
    } else {
      // In prod mode, should not have logged
      expect(logCalls.length).toBe(0);
    }
  });
});

describe('predefined debuggers', () => {
  let originalConsoleLog: typeof console.log;
  let logCalls: any[][] = [];

  beforeEach(() => {
    logCalls = [];
    originalConsoleLog = console.log;
    console.log = (...args: any[]) => {
      logCalls.push(args);
    };
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  it('debugStore should be a function', () => {
    expect(typeof debugStore).toBe('function');
  });

  it('debugAtom should be a function', () => {
    expect(typeof debugAtom).toBe('function');
  });

  it('debugTimeTravel should be a function', () => {
    expect(typeof debugTimeTravel).toBe('function');
  });

  it('predefined debuggers should not throw', () => {
    expect(() => {
      debugStore('message');
      debugAtom('message');
      debugTimeTravel('message');
    }).not.toThrow();
  });

  it('predefined debuggers should have correct scopes in dev mode', () => {
    const isDev = process.env.NODE_ENV === 'development';
    
    debugStore('test');
    debugAtom('test');
    debugTimeTravel('test');
    
    if (isDev) {
      expect(logCalls.length).toBe(3);
      expect(logCalls[0][0]).toContain('[STORE]');
      expect(logCalls[1][0]).toContain('[ATOM]');
      expect(logCalls[2][0]).toContain('[TIME-TRAVEL]');
    } else {
      expect(logCalls.length).toBe(0);
    }
  });
});

// Import after test setup to ensure proper mocking
import { createDebugger, debugStore, debugAtom, debugTimeTravel } from '../debug';
