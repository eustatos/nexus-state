import { describe, it, expect } from "vitest";
import { snapshotSerialization, serializeSnapshot } from "../serialize";

describe("snapshotSerialization - Alias Compatibility", () => {
  it("serializeSnapshot should be same function as snapshotSerialization", () => {
    expect(serializeSnapshot).toBe(snapshotSerialization);
  });

  it("should work identically through alias", () => {
    const input = { test: "value", date: new Date() };

    const r1 = snapshotSerialization(input);
    const r2 = serializeSnapshot(input);

    expect(r1).toEqual(r2);
  });
});
