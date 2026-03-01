/**
 * Integration tests for action metadata and grouping (DEV-003-C).
 * Verifies metadata builder, custom metadata, and ActionGrouper work together.
 */

import { describe, it, expect } from "vitest";
import { createActionMetadata } from "../action-metadata";
import { createActionGrouper } from "../action-grouper";
import type { ActionMetadata, ActionGroupResult } from "../types";

describe("Action metadata and grouping integration", () => {
  it("should build metadata with custom fields and group into a single batch", () => {
    interface CustomMeta {
      requestId: string;
      operation: string;
    }

    const grouper = createActionGrouper({ flushAfterMs: 1000, maxGroupSize: 10 });
    const groupId = "batch-form-submit";

    grouper.startGroup(groupId);

    const meta1 = createActionMetadata<CustomMeta>()
      .type("form/FIELD_UPDATE")
      .atomName("form")
      .source("DevToolsPlugin")
      .groupId(groupId)
      .set("requestId", "req-1")
      .set("operation", "FIELD_UPDATE")
      .build();

    const meta2 = createActionMetadata<CustomMeta>()
      .type("form/SUBMIT")
      .atomName("form")
      .source("DevToolsPlugin")
      .groupId(groupId)
      .set("requestId", "req-1")
      .set("operation", "SUBMIT")
      .build();

    grouper.add(meta1);
    grouper.add(meta2);

    const result = grouper.endGroup(groupId) as ActionGroupResult;

    expect(result).not.toBeNull();
    expect(result.count).toBe(2);
    expect(result.type).toContain("Batch");
    expect(result.metadata.atomNames).toEqual(["form", "form"]);
    expect(result.metadata.batchCount).toBe(2);
    expect(result.metadata.batchGroupId).toBe(groupId);
  });

  it("should support type-safe custom metadata through builder and grouping", () => {
    interface ApiMeta {
      requestId: string;
      retries: number;
    }

    const grouper = createActionGrouper({ maxGroupSize: 5 });
    const groupId = "api-batch";

    grouper.startGroup(groupId);

    const metadata = createActionMetadata<ApiMeta>()
      .type("api/CALL")
      .atomName("api")
      .groupId(groupId)
      .set("requestId", "r-1")
      .set("retries", 2)
      .build();

    // Type check: custom fields are available on metadata
    expect(metadata.requestId).toBe("r-1");
    expect(metadata.retries).toBe(2);

    grouper.add(metadata);
    const result = grouper.endGroup(groupId);

    expect(result?.count).toBe(1);
    expect(result?.metadata.atomNames).toContain("api");
  });

  it("should produce valid ActionGroupResult for DevTools display", () => {
    const grouper = createActionGrouper({});
    const groupId = "display-test";

    grouper.startGroup(groupId);
    grouper.add(
      createActionMetadata().type("a/SET").atomName("atomA").groupId(groupId).build(),
    );
    grouper.add(
      createActionMetadata().type("b/SET").atomName("atomB").groupId(groupId).build(),
    );

    const result = grouper.endGroup(groupId);

    expect(result).toMatchObject({
      count: 2,
      type: expect.any(String),
      metadata: expect.objectContaining({
        atomNames: ["atomA", "atomB"],
        batchCount: 2,
        batchGroupId: groupId,
      }),
    });
  });
});
