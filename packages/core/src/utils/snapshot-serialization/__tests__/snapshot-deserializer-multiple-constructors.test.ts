import { createSnapshotDeserializer } from "../utils";

describe("SnapshotDeserializer with multiple allowed constructors", () => {
  const generateUniqueClassName = (prefix: string): string => {
    const testId =
      Date.now() + "_" + Math.random().toString(36).substring(2, 10);
    return `${prefix}_${testId}`;
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

  describe("when multiple classes are registered globally", () => {
    let className1: string;
    let className2: string;
    let TestClass1: any;
    let TestClass2: any;

    beforeEach(() => {
      // Первый класс with __type field
      className1 = generateUniqueClassName("TestClass_multi1");
      TestClass1 = class {
        __type: string;
        value: string;

        constructor() {
          this.__type = className1;
          this.value = "test1";
        }
      };
      registerGlobalClass(className1, TestClass1);

      // Второй класс with __type field
      className2 = generateUniqueClassName("TestClass_multi2");
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

    it("should handle multiple allowed constructors without interference", () => {
      // These should match what the serializer would produce
      const input1 = {
        __id: "obj_1",
        __type: className1,
        value: "test1",
      };

      const input2 = {
        __id: "obj_2",
        __type: className2,
        value: "test2",
      };

      const deserializer = createSnapshotDeserializer({
        allowedConstructors: ["Object", className1, className2],
      });

      const result1 = deserializer(input1);
      const result2 = deserializer(input2);

      expect(result1).toBeInstanceOf(TestClass1);
      expect(result2).toBeInstanceOf(TestClass2);
      expect((result1 as any).value).toBe("test1");
      expect((result2 as any).value).toBe("test2");
    });
  });
});
