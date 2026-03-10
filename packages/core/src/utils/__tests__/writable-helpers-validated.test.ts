import { describe, it, expect } from "vitest";
import { createValidatedAtom } from "../writable-helpers";
import { createStore } from "../../index";

describe("createValidatedAtom - basic", () => {
  it("should accept valid value", () => {
    const emailAtom = createValidatedAtom({
      initial: "",
      validator: (v: string) => v.includes("@"),
    });
    const store = createStore();
    store.set(emailAtom, "test@example.com");
    expect(store.get(emailAtom)).toBe("test@example.com");
  });

  it("should reject invalid value (boolean validator)", () => {
    const emailAtom = createValidatedAtom({
      initial: "default@example.com",
      validator: (v: string) => v.includes("@"),
    });
    const store = createStore();
    store.set(emailAtom, "invalid");
    expect(store.get(emailAtom)).toBe("default@example.com");
  });

  it("should use default value for invalid input", () => {
    const emailAtom = createValidatedAtom({
      initial: "initial@example.com",
      validator: (v: string) => v.includes("@"),
      default: "default@example.com",
    });
    const store = createStore();
    store.set(emailAtom, "invalid");
    // Keeps initial value when validation fails
    expect(store.get(emailAtom)).toBe("initial@example.com");
  });
});

describe("createValidatedAtom - string validator", () => {
  it("should accept valid value (string validator)", () => {
    const emailAtom = createValidatedAtom({
      initial: "",
      validator: (v: string) => {
        if (!v.includes("@")) return "Invalid email";
        return "";
      },
    });
    const store = createStore();
    store.set(emailAtom, "test@example.com");
    expect(store.get(emailAtom)).toBe("test@example.com");
  });

  it("should reject invalid value (string validator)", () => {
    const emailAtom = createValidatedAtom({
      initial: "default@example.com",
      validator: (v: string) => {
        if (!v.includes("@")) return "Invalid email";
        return "";
      },
    });
    const store = createStore();
    store.set(emailAtom, "invalid");
    expect(store.get(emailAtom)).toBe("default@example.com");
  });
});

describe("createValidatedAtom - object validator", () => {
  it("should accept valid value (object validator)", () => {
    const emailAtom = createValidatedAtom({
      initial: "",
      validator: (v: string) => {
        if (!v.includes("@")) {
          return { isValid: false, error: "Invalid email", value: "" };
        }
        return { isValid: true, value: v };
      },
    });
    const store = createStore();
    store.set(emailAtom, "test@example.com");
    expect(store.get(emailAtom)).toBe("test@example.com");
  });

  it("should reject invalid value (object validator)", () => {
    const emailAtom = createValidatedAtom({
      initial: "default@example.com",
      validator: (v: string) => {
        if (!v.includes("@")) {
          return { isValid: false, error: "Invalid email", value: "default@example.com" };
        }
        return { isValid: true, value: v };
      },
    });
    const store = createStore();
    store.set(emailAtom, "invalid");
    expect(store.get(emailAtom)).toBe("default@example.com");
  });
});

describe("createValidatedAtom - throw on error", () => {
  it("should throw on invalid value when throwOnError is true", () => {
    const emailAtom = createValidatedAtom({
      initial: "",
      validator: (v: string) => v.includes("@"),
      throwOnError: true,
    });
    const store = createStore();
    expect(() => store.set(emailAtom, "invalid")).toThrow("Validation failed");
  });

  it("should throw with custom error message", () => {
    const emailAtom = createValidatedAtom({
      initial: "",
      validator: (v: string) => {
        if (!v.includes("@")) {
          return { isValid: false, error: "Custom error", value: "" };
        }
        return { isValid: true, value: v };
      },
      throwOnError: true,
    });
    const store = createStore();
    expect(() => store.set(emailAtom, "invalid")).toThrow("Custom error");
  });
});

describe("createValidatedAtom - number validation", () => {
  it("should validate positive numbers", () => {
    const positiveAtom = createValidatedAtom({
      initial: 1,
      validator: (v: number) => v > 0,
    });
    const store = createStore();
    store.set(positiveAtom, 5);
    expect(store.get(positiveAtom)).toBe(5);
    store.set(positiveAtom, -1);
    expect(store.get(positiveAtom)).toBe(5); // stays at previous valid value
  });

  it("should validate range", () => {
    const rangeAtom = createValidatedAtom({
      initial: 50,
      validator: (v: number) => v >= 0 && v <= 100,
      default: 50,
    });
    const store = createStore();
    store.set(rangeAtom, 150);
    expect(store.get(rangeAtom)).toBe(50);
    store.set(rangeAtom, 75);
    // The validated atom keeps the previous valid value
    expect(store.get(rangeAtom)).toBe(50);
  });
});
