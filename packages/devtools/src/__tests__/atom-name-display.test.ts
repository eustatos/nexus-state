import { DevToolsPlugin } from '../devtools-plugin';
import { atomRegistry } from '../../../core/src/atom-registry';
import { vi } from 'vitest';

// Mock atom for testing
const createMockAtom = (id: string, name?: string) => {
  const atomId = Symbol(id);
  const atom: any = {
    id: atomId,
    toString: () => `Atom(${id})`,
  };
  
  // Register atom if name provided
  if (name) {
    atomRegistry.register(atom, name);
  }
  
  return atom;
};

describe('DevToolsPlugin Atom Name Display', () => {
  beforeEach(() => {
    // Clear registry before each test
    atomRegistry.clear();
  });

  it('should display atom names when showAtomNames is enabled', () => {
    const atom = createMockAtom('test-atom', 'TestAtom');
    const plugin = new DevToolsPlugin({ showAtomNames: true });
    
    // Access private method through reflection for testing
    const getAtomName = (plugin as any).getAtomName.bind(plugin);
    const name = getAtomName(atom);
    
    expect(name).toBe('TestAtom');
  });

  it('should use atom toString method when showAtomNames is disabled', () => {
    const atom = createMockAtom('test-atom'); // No name registered
    const plugin = new DevToolsPlugin({ showAtomNames: false });
    
    // Access private method through reflection for testing
    const getAtomName = (plugin as any).getAtomName.bind(plugin);
    const name = getAtomName(atom);
    
    expect(name).toBe('Atom(test-atom)');
  });

  it('should use custom atom name formatter when provided', () => {
    const atom = createMockAtom('test-atom', 'TestAtom');
    const formatter = vi.fn().mockReturnValue('CustomName');
    const plugin = new DevToolsPlugin({ 
      showAtomNames: true,
      atomNameFormatter: formatter
    });
    
    // Access private method through reflection for testing
    const getAtomName = (plugin as any).getAtomName.bind(plugin);
    const name = getAtomName(atom);
    
    expect(name).toBe('CustomName');
    expect(formatter).toHaveBeenCalledWith(atom, 'TestAtom');
  });

  it('should provide fallback name for unregistered atoms', () => {
    const atom = createMockAtom('test-atom'); // No name provided
    const plugin = new DevToolsPlugin({ showAtomNames: true });
    
    // Access private method through reflection for testing
    const getAtomName = (plugin as any).getAtomName.bind(plugin);
    const name = getAtomName(atom);
    
    // The name should contain the atom's symbol identifier
    expect(name).toContain('atom-');
  });

  it('should handle error in atom name resolution', () => {
    const atom: any = { id: Symbol('test') };
    // Mock registry to throw error
    const originalGetName = atomRegistry.getName;
    atomRegistry.getName = () => {
      throw new Error('Registry error');
    };
    
    const plugin = new DevToolsPlugin({ showAtomNames: true });
    
    // Access private method through reflection for testing
    const getAtomName = (plugin as any).getAtomName.bind(plugin);
    const name = getAtomName(atom);
    
    expect(name).toContain('atom-');
    
    // Restore original method
    atomRegistry.getName = originalGetName;
  });

  it('should include atom name in metadata when setWithMetadata is used', () => {
    const atom = createMockAtom('test-atom', 'TestAtom');
    const plugin = new DevToolsPlugin({ showAtomNames: true });
    
    // Mock DevTools connection
    const mockConnection = {
      send: vi.fn(),
      subscribe: vi.fn().mockReturnValue(vi.fn()),
      init: vi.fn(),
      unsubscribe: vi.fn()
    };
    
    // Mock window with DevTools extension and addEventListener
    const originalWindow = global.window;
    global.window = {
      ...global.window,
      addEventListener: vi.fn(),
      __REDUX_DEVTOOLS_EXTENSION__: {
        connect: vi.fn().mockReturnValue(mockConnection)
      }
    } as any;
    
    const store: any = {
      get: vi.fn(),
      set: null, // Will be overridden by plugin
      getState: vi.fn().mockReturnValue({}),
      setWithMetadata: vi.fn(),
      serializeState: vi.fn(),
    };
    
    // Apply plugin
    plugin.apply(store);
    
    // Call set method which should use setWithMetadata
    store.set(atom, 'test-value');
    
    // Verify that setWithMetadata was called with metadata containing atom name
    expect(store.setWithMetadata).toHaveBeenCalledWith(
      atom,
      'test-value',
      expect.objectContaining({
        type: 'SET TestAtom',
        atomName: 'TestAtom'
      })
    );
    
    // Restore original window
    global.window = originalWindow;
  });
});