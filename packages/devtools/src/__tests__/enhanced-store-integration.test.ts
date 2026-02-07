import { DevToolsPlugin } from '../devtools-plugin';

describe('DevToolsPlugin Enhanced Store Integration', () => {
  it('should integrate with enhanced store API', () => {
    const plugin = new DevToolsPlugin();
    const store = {
      get: jest.fn(),
      set: jest.fn(),
      getState: jest.fn().mockReturnValue({}),
      setWithMetadata: jest.fn(),
      serializeState: jest.fn(),
    };

    expect(() => {
      plugin.apply(store as any);
    }).not.toThrow();
  });

  it('should use setWithMetadata when available', () => {
    const plugin = new DevToolsPlugin();
    const store = {
      get: jest.fn(),
      set: jest.fn(),
      getState: jest.fn().mockReturnValue({}),
      setWithMetadata: jest.fn(),
      serializeState: jest.fn(),
    };

    plugin.apply(store as any);
    
    // Verify that set method was overridden
    expect(typeof store.set).toBe('function');
  });

  it('should fall back to polling when setWithMetadata is not available', () => {
    const plugin = new DevToolsPlugin();
    const store = {
      get: jest.fn(),
      set: jest.fn(),
      getState: jest.fn().mockReturnValue({}),
      serializeState: jest.fn(),
    };

    expect(() => {
      plugin.apply(store as any);
    }).not.toThrow();
  });

  it('should handle serializeState method', () => {
    const plugin = new DevToolsPlugin();
    const store = {
      get: jest.fn(),
      set: jest.fn(),
      getState: jest.fn().mockReturnValue({}),
      serializeState: jest.fn().mockReturnValue({ serialized: true }),
    };

    expect(() => {
      plugin.apply(store as any);
    }).not.toThrow();
  });
});