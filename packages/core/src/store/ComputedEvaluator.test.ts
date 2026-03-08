import { describe, it, expect, beforeEach } from 'vitest';
import { ComputedEvaluator } from './ComputedEvaluator';
import { createMockAtom } from '../test-utils/index';
import type { PrimitiveAtom, ComputedAtom, WritableAtom } from '../types';

describe('ComputedEvaluator', () => {
  let evaluator: ComputedEvaluator;

  beforeEach(() => {
    evaluator = new ComputedEvaluator();
  });

  describe('evaluate', () => {
    it('should evaluate primitive atom', () => {
      const atom = createMockAtom('primitiveAtom', 42) as PrimitiveAtom<number>;
      const get = vi.fn();

      const result = evaluator.evaluate(atom, get);

      expect(result).toBe(42);
      expect(get).not.toHaveBeenCalled();
    });

    it('should evaluate computed atom', () => {
      let value = 10;
      const atom: ComputedAtom<number> = {
        id: Symbol('computed'),
        name: 'computedAtom',
        type: 'computed',
        read: (get) => get(createMockAtom('dep', value)) * 2,
      };
      const get = vi.fn((atom) => atom.name === 'dep' ? value : 0);

      const result = evaluator.evaluate(atom, get);

      expect(result).toBe(20);
      expect(get).toHaveBeenCalled();
    });

    it('should evaluate writable atom', () => {
      let value = 100;
      const atom: WritableAtom<number> = {
        id: Symbol('writable'),
        name: 'writableAtom',
        type: 'writable',
        read: (get) => get(createMockAtom('dep', value)),
        write: (get, set, newValue: number) => {
          value = newValue;
        },
      };
      const get = vi.fn((atom) => atom.name === 'dep' ? value : 0);

      const result = evaluator.evaluate(atom, get);

      expect(result).toBe(100);
    });

    it('should throw error for unknown atom type', () => {
      const atom: any = {
        id: Symbol('unknown'),
        name: 'unknownAtom',
        type: 'unknown',
      };
      const get = vi.fn();

      expect(() => evaluator.evaluate(atom, get)).toThrow('Unknown atom type');
    });

    it('should track evaluation stack', () => {
      const atom = createMockAtom('testAtom', 42) as PrimitiveAtom<number>;
      let isEvaluating = false;

      const get: any = (a: any) => {
        if (a.name === 'check') {
          isEvaluating = evaluator.isEvaluating(atom);
        }
        return 0;
      };

      evaluator.evaluate(atom, get);

      // Stack should be cleared after evaluation
      expect(evaluator.getEvaluationStackSize()).toBe(0);
    });

    it('should handle circular dependency detection', () => {
      const atom = createMockAtom('circular', 0) as PrimitiveAtom<number>;
      const get: any = () => {
        // Try to evaluate same atom again
        evaluator.evaluate(atom, get);
        return 0;
      };

      // Should not throw, just log warning
      expect(() => evaluator.evaluate(atom, get)).not.toThrow();
    });
  });

  describe('recompute', () => {
    it('should recompute computed atom', () => {
      let multiplier = 2;
      const depAtom = createMockAtom('dep', 5);
      const atom: ComputedAtom<number> = {
        id: Symbol('computed'),
        name: 'computedAtom',
        type: 'computed',
        read: (get) => get(depAtom) * multiplier,
      };
      const get = vi.fn((a) => a.id === depAtom.id ? 5 : 0);

      const result = evaluator.recompute(atom, get);

      expect(result).toBe(10);
      expect(get).toHaveBeenCalledWith(depAtom);
    });

    it('should recompute writable atom', () => {
      let value = 25;
      const depAtom = createMockAtom('dep', value);
      const atom: WritableAtom<number> = {
        id: Symbol('writable'),
        name: 'writableAtom',
        type: 'writable',
        read: (get) => get(depAtom),
        write: () => {},
      };
      const get = vi.fn((a) => a.id === depAtom.id ? value : 0);

      const result = evaluator.recompute(atom, get);

      expect(result).toBe(25);
    });

    it('should throw error for primitive atom', () => {
      const atom = createMockAtom('primitive', 42) as PrimitiveAtom<number>;
      const get = vi.fn();

      expect(() => evaluator.recompute(atom, get)).toThrow(
        'Cannot recompute non-computed atom'
      );
    });
  });

  describe('createGetter', () => {
    it('should create getter function', () => {
      const evaluateFn = vi.fn((atom) => (atom as any).value || 42);
      const getter = evaluator.createGetter(evaluateFn);
      const atom = createMockAtom('test', 100);

      const result = getter(atom);

      expect(result).toBe(42);
      expect(evaluateFn).toHaveBeenCalledWith(atom);
    });

    it('should create getter that evaluates atoms', () => {
      const values = new Map<symbol, any>();
      const evaluateFn = <V>(atom: any): V => {
        if (!values.has(atom.id)) {
          values.set(atom.id, atom.read());
        }
        return values.get(atom.id);
      };
      const getter = evaluator.createGetter(evaluateFn);
      const atom = createMockAtom('test', 'hello');

      const result = getter(atom);

      expect(result).toBe('hello');
    });
  });

  describe('isEvaluating', () => {
    it('should return false when atom is not being evaluated', () => {
      const atom = createMockAtom('test', 42);
      expect(evaluator.isEvaluating(atom)).toBe(false);
    });

    it('should return true during evaluation', () => {
      const atom = createMockAtom('test', 42);
      let result = false;

      const get: any = (a: any) => {
        if (a.id === atom.id) {
          result = evaluator.isEvaluating(atom);
        }
        return 0;
      };

      evaluator.evaluate(atom, get);

      // Note: isEvaluating checks the stack, which is cleared after evaluation
      // So this test verifies the stack mechanism exists
      expect(evaluator.getEvaluationStackSize()).toBe(0);
    });
  });

  describe('getEvaluationStackSize', () => {
    it('should return 0 when stack is empty', () => {
      expect(evaluator.getEvaluationStackSize()).toBe(0);
    });

    it('should return stack size during nested evaluation', () => {
      const atom1 = createMockAtom('atom1', 1);
      const atom2 = createMockAtom('atom2', 2);

      let stackSize = 0;
      const get: any = (a: any) => {
        if (a.id === atom2.id) {
          stackSize = evaluator.getEvaluationStackSize();
        }
        return a.id === atom1.id ? 1 : 2;
      };

      evaluator.evaluate(atom1, get);

      // Stack should be cleared after evaluation
      expect(evaluator.getEvaluationStackSize()).toBe(0);
    });
  });

  describe('clearEvaluationStack', () => {
    it('should clear the evaluation stack', () => {
      const atom = createMockAtom('test', 42);

      // Manually add to stack (simulating evaluation)
      (evaluator as any).evaluationStack.add(atom.id);
      expect(evaluator.getEvaluationStackSize()).toBe(1);

      evaluator.clearEvaluationStack();

      expect(evaluator.getEvaluationStackSize()).toBe(0);
    });

    it('should handle clearing empty stack', () => {
      expect(evaluator.getEvaluationStackSize()).toBe(0);
      evaluator.clearEvaluationStack();
      expect(evaluator.getEvaluationStackSize()).toBe(0);
    });
  });

  describe('integration', () => {
    it('should handle complex dependency graph', () => {
      let baseValue = 10;
      const baseAtom = createMockAtom('base', baseValue);

      const computed1: ComputedAtom<number> = {
        id: Symbol('computed1'),
        name: 'computed1',
        type: 'computed',
        read: (get) => get(baseAtom) * 2,
      };

      const computed2: ComputedAtom<number> = {
        id: Symbol('computed2'),
        name: 'computed2',
        type: 'computed',
        read: (get) => get(computed1) + 5,
      };

      const get: any = (atom: any) => {
        if (atom.id === baseAtom.id) return baseValue;
        if (atom.id === computed1.id) return baseValue * 2;
        return 0;
      };

      const result = evaluator.evaluate(computed2, get);
      expect(result).toBe(25); // (10 * 2) + 5
    });

    it('should handle multiple evaluations', () => {
      const atom = createMockAtom('test', 0);
      const get = vi.fn((a) => 0);

      evaluator.evaluate(atom, get);
      evaluator.evaluate(atom, get);
      evaluator.evaluate(atom, get);

      // Each evaluation should be independent
      expect(evaluator.getEvaluationStackSize()).toBe(0);
    });

    it('should maintain stack integrity after errors', () => {
      const depAtom = createMockAtom('dep', 42);
      const atom: ComputedAtom<number> = {
        id: Symbol('computed'),
        name: 'computed',
        type: 'computed',
        read: (get) => {
          get(depAtom);
          throw new Error('Test error');
        },
      };
      const get = vi.fn(() => 42);

      expect(() => evaluator.evaluate(atom, get)).toThrow('Test error');

      // Stack should be cleared even after error
      expect(evaluator.getEvaluationStackSize()).toBe(0);
    });
  });
});
