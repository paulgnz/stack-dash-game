import { describe, it, expect } from "vitest";
import { generateObstacles } from "../trackGenerator";

const VALID_LANES = [-1, 0, 1];

describe("generateObstacles", () => {
  it("generates obstacles within the requested z range", () => {
    const obstacles = generateObstacles(42, 0, 100);
    expect(obstacles.length).toBeGreaterThan(0);
    for (const obs of obstacles) {
      expect(obs.z).toBeGreaterThanOrEqual(0);
      expect(obs.z).toBeLessThanOrEqual(100);
    }
  });

  it("starts obstacles at fromZ + 15", () => {
    const obstacles = generateObstacles(42, 0, 100);
    expect(obstacles.length).toBeGreaterThan(0);
    expect(obstacles[0].z).toBeGreaterThanOrEqual(15);
  });

  it("is deterministic - same seed and range produces the same output", () => {
    const a = generateObstacles(42, 0, 200);
    const b = generateObstacles(42, 0, 200);
    expect(a).toEqual(b);
  });

  it("produces different output for different seeds", () => {
    const a = generateObstacles(1, 0, 200);
    const b = generateObstacles(2, 0, 200);
    expect(a).not.toEqual(b);
  });

  it("only spawns unlocked obstacle types based on z distance", () => {
    // At z 0-49, only barrier and low_bar should appear
    const earlyObstacles = generateObstacles(42, 0, 40);
    for (const obs of earlyObstacles) {
      expect(["barrier", "low_bar"]).toContain(obs.type);
    }
  });

  it("does not spawn moving_barrier before z=400", () => {
    const obstacles = generateObstacles(42, 0, 399);
    for (const obs of obstacles) {
      expect(obs.type).not.toBe("moving_barrier");
    }
  });

  it("can spawn later obstacle types when z is high enough", () => {
    // Generate a large range that should include later types
    // Use multiple seeds to increase chance of seeing variety
    const allTypes = new Set<string>();
    for (let seed = 0; seed < 20; seed++) {
      const obstacles = generateObstacles(seed, 400, 600);
      for (const obs of obstacles) {
        allTypes.add(obs.type);
      }
    }
    expect(allTypes.has("moving_barrier")).toBe(true);
  });

  it("all obstacles have valid lane values (-1, 0, or 1)", () => {
    const obstacles = generateObstacles(42, 0, 500);
    for (const obs of obstacles) {
      expect(obs.lanes.length).toBeGreaterThan(0);
      for (const lane of obs.lanes) {
        expect(VALID_LANES).toContain(lane);
      }
    }
  });

  it("barrier blocks exactly 1 lane", () => {
    const obstacles = generateObstacles(42, 0, 100);
    const barriers = obstacles.filter((o) => o.type === "barrier");
    for (const b of barriers) {
      expect(b.lanes).toHaveLength(1);
    }
  });

  it("low_bar blocks exactly 1 lane", () => {
    const obstacles = generateObstacles(42, 0, 100);
    const lowBars = obstacles.filter((o) => o.type === "low_bar");
    for (const lb of lowBars) {
      expect(lb.lanes).toHaveLength(1);
    }
  });

  it("double_barrier blocks exactly 2 lanes", () => {
    // Use a range where double_barrier is unlocked (z >= 100)
    const allObstacles: ReturnType<typeof generateObstacles> = [];
    for (let seed = 0; seed < 30; seed++) {
      allObstacles.push(...generateObstacles(seed, 100, 300));
    }
    const doubleBs = allObstacles.filter((o) => o.type === "double_barrier");
    expect(doubleBs.length).toBeGreaterThan(0);
    for (const db of doubleBs) {
      expect(db.lanes).toHaveLength(2);
      // The two blocked lanes must be different
      expect(db.lanes[0]).not.toBe(db.lanes[1]);
    }
  });

  it("moving_barrier has a speed between 1 and 3", () => {
    const allObstacles: ReturnType<typeof generateObstacles> = [];
    for (let seed = 0; seed < 30; seed++) {
      allObstacles.push(...generateObstacles(seed, 400, 600));
    }
    const movingBs = allObstacles.filter((o) => o.type === "moving_barrier");
    expect(movingBs.length).toBeGreaterThan(0);
    for (const mb of movingBs) {
      expect(mb.speed).toBeDefined();
      expect(mb.speed!).toBeGreaterThanOrEqual(1);
      expect(mb.speed!).toBeLessThanOrEqual(3);
    }
  });

  it("maintains minimum gap of 8 between consecutive obstacles", () => {
    const obstacles = generateObstacles(42, 0, 500);
    for (let i = 1; i < obstacles.length; i++) {
      const gap = obstacles[i].z - obstacles[i - 1].z;
      expect(gap).toBeGreaterThanOrEqual(8);
    }
  });

  it("returns empty array when range is too small for any obstacles", () => {
    const obstacles = generateObstacles(42, 0, 10);
    // fromZ + 15 = 15, which exceeds toZ = 10
    expect(obstacles).toEqual([]);
  });
});
