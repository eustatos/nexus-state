import { describe, it, expect } from "vitest";
import { snapshotSerialization } from "../serialize";
import { getObjectId } from "./helpers";

describe("snapshotSerialization - Circular References [Performance]", () => {
  it("should handle self-referencing object", () => {
    const obj: any = { name: "root" };
    obj.self = obj;

    const result = snapshotSerialization(obj);

    const objId = getObjectId(result);
    expect(objId).toBeDefined();
    expect((result as any).self).toEqual({ __ref: objId });
  });

  it("should handle mutual circular references (A -> B -> A)", () => {
    const a: any = { name: "A" };
    const b: any = { name: "B" };
    a.ref = b;
    b.ref = a;

    const result = snapshotSerialization({ a, b });

    const aId = getObjectId((result as any).a);
    const bId = getObjectId((result as any).a.ref);

    expect((result as any).a.ref).toMatchObject({
      __id: bId,
      __type: "Object",
      name: "B",
    });

    expect((result as any).b).toEqual({ __ref: bId });
  });

  it("should handle circular reference in array", () => {
    const arr: any[] = [1, 2];
    arr.push(arr);

    const result = snapshotSerialization(arr);

    expect(Array.isArray(result)).toBe(true);
    expect((result as any)[2]).toMatchObject({ __ref: expect.any(String) });
  });

  it("should handle complex circular graph (triangle)", () => {
    const a: any = { name: "A" };
    const b: any = { name: "B" };
    const c: any = { name: "C" };
    a.next = b;
    b.next = c;
    c.next = a;

    const result = snapshotSerialization({ root: a });

    const aId = getObjectId((result as any).root);
    const bId = getObjectId((result as any).root.next);
    const cId = getObjectId((result as any).root.next.next);

    expect((result as any).root.next.next.next).toEqual({ __ref: aId });
  });

  it("should handle deeply nested circular reference", () => {
    const root: any = { level: 0 };
    let current = root;

    for (let i = 1; i < 10; i++) {
      current.next = { level: i };
      current = current.next;
    }
    current.back = root;

    const result = snapshotSerialization(root);

    let nested = result;
    for (let i = 0; i < 9; i++) {
      nested = (nested as any).next;
    }

    const rootId = getObjectId(result);
    expect(nested).toMatchObject({
      __type: "Object",
      level: 9,
      back: { __ref: rootId },
    });
  });

  it("should assign consistent IDs within same serialization call", () => {
    const obj: any = { name: "test" };
    obj.ref1 = obj;
    obj.ref2 = obj;
    obj.ref3 = obj;

    const result = snapshotSerialization(obj);

    const objId = getObjectId(result);
    expect((result as any).ref1).toEqual({ __ref: objId });
    expect((result as any).ref2).toEqual({ __ref: objId });
    expect((result as any).ref3).toEqual({ __ref: objId });
  });
});
