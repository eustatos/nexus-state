import { createSnapshotDeserializer } from "../utils";

describe("SnapshotDeserializer class properties", () => {
  const generateUniqueClassName = (prefix: string): string => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  };

  const registerGlobalClass = (
    className: string,
    classDefinition: any,
  ): void => {
    (globalThis as any)[className] = classDefinition;
  };

  const unregisterGlobalClass = (className: string): void => {
    delete (globalThis as any)[className];
  };

  describe("when classes have different property values", () => {
    let className1: string;
    let className2: string;
    let TestClass1: any;
    let TestClass2: any;

    beforeEach(() => {
      // First class with value property
      className1 = generateUniqueClassName("TestClass_props1");
      TestClass1 = class {
        __type: string;
        value: string;

        constructor() {
          this.__type = className1;
          this.value = "test1";
        }
      };
      registerGlobalClass(className1, TestClass1);

      // Second class with value property
      className2 = generateUniqueClassName("TestClass_props2");
      TestClass2 = class {
        __type: string;
        value: string;

        constructor() {
          this.__type = className2;
          this.value = "test2";
        }
      };
      registerGlobalClass(className2, TestClass2);
    });

    afterEach(() => {
      unregisterGlobalClass(className1);
      unregisterGlobalClass(className2);
    });

    it("should preserve property values for each class instance", () => {
      const deserializer = createSnapshotDeserializer({
        allowedConstructors: ["Object", className1, className2],
      });

      // Include the property values in the input objects
      const result1 = deserializer({
        __id: "obj_1",
        __type: className1,
        value: "test1", // Add the property value
      });

      const result2 = deserializer({
        __id: "obj_2",
        __type: className2,
        value: "test2", // Add the property value
      });

      expect((result1 as any).value).toBe("test1");
      expect((result2 as any).value).toBe("test2");
    });

    it("should handle different property values for same class type", () => {
      const deserializer = createSnapshotDeserializer({
        allowedConstructors: ["Object", className1],
      });

      // Create two instances of the same class with different values
      const result1 = deserializer({
        __id: "obj_1",
        __type: className1,
        value: "different value 1",
      });

      const result2 = deserializer({
        __id: "obj_2",
        __type: className1,
        value: "different value 2",
      });

      expect((result1 as any).value).toBe("different value 1");
      expect((result2 as any).value).toBe("different value 2");
    });
  });
});
