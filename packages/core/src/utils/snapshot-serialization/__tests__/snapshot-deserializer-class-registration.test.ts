import { createSnapshotDeserializer } from "../utils";

describe("SnapshotDeserializer class registration", () => {
  const generateUniqueClassName = (): string => {
    return `TestClass_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
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

  describe("when registering a single class", () => {
    let className: string;
    let TestClass: any;

    beforeEach(() => {
      className = generateUniqueClassName();
      TestClass = class {
        __type: string;
        value: string;

        constructor() {
          this.__type = className;
          this.value = "test";
        }
      };
      registerGlobalClass(className, TestClass);
    });

    afterEach(() => {
      unregisterGlobalClass(className);
    });

    it("should properly register and unregister class in global scope", () => {
      expect((globalThis as any)[className]).toBe(TestClass);
    });

    it("should allow deserialization of the registered class", () => {
      // This simulates what the serializer would produce
      const input = {
        __id: "test_obj",
        __type: className,
        value: "test",
      };

      const deserializer = createSnapshotDeserializer({
        allowedConstructors: ["Object", className],
      });

      const result = deserializer(input);
      expect(result).toBeInstanceOf(TestClass);
      expect((result as any).value).toBe("test");
    });
  });
});
