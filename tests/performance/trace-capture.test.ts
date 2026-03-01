/**
 * Performance tests for stack trace capture system
 * Implements performance tests as per TASK-005
 */

import { 
  captureStackTrace, 
  createStackTraceGenerator 
} from '../../packages/devtools/src/utils/stack-tracer';

import { 
  getDevToolsConfig, 
  updateDevToolsConfig 
} from '../../packages/devtools/src/config/devtools-config';

import { stackTraceScenarios } from '../fixtures/action-scenarios';

describe('Stack Trace Capture Performance', () => {
  const originalEnv = process.env.NODE_ENV;
  
  beforeAll(() => {
    // Set development environment for testing
    process.env.NODE_ENV = 'development';
  });
  
  afterAll(() => {
    // Restore original environment
    process.env.NODE_ENV = originalEnv;
  });

  test('stack trace capture overhead < 1ms', () => {
    updateDevToolsConfig(stackTraceScenarios.developmentEnabled);
    
    const startTime = performance.now();
    const trace = captureStackTrace(10);
    const endTime = performance.now();
    
    const overhead = endTime - startTime;
    
    expect(overhead).toBeLessThan(1); // Less than 1ms overhead
    expect(trace).toBeDefined();
    if (trace) {
      expect(trace.frames).toHaveLength(10);
    }
  });

  test('lazy stack trace generation performance', () => {
    updateDevToolsConfig(stackTraceScenarios.developmentEnabled);
    
    const generator = createStackTraceGenerator(getDevToolsConfig());
    
    const startTime = performance.now();
    const trace = generator();
    const endTime = performance.now();
    
    const overhead = endTime - startTime;
    
    expect(overhead).toBeLessThan(1); // Less than 1ms overhead
    expect(trace).toBeDefined();
  });

  test('stack trace capture with custom limit', () => {
    updateDevToolsConfig(stackTraceScenarios.customLimit);
    
    const startTime = performance.now();
    const trace = captureStackTrace(5);
    const endTime = performance.now();
    
    const overhead = endTime - startTime;
    
    expect(overhead).toBeLessThan(1); // Less than 1ms overhead
    expect(trace).toBeDefined();
    if (trace) {
      expect(trace.frames).toHaveLength(5);
    }
  });

  test('stack trace disabled performance', () => {
    updateDevToolsConfig(stackTraceScenarios.developmentDisabled);
    
    const startTime = performance.now();
    const trace = captureStackTrace(10);
    const endTime = performance.now();
    
    const overhead = endTime - startTime;
    
    // Should be very fast when disabled
    expect(overhead).toBeLessThan(0.1);
    // Should return null when disabled
    expect(trace).toBeNull();
  });

  test('multiple stack trace captures', () => {
    updateDevToolsConfig(stackTraceScenarios.developmentEnabled);
    
    const captures = 100;
    const startTime = performance.now();
    
    for (let i = 0; i < captures; i++) {
      captureStackTrace(5);
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / captures;
    
    // Average time per capture should be less than 1ms
    expect(avgTime).toBeLessThan(1);
  });
});

describe('Production Build Exclusion', () => {
  const originalEnv = process.env.NODE_ENV;
  
  afterAll(() => {
    // Restore original environment
    process.env.NODE_ENV = originalEnv;
  });

  test('stack trace capture in production returns null', () => {
    // Set production environment
    process.env.NODE_ENV = 'production';
    
    updateDevToolsConfig(stackTraceScenarios.productionEnabled);
    
    const startTime = performance.now();
    const trace = captureStackTrace(10);
    const endTime = performance.now();
    
    const overhead = endTime - startTime;
    
    // Should be very fast in production
    expect(overhead).toBeLessThan(0.1);
    // Should return null in production
    expect(trace).toBeNull();
  });
});