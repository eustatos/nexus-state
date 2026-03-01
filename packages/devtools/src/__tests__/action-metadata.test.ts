/**
 * Unit tests for action metadata and ActionMetadataBuilder
 */

import { describe, it, expect } from "vitest";
import {
  createActionMetadata,
  createMinimalActionMetadata,
  ActionMetadataBuilder,
} from "../action-metadata";
import type { ActionMetadata } from "../types";

describe("ActionMetadataBuilder", () => {
  it("should build metadata with required type and atomName", () => {
    const meta = createActionMetadata()
      .type("user/SET")
      .atomName("user")
      .build();

    expect(meta.type).toBe("user/SET");
    expect(meta.atomName).toBe("user");
    expect(meta.timestamp).toBeDefined();
    expect(typeof meta.timestamp).toBe("number");
    expect(meta.source).toBe("unknown");
  });

  it("should use fluent API for all standard fields", () => {
    const ts = 1234567890;
    const meta = createActionMetadata()
      .type("counter/INCREMENT")
      .timestamp(ts)
      .source("DevToolsPlugin")
      .atomName("counter")
      .stackTrace("at set...")
      .groupId("batch-1")
      .build();

    expect(meta.type).toBe("counter/INCREMENT");
    expect(meta.timestamp).toBe(ts);
    expect(meta.source).toBe("DevToolsPlugin");
    expect(meta.atomName).toBe("counter");
    expect(meta.stackTrace).toBe("at set...");
    expect(meta.groupId).toBe("batch-1");
  });

  it("should set custom fields via set()", () => {
    const meta = createActionMetadata()
      .type("test")
      .atomName("a")
      .set("userId", "u-1")
      .set("operation", "SET")
      .build();

    expect((meta as Record<string, unknown>).userId).toBe("u-1");
    expect((meta as Record<string, unknown>).operation).toBe("SET");
  });

  it("should merge custom object via merge()", () => {
    const meta = createActionMetadata()
      .type("test")
      .atomName("a")
      .merge({ foo: "bar", count: 2 })
      .build();

    expect((meta as Record<string, unknown>).foo).toBe("bar");
    expect((meta as Record<string, unknown>).count).toBe(2);
  });

  it("should default timestamp to Date.now() when not set", () => {
    const before = Date.now();
    const meta = createActionMetadata().type("x").atomName("y").build();
    const after = Date.now();
    expect(meta.timestamp).toBeGreaterThanOrEqual(before);
    expect(meta.timestamp).toBeLessThanOrEqual(after);
  });

  it("should throw when building without type", () => {
    expect(() =>
      createActionMetadata().atomName("a").build(),
    ).toThrow("ActionMetadataBuilder: type is required");
  });
});

describe("createMinimalActionMetadata", () => {
  it("should create metadata with type and atomName", () => {
    const meta = createMinimalActionMetadata("form/SUBMIT", "form");
    expect(meta.type).toBe("form/SUBMIT");
    expect(meta.atomName).toBe("form");
    expect(meta.timestamp).toBeDefined();
    expect(meta.source).toBe("unknown");
  });

  it("should apply overrides", () => {
    const meta = createMinimalActionMetadata("x", "y", {
      source: "Custom",
      timestamp: 999,
    });
    expect(meta.source).toBe("Custom");
    expect(meta.timestamp).toBe(999);
  });
});

describe("ActionMetadata type safety", () => {
  it("should allow generic custom metadata shape", () => {
    interface CustomMeta {
      requestId: string;
      retries: number;
    }
    const meta = createActionMetadata<CustomMeta>()
      .type("api/CALL")
      .atomName("api")
      .set("requestId", "req-1")
      .set("retries", 2)
      .build();

    expect(meta.requestId).toBe("req-1");
    expect(meta.retries).toBe(2);
  });
});
