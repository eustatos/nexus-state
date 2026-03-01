/**
 * Integration tests for time-travel jumpTo with DevTools
 * 
 * These tests verify that when jumpTo is called via DevTools commands,
 * the store state is properly updated and synchronized.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createStore } from "@nexus-state/core";
import { atom } from "@nexus-state/core";
import { DevToolsPlugin } from "../devtools-plugin";
import { createMessageHandler } from "../message-handler";
import { CommandHandler } from "../command-handler";
import { SimpleTimeTravel } from "@nexus-state/core";

describe("Time Travel jumpTo Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("CommandHandler with jumpTo", () => {
    it("should update store state when jumping to a specific index", () => {
      const store = createStore([]);
      
      const counterAtom = atom(0, "counter");
      
      // Set up time travel with autoCapture enabled (default)
      const timeTravel = new SimpleTimeTravel(store, { autoCapture: true });
      
      // Verify initial state is captured
      const history1 = timeTravel.getHistory();
      expect(history1.length).toBe(1);
      expect(store.get(counterAtom)).toBe(0);
      
      // Update atom - this should auto-capture
      store.set(counterAtom, 10);
      
      // Verify auto-capture happened
      const history2 = timeTravel.getHistory();
      expect(history2.length).toBe(2);
      expect(store.get(counterAtom)).toBe(10);
      
      // Update atom again - this should auto-capture
      store.set(counterAtom, 20);
      
      // Verify auto-capture happened
      const history3 = timeTravel.getHistory();
      expect(history3.length).toBe(3);
      expect(store.get(counterAtom)).toBe(20);
      
      // Verify history actions
      expect(history3[0].metadata.action).toBe("initial");
      expect(history3[1].metadata.action).toContain("counter");
      expect(history3[2].metadata.action).toContain("counter");
      
      // Create command handler and set up time travel
      const commandHandler = new CommandHandler();
      commandHandler.setTimeTravel(timeTravel);
      
      // Jump to index 1 (value should be 10)
      const result = commandHandler.handleCommand({
        type: "JUMP_TO_STATE",
        payload: { index: 1 },
      });
      
      expect(result).toBe(true);
      expect(store.get(counterAtom)).toBe(10);
      
      // Jump to index 2 (value should be 20)
      commandHandler.handleCommand({
        type: "JUMP_TO_STATE",
        payload: { index: 2 },
      });
      
      expect(store.get(counterAtom)).toBe(20);
      
      // Jump back to index 0 (value should be 0)
      commandHandler.handleCommand({
        type: "JUMP_TO_STATE",
        payload: { index: 0 },
      });
      
      expect(store.get(counterAtom)).toBe(0);
    });

    it("should send updated state to DevTools after jumpTo", () => {
      const store = createStore([]);
      
      const counterAtom = atom(0, "counter");
      
      // Set up time travel
      const timeTravel = new SimpleTimeTravel(store, { autoCapture: true });
      
      // Update atom
      store.set(counterAtom, 42);
      
      // Create command handler with state update callback
      const stateUpdates: Record<string, unknown>[] = [];
      const commandHandler = new CommandHandler({
        onStateUpdate: (state) => {
          stateUpdates.push(state);
        },
      });
      commandHandler.setTimeTravel(timeTravel);
      
      // Jump to index 1
      commandHandler.handleCommand({
        type: "JUMP_TO_STATE",
        payload: { index: 1 },
      });
      
      // Should have sent state update
      expect(stateUpdates.length).toBe(1);
      expect(stateUpdates[0]["counter"]).toBe(42);
      
      // Jump to index 0
      commandHandler.handleCommand({
        type: "JUMP_TO_STATE",
        payload: { index: 0 },
      });
      
      expect(stateUpdates.length).toBe(2);
      expect(stateUpdates[1]["counter"]).toBe(0);
    });
  });

  describe("MessageHandler with jumpTo", () => {
    it("should handle JUMP_TO_STATE from DevTools", () => {
      const store = createStore([]);
      
      const counterAtom = atom(0, "counter");
      
      // Set up time travel
      const timeTravel = new SimpleTimeTravel(store, { autoCapture: true });
      
      // Update atom
      store.set(counterAtom, 100);
      
      // Create message handler
      const messageHandler = createMessageHandler({
        enableTimeTravel: true,
        debug: true,
      });
      
      messageHandler.setStore(store);
      messageHandler.setTimeTravel(timeTravel);
      
      // Simulate DevTools message
      const result = messageHandler.handle(
        {
          type: "DISPATCH",
          payload: {
            type: "JUMP_TO_STATE",
            index: 1,
          },
        },
        store,
      );
      
      expect(result.success).toBe(true);
      expect(store.get(counterAtom)).toBe(100);
    });

    it("should handle JUMP_TO_ACTION from DevTools", () => {
      const store = createStore([]);
      
      const counterAtom = atom(0, "counter");
      
      // Set up time travel
      const timeTravel = new SimpleTimeTravel(store, { autoCapture: true });
      
      // Update atom with different values
      store.set(counterAtom, 10);
      store.set(counterAtom, 20);
      
      // Create message handler
      const messageHandler = createMessageHandler({
        enableTimeTravel: true,
        debug: true,
      });
      
      messageHandler.setStore(store);
      messageHandler.setTimeTravel(timeTravel);
      
      // Jump to action "SET counter" (auto-generated)
      // The action name will be auto-generated by SimpleTimeTravel
      const history = timeTravel.getHistory();
      
      // Find an action name from history
      const actionName = history[2]?.metadata.action;
      expect(actionName).toBeDefined();
      
      const result = messageHandler.handle(
        {
          type: "DISPATCH",
          payload: {
            type: "JUMP_TO_ACTION",
            action: actionName,
          },
        },
        store,
      );
      
      expect(result.success).toBe(true);
      expect(store.get(counterAtom)).toBe(20);
    });
  });

  describe("DevToolsPlugin with jumpTo", () => {
    it("should update store when JUMP_TO_STATE is dispatched", () => {
      const store = createStore([]);
      
      const counterAtom = atom(0, "counter");
      
      // Set up time travel
      const timeTravel = new SimpleTimeTravel(store, { autoCapture: true });
      
      // Update atom
      store.set(counterAtom, 55);
      
      // Create DevTools plugin and apply to store
      const plugin = new DevToolsPlugin();
      plugin.apply(store as any);
      
      // Set time travel manually (since we're not connecting to real DevTools)
      plugin.setTimeTravel(timeTravel);
      
      // Simulate dispatch from DevTools
      const payload = {
        type: "JUMP_TO_STATE",
        index: 1,
      };
      
      // Access private method to test
      const handleTimeTravelCommand = (plugin as any).handleTimeTravelCommand;
      handleTimeTravelCommand(payload, store);
      
      expect(store.get(counterAtom)).toBe(55);
    });

    it("should update store when JUMP_TO_ACTION is dispatched", () => {
      const store = createStore([]);
      
      const counterAtom = atom(0, "counter");
      
      // Set up time travel
      const timeTravel = new SimpleTimeTravel(store, { autoCapture: true });
      
      // Update atom
      store.set(counterAtom, 77);
      store.set(counterAtom, 88);
      
      // Create DevTools plugin and apply to store
      const plugin = new DevToolsPlugin();
      plugin.apply(store as any);
      
      // Set time travel manually
      plugin.setTimeTravel(timeTravel);
      
      // Simulate dispatch from DevTools to jump to action
      const history = timeTravel.getHistory();
      const actionName = history[2]?.metadata.action;
      
      const payload = {
        type: "JUMP_TO_ACTION",
        action: actionName,
      };
      
      const handleTimeTravelCommand = (plugin as any).handleTimeTravelCommand;
      handleTimeTravelCommand(payload, store);
      
      expect(store.get(counterAtom)).toBe(88);
    });
  });
});
