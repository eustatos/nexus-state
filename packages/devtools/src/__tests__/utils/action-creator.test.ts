import { describe, it, expect } from "vitest";
import {
  createAction,
  createActionGroup,
  createActionWithNaming,
} from "../../utils/action-creator";

describe("Action Creator", () => {
  describe("createAction", () => {
    it("should create action with name", () => {
      const action = createAction("TEST_ACTION");
      expect(action.type).toBe("TEST_ACTION");
      expect(action.timestamp).toBeGreaterThan(0);
    });

    it("should create action with payload", () => {
      const payload = { value: 42 };
      const action = createAction("TEST_ACTION", payload);
      expect(action.payload).toEqual(payload);
    });

    it("should create action with metadata", () => {
      const metadata = { atomName: "counter", atomType: "primitive", updateType: "direct" as const, customName: "INCREMENT", timestamp: Date.now() };
      const action = createAction("TEST_ACTION", undefined, metadata);
      expect(action.metadata).toEqual(metadata);
    });

    it("should create action with stack trace", () => {
      const stackTrace = { frames: ["test"], timestamp: Date.now() };
      const action = createAction("TEST_ACTION", undefined, undefined, stackTrace);
      expect(action.stackTrace).toEqual(stackTrace);
    });
  });

  describe("createActionGroup", () => {
    it("should create action group", () => {
      const actions = [
        createAction("ACTION1"),
        createAction("ACTION2"),
      ];
      const group = createActionGroup(actions, "BATCH_UPDATE");
      expect(group.actions).toEqual(actions);
      expect(group.groupName).toBe("BATCH_UPDATE");
      expect(group.timestamp).toBeGreaterThan(0);
    });
  });

  describe("createActionWithNaming", () => {
    it("should create action with function strategy", () => {
      const atom = { id: { toString: () => "counter" } };
      const value = 42;
      const strategy = (atom: any, value: any) => `UPDATE_${atom.id.toString()}_TO_${value}`;
      const metadata = { atomName: "counter", atomType: "primitive", updateType: "direct" as const, customName: "", timestamp: Date.now() };
      
      const action = createActionWithNaming(atom, value, strategy, metadata);
      expect(action.type).toBe("UPDATE_counter_TO_42");
      expect(action.payload).toBe(value);
    });

    it("should use custom name from metadata", () => {
      const atom = { id: { toString: () => "counter" } };
      const value = 42;
      const strategy = "custom";
      const metadata = { atomName: "counter", atomType: "primitive", updateType: "direct" as const, customName: "INCREMENT_COUNTER", timestamp: Date.now() };
      
      const action = createActionWithNaming(atom, value, strategy, metadata);
      expect(action.type).toBe("INCREMENT_COUNTER");
    });

    it("should use auto strategy by default", () => {
      const atom = { id: { toString: () => "counter" } };
      const value = 42;
      const strategy = "auto";
      const metadata = { atomName: "counter", atomType: "primitive", updateType: "direct" as const, customName: "", timestamp: Date.now() };
      
      const action = createActionWithNaming(atom, value, strategy, metadata);
      expect(action.type).toBe("ATOM_UPDATE/counter");
    });
  });
});