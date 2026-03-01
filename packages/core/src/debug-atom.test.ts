import { describe, it, expect } from "vitest";
import { atom } from "./index";
import type { Getter } from "./types";

describe("debug atom", () => {
  it("should create atoms with correct types", () => {
    const countAtom = atom(0);
    expect(countAtom.type).toBe("primitive");
    expect(typeof countAtom.read).toBe("function");

    const doubleAtom = atom((get: Getter) => get(countAtom) * 2);
    expect(doubleAtom.type).toBe("computed");
    expect(typeof doubleAtom.read).toBe("function");
  });
});
