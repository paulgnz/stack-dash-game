import { describe, it, expect } from "vitest";
import { SeededRandom } from "../seededRandom";

describe("SeededRandom", () => {
  it("produces deterministic sequence from same seed", () => {
    const a = new SeededRandom(42);
    const b = new SeededRandom(42);
    for (let i = 0; i < 100; i++) {
      expect(a.next()).toBe(b.next());
    }
  });

  it("produces values between 0 and 1", () => {
    const rng = new SeededRandom(123);
    for (let i = 0; i < 1000; i++) {
      const val = rng.next();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it("produces different sequences for different seeds", () => {
    const a = new SeededRandom(1);
    const b = new SeededRandom(2);
    const aValues = Array.from({ length: 10 }, () => a.next());
    const bValues = Array.from({ length: 10 }, () => b.next());
    expect(aValues).not.toEqual(bValues);
  });

  it("range returns values within bounds", () => {
    const rng = new SeededRandom(99);
    for (let i = 0; i < 100; i++) {
      const val = rng.range(5, 10);
      expect(val).toBeGreaterThanOrEqual(5);
      expect(val).toBeLessThan(10);
    }
  });
});
