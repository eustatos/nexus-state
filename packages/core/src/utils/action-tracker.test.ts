import { describe, it, expect, vi, beforeEach } from "vitest";
import { 
  ActionTracker, 
  globalActionTracker, 
  createActionWithStackTrace,
  ActionMetadata,
  ActionTrackingOptions
} from "./action-tracker";

describe("ActionTracker", () => {
  let tracker: ActionTracker;

  beforeEach(() => {
    tracker = new ActionTracker();
  });

  describe("trackAction", () => {
    it("should track action", () => {
      const metadata: ActionMetadata = {
        id: "test-id",
        type: "SET",
        timestamp: Date.now()
      };

      tracker.trackAction(metadata);

      expect(tracker.getActionCount()).toBe(1);
    });

    it("should capture stack trace when enabled", () => {
      const tracker = new ActionTracker({ captureStackTrace: true });
      const metadata: ActionMetadata = {
        id: "test-id",
        type: "SET",
        timestamp: Date.now()
      };

      tracker.trackAction(metadata);

      expect(metadata.stackTrace).toBeDefined();
      expect(metadata.stackTrace).toContain("trackAction");
    });

    it("should respect enabled option", () => {
      const tracker = new ActionTracker({ enabled: false });
      const metadata: ActionMetadata = {
        id: "test-id",
        type: "SET",
        timestamp: Date.now()
      };

      tracker.trackAction(metadata);

      expect(tracker.getActionCount()).toBe(0);
    });
  });

  describe("getRecentActions", () => {
    it("should get recent actions", () => {
      for (let i = 0; i < 5; i++) {
        tracker.trackAction({
          id: `action-${i}`,
          type: "SET",
          timestamp: Date.now()
        });
      }

      const recent = tracker.getRecentActions(3);
      expect(recent.length).toBe(3);
      expect(recent[0].id).toBe("action-2");
    });

    it("should return empty array when no actions", () => {
      const recent = tracker.getRecentActions(10);
      expect(recent).toEqual([]);
    });
  });

  describe("getActionsByType", () => {
    it("should filter by type", () => {
      tracker.trackAction({
        id: "action-1",
        type: "SET",
        timestamp: Date.now()
      });

      tracker.trackAction({
        id: "action-2",
        type: "COMPUTED_UPDATE",
        timestamp: Date.now()
      });

      tracker.trackAction({
        id: "action-3",
        type: "SET",
        timestamp: Date.now()
      });

      const setActions = tracker.getActionsByType("SET");
      expect(setActions.length).toBe(2);
      expect(setActions[0].id).toBe("action-1");
      expect(setActions[1].id).toBe("action-3");
    });

    it("should return empty array for non-existent type", () => {
      const actions = tracker.getActionsByType("NON_EXISTENT");
      expect(actions).toEqual([]);
    });
  });

  describe("getActionsBySource", () => {
    it("should filter by source", () => {
      tracker.trackAction({
        id: "action-1",
        type: "SET",
        source: "ComponentA",
        timestamp: Date.now()
      });

      tracker.trackAction({
        id: "action-2",
        type: "SET",
        source: "ComponentB",
        timestamp: Date.now()
      });

      const componentAActions = tracker.getActionsBySource("ComponentA");
      expect(componentAActions.length).toBe(1);
      expect(componentAActions[0].id).toBe("action-1");
    });

    it("should return empty array for non-existent source", () => {
      const actions = tracker.getActionsBySource("NON_EXISTENT");
      expect(actions).toEqual([]);
    });
  });

  describe("clearHistory", () => {
    it("should clear all actions", () => {
      for (let i = 0; i < 5; i++) {
        tracker.trackAction({
          id: `action-${i}`,
          type: "SET",
          timestamp: Date.now()
        });
      }

      expect(tracker.getActionCount()).toBe(5);

      tracker.clearHistory();
      expect(tracker.getActionCount()).toBe(0);
    });
  });

  describe("getActionCount", () => {
    it("should return action count", () => {
      expect(tracker.getActionCount()).toBe(0);

      tracker.trackAction({
        id: "action-1",
        type: "SET",
        timestamp: Date.now()
      });

      expect(tracker.getActionCount()).toBe(1);

      tracker.trackAction({
        id: "action-2",
        type: "SET",
        timestamp: Date.now()
      });

      expect(tracker.getActionCount()).toBe(2);
    });
  });

  describe("createSetActionMetadata", () => {
    it("should create SET metadata", () => {
      const atom = { id: Symbol("atom"), type: "primitive" as const };
      const metadata = tracker.createSetActionMetadata(
        atom,
        10,
        20,
        "Component",
        { custom: "data" }
      );

      expect(metadata.id).toBeDefined();
      expect(metadata.type).toBe("SET");
      expect(metadata.atom).toBe(atom);
      expect(metadata.previousValue).toBeUndefined(); // includeValues is false by default
      expect(metadata.newValue).toBeUndefined();
      expect(metadata.source).toBe("Component");
      expect(metadata.timestamp).toBeDefined();
      expect(metadata.custom).toEqual({ custom: "data" });
    });

    it("should include values when option enabled", () => {
      const tracker = new ActionTracker({ includeValues: true });
      const atom = { id: Symbol("atom"), type: "primitive" as const };

      const metadata = tracker.createSetActionMetadata(
        atom,
        10,
        20
      );

      expect(metadata.previousValue).toBe(10);
      expect(metadata.newValue).toBe(20);
    });
  });

  describe("createComputedUpdateMetadata", () => {
    it("should create COMPUTED_UPDATE metadata", () => {
      const atom = { id: Symbol("atom"), type: "computed" as const };
      const metadata = tracker.createComputedUpdateMetadata(
        atom,
        10,
        20,
        []
      );

      expect(metadata.id).toBeDefined();
      expect(metadata.type).toBe("COMPUTED_UPDATE");
      expect(metadata.atom).toBe(atom);
      expect(metadata.timestamp).toBeDefined();
    });

    it("should include dependencies in custom", () => {
      const atom1 = { id: Symbol("atom1"), type: "primitive" as const };
      const atom2 = { id: Symbol("atom2"), type: "primitive" as const };
      const computedAtom = { id: Symbol("computed"), type: "computed" as const };

      const metadata = tracker.createComputedUpdateMetadata(
        computedAtom,
        10,
        20,
        [atom1, atom2]
      );

      expect(metadata.custom?.dependencies).toBeDefined();
      expect(metadata.custom?.dependencies.length).toBe(2);
    });
  });

  describe("generateId", () => {
    it("should generate unique IDs", () => {
      const id1 = tracker["generateId"]();
      const id2 = tracker["generateId"]();

      expect(id1).not.toBe(id2);
    });

    it("should include timestamp in ID", () => {
      const id = tracker["generateId"]();
      expect(id).toContain("-");
    });
  });

  describe("max history size", () => {
    it("should respect maxHistorySize", () => {
      const tracker = new ActionTracker({ maxHistorySize: 3 });
      
      for (let i = 0; i < 5; i++) {
        tracker.trackAction({
          id: `action-${i}`,
          type: "SET",
          timestamp: Date.now()
        });
      }

      expect(tracker.getActionCount()).toBe(3);
    });
  });

  describe("edge cases", () => {
    it("should handle null metadata", () => {
      expect(() => tracker.trackAction(null as any)).not.toThrow();
    });

    it("should handle empty type", () => {
      const metadata: ActionMetadata = {
        id: "test",
        type: "",
        timestamp: Date.now()
      };
      
      expect(() => tracker.trackAction(metadata)).not.toThrow();
    });
  });
});

