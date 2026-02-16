import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "../gameStore";

describe("gameStore", () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  it("starts in menu state", () => {
    const state = useGameStore.getState();
    expect(state.phase).toBe("menu");
    expect(state.score).toBe(0);
    expect(state.stackHeight).toBe(0);
    expect(state.speed).toBe(5);
  });

  it("transitions to playing on start", () => {
    useGameStore.getState().start();
    expect(useGameStore.getState().phase).toBe("playing");
  });

  it("increments score with height multiplier", () => {
    useGameStore.getState().start();
    useGameStore.getState().setStackHeight(10);
    useGameStore.getState().addScore(100);
    // multiplier = 1 + floor(10/5) * 0.5 = 2.0
    expect(useGameStore.getState().score).toBe(200);
  });

  it("tracks stack height", () => {
    useGameStore.getState().start();
    useGameStore.getState().setStackHeight(15);
    expect(useGameStore.getState().stackHeight).toBe(15);
  });

  it("increases speed over distance", () => {
    useGameStore.getState().start();
    useGameStore.getState().addDistance(100);
    expect(useGameStore.getState().speed).toBeGreaterThan(5);
  });

  it("transitions to dead on die", () => {
    useGameStore.getState().start();
    useGameStore.getState().addScore(500);
    useGameStore.getState().die();
    expect(useGameStore.getState().phase).toBe("dead");
    expect(useGameStore.getState().finalScore).toBe(500);
  });

  it("resets all state", () => {
    useGameStore.getState().start();
    useGameStore.getState().addScore(500);
    useGameStore.getState().die();
    useGameStore.getState().reset();
    expect(useGameStore.getState().phase).toBe("menu");
    expect(useGameStore.getState().score).toBe(0);
  });

  it("tracks best score", () => {
    useGameStore.getState().start();
    useGameStore.getState().addScore(500);
    useGameStore.getState().die();
    expect(useGameStore.getState().bestScore).toBe(500);
    useGameStore.getState().reset();
    useGameStore.getState().start();
    useGameStore.getState().addScore(300);
    useGameStore.getState().die();
    expect(useGameStore.getState().bestScore).toBe(500);
  });

  it("tracks block placement cooldown", () => {
    useGameStore.getState().start();
    expect(useGameStore.getState().canPlaceBlock).toBe(true);
    useGameStore.getState().placeBlock();
    expect(useGameStore.getState().canPlaceBlock).toBe(false);
  });
});
