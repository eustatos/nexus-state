/**
 * Tests for ComparisonFormatter
 */

import { describe, it, expect, beforeEach } from "vitest";
import { ComparisonFormatter } from "../ComparisonFormatter";
import type { SnapshotComparison, AtomComparison } from "../types";
import type { Snapshot } from "../../types";

/**
 * Helper to create a mock comparison result
 */
function createMockComparison(
  overrides?: Partial<SnapshotComparison>,
): SnapshotComparison {
  const baseComparison: SnapshotComparison = {
    id: "cmp_test",
    timestamp: Date.now(),
    summary: {
      totalAtoms: 3,
      changedAtoms: 1,
      addedAtoms: 0,
      removedAtoms: 0,
      unchangedAtoms: 2,
      hasChanges: true,
      changePercentage: 33.33,
    },
    atoms: [
      {
        atomId: "atom1",
        atomName: "counter",
        atomType: "primitive",
        status: "modified",
        oldValue: 1,
        newValue: 2,
        valueDiff: {
          type: "primitive",
          equal: false,
          oldPrimitive: 1,
          newPrimitive: 2,
        },
        path: ["counter"],
      },
      {
        atomId: "atom2",
        atomName: "name",
        atomType: "primitive",
        status: "unchanged",
        oldValue: "test",
        newValue: "test",
        path: ["name"],
      },
      {
        atomId: "atom3",
        atomName: "active",
        atomType: "primitive",
        status: "unchanged",
        oldValue: true,
        newValue: true,
        path: ["active"],
      },
    ],
    statistics: {
      duration: 5,
      memoryUsed: 1024,
      depth: 3,
      totalComparisons: 3,
      cacheHits: 0,
      cacheMisses: 1,
    },
    metadata: {
      snapshotA: {
        id: "snap1",
        timestamp: 1000,
        action: "init",
      },
      snapshotB: {
        id: "snap2",
        timestamp: 2000,
        action: "update",
      },
      timeDifference: 1000,
      options: {
        deepCompare: true,
        maxDepth: 100,
        compareMetadata: true,
        cacheResults: true,
        cacheSize: 100,
        ignoreFunctions: false,
        ignoreSymbols: false,
        circularHandling: "path",
        valueEquality: "strict",
        colorize: false,
      },
    },
    ...overrides,
  };

  return baseComparison;
}

