import {
  AutoNamingStrategy,
  SimpleNamingStrategy,
  PatternNamingStrategy,
  CustomNamingStrategy,
  CompositeNamingStrategy,
  createBuiltInStrategy,
  defaultAutoStrategy,
  defaultSimpleStrategy,
  defaultPatternStrategy,
} from "../strategies";
import type { ActionNamingContext } from "../types";
import { vi } from "vitest";

describe("Action Naming Strategies", () => {
  const mockContext: ActionNamingContext = {
    atom: { id: { toString: () => "test-atom" } } as any,
    atomName: "user",
    operation: "SET",
    timestamp: 1234567890,
    state: { value: "test" },
    metadata: { source: "test" },
  };

  describe("AutoNamingStrategy", () => {
    const strategy = new AutoNamingStrategy();

    it("should have correct name and description", () => {
      expect(strategy.name).toBe("auto");
      expect(strategy.description).toContain(
        "Combines atom name with operation",
      );
    });

    it("should combine atom name and operation", () => {
      const result = strategy.getName(mockContext);
      expect(result).toBe("user SET");
    });

    it("should handle different operations", () => {
      const context = { ...mockContext, operation: "INCREMENT" };
      const result = strategy.getName(context);
      expect(result).toBe("user INCREMENT");
    });

    it("should handle different atom names", () => {
      const context = { ...mockContext, atomName: "counter" };
      const result = strategy.getName(context);
      expect(result).toBe("counter SET");
    });
  });

  describe("SimpleNamingStrategy", () => {
    const strategy = new SimpleNamingStrategy();

    it("should have correct name and description", () => {
      expect(strategy.name).toBe("simple");
      expect(strategy.description).toContain("Uses only the operation name");
    });

    it("should return only operation name", () => {
      const result = strategy.getName(mockContext);
      expect(result).toBe("SET");
    });

    it("should handle different operations", () => {
      const context = { ...mockContext, operation: "RESET" };
      const result = strategy.getName(context);
      expect(result).toBe("RESET");
    });

    it("should ignore atom name", () => {
      const context = { ...mockContext, atomName: "different" };
      const result = strategy.getName(context);
      expect(result).toBe("SET"); // Still just operation
    });
  });

  describe("PatternNamingStrategy", () => {
    it("should create with basic pattern", () => {
      const strategy = new PatternNamingStrategy({
        pattern: "{atomName}.{operation}",
      });

      expect(strategy.name).toBe("pattern");
      expect(strategy.description).toContain("Pattern-based naming");

      const result = strategy.getName(mockContext);
      expect(result).toBe("user.SET");
    });

    it("should handle timestamp placeholder", () => {
      const strategy = new PatternNamingStrategy({
        pattern: "[{timestamp}] {atomName} {operation}",
        placeholders: { timestamp: true },
      });

      const result = strategy.getName(mockContext);
      expect(result).toBe("[1234567890] user SET");
    });

    it("should handle date and time placeholders", () => {
      const strategy = new PatternNamingStrategy({
        pattern: "{date} {time} {atomName}.{operation}",
        placeholders: { date: true, time: true },
      });

      const result = strategy.getName(mockContext);
      // Date should be in YYYY-MM-DD format
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} user\.SET$/);
    });

    it("should handle custom placeholders", () => {
      const strategy = new PatternNamingStrategy({
        pattern: "{custom1}-{custom2} {atomName}",
        placeholders: {
          custom: {
            custom1: () => "test",
            custom2: (ctx) => ctx.operation.toLowerCase(),
          },
        },
      });

      const result = strategy.getName(mockContext);
      expect(result).toBe("test-set user");
    });

    it("should handle missing placeholders gracefully", () => {
      const strategy = new PatternNamingStrategy({
        pattern: "{atomName} {operation}",
        placeholders: { timestamp: false }, // Not included
      });

      const result = strategy.getName(mockContext);
      expect(result).toBe("user SET");
      expect(result).not.toContain("timestamp");
    });
  });

  describe("CustomNamingStrategy", () => {
    it("should use custom naming function", () => {
      const customFn = vi.fn().mockReturnValue("custom-name");
      const strategy = new CustomNamingStrategy(
        customFn,
        "Test custom strategy",
      );

      expect(strategy.name).toBe("custom");
      expect(strategy.description).toBe("Test custom strategy");

      const result = strategy.getName(mockContext);
      expect(result).toBe("custom-name");
      expect(customFn).toHaveBeenCalledWith(mockContext);
    });

    it("should use default description if not provided", () => {
      const customFn = () => "test";
      const strategy = new CustomNamingStrategy(customFn);

      expect(strategy.description).toBe("Custom user-defined naming function");
    });
  });

  describe("CompositeNamingStrategy", () => {
    it("should try strategies in order", () => {
      const strategy1 = {
        name: "first",
        description: "First strategy",
        getName: vi.fn().mockReturnValue(""), // Returns empty string
      };

      const strategy2 = {
        name: "second",
        description: "Second strategy",
        getName: vi.fn().mockReturnValue("success"),
      };

      const strategy3 = {
        name: "third",
        description: "Third strategy",
        getName: vi.fn().mockReturnValue("should-not-be-called"),
      };

      const composite = new CompositeNamingStrategy(
        [strategy1, strategy2, strategy3] as any,
        "fallback",
      );

      const result = composite.getName(mockContext);
      expect(result).toBe("success");
      expect(strategy1.getName).toHaveBeenCalled();
      expect(strategy2.getName).toHaveBeenCalled();
      expect(strategy3.getName).not.toHaveBeenCalled();
    });

    it("should use fallback if all strategies fail", () => {
      const failingStrategy = {
        name: "failing",
        description: "Failing strategy",
        getName: vi.fn().mockImplementation(() => {
          throw new Error("Strategy failed");
        }),
      };

      const composite = new CompositeNamingStrategy(
        [failingStrategy] as any,
        "fallback-name",
      );

      const result = composite.getName(mockContext);
      expect(result).toBe("fallback-name");
    });

    it("should use fallback if all strategies return empty strings", () => {
      const emptyStrategy = {
        name: "empty",
        description: "Empty strategy",
        getName: vi.fn().mockReturnValue(""),
      };

      const composite = new CompositeNamingStrategy(
        [emptyStrategy] as any,
        "fallback",
      );

      const result = composite.getName(mockContext);
      expect(result).toBe("fallback");
    });
  });

  describe("createBuiltInStrategy", () => {
    it("should create auto strategy", () => {
      const strategy = createBuiltInStrategy("auto");
      expect(strategy.name).toBe("auto");
      expect(strategy.getName(mockContext)).toBe("user SET");
    });

    it("should create simple strategy", () => {
      const strategy = createBuiltInStrategy("simple");
      expect(strategy.name).toBe("simple");
      expect(strategy.getName(mockContext)).toBe("SET");
    });

    it("should create pattern strategy with config", () => {
      const strategy = createBuiltInStrategy("pattern", {
        pattern: "{atomName}-{operation}",
      });
      expect(strategy.name).toBe("pattern");
      expect(strategy.getName(mockContext)).toBe("user-SET");
    });

    it("should throw error for pattern without config", () => {
      expect(() => createBuiltInStrategy("pattern")).toThrow(
        "Pattern strategy requires config with pattern",
      );
    });

    it("should throw error for unknown strategy", () => {
      expect(() => createBuiltInStrategy("unknown" as any)).toThrow(
        "Unknown built-in strategy",
      );
    });
  });

  describe("Default strategies", () => {
    it("should have default auto strategy", () => {
      expect(defaultAutoStrategy.name).toBe("auto");
      expect(defaultAutoStrategy.getName(mockContext)).toBe("user SET");
    });

    it("should have default simple strategy", () => {
      expect(defaultSimpleStrategy.name).toBe("simple");
      expect(defaultSimpleStrategy.getName(mockContext)).toBe("SET");
    });

    it("should have default pattern strategy", () => {
      expect(defaultPatternStrategy.name).toBe("pattern");
      const result = defaultPatternStrategy.getName(mockContext);
      expect(result).toMatch(/^\[\d+\] user SET$/);
    });
  });
});
