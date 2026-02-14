import { describe, it, expect, beforeEach } from "vitest";
import {
  getDevToolsConfig,
  updateDevToolsConfig,
  resetDevToolsConfig,
  isDevelopmentMode,
  isActionGroupingEnabled,
  DEFAULT_DEVTOOLS_CONFIG,
} from "../../config/devtools-config";

describe("DevTools Config", () => {
  beforeEach(() => {
    resetDevToolsConfig();
  });

  it("should return default config", () => {
    const config = getDevToolsConfig();
    expect(config).toEqual(DEFAULT_DEVTOOLS_CONFIG);
  });

  it("should update config", () => {
    updateDevToolsConfig({ enableGrouping: false, maxGroupSize: 50 });
    const config = getDevToolsConfig();
    expect(config.enableGrouping).toBe(false);
    expect(config.maxGroupSize).toBe(50);
    // Other values should remain default
    expect(config.actionNaming).toBe(DEFAULT_DEVTOOLS_CONFIG.actionNaming);
  });

  it("should reset config to defaults", () => {
    updateDevToolsConfig({ enableGrouping: false, maxGroupSize: 50 });
    resetDevToolsConfig();
    const config = getDevToolsConfig();
    expect(config).toEqual(DEFAULT_DEVTOOLS_CONFIG);
  });

  it("should check development mode", () => {
    expect(isDevelopmentMode()).toBe(DEFAULT_DEVTOOLS_CONFIG.isDevelopment);
    updateDevToolsConfig({ isDevelopment: true });
    expect(isDevelopmentMode()).toBe(true);
  });

  it("should check action grouping enabled", () => {
    expect(isActionGroupingEnabled()).toBe(DEFAULT_DEVTOOLS_CONFIG.enableGrouping);
    updateDevToolsConfig({ enableGrouping: false });
    expect(isActionGroupingEnabled()).toBe(false);
  });
});