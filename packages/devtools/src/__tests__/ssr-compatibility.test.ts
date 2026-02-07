/**
 * @jest-environment node
 */

import { DevToolsPlugin } from '../devtools-plugin';

describe('DevToolsPlugin SSR Compatibility', () => {
  it('should not throw errors when initialized in server environment', () => {
    expect(() => {
      const plugin = new DevToolsPlugin();
      plugin.apply({
        get: () => ({}),
        set: () => {},
        getState: () => ({}),
      });
    }).not.toThrow();
  });

  it('should not attempt to connect to DevTools in server environment', () => {
    const plugin = new DevToolsPlugin();
    const store = {
      get: () => ({}),
      set: () => {},
      getState: () => ({}),
    };

    expect(() => {
      plugin.apply(store as any);
    }).not.toThrow();
  });

  it('should handle configuration in server environment', () => {
    expect(() => {
      const plugin = new DevToolsPlugin({
        name: 'test-store',
        trace: true,
        latency: 50,
        maxAge: 100,
      });
      plugin.apply({
        get: () => ({}),
        set: () => {},
        getState: () => ({}),
      });
    }).not.toThrow();
  });
});