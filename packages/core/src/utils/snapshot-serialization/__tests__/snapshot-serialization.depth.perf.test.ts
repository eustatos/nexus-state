import { describe, it, expect } from "vitest";
import { snapshotSerialization } from "../serialize";

describe("snapshotSerialization - Depth Limiting [Performance]", () => {
  it("should respect maxDepth option", () => {
    const deep = {
      l1: { l2: { l3: { l4: { value: "too deep" } } } },
    };

    const result = snapshotSerialization(deep, { maxDepth: 2 });

    expect((result as any).l1).toBeDefined();
    expect((result as any).l1.l2.l3).toMatchObject({
      __type: "MaxDepthExceeded",
      __message: expect.stringContaining("Max depth 2 reached"),
    });
  });

  it("should use default maxDepth of 50", () => {
    let deep49: any = { value: "leaf" };
    for (let i = 0; i < 49; i++) {
      deep49 = { child: deep49 };
    }

    const result49 = snapshotSerialization(deep49);
    expect((result49 as any).child).toBeDefined();
  });

  it("should include path in MaxDepthExceeded message", () => {
    const data = { user: { profile: { settings: { theme: "dark" } } } };
    const result = snapshotSerialization(data, { maxDepth: 2 });

    const msg = (result as any).user.profile.settings.__message;
    expect(msg).toContain("root.user.profile.settings");
  });

  it("should handle maxDepth of 0", () => {
    const input = { value: "test" };
    const result = snapshotSerialization(input, { maxDepth: 0 });

    expect(result).toMatchObject({
      __type: "Object",
      value: "test",
    });
  });

  it("should handle maxDepth of 1", () => {
    const input = { child: { grandchild: "deep" } };
    const result = snapshotSerialization(input, { maxDepth: 1 });

    expect((result as any).child).toMatchObject({
      __id: expect.any(String),
      __type: "Object",
      grandchild: { __type: "MaxDepthExceeded" },
    });
  });
});
