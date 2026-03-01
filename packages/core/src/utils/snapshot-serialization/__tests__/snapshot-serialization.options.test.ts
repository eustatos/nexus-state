import { describe, it, expect } from "vitest";
import { snapshotSerialization } from "../serialize";

describe("snapshotSerialization - Options", () => {
  describe("skipKeys", () => {
    it("should exclude specified keys from serialization", () => {
      const input = {
        public: "visible",
        password: "secret123",
        token: "abc-xyz",
      };

      const result = snapshotSerialization(input, {
        skipKeys: ["password", "token"],
      });

      expect(result).toMatchObject({
        __type: "Object",
        public: "visible",
      });
      expect(result).not.toHaveProperty("password");
      expect(result).not.toHaveProperty("token");
    });

    it("should skip keys in nested objects", () => {
      const input = {
        user: {
          name: "Alice",
          password: "hidden",
        },
      };

      const result = snapshotSerialization(input, {
        skipKeys: ["password"],
      });

      expect((result as any).user).toMatchObject({
        name: "Alice",
      });
      expect((result as any).user).not.toHaveProperty("password");
    });

    it("should skip keys in arrays of objects", () => {
      const input = [
        { id: 1, secret: "a" },
        { id: 2, secret: "b" },
      ];

      const result = snapshotSerialization(input, {
        skipKeys: ["secret"],
      });

      expect((result as any)[0]).not.toHaveProperty("secret");
      expect((result as any)[1]).not.toHaveProperty("secret");
    });
  });

  describe("preserveType", () => {
    it("should include constructor name when preserveType is true", () => {
      class User {
        constructor(public name: string) {}
      }

      const result = snapshotSerialization(new User("Alice"), {
        preserveType: true,
      });

      expect(result).toMatchObject({ __type: "User" });
    });

    it("should use generic Object type when preserveType is false", () => {
      class User {
        constructor(public name: string) {}
      }

      const result = snapshotSerialization(new User("Alice"), {
        preserveType: false,
      });

      expect(result).toMatchObject({ __type: "Object" });
    });

    it("should preserve type for built-in classes", () => {
      const result = snapshotSerialization(new Date(), {
        preserveType: true,
      });

      expect(result).toMatchObject({ __type: "Date" });
    });
  });

  describe("customTransformers", () => {
    it("should apply custom transformer for specific constructor", () => {
      class CustomType {
        constructor(
          public id: string,
          public secret: string,
        ) {}
      }

      const obj = new CustomType("user_1", "do-not-serialize");

      const result = snapshotSerialization(obj, {
        customTransformers: new Map([
          [
            CustomType,
            (val: CustomType) => ({
              __type: "CustomType",
              id: val.id,
            }),
          ],
        ]),
      });

      expect(result).toEqual({
        __type: "CustomType",
        id: "user_1",
      });
    });

    it("should apply transformer before default handling", () => {
      class MyDate extends Date {}

      const obj = new MyDate("2023-01-01");

      const result = snapshotSerialization(obj, {
        customTransformers: new Map([
          [
            MyDate,
            (val: MyDate) => ({
              __type: "MyDate",
              timestamp: val.getTime(),
            }),
          ],
        ]),
      });

      expect(result).toMatchObject({ __type: "MyDate" });
    });

    it("should pass context to custom transformer", () => {
      class Node {
        constructor(
          public value: any,
          public children: Node[] = [],
        ) {}
      }

      const tree = new Node("root", [new Node("child1"), new Node("child2")]);

      const result = snapshotSerialization(tree, {
        customTransformers: new Map([
          [
            Node,
            (val: Node, ctx) => ({
              __type: "TreeNode",
              value: snapshotSerialization(val.value, ctx.options, ctx),
              childCount: val.children.length,
            }),
          ],
        ]),
      });

      expect(result).toMatchObject({
        __type: "TreeNode",
        value: "root",
        childCount: 2,
      });
    });
  });
});
