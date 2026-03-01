/**
 * Verification benchmark to ensure performance tests are working
 */

import { describe, bench } from "vitest";

describe("Performance Test Verification", () => {
  bench("simple addition", () => {
    let sum = 0;
    for (let i = 0; i < 1000; i++) {
      sum += i;
    }
    // Ensure the operation isn't optimized away
    if (sum === 0) throw new Error("Benchmark not running");
  });

  bench("array creation", () => {
    const arr = new Array(1000).fill(null).map((_, i) => i);
    if (arr.length !== 1000) throw new Error("Array creation failed");
  });

  bench("object manipulation", () => {
    const obj: Record<string, number> = {};
    for (let i = 0; i < 100; i++) {
      obj[`key${i}`] = i;
    }
    if (Object.keys(obj).length !== 100)
      throw new Error("Object manipulation failed");
  });
});
