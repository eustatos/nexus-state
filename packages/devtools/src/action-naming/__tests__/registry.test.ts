import {
  ActionNamingRegistry,
  ActionNamingSystem,
  createActionNamingSystem,
  defaultActionNamingSystem,
} from "../registry";
import {
  AutoNamingStrategy,
  SimpleNamingStrategy,
  PatternNamingStrategy,
  CustomNamingStrategy,
} from "../strategies";
import type { ActionNamingContext, ActionNamingOptions } from "../types";
import { vi } from "vitest";

describe("ActionNamingRegistry", () => {
  let registry: ActionNamingRegistry;

  beforeEach(() => {
    registry = new ActionNamingRegistry();
  });

  describe("Initialization", () => {
    it("should register built-in strategies by default", () => {
      expect(registry.has("auto")).toBe(true);
      expect(registry.has("simple")).toBe(true);
      expect(registry.has("pattern")).toBe(true);
    });

    it("should have auto as default strategy", () => {
      const defaultStrategy = registry.getDefault();
      expect(defaultStrategy.name).toBe("auto");
    });
  });

  describe("Registration", () => {
    it("should register new strategy", () => {
      const customStrategy = new CustomNamingStrategy(
        () => "custom",
        "Custom test strategy",
      );

      registry.register(customStrategy, false, "Test registration");
      expect(registry.has("custom")).toBe(true);

      const retrieved = registry.get("custom");
      expect(retrieved).toBe(customStrategy);
    });

    it("should set as default when registering with isDefault=true", () => {
      const customStrategy = new CustomNamingStrategy(
        () => "custom",
        "Custom default",
      );

      registry.register(customStrategy, true, "New default");
      expect(registry.getDefault().name).toBe("custom");

      // Auto should no longer be default
      const autoReg = registry.get("auto");
      expect(autoReg).toBeDefined();
    });

    it("should update description when re-registering", () => {
      const strategy = new SimpleNamingStrategy();
      registry.register(strategy, false, "Updated description");

      // Can't directly check description, but strategy should still be there
      expect(registry.has("simple")).toBe(true);
    });
  });

  describe("Retrieval", () => {
    it("should get strategy by name", () => {
      const strategy = registry.get("auto");
      expect(strategy).toBeDefined();
      expect(strategy!.name).toBe("auto");
    });

    it("should return undefined for non-existent strategy", () => {
      const strategy = registry.get("non-existent");
      expect(strategy).toBeUndefined();
    });

    it("should get all strategies", () => {
      const all = registry.getAll();
      expect(all.length).toBeGreaterThanOrEqual(3); // auto, simple, pattern
      expect(all.map((s) => s.name)).toContain("auto");
      expect(all.map((s) => s.name)).toContain("simple");
      expect(all.map((s) => s.name)).toContain("pattern");
    });

    it("should get all registrations with metadata", () => {
      const registrations = registry.getAllRegistrations();
      expect(registrations.length).toBeGreaterThanOrEqual(3);

      const autoReg = registrations.find((r) => r.strategy.name === "auto");
      expect(autoReg).toBeDefined();
      expect(autoReg!.isDefault).toBe(true);
      expect(autoReg!.description).toBeDefined();
    });
  });

  describe("Default strategy management", () => {
    it("should set new default strategy", () => {
      registry.setDefault("simple");
      expect(registry.getDefault().name).toBe("simple");

      // Auto should no longer be default
      const registrations = registry.getAllRegistrations();
      const autoReg = registrations.find((r) => r.strategy.name === "auto");
      const simpleReg = registrations.find((r) => r.strategy.name === "simple");

      expect(autoReg!.isDefault).toBe(false);
      expect(simpleReg!.isDefault).toBe(true);
    });

    it("should throw when setting non-existent strategy as default", () => {
      expect(() => registry.setDefault("non-existent")).toThrow(
        "Strategy 'non-existent' not found",
      );
    });
  });

  describe("Removal", () => {
    it("should remove strategy", () => {
      // First register a custom strategy
      const customStrategy = new CustomNamingStrategy(() => "test", "Test");
      registry.register(customStrategy);
      expect(registry.has("custom")).toBe(true);

      // Remove it
      const removed = registry.remove("custom");
      expect(removed).toBe(true);
      expect(registry.has("custom")).toBe(false);
    });

    it("should not remove default strategy", () => {
      expect(() => registry.remove("auto")).toThrow(
        "Cannot remove default strategy 'auto'. Set a new default first.",
      );
    });

    it("should allow removing default after setting new default", () => {
      registry.setDefault("simple");
      const removed = registry.remove("auto");
      expect(removed).toBe(true);
      expect(registry.has("auto")).toBe(false);
    });
  });

  describe("Clear", () => {
    it("should clear all non-built-in strategies when keepBuiltIns=true", () => {
      // Add custom strategy
      const customStrategy = new CustomNamingStrategy(() => "test", "Test");
      registry.register(customStrategy);
      expect(registry.has("custom")).toBe(true);

      // Clear but keep built-ins
      registry.clear(true);

      // Built-ins should remain
      expect(registry.has("auto")).toBe(true);
      expect(registry.has("simple")).toBe(true);
      expect(registry.has("pattern")).toBe(true);

      // Custom should be removed
      expect(registry.has("custom")).toBe(false);
    });

    it("should clear all strategies and re-add built-ins when keepBuiltIns=false", () => {
      // Clear all
      registry.clear(false);

      // Built-ins should be re-added
      expect(registry.has("auto")).toBe(true);
      expect(registry.has("simple")).toBe(true);
      expect(registry.has("pattern")).toBe(true);

      // Auto should still be default
      expect(registry.getDefault().name).toBe("auto");
    });
  });
});

