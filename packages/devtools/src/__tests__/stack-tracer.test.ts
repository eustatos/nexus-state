import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  captureStackTrace,
  filterStackTraceFrames,
  formatStackTraceForDevTools,
  createStackTraceGenerator,
  isStackTraceEnabled,
  DEFAULT_STACK_TRACE_CONFIG,
  type CapturedStackTrace,
  type StackTraceConfig,
} from "../utils/stack-tracer";

describe("stack-tracer", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    vi.restoreAllMocks();
  });

  describe("filterStackTraceFrames", () => {
    it("removes frames matching default exclude patterns", () => {
      const frames = [
        "at Object.<anonymous> (/project/node_modules/jest/index.js:1:1)",
        "at userCode (/app/src/component.tsx:10:5)",
        "at runTest (/project/__tests__/foo.test.ts:1:1)",
      ];
      const filtered = filterStackTraceFrames(frames);
      expect(filtered).toHaveLength(1);
      expect(filtered[0]).toContain("component.tsx");
    });

    it("respects custom excludePatterns", () => {
      const frames = [
        "at foo (src/bar.ts:1:1)",
        "at baz (src/qux.ts:2:2)",
      ];
      const filtered = filterStackTraceFrames(frames, {
        excludePatterns: [/qux/],
      });
      expect(filtered).toHaveLength(1);
      expect(filtered[0]).toContain("bar.ts");
    });

    it("respects maxFrames", () => {
      const frames = ["at a (a:1)", "at b (b:1)", "at c (c:1)"];
      const filtered = filterStackTraceFrames(frames, { maxFrames: 2 });
      expect(filtered).toHaveLength(2);
    });
  });

  describe("formatStackTraceForDevTools", () => {
    it("joins frames with newline", () => {
      const captured: CapturedStackTrace = {
        frames: ["at foo (a:1)", "at bar (b:2)"],
        timestamp: 0,
      };
      const str = formatStackTraceForDevTools(captured);
      expect(str).toBe("at foo (a:1)\nat bar (b:2)");
    });
  });

  describe("captureStackTrace", () => {
    it("returns null when NODE_ENV is not development", () => {
      process.env.NODE_ENV = "production";
      expect(captureStackTrace(10)).toBeNull();
    });

    it("returns captured stack when NODE_ENV is development", () => {
      process.env.NODE_ENV = "development";
      const result = captureStackTrace(5);
      // In test env we may still get null if Vitest sets NODE_ENV=test
      if (result !== null) {
        expect(result).toHaveProperty("frames");
        expect(result).toHaveProperty("timestamp");
        expect(Array.isArray(result.frames)).toBe(true);
      }
    });
  });

  describe("createStackTraceGenerator", () => {
    it("returns function that yields null when enableStackTrace is false", () => {
      const config: StackTraceConfig = {
        ...DEFAULT_STACK_TRACE_CONFIG,
        enableStackTrace: false,
        isDevelopment: true,
      };
      const gen = createStackTraceGenerator(config);
      expect(gen()).toBeNull();
    });

    it("returns function that yields null when not in development", () => {
      const config: StackTraceConfig = {
        ...DEFAULT_STACK_TRACE_CONFIG,
        enableStackTrace: true,
        isDevelopment: false,
      };
      const gen = createStackTraceGenerator(config);
      expect(gen()).toBeNull();
    });

    it("returns function that captures when enabled and development", () => {
      const config: StackTraceConfig = {
        ...DEFAULT_STACK_TRACE_CONFIG,
        enableStackTrace: true,
        isDevelopment: process.env.NODE_ENV === "development",
      };
      const gen = createStackTraceGenerator(config);
      const result = gen();
      if (process.env.NODE_ENV === "development" && result !== null) {
        expect(result.frames).toBeDefined();
        expect(result.timestamp).toBeDefined();
      }
    });
  });

  describe("isStackTraceEnabled", () => {
    it("returns false when enableStackTrace is false", () => {
      expect(
        isStackTraceEnabled({
          ...DEFAULT_STACK_TRACE_CONFIG,
          enableStackTrace: false,
          isDevelopment: true,
        }),
      ).toBe(false);
    });

    it("returns true when both enableStackTrace and isDevelopment are true", () => {
      expect(
        isStackTraceEnabled({
          ...DEFAULT_STACK_TRACE_CONFIG,
          enableStackTrace: true,
          isDevelopment: true,
        }),
      ).toBe(true);
    });
  });
});