describe("globalActionTracker", () => {
  it("should be a singleton instance", () => {
    const tracker1 = globalActionTracker;
    const tracker2 = new ActionTracker();

    expect(tracker1).not.toBe(tracker2);
    expect(tracker1).toBeInstanceOf(ActionTracker);
  });

  it("should track actions globally", () => {
    const metadata: ActionMetadata = {
      id: "global-test",
      type: "SET",
      timestamp: Date.now()
    };

    globalActionTracker.trackAction(metadata);

    expect(globalActionTracker.getActionCount()).toBe(1);
  });
});

describe("createActionWithStackTrace", () => {
  it("should create action with stack trace", () => {
    const metadata = createActionWithStackTrace("TEST", "test-source", { custom: "data" });

    expect(metadata.id).toBeDefined();
    expect(metadata.type).toBe("TEST");
    expect(metadata.source).toBe("test-source");
    expect(metadata.timestamp).toBeDefined();
    expect(metadata.stackTrace).toBeDefined();
    expect(metadata.stackTrace).toContain("createActionWithStackTrace");
    expect(metadata.custom).toEqual({ custom: "data" });
  });

  it("should create action without source", () => {
    const metadata = createActionWithStackTrace("TEST");

    expect(metadata.id).toBeDefined();
    expect(metadata.type).toBe("TEST");
    expect(metadata.source).toBeUndefined();
  });
});
