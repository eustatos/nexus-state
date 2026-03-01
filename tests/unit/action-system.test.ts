/**
 * Unit tests for action naming and stack trace system
 * Implements tests as per TASK-005
 */

import { 
  defaultActionNaming, 
  generateActionName, 
  createActionMetadata 
} from '../../packages/devtools/src/utils/action-naming';

import { 
  captureStackTrace, 
  createStackTraceGenerator, 
  isStackTraceEnabled 
} from '../../packages/devtools/src/utils/stack-tracer';

import { 
  createAction, 
  createActionGroup, 
  createActionWithNaming 
} from '../../packages/devtools/src/utils/action-creator';

import { 
  getDevToolsConfig, 
  updateDevToolsConfig, 
  resetDevToolsConfig,
  isDevelopmentMode
} from '../../packages/devtools/src/config/devtools-config';

import { DEFAULT_DEVTOOLS_CONFIG } from '../../packages/devtools/src/config/devtools-config';

describe('Action Naming System', () => {
  test('default action naming', () => {
    const metadata = createActionMetadata('testAtom', 'atom', 'direct');
    const name = defaultActionNaming('testAtom', metadata);
    expect(name).toBe('ATOM_UPDATE/testAtom');
  });

  test('custom action naming strategy', () => {
    const metadata = createActionMetadata('testAtom', 'atom', 'direct');
    const customStrategy = () => `CUSTOM_${'testAtom'}`;
    const name = generateActionName(customStrategy, { name: 'testAtom' }, 'value', metadata);
    expect(name).toBe('CUSTOM_testAtom');
  });

  test('action metadata creation', () => {
    const metadata = createActionMetadata('testAtom', 'atom', 'computed', 'Custom Name');
    expect(metadata.atomName).toBe('testAtom');
    expect(metadata.atomType).toBe('atom');
    expect(metadata.updateType).toBe('computed');
    expect(metadata.customName).toBe('Custom Name');
    expect(metadata.timestamp).toBeDefined();
  });
});

describe('Stack Trace System', () => {
  beforeEach(() => {
    resetDevToolsConfig();
  });

  test('stack trace capture in development', () => {
    // Mock development environment
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    const trace = captureStackTrace(5);
    
    // Restore original environment
    process.env.NODE_ENV = originalEnv;
    
    expect(trace).toBeDefined();
    if (trace) {
      expect(trace.frames).toBeDefined();
      expect(trace.timestamp).toBeDefined();
    }
  });

  test('stack trace generator creation', () => {
    updateDevToolsConfig({ enableStackTrace: true, isDevelopment: true });
    const generator = createStackTraceGenerator(getDevToolsConfig());
    expect(typeof generator).toBe('function');
  });

  test('stack trace enabled check', () => {
    updateDevToolsConfig({ enableStackTrace: true, isDevelopment: true });
    expect(isStackTraceEnabled(getDevToolsConfig())).toBe(true);
    
    updateDevToolsConfig({ enableStackTrace: false, isDevelopment: true });
    expect(isStackTraceEnabled(getDevToolsConfig())).toBe(false);
  });
});

describe('Action Creator System', () => {
  test('create single action', () => {
    const action = createAction('TEST_ACTION', { data: 'test' });
    expect(action.type).toBe('TEST_ACTION');
    expect(action.payload).toEqual({ data: 'test' });
    expect(action.timestamp).toBeDefined();
  });

  test('create action group', () => {
    const action1 = createAction('ACTION_1');
    const action2 = createAction('ACTION_2');
    const group = createActionGroup([action1, action2], 'Test Group');
    
    expect(group.actions).toHaveLength(2);
    expect(group.groupName).toBe('Test Group');
    expect(group.timestamp).toBeDefined();
  });

  test('create action with naming strategy', () => {
    const metadata = createActionMetadata('testAtom', 'atom', 'direct');
    const action = createActionWithNaming(
      { name: 'testAtom' }, 
      'value', 
      'auto', 
      metadata
    );
    
    expect(action.type).toBe('ATOM_UPDATE/testAtom');
    expect(action.payload).toBe('value');
  });
});

describe('DevTools Configuration', () => {
  beforeEach(() => {
    resetDevToolsConfig();
  });

  test('default configuration', () => {
    const config = getDevToolsConfig();
    expect(config).toEqual(DEFAULT_DEVTOOLS_CONFIG);
  });

  test('update configuration', () => {
    updateDevToolsConfig({ traceLimit: 20 });
    const config = getDevToolsConfig();
    expect(config.traceLimit).toBe(20);
  });

  test('reset configuration', () => {
    updateDevToolsConfig({ traceLimit: 20 });
    resetDevToolsConfig();
    const config = getDevToolsConfig();
    expect(config.traceLimit).toBe(10); // Default value
  });

  test('development mode check', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    expect(isDevelopmentMode()).toBe(true);
    
    process.env.NODE_ENV = 'production';
    expect(isDevelopmentMode()).toBe(false);
    
    // Restore original environment
    process.env.NODE_ENV = originalEnv;
  });
});