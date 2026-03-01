import { describe, it, expect } from "vitest";
import {
  defaultActionNaming,
  generateActionName,
  createActionMetadata,
} from "../../utils/action-naming";

describe("Action Naming Utilities", () => {
  describe("defaultActionNaming", () => {
    it("should generate default action name", () => {
      const atomName = "counter";
      const metadata = { atomName, atomType: "primitive", updateType: "direct" as const, customName: "", timestamp: Date.now() };
      const result = defaultActionNaming(atomName, metadata);
      expect(result).toBe("ATOM_UPDATE/counter");
    });
  });

  describe("generateActionName", () => {
    it("should use function strategy", () => {
      const atom = { id: { toString: () => "counter" } };
      const value = 42;
      const strategy = (atom: any, value: any) => `SET_${atom.id.toString()}_TO_${value}`;
      const metadata = { atomName: "counter", atomType: "primitive", updateType: "direct" as const, customName: "", timestamp: Date.now() };
      
      const result = generateActionName(strategy, atom, value, metadata);
      expect(result).toBe("SET_counter_TO_42");
    });

    it("should use custom name with custom strategy", () => {
      const atom = { id: { toString: () => "counter" } };
      const value = 42;
      const strategy = "custom";
      const metadata = { atomName: "counter", atomType: "primitive", updateType: "direct" as const, customName: "INCREMENT", timestamp: Date.now() };
      
      const result = generateActionName(strategy, atom, value, metadata);
      expect(result).toBe("INCREMENT");
    });

    it("should use auto strategy by default", () => {
      const atom = { id: { toString: () => "counter" } };
      const value = 42;
      const strategy = "auto";
      const metadata = { atomName: "counter", atomType: "primitive", updateType: "direct" as const, customName: "", timestamp: Date.now() };
      
      const result = generateActionName(strategy, atom, value, metadata);
      expect(result).toBe("ATOM_UPDATE/counter");
    });

    it("should handle missing custom name with custom strategy", () => {
      const atom = { id: { toString: () => "counter" } };
      const value = 42;
      const strategy = "custom";
      const metadata = { atomName: "counter", atomType: "primitive", updateType: "direct" as const, customName: "", timestamp: Date.now() };
      
      const result = generateActionName(strategy, atom, value, metadata);
      expect(result).toBe("ATOM_UPDATE/counter");
    });
  });

  describe("createActionMetadata", () => {
    it("should create metadata with required fields", () => {
      const metadata = createActionMetadata("counter", "primitive", "direct");
      expect(metadata.atomName).toBe("counter");
      expect(metadata.atomType).toBe("primitive");
      expect(metadata.updateType).toBe("direct");
      expect(metadata.timestamp).toBeGreaterThan(0);
      expect(metadata.customName).toBeUndefined();
    });

    it("should create metadata with custom name", () => {
      const metadata = createActionMetadata("counter", "primitive", "direct", "INCREMENT");
      expect(metadata.customName).toBe("INCREMENT");
    });
  });
});