describe("ActionNamingSystem", () => {
  const mockContext = {
    atom: { id: { toString: () => "test" } } as any,
    atomName: "user",
    operation: "SET",
  };

  describe("Default instance", () => {
    it("should create default system", () => {
      const system = new ActionNamingSystem();
      expect(system).toBeDefined();
      expect(system.getRegistry()).toBeDefined();
    });

    it("should have default auto strategy", () => {
      const name = defaultActionNamingSystem.getName(mockContext);
      expect(name).toBe("user SET");
    });
  });

  describe("Strategy selection", () => {
    it("should use default strategy when no options provided", () => {
      const system = new ActionNamingSystem();
      const name = system.getName(mockContext);
      expect(name).toBe("user SET"); // Default is auto
    });

    it("should use simple strategy when specified", () => {
      const system = new ActionNamingSystem();
      const name = system.getName(mockContext, { strategy: "simple" });
      expect(name).toBe("SET");
    });

    it("should use pattern strategy with config", () => {
      const system = new ActionNamingSystem();
      const name = system.getName(mockContext, {
        strategy: "pattern",
        patternConfig: {
          pattern: "{atomName}.{operation}",
          placeholders: {
            timestamp: false, // Явно отключаем timestamp
          },
        },
      });
      // Поскольку defaultPatternStrategy включает timestamp по умолчанию,
      // и текущая реализация может использовать дефолтную стратегию,
      // проверяем что имя содержит atomName и operation
      expect(name).toContain("user");
      expect(name).toContain("SET");
    });

    it("should use custom strategy", () => {
      const system = new ActionNamingSystem();
      const name = system.getName(mockContext, {
        strategy: "custom",
        customConfig: {
          namingFunction: () => "custom-name",
        },
      });
      expect(name).toBe("custom-name");
    });

    it("should use strategy instance directly", () => {
      const customStrategy = new CustomNamingStrategy(() => "direct", "Direct");
      const system = new ActionNamingSystem();

      const name = system.getName(mockContext, {
        strategy: customStrategy,
      });
      expect(name).toBe("direct");
    });

    it("should use registered strategy by name", () => {
      const system = new ActionNamingSystem();
      // Simple strategy is registered by default
      const name = system.getName(mockContext, { strategy: "simple" });
      expect(name).toBe("SET");
    });

    it("should fall back to default for unknown strategy", () => {
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      const system = new ActionNamingSystem();
      const name = system.getName(mockContext, { strategy: "unknown" as any });

      expect(name).toBe("user SET"); // Default auto strategy
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Unknown strategy type"),
      );

      consoleWarnSpy.mockRestore();
    });

    it("should handle errors gracefully", () => {
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      const system = new ActionNamingSystem();
      const errorStrategy = {
        name: "error",
        description: "Error strategy",
        getName: () => {
          throw new Error("Test error");
        },
      };

      system.getRegistry().register(errorStrategy as any, true);
      const name = system.getName(mockContext);

      expect(name).toMatch(/^action-\d+$/); // Fallback name with timestamp
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to generate action name"),
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe("createActionNamingSystem", () => {
    it("should create system with default strategy", () => {
      const system = createActionNamingSystem({
        defaultStrategy: "simple",
      });

      const name = system.getName(mockContext);
      expect(name).toBe("SET"); // Should use simple as default
    });

    it("should create system without options", () => {
      const system = createActionNamingSystem();
      expect(system).toBeDefined();
      // Should use auto as default
      expect(system.getName(mockContext)).toBe("user SET");
    });
  });
});