describe("ComparisonFormatter", () => {
  let formatter: ComparisonFormatter;
  let formatterWithColor: ComparisonFormatter;

  beforeEach(() => {
    formatter = new ComparisonFormatter(false);
    formatterWithColor = new ComparisonFormatter(true);
  });

  describe("format - Summary format", () => {
    it("should format summary correctly", () => {
      const comparison = createMockComparison();
      const result = formatter.format(comparison, "summary");

      expect(result).toContain("=== Snapshot Comparison ===");
      expect(result).toContain("Time difference:");
      expect(result).toContain("Total atoms: 3");
      expect(result).toContain("Changed: 1");
      expect(result).toContain("Added: 0");
      expect(result).toContain("Removed: 0");
      expect(result).toContain("Modified: 1");
      expect(result).toContain("Unchanged: 2");
      expect(result).toContain("Computed in:");
    });

    it("should include action names when available", () => {
      const comparison = createMockComparison();
      const result = formatter.format(comparison, "summary");

      expect(result).toContain("init");
      expect(result).toContain("update");
    });

    it("should format with colors when enabled", () => {
      const comparison = createMockComparison();
      const result = formatterWithColor.format(comparison, "summary");

      // Color codes should be present
      expect(result).toContain("\x1b[");
    });
  });

  describe("format - Detailed format", () => {
    it("should format detailed changes correctly", () => {
      const comparison = createMockComparison();
      const result = formatter.format(comparison, "detailed");

      expect(result).toContain("=== Atom Changes ===");
      expect(result).toContain("Modified atoms:");
      expect(result).toContain("counter");
    });

    it("should show added atoms section", () => {
      const comparison = createMockComparison({
        summary: {
          totalAtoms: 1,
          changedAtoms: 1,
          addedAtoms: 1,
          removedAtoms: 0,
          unchangedAtoms: 0,
          hasChanges: true,
          changePercentage: 100,
        },
        atoms: [
          {
            atomId: "atom1",
            atomName: "newAtom",
            atomType: "primitive",
            status: "added",
            newValue: 42,
            path: ["newAtom"],
          },
        ],
      });

      const result = formatter.format(comparison, "detailed");

      expect(result).toContain("Added atoms:");
      expect(result).toContain("newAtom");
    });

    it("should show removed atoms section", () => {
      const comparison = createMockComparison({
        summary: {
          totalAtoms: 1,
          changedAtoms: 1,
          addedAtoms: 0,
          removedAtoms: 1,
          unchangedAtoms: 0,
          hasChanges: true,
          changePercentage: 100,
        },
        atoms: [
          {
            atomId: "atom1",
            atomName: "oldAtom",
            atomType: "primitive",
            status: "removed",
            oldValue: 42,
            path: ["oldAtom"],
          },
        ],
      });

      const result = formatter.format(comparison, "detailed");

      expect(result).toContain("Removed atoms:");
      expect(result).toContain("oldAtom");
    });

    it("should show no changes message when appropriate", () => {
      const comparison = createMockComparison({
        summary: {
          totalAtoms: 1,
          changedAtoms: 0,
          addedAtoms: 0,
          removedAtoms: 0,
          unchangedAtoms: 1,
          hasChanges: false,
          changePercentage: 0,
        },
        atoms: [
          {
            atomId: "atom1",
            atomName: "unchanged",
            atomType: "primitive",
            status: "unchanged",
            path: ["unchanged"],
          },
        ],
      });

      const result = formatter.format(comparison, "detailed");

      expect(result).toContain("No changes detected");
    });
  });

  describe("format - JSON format", () => {
    it("should format as valid JSON", () => {
      const comparison = createMockComparison();
      const result = formatter.format(comparison, "json");

      const parsed = JSON.parse(result);
      expect(parsed.id).toBe("cmp_test");
      expect(parsed.summary.totalAtoms).toBe(3);
    });
  });

  describe("visualize - Tree format", () => {
    it("should visualize as tree structure", () => {
      const comparison = createMockComparison();
      const result = formatter.visualize(comparison, "tree");

      expect(result).toContain("State Tree:");
      expect(result).toContain("├─");
      expect(result).toContain("└─");
    });
  });

  describe("visualize - List format", () => {
    it("should visualize as list", () => {
      const comparison = createMockComparison();
      const result = formatter.visualize(comparison, "list");

      // List format shows all atoms with their status icons
      expect(result).toContain("counter");
      expect(result).toContain("[modified]");
      // Note: "+" only appears for added atoms, "~" for modified
    });
  });

  describe("export - JSON format", () => {
    it("should export as JSON", () => {
      const comparison = createMockComparison();
      const result = formatter.export(comparison, "json");

      const parsed = JSON.parse(result);
      expect(parsed.id).toBeDefined();
      expect(parsed.atoms).toHaveLength(3);
    });
  });

  describe("export - HTML format", () => {
    it("should export as valid HTML", () => {
      const comparison = createMockComparison();
      const result = formatter.export(comparison, "html");

      expect(result).toContain("<!DOCTYPE html>");
      expect(result).toContain("<html>");
      expect(result).toContain("</html>");
      expect(result).toContain("<table>");
      expect(result).toContain("counter");
    });
  });

  describe("export - Markdown format", () => {
    it("should export as Markdown", () => {
      const comparison = createMockComparison();
      const result = formatter.export(comparison, "md");

      expect(result).toContain("# Snapshot Comparison");
      expect(result).toContain("## Summary");
      expect(result).toContain("| Metric | Value |");
      expect(result).toContain("## Atom Changes");
    });

    it("should include Added section when atoms are added", () => {
      const comparison = createMockComparison({
        summary: {
          totalAtoms: 1,
          changedAtoms: 1,
          addedAtoms: 1,
          removedAtoms: 0,
          unchangedAtoms: 0,
          hasChanges: true,
          changePercentage: 100,
        },
        atoms: [
          {
            atomId: "atom1",
            atomName: "newAtom",
            atomType: "primitive",
            status: "added",
            newValue: 42,
            path: ["newAtom"],
          },
        ],
      });

      const result = formatter.export(comparison, "md");

      expect(result).toContain("### Added");
      expect(result).toContain("newAtom");
    });

    it("should include Removed section when atoms are removed", () => {
      const comparison = createMockComparison({
        summary: {
          totalAtoms: 1,
          changedAtoms: 1,
          addedAtoms: 0,
          removedAtoms: 1,
          unchangedAtoms: 0,
          hasChanges: true,
          changePercentage: 100,
        },
        atoms: [
          {
            atomId: "atom1",
            atomName: "oldAtom",
            atomType: "primitive",
            status: "removed",
            oldValue: 42,
            path: ["oldAtom"],
          },
        ],
      });

      const result = formatter.export(comparison, "md");

      expect(result).toContain("### Removed");
      expect(result).toContain("oldAtom");
    });

    it("should include Modified section when atoms are modified", () => {
      const comparison = createMockComparison();
      const result = formatter.export(comparison, "md");

      expect(result).toContain("### Modified");
      expect(result).toContain("counter");
    });
  });

  describe("formatValueDiff", () => {
    it("should format primitive diff", () => {
      const comparison = createMockComparison();
      const result = formatter.format(comparison, "detailed");

      expect(result).toContain("Old:");
      expect(result).toContain("New:");
    });
  });

  describe("Utility functions", () => {
    it("should format duration correctly", () => {
      const comparison = createMockComparison();
      const result = formatter.format(comparison, "summary");

      expect(result).toMatch(/ms/);
    });

    it("should format bytes correctly", () => {
      const comparison = createMockComparison();
      const result = formatter.format(comparison, "summary");

      // Should contain memory formatting (B, KB, or MB)
      expect(result).toMatch(/(B|KB|MB)/);
    });

    it("should truncate long values", () => {
      const longComparison = createMockComparison({
        summary: {
          totalAtoms: 1,
          changedAtoms: 1,
          addedAtoms: 0,
          removedAtoms: 0,
          unchangedAtoms: 0,
          hasChanges: true,
          changePercentage: 100,
        },
        atoms: [
          {
            atomId: "atom1",
            atomName: "longValue",
            atomType: "primitive",
            status: "modified",
            oldValue: "a".repeat(100),
            newValue: "b".repeat(100),
            valueDiff: {
              type: "primitive",
              equal: false,
              oldPrimitive: "a".repeat(100),
              newPrimitive: "b".repeat(100),
            },
            path: ["longValue"],
          },
        ],
      });

      const result = formatter.format(longComparison, "detailed");

      // Should contain truncation indicator in detailed output
      expect(result).toContain("...");
    });
  });
});
